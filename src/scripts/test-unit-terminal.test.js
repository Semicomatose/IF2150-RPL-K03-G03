import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createRestrictedTerminalSession } from "../backend/services/terminalService.js";
import { FakeTerminalSocket, makeGitRepo, removeTempDirs, tempDir } from "./test-fixtures.js";

afterEach(removeTempDirs);

async function openTerminal(repo, options) {
	const ws = new FakeTerminalSocket();
	createRestrictedTerminalSession(ws, repo, options);
	await ws.waitFor((text) => /terminal ready[\s\S]*~ \$ $/.test(text));
	return ws;
}

test("C07-UT18 terminal file commands create, list, enter, and read files inside the repository", async () => {
	const ws = await openTerminal(await makeGitRepo());
	assert.match(await ws.run("mkdir docs"), /Directory created\./);
	assert.match(await ws.run("cd docs"), /docs \$ $/);
	assert.match(await ws.run("touch notes.txt"), /File created\./);
	assert.match(await ws.run("ls"), /notes\.txt/);
	assert.match(await ws.run("pwd"), /\r\ndocs\r\n/);
	await ws.run("cd ..");
	assert.match(await ws.run("ls"), /README\.md\s+docs\//);
	assert.match(await ws.run("cat README.md"), /initial/);
	assert.match(await ws.run("cd README.md"), /That path is not a directory\./);
	assert.match(await ws.run("cat docs"), /Not a regular file\./);
});

test("C07-UT19 terminal git commands stage, commit, and show history on the current branch", async () => {
	const ws = await openTerminal(await makeGitRepo());
	await ws.run("touch a.txt");
	assert.match(await ws.run("add a.txt"), /Staged: a\.txt/);
	assert.match(await ws.run("commit -m \"add a\""), /Commit created\./);
	assert.match(await ws.run("log"), /add a[\s\S]*initial commit/);
	assert.match(await ws.run("branch"), /\* main/);
	assert.doesNotMatch(await ws.run("status"), /\?\?/);
	assert.match(await ws.run("commit -m"), /Usage: commit -m "your message"/);
});

test("C07-UT20 terminal diff and restore operate on a modified tracked file", async () => {
	const repo = await makeGitRepo();
	const ws = await openTerminal(repo);
	await fs.writeFile(path.join(repo, "README.md"), "changed\n");
	assert.match(await ws.run("diff README.md"), /\+changed/);
	assert.match(await ws.run("restore README.md"), /Restored: README\.md/);
	assert.equal(await fs.readFile(path.join(repo, "README.md"), "utf8"), "initial\n");
	assert.match(await ws.run("checkout missing-branch"), /Error:/);
	assert.match(await ws.run("checkout --orphan"), /Usage: checkout <branch>/);
});

test("C07-UT21 terminal rejects unknown commands, absolute paths, escapes, and malformed quoting", async () => {
	const repo = await makeGitRepo();
	const ws = await openTerminal(repo);
	assert.match(await ws.run("rm README.md"), /Unknown command: rm/);
	assert.match(await ws.run("cat /etc/passwd"), /Absolute paths are not allowed\./);
	assert.match(await ws.run("touch ../escape.txt"), /Access denied: you cannot leave the challenge repository\./);
	await assert.rejects(() => fs.access(path.join(path.dirname(repo), "escape.txt")), { code: "ENOENT" });
	assert.match(await ws.run("ls a b"), /Usage: ls \[path\]/);
	assert.match(await ws.run("commit -m \"unfinished"), /Unclosed quote or escape character\./);
});

test("C07-UT22 terminal blocks symlinks that resolve outside the repository", async () => {
	const repo = await makeGitRepo();
	const outside = path.join(await tempDir("ci-outside-"), "secret.txt");
	await fs.writeFile(outside, "secret\n");
	await fs.symlink(outside, path.join(repo, "link.txt"));
	const ws = await openTerminal(repo);
	const output = await ws.run("cat link.txt");
	assert.match(output, /Access denied: path resolves outside the repository\./);
	assert.doesNotMatch(output, /secret/);
});

test("C07-UT23 terminal line editing and the command hook record what the user ran", async () => {
	const commands = [];
	const ws = await openTerminal(await makeGitRepo(), { onCommand: async (entry) => commands.push(entry) });
	assert.match(await ws.type("lx\x7fs\r"), /README\.md/);
	assert.match(await ws.type("\x1b[Apwd\r"), /\r\n\/\r\n/);
	assert.match(await ws.type("status\x03"), /\^C/);
	await ws.run("clear");
	assert.ok(ws.output().includes("\x1b[2J\x1b[H"));
	assert.deepEqual(commands.map((entry) => entry.command), ["ls", "pwd", "clear"]);
	assert.match(commands[0].output, /README\.md/);
	ws.emit("message", Buffer.from(JSON.stringify({ type: "input", data: "a".repeat(4097) })));
	await ws.waitFor((text) => text.includes("Command is too long."));
});

test("C07-UT24 terminal initialization fails and closes the socket when the repository has no .git", async () => {
	const ws = new FakeTerminalSocket();
	createRestrictedTerminalSession(ws, await tempDir("ci-no-git-"));
	await ws.waitFor((text) => text.includes("Terminal initialization failed"));
	assert.equal(ws.closeCode, 1011);
});
