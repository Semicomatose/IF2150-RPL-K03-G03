import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";

const execFileAsync = promisify(execFile);

function getOutput(stdout, stderr) {
	return [stdout, stderr]
		.map(value => String(value ?? "").trim())
		.filter(Boolean)
		.join("\n");
}

export async function verifyChallengeRepository({
	repositoryDirectory,
	scriptPath
}) {
	try {
		await fs.access(scriptPath);

		let result;
		try {
			result = await execFileAsync(
				"bash",
				[scriptPath],
				{
					cwd: repositoryDirectory,
					timeout: 30_000,
					maxBuffer: 1024 * 1024,
					windowsHide: true
				}
			);
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
				error: typeof exitCode === "number"
					? `verify.sh exited with invalid score code ${exitCode}. Expected 0–100.`
					: executionError.killed
						? "Verification script timed out."
						: `Could not execute verify.sh: ${executionError.message}`,
				output
			};
		}

		return {
			ok: true,
			passed: false,
			score: 0,
			output: getOutput(result.stdout, result.stderr)
		};
	} catch (error) {
		return {
			ok: false,
			passed: false,
			score: 0,
			error: `Verification error: ${error.message}`,
			output: ""
		};
	}
}
