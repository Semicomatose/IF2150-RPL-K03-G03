import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const MAX_FILE_SIZE = 1024 * 1024;
const MAX_OUTPUT = 50 * 1024;
const MAX_COMMAND_LENGTH = 4096;

function send(ws, type, data) {
	if (ws.readyState === 1) {
		ws.send(JSON.stringify({ type, data }));
	}
}

function isInsideRoot(root, target) {
	const relative = path.relative(root, target);
	return relative === "" || (!relative.startsWith(`..${path.sep}`) &&
		relative !== ".." && !path.isAbsolute(relative));
}

async function resolveSafePath(root, cwd, input, mustExist = true) {
	if (typeof input !== "string" || !input || input.includes("\0")) {
		throw new Error("Invalid path.");
	}
	if (path.isAbsolute(input)) {
		throw new Error("Absolute paths are not allowed.");
	}

	const target = path.resolve(cwd, input);
	if (!isInsideRoot(root, target)) {
		throw new Error("Access denied: you cannot leave the challenge repository.");
	}

	if (mustExist) {
		const real = await fs.realpath(target);
		if (!isInsideRoot(root, real)) {
			throw new Error("Access denied: path resolves outside the repository.");
		}
		return real;
	}

	let existing = target;
	while (true) {
		try {
			const realParent = await fs.realpath(existing);
			if (!isInsideRoot(root, realParent)) {
				throw new Error("Access denied: path resolves outside the repository.");
			}
			break;
		} catch (error) {
			if (error.code !== "ENOENT") throw error;
			const parent = path.dirname(existing);
			if (parent === existing) throw new Error("Invalid path.");
			existing = parent;
		}
	}

	return target;
}

function parseArgs(line) {
	const args = [];
	let current = "";
	let quote = null;
	let escaped = false;

	for (const char of line.trim()) {
		if (escaped) {
			current += char;
			escaped = false;
		} else if (char === "\\" && quote !== "'") {
			escaped = true;
		} else if (quote) {
			if (char === quote) quote = null;
			else current += char;
		} else if (char === "'" || char === '"') {
			quote = char;
		} else if (/\s/.test(char)) {
			if (current) {
				args.push(current);
				current = "";
			}
		} else {
			current += char;
		}
	}

	if (escaped || quote) throw new Error("Unclosed quote or escape character.");
	if (current) args.push(current);
	return args;
}

async function runGit(root, args) {
	const { stdout, stderr } = await execFileAsync("git", args, {
		cwd: root,
		timeout: 10_000,
		maxBuffer: MAX_OUTPUT,
		windowsHide: true
	});
	return stdout + (stderr ? `\r\n${stderr}` : "");
}

async function runCommand(root, cwd, args) {
	const [command, ...params] = args;

	switch (command) {
		case "help":
			return [
				"Available commands:",
				"  help					 Show this help",
				"  pwd					 Show current directory",
				"  ls [path]			 List files",
				"  cd <path>			 Change directory",
				"  cat <file>			 Read a text file",
				"  mkdir <directory>	 Create a directory",
				"  touch <file>			 Create an empty file",
				"  clear				 Clear the terminal",
				"Git commands:",
				"  diff [file]			 Show Git changes",
				"  status				 Show Git status",
				"  log					 Recent commits",
				"  branch				 List branches",
				"  add <file>			 Stage a file",
				'  commit -m "message"	 Commit staged changes',
				"  checkout <branch>	 Switch branches",
				"  restore <file>		 Restore a file"
			].join("\r\n");
		case "pwd":
			if (params.length) throw new Error("pwd takes no arguments.");
			return path.relative(root, cwd) || "/";
		case "ls": {
			if (params.length > 1) throw new Error("Usage: ls [path]");
			const target = await resolveSafePath(root, cwd, params[0] || ".", true);
			const entries = await fs.readdir(target, { withFileTypes: true });
			return entries.map((entry) => {
				if (entry.isSymbolicLink()) return `${entry.name}@`;
				return entry.isDirectory() ? `${entry.name}/` : entry.name;
			}).sort().join("	   ") || "(empty directory)";
		}
		case "cd": {
			if (params.length !== 1) throw new Error("Usage: cd <directory>");
			const target = await resolveSafePath(root, cwd, params[0], true);
			if (!(await fs.stat(target)).isDirectory()) throw new Error("That path is not a directory.");
			return { cwd: target, output: "" };
		}
		case "cat": {
			if (params.length !== 1) throw new Error("Usage: cat <file>");
			const target = await resolveSafePath(root, cwd, params[0], true);
			const stat = await fs.stat(target);
			if (!stat.isFile()) throw new Error("Not a regular file.");
			if (stat.size > MAX_FILE_SIZE) throw new Error("File is too large to display.");
			return (await fs.readFile(target, "utf8")).slice(0, MAX_OUTPUT);
		}
		case "mkdir": {
			if (params.length !== 1) throw new Error("Usage: mkdir <directory>");
			const target = await resolveSafePath(root, cwd, params[0], false);
			await fs.mkdir(target);
			return "Directory created.";
		}
		case "touch": {
			if (params.length !== 1) throw new Error("Usage: touch <file>");
			const target = await resolveSafePath(root, cwd, params[0], false);
			const handle = await fs.open(target, "a");
			await handle.close();
			return "File created.";
		}
		case "status":
			if (params.length) throw new Error("status takes no arguments");
			return runGit(root, ["status", "--short", "--branch"]);
		case "log":
			if (params.length) throw new Error("log takes no arguments");
			return runGit(root, ["log", "-5", "--oneline"]);
		case "branch":
			if (params.length) throw new Error("branch takes no arguments");
			return runGit(root, ["branch"]);
		case "diff": {
			if (params.length > 1) throw new Error("Usage: diff [file]");
			if (!params[0]) return runGit(root, ["diff", "--"]);
			const target = await resolveSafePath(root, cwd, params[0], true);
			return runGit(root, ["diff", "--", path.relative(root, target)]);
		}
		case "add": {
			if (params.length !== 1) throw new Error("Usage: add <file>");
			const target = await resolveSafePath(root, cwd, params[0], true);
			const relative = path.relative(root, target);
			await runGit(root, ["add", "--", relative]);
			return `Staged: ${relative}`;
		}
		case "commit": {
			if (params.length < 2 || params[0] !== "-m") {
				throw new Error('Usage: commit -m "your message"');
			}
			await runGit(root, ["commit", "-m", params.slice(1).join(" ")]);
			return "Commit created.";
		}
		case "checkout": {
			if (params.length !== 1 || params[0].startsWith("-")) {
				throw new Error("Usage: checkout <branch>");
			}
			await runGit(root, ["switch", "--no-guess", params[0]]);
			return `Switched to branch: ${params[0]}`;
		}
		case "restore": {
			if (params.length !== 1) throw new Error("Usage: restore <file>");
			const target = await resolveSafePath(root, cwd, params[0], true);
			const relative = path.relative(root, target);
			await runGit(root, ["restore", "--", relative]);
			return `Restored: ${relative}`;
		}
		case "clear":
			if (params.length) throw new Error("clear takes no arguments");
			return { clear: true };
		default:
			throw new Error(`Unknown command: ${command || ""}. Type "help" for commands.`);
	}
}

