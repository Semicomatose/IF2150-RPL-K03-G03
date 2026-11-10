import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { getChallengePackage } from "../repositories/challengeRepository.js";
import { createSession } from "./gitService.js";

const execFileAsync = promisify(execFile);

export async function initializeChallengeSession(challengeId) {
	const packageBuffer = await getChallengePackage(challengeId);
	if (!packageBuffer) {
		throw new Error("Challenge package not found.");
	}

	const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "challenge-session-"));
	const mainZipPath = path.join(tempDir, "challenge.zip");

	await fs.writeFile(mainZipPath, packageBuffer);
	await execFileAsync("unzip", ["-q", mainZipPath, "-d", tempDir]);

	const setupScriptPath = path.join(tempDir, "setup.sh");
	try {
		await fs.access(setupScriptPath);
		await execFileAsync("bash", [setupScriptPath], { cwd: tempDir });
	} catch (error) {
		if (error.code !== "ENOENT") {
			throw new Error(`Setup script failed: ${error.message}`);
		}
	}

	const repoZipPath = path.join(tempDir, "repo.zip");
	try {
		await fs.access(repoZipPath);
		await execFileAsync("unzip", ["-q", repoZipPath, "-d", tempDir]);
	} catch (error) {
		throw new Error("Challenge package is missing the 'repo.zip' archive.");
	}

	const repoDir = path.join(tempDir, "repo");
	const session = await createSession(repoDir);

	return {
		sessionId: session.id,
		repositoryDirectory: session.directory,
		tempDir
	}
}
