import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { promisify } from "node:util";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

import { pool } from "./backend/db.js";
import { createUser } from "./backend/repositories/userRepository.js";
import { listChallenges } from "./backend/repositories/challengeRepository.js";

import fs from "node:fs/promises";
import path from "node:path";
import { saveChallengePackage } from "./backend/repositories/challengeRepository.js";

const scrypt = promisify(scryptCallback);

async function hashPassword(password) {
	const salt = randomBytes(16).toString("hex");
	const derivedKey = await scrypt(password, salt, 64);

	return `scrypt$${salt}$${derivedKey.toString("hex")}`;
}

function readHidden(prompt) {
	return new Promise((resolve, reject) => {
		if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
			reject(new Error("Password input requires an interactive terminal."));
			return;
		}

		stdout.write(prompt);
		stdin.setRawMode(true);
		stdin.resume();

		let password = "";

		function cleanup() {
			stdin.removeListener("data", onData);
			stdin.setRawMode(false);
			stdin.pause();
			stdout.write("\n");
		}

		function onData(data) {
			for (const char of data.toString("utf8")) {
				if (char === "\u0003") {
					cleanup();
					reject(new Error("Password input cancelled."));
					return;
				}

				if (char === "\r" || char === "\n") {
					cleanup();
					resolve(password);
					return;
				}

				if (char === "\u007f" || char === "\b") {
					password = password.slice(0, -1);
					continue;
				}

				if (char >= " " && char <= "~") {
					password += char;
				}
			}
		}

		stdin.on("data", onData);
	});
}

async function createUserCommand() {
	const rl = createInterface({ input: stdin, output: stdout });
	try {
		const username = (await rl.question("Username: ")).trim();
		const email = (await rl.question("Email: ")).trim().toLowerCase();
		const role = (await rl.question("Role (PEMBUAT/PELAJAR): ")).trim().toUpperCase();

		if (!username || !email) {
			throw new Error("Username and email are required.");
		}

		if (!["PEMBUAT", "PELAJAR"].includes(role)) {
			throw new Error("Role must be PEMBUAT or PELAJAR.");
		}

		rl.close();

		const password = await readHidden("Password (minimum 8 characters): ");
		if (password.length < 8) {
			throw new Error("Password must contain at least 8 characters.");
		}

		const passwordHash = await hashPassword(password);

		const user = await createUser({ username, email, passwordHash, role });

		console.log("\nUser created successfully!");
		console.log(`ID:       ${user.id}`);
		console.log(`Username: ${user.username}`);
		console.log(`Email:    ${user.email}`);
		console.log(`Role:     ${user.role}`);
	} finally {
		rl.close();
	}
}

async function createChallengeCommand() {
	const rl = createInterface({ input: stdin, output: stdout });

	try {
		console.log("\nCreate a new challenge\n");

		const title = (await rl.question("Title: ")).trim();
		const description = (await rl.question("Description: ")).trim();
		const difficulty = (await rl.question("Difficulty (MUDAH/SEDANG/SULIT): "))
			  .trim().toUpperCase();
		const creatorUsername = (await rl.question("Creator username: ")).trim();
		const archivePathInput = (await rl.question("Challenge ZIP path: ")).trim();

		if (!title || title.length > 150) {
			throw new Error("Title is required and must be at most 150 characters.");
		}

		if (!description) {
			throw new Error("Description is required.");
		}

		if (!["MUDAH", "SEDANG", "SULIT"].includes(difficulty)) {
			throw new Error("Invalid difficulty.");
		}

		const creatorResult = await pool.query(
			"SELECT id, username, role FROM users WHERE username = $1",
			[creatorUsername]
		);

		const creator = creatorResult.rows[0];
		if (!creator) {
			throw new Error(`User "${creatorUsername}" does not exist.`);
		}
		if (creator.role !== "PEMBUAT") {
			throw new Error("Only PEMBUAT users can create challenges.");
		}

		const archivePath = path.resolve(archivePathInput);
		const archiveStat = await fs.stat(archivePath);

		if (!archiveStat.isFile() || path.extname(archivePath).toLowerCase() !== ".zip") {
			throw new Error("Please provide a valid ZIP archive.");
		}

		const packageData = await fs.readFile(archivePath);
		const challenge = await saveChallengePackage({
			creatorId: creator.id,
			title,
			description,
			difficulty,
			packageData
		});

		console.log("\nChallenge created successfully!");
		console.log(`ID:         ${challenge.id}`);
		console.log(`Title:      ${challenge.title}`);
		console.log(`Difficulty: ${challenge.difficulty}`);
		console.log(`Status:     ${challenge.status}`);
		console.log(`Creator:    ${creator.username}`);
	} finally {
		rl.close();
	}
}

async function listChallengesCommand() {
	const challenges = await listChallenges();

	if (challenges.length === 0) {
		console.log("No challenges found.");
		return;
	}

	console.table(challenges.map((challenge) => ({
		ID: challenge.id,
		Title: challenge.title,
		Difficulty: challenge.difficulty,
		Status: challenge.status,
		Creator: challenge.creator,
		Created: new Date(challenge.created_at).toLocaleString()
	})));
}

function showHelp() {
	console.log(`
Commitment Issues CLI

Commands:
  user create       Create a user account
  challenge list    List registered challenges

Examples:
  npm run cli -- user create
  npm run cli -- challenge create
  npm run cli -- challenge list
`);
}

async function main() {
	const [resource, action] = process.argv.slice(2);

	switch (resource) {
	case "user":
		switch (action) {
		case "create":
			await createUserCommand();
			break;
		default:
			showHelp();
			break;
		}
		break;
	case "challenge":
		switch (action) {
		case "create":
			await createChallengeCommand();
			break;
		case "list":
			await listChallengesCommand();
			break;
		default:
			showHelp();
			break;
		}
		break;
	default:
		showHelp();
		break;
	}
}

try {
	await main();
} catch (error) {
	console.error("\nError:", error.message);
	process.exitCode = 1;
} finally {
	await pool.end();
}
