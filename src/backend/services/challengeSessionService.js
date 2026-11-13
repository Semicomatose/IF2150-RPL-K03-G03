import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { getChallengePackage } from "../repositories/challengeRepository.js";
import { createSession } from "./gitService.js";

const execFileAsync = promisify(execFile);
const MAX_PACKAGE_BYTES = 25 * 1024 * 1024;
const MAX_ARCHIVE_ENTRIES = 10_000;
const MAX_UNPACKED_BYTES = 150 * 1024 * 1024;

async function validateZipArchive(zipPath) {
	const { stdout } = await execFileAsync("unzip", ["-Z1", zipPath], {
		timeout: 10_000,
		maxBuffer: 2 * 1024 * 1024,
		windowsHide: true
	});

	const entries = stdout.split(/\r?\n/).filter(Boolean);
	if (!entries.length || entries.length > MAX_ARCHIVE_ENTRIES) {
		throw new Error("Challenge archive is empty or contains too many files.");
	}

	for (const entry of entries) {
		const normalized = entry.replace(/\\/g, "/");
		if (normalized.startsWith("/") ||
			/^[a-zA-Z]:/.test(normalized) ||
			normalized.split("/").includes("..") ||
			normalized.includes("\0")) {
			throw new Error("Challenge archive contains an unsafe file path.");
		}
	}

	// Symlink entries can redirect later archive members outside the extraction root.
	const { stdout: verboseListing } = await execFileAsync("zipinfo", ["-l", zipPath], {
		timeout: 10_000,
		maxBuffer: 4 * 1024 * 1024,
		windowsHide: true
	});
	if (verboseListing.split(/\r?\n/).some((line) => /^\s*l[rwx-]{9}\s/.test(line))) {
		throw new Error("Challenge archives may not contain symbolic links.");
	}

	const { stdout: listing } = await execFileAsync("unzip", ["-l", zipPath], {
		timeout: 10_000,
		maxBuffer: 4 * 1024 * 1024,
		windowsHide: true
	});

	let totalBytes = 0;
	for (const line of listing.split(/\r?\n/)) {
		const match = line.match(/^\s*(\d+)\s+\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}\s+/);
		if (match) totalBytes += Number(match[1]);
	}
	if (totalBytes > MAX_UNPACKED_BYTES) {
		throw new Error("Challenge archive expands beyond the allowed size.");
	}
}

async function extractZip(zipPath, destination) {
	await validateZipArchive(zipPath);
	await execFileAsync("unzip", ["-q", zipPath, "-d", destination], {
		timeout: 30_000,
		maxBuffer: 1024 * 1024,
		windowsHide: true
	});
}

export async function initializeChallengeSession(challengeId, userId) {
	const packageBuffer = await getChallengePackage(challengeId, userId);

	if (!packageBuffer) {
		throw new Error("Challenge not found or you do not have access to it.");
	}
	if (packageBuffer.length > MAX_PACKAGE_BYTES) {
		throw new Error("Challenge package is larger than the allowed 25 MB.");
	}

	const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "challenge-session-"));

	try {
		const mainZipPath = path.join(tempDir, "challenge.zip");
		await fs.writeFile(mainZipPath, packageBuffer);
		await extractZip(mainZipPath, tempDir);

		const setupScriptPath = path.join(tempDir, "setup.sh");
		try {
			await fs.access(setupScriptPath);
			await execFileAsync("bash", [setupScriptPath], {
				cwd: tempDir,
				timeout: 10_000,
				maxBuffer: 1024 * 1024,
				windowsHide: true
			});
		} catch (error) {
			if (error.code !== "ENOENT") {
				throw new Error(`Setup script failed: ${error.message}`);
			}
		}

		const repoZipPath = path.join(tempDir, "repo.zip");
		try {
			await fs.access(repoZipPath);
		} catch {
			throw new Error("Challenge package is missing the 'repo.zip' archive.");
		}

		// Preserve the existing package layout: repo.zip contains a top-level `repo/` directory.
		await extractZip(repoZipPath, tempDir);
		const repoDir = path.join(tempDir, "repo");

		const session = await createSession(repoDir);
		return {
			sessionId: session.id,
			repositoryDirectory: session.directory,
			tempDir
		};
	} catch (error) {
		await fs.rm(tempDir, { recursive: true, force: true });
		throw error;
	}
}

// Validate the uploaded package before it is persisted, using the same archive
// safety checks as session extraction. The outer ZIP must contain repo.zip.
export async function validateChallengePackageBuffer(packageBuffer) {
	if (!Buffer.isBuffer(packageBuffer) || packageBuffer.length === 0 || packageBuffer.length > MAX_PACKAGE_BYTES) {
		throw new Error("Challenge package must be a non-empty ZIP no larger than 25 MB.");
	}
	const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "challenge-upload-check-"));
	try {
		const archivePath = path.join(tempDir, "challenge.zip");
		await fs.writeFile(archivePath, packageBuffer);
		await validateZipArchive(archivePath);
		await extractZip(archivePath, tempDir);
		const repoZipPath = path.join(tempDir, "repo.zip");
		await fs.access(repoZipPath);
		const repoCheckDir = path.join(tempDir, "repo-check");
		await fs.mkdir(repoCheckDir);
		await extractZip(repoZipPath, repoCheckDir);
		await fs.access(path.join(repoCheckDir, "repo"));
		return true;
	} catch (error) {
		throw new Error(`Invalid challenge package: ${error.message}`);
	} finally {
		await fs.rm(tempDir, { recursive: true, force: true });
	}
}
