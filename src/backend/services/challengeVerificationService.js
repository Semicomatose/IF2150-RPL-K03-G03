import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function runGit(directory, args) {
	return execFileAsync("git", args, {
		cwd: directory,
		timeout: 10_000,
		maxBuffer: 50 * 1024,
		windowsHide: true
	});
}

export async function verifyChallengeRepository(directory) {
	const checks = [];

	try {
		await runGit(directory, ["fsck", "--full"]);
		checks.push({
			name: "Repository integrity",
			passed: true,
			message: "Git repository structure is valid."
		});
	} catch {
		checks.push({
			name: "Repository integrity",
			passed: false,
			message: "Git repository structure is corrupted."
		});
	}

	try {
		const { stdout } = await runGit(directory, [
			"status",
			"--porcelain",
			"--untracked-files=all"
		]);

		const clean = stdout.trim().length === 0;

		checks.push({
			name: "Working tree",
			passed: clean,
			message: clean
				? "Working tree is clean."
				: "There are uncommitted or untracked changes."
		});
	} catch {
		checks.push({
			name: "Working tree",
			passed: false,
			message: "Could not inspect the working tree."
		});
	}

	try {
		const { stdout } = await runGit(directory, [
			"branch",
			"--show-current"
		]);

		const branch = stdout.trim();
		const valid = branch === "main" || branch === "master";

		checks.push({
			name: "Current branch",
			passed: valid,
			message: valid
				? `Current branch is ${branch}.`
				: `Expected main or master, but found "${branch || "detached HEAD"}".`
		});
	} catch {
		checks.push({
			name: "Current branch",
			passed: false,
			message: "Could not determine the current branch."
		});
	}

	const passed = checks.every((check) => check.passed);

	return {
		passed,
		score: passed ? 100 : 0,
		checks,
		output: checks
			.map((check) =>
				`${check.passed ? "[PASS]" : "[FAIL]"} ${check.name}: ${check.message}`
			)
			.join("\n")
	};
}
