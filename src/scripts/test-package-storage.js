import { readFile, writeFile, rm } from "node:fs/promises";
import { randomUUID, createHash } from "node:crypto";
import path from "node:path";
import { pool } from "../backend/db.js";

const zipPath = process.argv[2];

if (!zipPath) {
	console.error("Usage: node scripts/test-package-storage.js <path-to-zip>");
	process.exit(1);
}

const original = await readFile(zipPath);
const testId = randomUUID();

let client;
let creatorId;
let challengeId;

function hash(buffer) {
	return createHash("sha256").update(buffer).digest("hex");
}

try {
	client = await pool.connect();
	await client.query("BEGIN");

	const user = await client.query(`
		INSERT INTO users (username, email, password_hash, role)
		VALUES ($1, $2, $3, 'PEMBUAT')
		RETURNING id
	`, [`test_${testId}`, `test_${testId}@example.test`, "test-only-hash"]);

	creatorId = user.rows[0].id;

	const challenge = await client.query(`
		INSERT INTO challenges
		(creator_id, title, description, difficulty, package_data)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id
	`, [creatorId, "ZIP Storage Test", "Temporary test challenge", "MUDAH", original]);

	challengeId = challenge.rows[0].id;

	const retrieved = await client.query(`
		SELECT package_data FROM challenges WHERE id = $1
	`, [challengeId]);

	const restored = retrieved.rows[0].package_data;
	const outputPath = path.resolve("test-restored-package.zip");

	await writeFile(outputPath, restored);

	console.log("Original size:", original.length, "bytes");
	console.log("Retrieved size:", restored.length, "bytes");
	console.log("Original SHA-256:", hash(original));
	console.log("Retrieved SHA-256:", hash(restored));

	if (!original.equals(restored)) {
		throw new Error("Retrieved ZIP differs from original!");
	}

	console.log("\nZIP storage test passed!");
	console.log("Restored file:", outputPath);

	await client.query("ROLLBACK");
} catch (error) {
	if (client) {
		await client.query("ROLLBACK");
	}

	console.error("ZIP storage test failed:", error.message);
	process.exitCode = 1;
} finally {
	if (client) client.release();
	await pool.end();
}
