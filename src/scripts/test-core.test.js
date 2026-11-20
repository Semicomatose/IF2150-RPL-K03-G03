import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { EventEmitter } from "node:events";

import {
	createSession,
	runGitCommand
} from "../backend/services/gitService.js";
import {
	verifyChallengeRepository
} from "../backend/services/challengeVerificationService.js";
import {
	validateChallengePackageBuffer
} from "../backend/services/challengeSessionService.js";
import {
	createRestrictedTerminalSession
} from "../backend/services/terminalService.js";

const execFileAsync = promisify(execFile);
const tempDirs = [];

async function tempDir(prefix = "commitment-issues-test-") {
	const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
	tempDirs.push(dir);
	return dir;
}

async function makeGitRepo() {
	const dir = await tempDir("ci-git-");
	await execFileAsync("git", ["init", "-b", "main"], { cwd: dir });
	await execFileAsync("git", ["config", "user.name", "Test Runner"], { cwd: dir });
	await execFileAsync("git", ["config", "user.email", "test@example.test"], { cwd: dir });
	await fs.writeFile(path.join(dir, "README.md"), "initial\n");
	await execFileAsync("git", ["add", "README.md"], { cwd: dir });
	await execFileAsync("git", ["commit", "-m", "initial commit"], { cwd: dir });
	return dir;
}

class FakeWebSocket extends EventEmitter {
	constructor() {
		super();
		this.readyState = 1;
		this.sent = [];
		this.closed = false;
	}
	send(raw) { this.sent.push(JSON.parse(raw)); }
	close() { this.closed = true; this.readyState = 3; }
	input(data) {
		this.emit("message", Buffer.from(JSON.stringify({ type: "input", data })));
	}
	outputText() {
		return this.sent.filter(x => x.type === "output").map(x => x.data).join("");
	}
}

async function waitFor(predicate, timeoutMs = 1500) {
	const start = Date.now();
	while (!predicate()) {
		if (Date.now() - start > timeoutMs) throw new Error("Timed out waiting for terminal output");
		await new Promise(resolve => setTimeout(resolve, 10));
	}
}

afterEach(async () => {
	await Promise.all(tempDirs.splice(0).map(dir => fs.rm(dir, { recursive: true, force: true })));
});

test("git session accepts a directory containing .git", async () => {
	const repo = await makeGitRepo();
	const session = await createSession(repo);
	assert.equal(session.directory, await fs.realpath(repo));
	assert.ok(session.id);
});

test("git session rejects a directory without .git", async () => {
	const dir = await tempDir();
	await assert.rejects(() => createSession(dir), /valid \.git entry/);
});

test("git status and log return successful output", async () => {
	const repo = await makeGitRepo();
	const status = await runGitCommand(repo, "status");
	const log = await runGitCommand(repo, "log");
	assert.equal(status.ok, true);
	assert.match(status.output, /main/);
	assert.equal(log.ok, true);
	assert.match(log.output, /initial commit/);
});

test("git command allowlist rejects unknown commands", async () => {
	const repo = await makeGitRepo();
	await assert.rejects(() => runGitCommand(repo, "push"), /not permitted/);
});

test("git add rejects path traversal and option injection", async () => {
	const repo = await makeGitRepo();
	await assert.rejects(() => runGitCommand(repo, "add", ["../outside"]), /safe relative/);
	await assert.rejects(() => runGitCommand(repo, "add", ["--force"]), /safe relative/);
});

test("git add stages a valid relative file", async () => {
	const repo = await makeGitRepo();
	await fs.writeFile(path.join(repo, "new.txt"), "hello");
	const result = await runGitCommand(repo, "add", ["new.txt"]);
	assert.equal(result.ok, true);
	const status = await runGitCommand(repo, "status");
	assert.match(status.output, /new\.txt/);
});

test("verification returns not-found result when verify.sh is absent", async () => {
	const dir = await tempDir();
	const result = await verifyChallengeRepository({
		repositoryDirectory: dir,
		scriptPath: path.join(dir, "verify.sh")
	});
	assert.deepEqual(
		{ ok: result.ok, passed: result.passed, score: result.score, output: result.output },
		{ ok: false, passed: false, score: 0, output: "" }
	);
	assert.match(result.error, /not found/);
});

