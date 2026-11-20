import { EventEmitter } from "node:events";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

export const execFileAsync = promisify(execFile);

const createdDirs = [];

export async function tempDir(prefix = "commitment-issues-test-") {
	const dir = await fs.mkdtemp(path.join(os.tmpdir(), prefix));
	createdDirs.push(dir);
	return dir;
}

export async function removeTempDirs() {
	await Promise.all(createdDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true })));
}

export async function commandExists(command, args = ["-v"]) {
	try {
		await execFileAsync(command, args, { windowsHide: true });
		return true;
	} catch {
		return false;
	}
}

export async function buildChallengePackage({ setup, verify, includeRepo = true } = {}) {
	const dir = await tempDir("ci-package-");
	const outerDir = path.join(dir, "outer");
	await fs.mkdir(outerDir);

	if (includeRepo) {
		const repoDir = path.join(dir, "repo");
		await fs.mkdir(repoDir);
		await execFileAsync("git", ["init", "-b", "main"], { cwd: repoDir });
		await execFileAsync("git", ["config", "user.name", "Test Runner"], { cwd: repoDir });
		await execFileAsync("git", ["config", "user.email", "test@example.test"], { cwd: repoDir });
		await fs.writeFile(path.join(repoDir, "README.md"), "fixture\n");
		await execFileAsync("git", ["add", "README.md"], { cwd: repoDir });
		await execFileAsync("git", ["commit", "-m", "initial commit"], { cwd: repoDir });
		await execFileAsync("zip", ["-qr", path.join(outerDir, "repo.zip"), "repo"], { cwd: dir });
	}
	if (setup !== undefined) await fs.writeFile(path.join(outerDir, "setup.sh"), setup);
	if (verify !== undefined) await fs.writeFile(path.join(outerDir, "verify.sh"), verify);

	const entries = await fs.readdir(outerDir);
	const packagePath = path.join(dir, "package.zip");
	await execFileAsync("zip", ["-qr", packagePath, ...entries], { cwd: outerDir });
	return fs.readFile(packagePath);
}

export async function makeGitRepo() {
	const dir = await tempDir("ci-git-");
	await execFileAsync("git", ["init", "-b", "main"], { cwd: dir });
	await execFileAsync("git", ["config", "user.name", "Test Runner"], { cwd: dir });
	await execFileAsync("git", ["config", "user.email", "test@example.test"], { cwd: dir });
	await fs.writeFile(path.join(dir, "README.md"), "initial\n");
	await execFileAsync("git", ["add", "README.md"], { cwd: dir });
	await execFileAsync("git", ["commit", "-m", "initial commit"], { cwd: dir });
	return dir;
}

export class FakeTerminalSocket extends EventEmitter {
	constructor() {
		super();
		this.readyState = 1;
		this.sent = [];
		this.closeCode = null;
	}

	send(raw) {
		this.sent.push(JSON.parse(raw));
	}

	close(code) {
		this.closeCode = code ?? 1000;
		this.readyState = 3;
	}

	output() {
		return this.sent.filter((message) => message.type === "output").map((message) => message.data).join("");
	}

	async waitFor(predicate, timeoutMs = 5000) {
		const start = Date.now();
		while (!predicate(this.output())) {
			if (Date.now() - start > timeoutMs) throw new Error(`Timed out waiting for terminal output: ${JSON.stringify(this.output().slice(-200))}`);
			await new Promise((resolve) => setTimeout(resolve, 10));
		}
	}

	async type(data) {
		const start = this.output().length;
		this.emit("message", Buffer.from(JSON.stringify({ type: "input", data })));
		await this.waitFor((text) => {
			const chunk = text.slice(start);
			return chunk.includes("\r\n") && chunk.endsWith("$ ");
		});
		return this.output().slice(start);
	}

	run(command) {
		return this.type(`${command}\r`);
	}
}
