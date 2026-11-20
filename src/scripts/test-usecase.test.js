import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { buildChallengePackage, removeTempDirs } from "./test-fixtures.js";
import {
	pool,
	environmentSkipReason,
	startServer,
	createAccount,
	loginAs,
	challengeForm,
	openTerminal,
	cleanupDatabase
} from "./test-integration-support.js";

const skip = await environmentSkipReason({ needsShellTools: true });
const VERIFY_SOLUTION = [
	"if git log --format=%s | grep -qx \"add solution\"; then",
	"  echo \"[v] solution commit found\"",
	"  exit 100",
	"fi",
	"echo \"[x] missing solution commit\"",
	"exit 40",
	""
].join("\n");

let server;
let creatorClient;
let studentClient;
let packageBuffer;

before(async () => {
	if (skip) return;
	server = await startServer();
	creatorClient = await loginAs(server.baseUrl, await createAccount("PEMBUAT"));
	studentClient = await loginAs(server.baseUrl, await createAccount("PELAJAR"));
	packageBuffer = await buildChallengePackage({ setup: "echo setup-done\n", verify: VERIFY_SOLUTION });
});

after(async () => {
	if (!skip) {
		await server?.stop();
		await cleanupDatabase();
	}
	await removeTempDirs();
	await pool.end();
});

async function publishedChallenge(title) {
	const uploaded = await creatorClient.upload("/api/challenges", challengeForm({ title, packageBuffer }));
	assert.equal(uploaded.status, 201);
	assert.equal((await creatorClient.post(`/api/creator/challenges/${uploaded.data.id}/publish`)).status, 200);
	return uploaded.data.id;
}

async function attemptStatus(attemptId) {
	const row = (await pool.query("SELECT status, score FROM attempts WHERE id = $1", [attemptId])).rows[0];
	return { status: row.status, score: Number(row.score) };
}

test("UC01-TC03 a creator uploads a challenge package and finds it as a draft", { skip }, async () => {
	const uploaded = await creatorClient.upload("/api/challenges", challengeForm({ title: "UC01 upload", description: "Commit a solution", difficulty: "2", packageBuffer }));
	assert.equal(uploaded.status, 201);
	const mine = (await creatorClient.get("/api/creator/challenges")).data.find((challenge) => challenge.id === uploaded.data.id);
	assert.equal(mine.title, "UC01 upload");
	assert.equal(mine.description, "Commit a solution");
	assert.equal(mine.difficulty, "MUDAH");
	assert.equal(mine.status, "DRAF");
});

test("UC01-TC04 a zip without repo.zip is rejected as an invalid challenge package", { skip }, async () => {
	const invalid = await buildChallengePackage({ includeRepo: false, verify: VERIFY_SOLUTION });
	const response = await creatorClient.upload("/api/challenges", challengeForm({ title: "UC01 invalid", packageBuffer: invalid }));
	assert.equal(response.status, 400);
	assert.match(response.data.error, /Invalid challenge package/);
});

test("UC02-TC04 a creator evaluates a challenge in the terminal, verifies it, and publishes it", { skip }, async () => {
	const uploaded = await creatorClient.upload("/api/challenges", challengeForm({ title: "UC02 evaluate", packageBuffer }));
	const session = await creatorClient.post("/api/creator/sessions", { challengeId: uploaded.data.id });
	assert.equal(session.status, 201);
	const terminal = await openTerminal(server.port, creatorClient.cookie, `/api/creator/sessions/${session.data.sessionId}/terminal`);
	await terminal.run("touch solution.txt");
	await terminal.run("add solution.txt");
	assert.match(await terminal.run("commit -m \"add solution\""), /Commit created\./);
	await terminal.close();
	const verified = await creatorClient.post(`/api/creator/sessions/${session.data.sessionId}/verify`);
	assert.equal(verified.data.verification.score, 100);
	assert.match(verified.data.verification.output, /\[v\] solution commit found/);
	await creatorClient.del(`/api/creator/sessions/${session.data.sessionId}`);
	const published = await creatorClient.post(`/api/creator/challenges/${uploaded.data.id}/publish`);
	assert.equal(published.data.status, "TERPUBLIKASI");
	const catalog = (await studentClient.get("/api/challenges")).data.map((challenge) => challenge.id);
	assert.equal(catalog.includes(uploaded.data.id), true);
});

