import test, { afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { buildChallengePackage, removeTempDirs, tempDir } from "./test-fixtures.js";

let storedPackage = null;

mock.module(new URL("../backend/repositories/challengeRepository.js", import.meta.url).href, {
	namedExports: { getChallengePackage: async () => storedPackage }
});

const { initializeChallengeSession, validateChallengePackageBuffer } = await import("../backend/services/challengeSessionService.js");

const openedSessions = [];

afterEach(async () => {
	await Promise.all(openedSessions.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
	await removeTempDirs();
	storedPackage = null;
});

test("C05-UT03 validateChallengePackageBuffer rejects a package without repo.zip", async () => {
	const buffer = await buildChallengePackage({ includeRepo: false, verify: "exit 100\n" });
	await assert.rejects(() => validateChallengePackageBuffer(buffer), /Invalid challenge package/);
});

test("C05-UT04 validateChallengePackageBuffer rejects a package one byte above 25 MB", async () => {
	await assert.rejects(() => validateChallengePackageBuffer(Buffer.alloc(25 * 1024 * 1024 + 1)), /no larger than 25 MB/);
});

test("C07-UT14 initializeChallengeSession runs setup.sh and returns the extracted git repository", async () => {
	storedPackage = await buildChallengePackage({ setup: "echo ready > setup-ran.txt\n", verify: "exit 100\n" });
	const session = await initializeChallengeSession(1, 1);
	openedSessions.push(session.tempDir);
	assert.match(session.sessionId, /^[a-f0-9-]{36}$/);
	assert.equal(path.basename(session.repositoryDirectory), "repo");
	assert.equal((await fs.stat(path.join(session.repositoryDirectory, ".git"))).isDirectory(), true);
	assert.equal((await fs.readFile(path.join(session.tempDir, "setup-ran.txt"), "utf8")).trim(), "ready");
	await fs.access(path.join(session.tempDir, "verify.sh"));
});

test("C07-UT15 initializeChallengeSession rejects a challenge that cannot be loaded", async () => {
	storedPackage = null;
	await assert.rejects(() => initializeChallengeSession(404, 1), /Challenge not found/);
});

test("C07-UT16 initializeChallengeSession rejects a failing setup.sh and removes its temporary directory", async () => {
	const marker = path.join(await tempDir("ci-marker-"), "session-dir.txt");
	storedPackage = await buildChallengePackage({ setup: `pwd > '${marker}'\nexit 3\n`, verify: "exit 100\n" });
	await assert.rejects(() => initializeChallengeSession(1, 1), /Setup script failed/);
	const sessionDir = (await fs.readFile(marker, "utf8")).trim();
	await assert.rejects(() => fs.access(sessionDir), { code: "ENOENT" });
});

test("C07-UT17 initializeChallengeSession rejects a package without repo.zip", async () => {
	storedPackage = await buildChallengePackage({ includeRepo: false, verify: "exit 100\n" });
	await assert.rejects(() => initializeChallengeSession(1, 1), /missing the 'repo\.zip' archive/);
});
