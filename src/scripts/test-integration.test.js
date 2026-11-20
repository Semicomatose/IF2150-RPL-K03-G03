import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { buildChallengePackage, removeTempDirs } from "./test-fixtures.js";
import {
	pool,
	environmentSkipReason,
	startServer,
	createClient,
	createAccount,
	trackUsername,
	loginAs,
	challengeForm,
	openTerminal,
	uniqueName,
	cleanupDatabase
} from "./test-integration-support.js";

const skip = await environmentSkipReason({ needsShellTools: true });

let server;
let creator;
let student;
let creatorClient;
let studentClient;
let packageBuffer;
let publishedChallengeId;

before(async () => {
	if (skip) return;
	server = await startServer();
	creator = await createAccount("PEMBUAT");
	student = await createAccount("PELAJAR");
	creatorClient = await loginAs(server.baseUrl, creator);
	studentClient = await loginAs(server.baseUrl, student);
	packageBuffer = await buildChallengePackage({ setup: "echo setup-done\n", verify: "echo \"[v] verified\"\nexit 100\n" });
	const uploaded = await creatorClient.upload("/api/challenges", challengeForm({ title: "INT shared challenge", packageBuffer }));
	publishedChallengeId = uploaded.data.id;
	await creatorClient.post(`/api/creator/challenges/${publishedChallengeId}/publish`);
});

after(async () => {
	if (!skip) {
		await server?.stop();
		await cleanupDatabase();
	}
	await removeTempDirs();
	await pool.end();
});

test("INT-TC01 I-01 /api/me rejects anonymous visitors and returns the logged-in user", { skip }, async () => {
	const anonymous = await createClient(server.baseUrl).get("/api/me");
	assert.equal(anonymous.status, 401);
	assert.match(anonymous.data.error, /Authentication required/);
	const me = await creatorClient.get("/api/me");
	assert.equal(me.status, 200);
	assert.equal(me.data.user.username, creator.username);
	assert.equal(me.data.user.role, "PEMBUAT");
});

test("INT-TC02 I-02 signup stores a PELAJAR account with a scrypt password hash", { skip }, async () => {
	const username = uniqueName("signup");
	const response = await createClient(server.baseUrl).post("/api/auth/signup", { email: `${username}@example.test`, username, password: "password123" });
	await trackUsername(username);
	assert.equal(response.status, 201);
	assert.equal(response.data.user.role, "PELAJAR");
	assert.equal("password_hash" in response.data.user, false);
	const stored = await pool.query("SELECT password_hash FROM users WHERE username = $1", [username]);
	assert.match(stored.rows[0].password_hash, /^scrypt\$[a-f0-9]+\$[a-f0-9]+$/);
	assert.doesNotMatch(stored.rows[0].password_hash, /password123/);
});

test("INT-TC03 I-02 signup rejects a taken username and a password below 8 characters", { skip }, async () => {
	const client = createClient(server.baseUrl);
	const duplicate = await client.post("/api/auth/signup", { email: `${uniqueName("dup")}@example.test`, username: student.username, password: "password123" });
	assert.equal(duplicate.status, 409);
	const username = uniqueName("short");
	const shortPassword = await client.post("/api/auth/signup", { email: `${username}@example.test`, username, password: "1234567" });
	assert.equal(shortPassword.status, 400);
	assert.match(shortPassword.data.error, /at least 8 characters/);
});

test("INT-TC04 I-03 login creates a session cookie that identifies the user", { skip }, async () => {
	const client = createClient(server.baseUrl);
	const response = await client.post("/api/login", { identifier: student.email, password: student.password });
	assert.equal(response.status, 200);
	assert.match(client.cookie, /^ci_session=[a-f0-9-]{36}$/);
	assert.equal((await client.get("/api/me")).data.user.id, student.id);
});

test("INT-TC05 I-03 login with a wrong password is refused without a session", { skip }, async () => {
	const client = createClient(server.baseUrl);
	const response = await client.post("/api/login", { identifier: student.username, password: "wrong-password" });
	assert.notEqual(response.status, 200);
	assert.match(response.data.error, /Invalid identifier or password/);
	assert.equal(client.cookie, "");
});

test("INT-TC06 I-08 uploading a valid package stores a DRAF challenge with the package bytes", { skip }, async () => {
	const response = await creatorClient.upload("/api/challenges", challengeForm({ title: "INT upload", packageBuffer }));
	assert.equal(response.status, 201);
	assert.equal(response.data.status, "DRAF");
	const stored = await pool.query("SELECT creator_id, octet_length(package_data) AS size FROM challenges WHERE id = $1", [response.data.id]);
	assert.equal(String(stored.rows[0].creator_id), String(creator.id));
	assert.equal(Number(stored.rows[0].size), packageBuffer.length);
});

test("INT-TC07 I-08 upload rejects non-zip files, overlong titles, and students", { skip }, async () => {
	const notZip = await creatorClient.upload("/api/challenges", challengeForm({ title: "INT bad file", packageBuffer, filename: "challenge.txt" }));
	assert.equal(notZip.status, 400);
	const longTitle = await creatorClient.upload("/api/challenges", challengeForm({ title: "x".repeat(51), packageBuffer }));
	assert.equal(longTitle.status, 400);
	const byStudent = await studentClient.upload("/api/challenges", challengeForm({ title: "INT student upload", packageBuffer }));
	assert.equal(byStudent.status, 403);
});