export function createRestrictedTerminalSession(ws, repositoryDirectory, { onCommand, onActivity } = {}) {
	let root;
	let cwd;
	let input = "";
	let escapeState = 0;
	let queue = Promise.resolve();

	async function initialize() {
		root = await fs.realpath(repositoryDirectory);
		cwd = root;

		const gitPath = path.join(root, ".git");
		const gitStat = await fs.stat(gitPath).catch(() => null);
		if (!gitStat || (!gitStat.isDirectory() && !gitStat.isFile())) {
			throw new Error("Challenge repository is not available.");
		}

		send(ws, "output", "Challenge terminal ready. Type help to see commands.\r\n");
		send(ws, "output", prompt());
	}

	function prompt() {
		const relative = path.relative(root, cwd);
		return `${relative || "~"} $ `;
	}

	async function handleLine(line) {
		const trimmed = line.trim();
		if (!trimmed) {
			send(ws, "output", prompt());
			return;
		}

		let commandOutput = "";
		try {
			const result = await runCommand(root, cwd, parseArgs(trimmed));
			if (result?.cwd) {
				cwd = result.cwd;
			} else if (result?.clear) {
				send(ws, "output", "\x1b[2J\x1b[H");
			} else if (typeof result === "string") {
				commandOutput = result.slice(0, MAX_OUTPUT);
				if (commandOutput) send(ws, "output", commandOutput + "\r\n");
			}
		} catch (error) {
			commandOutput = `Error: ${error.message}`;
			send(ws, "output", commandOutput + "\r\n");
		}

		if (typeof onCommand === "function") {
			try {
				await onCommand({
					command: trimmed.slice(0, MAX_COMMAND_LENGTH),
					output: commandOutput.slice(0, MAX_OUTPUT)
				});
			} catch (error) {
				console.error("Failed to save terminal history:", error);
			}
		}

		send(ws, "output", prompt());
	}

	function handleInput(data) {
		onActivity?.();

		for (const char of data) {
			if (escapeState === 1) {
				if (char === "[") escapeState = 2;
				else if (char === "]" || char === "O") escapeState = 3;
				else escapeState = 0;
				continue;
			}
			if (escapeState === 2) {
				if (char >= "@" && char <= "~") escapeState = 0;
				continue;
			}
			if (escapeState === 3) {
				if (char === "\x07" || char === "\x1b") escapeState = 0;
				continue;
			}
			if (char === "\x1b") {
				escapeState = 1;
				continue;
			}
			if (char === "\x03") {
				input = "";
				send(ws, "output", "^C\r\n" + prompt());
				continue;
			}
			if (char === "\r" || char === "\n") {
				send(ws, "output", "\r\n");
				const line = input;
				input = "";
				queue = queue.then(() => handleLine(line)).catch((error) => {
					send(ws, "output", `Error: ${error.message}\r\n`);
				});
				continue;
			}
			if (char === "\x7f" || char === "\b") {
				if (input.length) {
					input = input.slice(0, -1);
					send(ws, "output", "\b \b");
				}
				continue;
			}
			if (char >= " " && char !== "\x7f") {
				if (input.length >= MAX_COMMAND_LENGTH) {
					send(ws, "output", "\r\nCommand is too long.\r\n" + prompt() + input);
					input = "";
					continue;
				}
				input += char;
				send(ws, "output", char);
			}
		}
	}

	initialize().catch((error) => {
		send(ws, "output", `Terminal initialization failed: ${error.message}\r\n`);
		ws.close(1011, "Terminal initialization failed");
	});

	ws.on("message", (raw) => {
		try {
			const message = JSON.parse(raw.toString());
			if (message.type === "input" && typeof message.data === "string") {
				handleInput(message.data);
			} else {
				send(ws, "output", "Invalid terminal message.\r\n");
			}
		} catch {
			send(ws, "output", "Invalid terminal message.\r\n");
		}
	});

	ws.on("close", () => { input = ""; });
}
