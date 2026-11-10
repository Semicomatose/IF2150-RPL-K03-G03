import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import { pool } from "../backend/db.js";
import { initializeChallengeSession } from "../backend/services/challengeSessionService.js";
import { runGitCommand } from "../backend/services/gitService.js";

const zipPath = process.argv[2];

if (!zipPath) {
	console.error("Usage: node src/scripts/test-challenge-session.js <path-to-challenge-zip>");
	process.exit(1);
}

const packageBuffer = await readFile(zipPath);
const testId = randomUUID();

let client;
let challengeId;
let sessionResult;

try {
	client = await pool.connect();
	await client.query("BEGIN");

	const user = await client.query(`
		INSERT INTO users (username, email, password_hash, role)
		VALUES ($1, $2, $3, 'PEMBUAT')
		RETURNING id
	`, [`session_test_${testId}`, `session_test_${testId}@example.test`, "test-only-hash"]);

	const creatorId = user.rows[0].id;

	const challenge = await client.query(`
		INSERT INTO challenges
		(creator_id, title, description, difficulty, package_data)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id
	`, [creatorId, "Session Test Challenge", "Testing session initialization flow", "MUDAH", packageBuffer]);

	challengeId = challenge.rows[0].id;

	console.log(`Challenge created in DB with ID: ${challengeId}`);

	await client.query("COMMIT");
	client.release();
	client = null;

	console.log("\nInitializing challenge session...");
	sessionResult = await initializeChallengeSession(challengeId);

	console.log("Session created successfully!");
	console.log(`Session ID: ${sessionResult.sessionId}`);
	console.log(`Repository Directory: ${sessionResult.repositoryDirectory}`);
	console.log(`Temp Extraction Dir: ${sessionResult.tempDir}`);

	console.log("\nRunning test Git command ($ git status)...");
	const gitStatus = await runGitCommand(sessionResult.repositoryDirectory, "status");
	console.log(gitStatus.output);

	if (!gitStatus.ok) {
		throw new Error("Git status command failed inside the session.");
	}

	console.log("\nChallenge session test passed!");

} catch (error) {
	if (client) {
		await client.query("ROLLBACK");
		client.release();
	}
	console.error("\n Challenge session test failed:", error.message);
	process.exitCode = 1;
} finally {
	if (sessionResult?.tempDir) {
		try {
			await fs.rm(sessionResult.tempDir, { recursive: true, force: true });
			console.log("\nTemporary extraction directory cleaned up.");
		} catch (cleanupError) {
			console.error("Failed to clean up temp dir:", cleanupError.message);
		}
	}
	await pool.end();
}