test("INT-TC08 I-05 difficulty levels are stored as the categories used by the challenge filter", { skip }, async () => {
	const expected = { "1": "MUDAH", "3": "MUDAH", "4": "SEDANG", "7": "SEDANG", "8": "SULIT", "10": "SULIT" };
	const ids = {};
	for (const level of Object.keys(expected)) {
		const response = await creatorClient.upload("/api/challenges", challengeForm({ title: `INT level ${level}`, packageBuffer, difficulty: level }));
		assert.equal(response.status, 201);
		ids[level] = response.data.id;
	}
	const listed = (await creatorClient.get("/api/challenges")).data;
	for (const [level, category] of Object.entries(expected)) {
		assert.equal(listed.find((challenge) => challenge.id === ids[level]).difficulty, category);
	}
	const outOfRange = await creatorClient.upload("/api/challenges", challengeForm({ title: "INT level 11", packageBuffer, difficulty: "11" }));
	assert.equal(outOfRange.status, 400);
});

test("INT-TC09 I-04 the main menu shows students only published challenges", { skip }, async () => {
	const draft = await creatorClient.upload("/api/challenges", challengeForm({ title: "INT hidden draft", packageBuffer }));
	let listed = (await studentClient.get("/api/challenges")).data.map((challenge) => challenge.id);
	assert.equal(listed.includes(draft.data.id), false);
	assert.equal(listed.includes(publishedChallengeId), true);
	await creatorClient.post(`/api/creator/challenges/${draft.data.id}/publish`);
	listed = (await studentClient.get("/api/challenges")).data.map((challenge) => challenge.id);
	assert.equal(listed.includes(draft.data.id), true);
});

test("INT-TC10 I-10 the evaluation environment runs commands, verifies once, and closes", { skip }, async () => {
	const created = await creatorClient.post("/api/creator/sessions", { challengeId: publishedChallengeId });
	assert.equal(created.status, 201);
	const sessionId = created.data.sessionId;
	const terminal = await openTerminal(server.port, creatorClient.cookie, `/api/creator/sessions/${sessionId}/terminal`);
	assert.match(await terminal.run("status"), /## main/);
	await terminal.close();
	const verified = await creatorClient.post(`/api/creator/sessions/${sessionId}/verify`);
	assert.equal(verified.status, 200);
	assert.equal(verified.data.verification.passed, true);
	assert.equal(verified.data.verification.score, 100);
	assert.equal((await creatorClient.post(`/api/creator/sessions/${sessionId}/verify`)).status, 409);
	assert.equal((await creatorClient.del(`/api/creator/sessions/${sessionId}`)).status, 200);
});

test("INT-TC11 I-09 the challenge environment records commands and the submitted score", { skip }, async () => {
	const created = await studentClient.post("/api/sessions", { challengeId: publishedChallengeId });
	assert.equal(created.status, 201);
	const { sessionId, attemptId } = created.data;
	let attempt = (await pool.query("SELECT status, score FROM attempts WHERE id = $1", [attemptId])).rows[0];
	assert.deepEqual({ status: attempt.status, score: Number(attempt.score) }, { status: "BERLANGSUNG", score: 0 });
	const terminal = await openTerminal(server.port, studentClient.cookie, `/api/sessions/${sessionId}/terminal`);
	await terminal.run("status");
	await terminal.close();
	const history = await pool.query("SELECT command FROM terminal_history WHERE attempt_id = $1", [attemptId]);
	assert.deepEqual(history.rows.map((row) => row.command), ["status"]);
	const submitted = await studentClient.post(`/api/sessions/${sessionId}/submit`);
	assert.equal(submitted.status, 200);
	assert.match(submitted.data.verification.output, /\[v\] verified/);
	attempt = (await pool.query("SELECT status, score, submitted_at FROM attempts WHERE id = $1", [attemptId])).rows[0];
	assert.equal(attempt.status, "SELESAI");
	assert.equal(Number(attempt.score), 100);
	assert.notEqual(attempt.submitted_at, null);
});

test("INT-TC12 I-07 history lists an abandoned attempt as failed with score 0", { skip }, async () => {
	const created = await studentClient.post("/api/sessions", { challengeId: publishedChallengeId });
	assert.equal((await studentClient.del(`/api/sessions/${created.data.sessionId}`)).status, 200);
	const history = await studentClient.get("/api/history");
	assert.equal(history.status, 200);
	const entry = history.data.find((item) => item.id === created.data.attemptId);
	assert.equal(entry.status, "GAGAL");
	assert.equal(Number(entry.score), 0);
	assert.equal(entry.challengeId, publishedChallengeId);
});

test("INT-TC13 I-06 logging out from the profile menu invalidates the session", { skip }, async () => {
	const client = await loginAs(server.baseUrl, student);
	assert.equal((await client.post("/api/logout")).status, 200);
	assert.equal((await client.get("/api/me")).status, 401);
});