test("UC02-TC05 a creator edits a published challenge and then schedules it for deletion", { skip }, async () => {
	const id = await publishedChallenge("UC02 manage");
	const edited = await creatorClient.put(`/api/creator/challenges/${id}`, { title: "UC02 managed", description: "Updated description", difficulty: "9" });
	assert.equal(edited.status, 200);
	assert.equal(edited.data.title, "UC02 managed");
	assert.equal(edited.data.difficulty, "SULIT");
	const scheduled = await creatorClient.post(`/api/creator/challenges/${id}/schedule-delete`);
	assert.equal(scheduled.data.status, "DIJADWALKAN_HAPUS");
	const catalog = (await studentClient.get("/api/challenges")).data.map((challenge) => challenge.id);
	assert.equal(catalog.includes(id), false);
	const editAfterSchedule = await creatorClient.put(`/api/creator/challenges/${id}`, { title: "Too late", description: "x", difficulty: "1" });
	assert.equal(editAfterSchedule.status, 404);
});

test("UC03-TC04 a student solves a challenge in the terminal and receives full score with feedback", { skip }, async () => {
	const id = await publishedChallenge("UC03 solve");
	const session = await studentClient.post("/api/sessions", { challengeId: id });
	const terminal = await openTerminal(server.port, studentClient.cookie, `/api/sessions/${session.data.sessionId}/terminal`);
	await terminal.run("touch solution.txt");
	assert.match(await terminal.run("add solution.txt"), /Staged: solution\.txt/);
	await terminal.run("commit -m \"add solution\"");
	await terminal.close();
	const submitted = await studentClient.post(`/api/sessions/${session.data.sessionId}/submit`);
	assert.equal(submitted.status, 200);
	assert.equal(submitted.data.verification.passed, true);
	assert.match(submitted.data.verification.output, /\[v\] solution commit found/);
	assert.deepEqual(await attemptStatus(session.data.attemptId), { status: "SELESAI", score: 100 });
	assert.equal((await studentClient.post(`/api/sessions/${session.data.sessionId}/submit`)).status, 409);
});

test("UC03-TC05 restarting gives a fresh attempt and an unsolved submission keeps the partial score", { skip }, async () => {
	const id = await publishedChallenge("UC03 restart");
	const first = await studentClient.post("/api/sessions", { challengeId: id });
	const restarted = await studentClient.post(`/api/sessions/${first.data.sessionId}/restart`);
	assert.equal(restarted.status, 201);
	assert.notEqual(restarted.data.attemptId, first.data.attemptId);
	assert.notEqual(restarted.data.sessionId, first.data.sessionId);
	assert.deepEqual(await attemptStatus(first.data.attemptId), { status: "GAGAL", score: 0 });
	const submitted = await studentClient.post(`/api/sessions/${restarted.data.sessionId}/submit`);
	assert.equal(submitted.data.verification.score, 40);
	assert.match(submitted.data.verification.output, /\[x\] missing solution commit/);
	assert.deepEqual(await attemptStatus(restarted.data.attemptId), { status: "GAGAL", score: 40 });
});

test("UC03-TC06 leaving the challenge ends the attempt and closes the session", { skip }, async () => {
	const id = await publishedChallenge("UC03 leave");
	const session = await studentClient.post("/api/sessions", { challengeId: id });
	assert.equal((await studentClient.del(`/api/sessions/${session.data.sessionId}`)).status, 200);
	assert.deepEqual(await attemptStatus(session.data.attemptId), { status: "GAGAL", score: 0 });
	assert.equal((await studentClient.post(`/api/sessions/${session.data.sessionId}/submit`)).status, 404);
});

test("UC04-TC03 students see their attempt history and creators see the score recap", { skip }, async () => {
	const id = await publishedChallenge("UC04 recap");
	const solved = await studentClient.post("/api/sessions", { challengeId: id });
	const terminal = await openTerminal(server.port, studentClient.cookie, `/api/sessions/${solved.data.sessionId}/terminal`);
	await terminal.run("touch solution.txt");
	await terminal.run("add solution.txt");
	await terminal.run("commit -m \"add solution\"");
	await terminal.close();
	await studentClient.post(`/api/sessions/${solved.data.sessionId}/submit`);
	const abandoned = await studentClient.post("/api/sessions", { challengeId: id });
	await studentClient.del(`/api/sessions/${abandoned.data.sessionId}`);

	const history = (await studentClient.get("/api/history")).data.filter((item) => item.challengeId === id);
	assert.deepEqual(history.map((item) => [item.status, Number(item.score)]).sort(), [["GAGAL", 0], ["SELESAI", 100]]);

	const recap = await creatorClient.get(`/api/creator/challenges/${id}/attempts`);
	assert.equal(recap.status, 200);
	assert.equal(recap.data.total, 2);
	assert.equal(recap.data.completed, 1);
	assert.equal(recap.data.failed, 1);
	assert.equal(recap.data.active, 0);
	assert.equal(recap.data.averageScore, 50);
	assert.equal((await studentClient.get(`/api/creator/challenges/${id}/attempts`)).status, 403);
});