test("verification interprets exit code 100 as passed", async () => {
	const dir = await tempDir();
	const script = path.join(dir, "verify.sh");
	await fs.writeFile(script, "#!/bin/bash\necho all-good\nexit 100\n");
	const result = await verifyChallengeRepository({ repositoryDirectory: dir, scriptPath: script });
	assert.equal(result.ok, true);
	assert.equal(result.passed, true);
	assert.equal(result.score, 100);
	assert.match(result.output, /all-good/);
});

test("verification interprets exit code 0 as a valid zero score", async () => {
	const dir = await tempDir();
	const script = path.join(dir, "verify.sh");
	await fs.writeFile(script, "#!/bin/bash\necho no-points\nexit 0\n");
	const result = await verifyChallengeRepository({ repositoryDirectory: dir, scriptPath: script });
	assert.equal(result.ok, true);
	assert.equal(result.passed, false);
	assert.equal(result.score, 0);
});

test("verification preserves partial scores from exit codes 1 through 99", async () => {
	const dir = await tempDir();
	const script = path.join(dir, "verify.sh");
	await fs.writeFile(script, "#!/bin/bash\necho partial\nexit 65\n");
	const result = await verifyChallengeRepository({ repositoryDirectory: dir, scriptPath: script });
	assert.equal(result.ok, true);
	assert.equal(result.passed, false);
	assert.equal(result.score, 65);
});

test("package validator rejects non-Buffer and empty input", async () => {
	await assert.rejects(() => validateChallengePackageBuffer("not a buffer"), /non-empty ZIP/);
	await assert.rejects(() => validateChallengePackageBuffer(Buffer.alloc(0)), /non-empty ZIP/);
});

test("package validator accepts outer ZIP with repo.zip containing repo/.git", async () => {
	const dir = await tempDir();
	const repoDir = path.join(dir, "repo");
	await fs.mkdir(path.join(repoDir, ".git"), { recursive: true });
	await fs.writeFile(path.join(repoDir, "README.md"), "fixture\n");
	const innerZip = path.join(dir, "repo.zip");
	await execFileAsync("zip", ["-qr", innerZip, "repo"], { cwd: dir });
	const outerDir = path.join(dir, "outer");
	await fs.mkdir(outerDir);
	await fs.copyFile(innerZip, path.join(outerDir, "repo.zip"));
	const outerZip = path.join(dir, "package.zip");
	await execFileAsync("zip", ["-qr", outerZip, "repo.zip"], { cwd: outerDir });
	const buffer = await fs.readFile(outerZip);
	assert.equal(await validateChallengePackageBuffer(buffer), true);
});

test("terminal initializes and supports pwd and help", async () => {
	const repo = await makeGitRepo();
	const ws = new FakeWebSocket();
	createRestrictedTerminalSession(ws, repo);
	await waitFor(() => ws.outputText().includes("terminal ready"));
	ws.input("pwd\r");
	await waitFor(() => ws.outputText().includes("~ $"));
	ws.input("help\r");
	await waitFor(() => ws.outputText().includes("Available commands:"));
	assert.match(ws.outputText(), /Git commands:/);
});

test("terminal blocks attempts to leave repository root", async () => {
	const repo = await makeGitRepo();
	const ws = new FakeWebSocket();
	createRestrictedTerminalSession(ws, repo);
	await waitFor(() => ws.outputText().includes("terminal ready"));
	ws.input("cd ..\r");
	await waitFor(() => ws.outputText().includes("Access denied"));
	assert.match(ws.outputText(), /Access denied: you cannot leave the challenge repository/);
});

test("terminal rejects malformed input messages", async () => {
	const repo = await makeGitRepo();
	const ws = new FakeWebSocket();
	createRestrictedTerminalSession(ws, repo);
	await waitFor(() => ws.outputText().includes("terminal ready"));
	ws.emit("message", Buffer.from("{bad json"));
	await waitFor(() => ws.outputText().includes("Invalid terminal message"));
	assert.match(ws.outputText(), /Invalid terminal message/);
});
