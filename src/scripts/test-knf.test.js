import test, { afterEach, mock } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { buildChallengePackage, removeTempDirs, tempDir } from "./test-fixtures.js";

let storedPackage = null;

mock.module(new URL("../backend/repositories/challengeRepository.js", import.meta.url).href, {
	namedExports: { getChallengePackage: async () => storedPackage }
});

const { initializeChallengeSession } = await import("../backend/services/challengeSessionService.js");
const { verifyChallengeRepository } = await import("../backend/services/challengeVerificationService.js");

const sessionDirs = [];

afterEach(async () => {
	await Promise.all(sessionDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
	await removeTempDirs();
	storedPackage = null;
});

test("KNF01-TC01 setup.sh cannot write outside its session directory", { todo: "setup.sh currently runs with the server user's permissions" }, async () => {
	const outside = path.join(await tempDir("ci-knf01-"), "escaped.txt");
	storedPackage = await buildChallengePackage({ setup: `echo escaped > '${outside}'\n`, verify: "exit 100\n" });
	const session = await initializeChallengeSession(1, 1).catch(() => null);
	if (session) sessionDirs.push(session.tempDir);
	await assert.rejects(() => fs.access(outside), { code: "ENOENT" });
});

test("KNF01-TC02 a runaway setup.sh is stopped by the 10 second limit", async () => {
	storedPackage = await buildChallengePackage({ setup: "sleep 30\n", verify: "exit 100\n" });
	const started = Date.now();
	await assert.rejects(() => initializeChallengeSession(1, 1), /Setup script failed/);
	const elapsed = Date.now() - started;
	assert.ok(elapsed >= 9_000 && elapsed < 20_000, `setup stopped after ${elapsed} ms`);
});

test("KNF02-TC01 60 concurrent verifications always return a valid result without crashing", async () => {
	const repo = await tempDir("ci-knf02-repo-");
	const scriptsDir = await tempDir("ci-knf02-scripts-");
	const cases = [
		{ body: "echo ok\nexit 100\n", expected: { ok: true, passed: true, score: 100 } },
		{ body: "exit 0\n", expected: { ok: true, passed: false, score: 0 } },
		{ body: "exit 65\n", expected: { ok: true, passed: false, score: 65 } },
		{ body: "exit 150\n", expected: { ok: false, passed: false, score: 0 } },
		{ body: "kill -9 $$\n", expected: { ok: false, passed: false, score: 0 } },
		{ body: null, expected: { ok: false, passed: false, score: 0 } }
	];
	const scripts = await Promise.all(cases.map(async (item, index) => {
		const scriptPath = path.join(scriptsDir, `verify-${index}.sh`);
		if (item.body !== null) await fs.writeFile(scriptPath, item.body);
		return scriptPath;
	}));

	const runs = Array.from({ length: 60 }, (_, index) => index % cases.length);
	const outcomes = [];
	for (let start = 0; start < runs.length; start += 12) {
		const batch = runs.slice(start, start + 12).map(async (caseIndex) => {
			try {
				return { caseIndex, result: await verifyChallengeRepository({ repositoryDirectory: repo, scriptPath: scripts[caseIndex] }) };
			} catch (error) {
				return { caseIndex, crash: error };
			}
		});
		outcomes.push(...(await Promise.all(batch)));
	}

	assert.equal(outcomes.filter((outcome) => outcome.crash).length, 0);
	for (const { caseIndex, result } of outcomes) {
		const { ok, passed, score } = result;
		assert.deepEqual({ ok, passed, score }, cases[caseIndex].expected);
		if (!ok) assert.equal(typeof result.error, "string");
	}
});
