import path from "node:path";
import {
	createSession,
	runGitCommand
} from "../backend/services/gitService.js";

const repositoryDir = process.argv[2];

if (!repositoryDir) {
	console.error("Usage: node scripts/test-git.js <repository-directory>");
	process.exit(1);
}

try {
	const session = await createSession(path.resolve(repositoryDir));

	console.log("Git session created:", session.id);
	console.log("Repository:", session.directory);

	for (const command of ["status", "log", "branch"]) {
		const result = await runGitCommand(session.directory, command);

		console.log(`\n$ git ${command}`);
		console.log(result.output);

		if (!result.ok) {
			throw new Error(`Git command failed: ${command}`);
		}
	}
	console.log("\nGit session test passed.");
} catch (error) {
	console.error("Test failed:", error.message);
	process.exitCode = 1;
}
