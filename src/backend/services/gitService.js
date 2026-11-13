import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const execFileAsync = promisify(execFile);

export async function createSession(repositoryDir) {
	const directory = await fs.realpath(path.resolve(repositoryDir));
	const stats = await fs.stat(directory);

	if (!stats.isDirectory()) {
		throw new Error("Repository path is not a directory.");
	}

	// A normal repository has a .git directory; a linked worktree can have a .git file.
	const gitPath = path.join(directory, ".git");
	const gitStats = await fs.stat(gitPath).catch((error) => {
		if (error.code === "ENOENT") return null;
		throw error;
	});

	if (!gitStats || (!gitStats.isDirectory() && !gitStats.isFile())) {
		throw new Error("Challenge archive does not contain a valid .git entry.");
	}

	return { id: randomUUID(), directory };
}

export async function runGitCommand(directory, command, args = []) {
	let gitArgs;

	switch (command) {
		case "status":
			if (args.length) throw new Error("status takes no arguments");
			gitArgs = ["status", "--short", "--branch"];
			break;
		case "log":
			if (args.length) throw new Error("log takes no arguments");
			gitArgs = ["log", "--oneline", "-10"];
			break;
		case "branch":
			if (args.length) throw new Error("branch takes no arguments");
			gitArgs = ["branch"];
			break;
		case "add":
			if (!args.length || args.some((p) =>
				typeof p !== "string" || !p || p.startsWith("-") ||
				path.isAbsolute(p) || p.split(/[\\/]/).includes(".."))) {
				throw new Error("add requires safe relative file paths");
			}
			gitArgs = ["add", "--", ...args];
			break;
		case "commit":
			if (args.length !== 1 || typeof args[0] !== "string" || !args[0].trim()) {
				throw new Error("commit requires one non-empty message");
			}
			gitArgs = ["commit", "-m", args[0]];
			break;
		default:
			throw new Error("Git command is not permitted");
	}

	try {
		const { stdout, stderr } = await execFileAsync("git", gitArgs, {
			cwd: directory,
			timeout: 10_000,
			maxBuffer: 1024 * 1024,
			windowsHide: true
		});
		return { ok: true, output: stdout + stderr };
	} catch (error) {
		return {
			ok: false,
			output: (error.stdout || "") + (error.stderr || error.message)
		};
	}
}
