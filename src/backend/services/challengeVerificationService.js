import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";

const execFileAsync = promisify(execFile);

function getOutput(stdout, stderr) {
	return [stdout, stderr]
		.map((value) => String(value ?? "").trim())
		.filter(Boolean)
		.join("\n")
		.slice(0, 50 * 1024);
}

/*
 * verify.sh communicates its score through its exit code:
 * 0 = zero points, 1..99 = partial score, 100 = passed.
 * A regular successful shell exit (0) is therefore a valid score of zero.
 */
export async function verifyChallengeRepository({ repositoryDirectory, scriptPath }) {
	try {
		await fs.access(scriptPath);
	} catch {
		return {
			ok: false,
			passed: false,
			score: 0,
			error: "Verification script (verify.sh) was not found.",
			output: ""
		};
	}

	try {
		const result = await execFileAsync("bash", [scriptPath], {
			cwd: repositoryDirectory,
			timeout: 30_000,
			maxBuffer: 1024 * 1024,
			windowsHide: true
		});

		return {
			ok: true,
			passed: false,
			score: 0,
			output: getOutput(result.stdout, result.stderr)
		};
	} catch (executionError) {
		const exitCode = executionError.code;
		const output = getOutput(executionError.stdout, executionError.stderr);

		if (typeof exitCode === "number" && Number.isInteger(exitCode) &&
			exitCode >= 0 && exitCode <= 100) {
			return {
				ok: true,
				passed: exitCode === 100,
				score: exitCode,
				output
			};
		}

		return {
			ok: false,
			passed: false,
			score: 0,
			error: executionError.killed
				? "Verification script timed out."
				: `Could not execute verify.sh: ${executionError.message}`,
			output
		};
	}
}
