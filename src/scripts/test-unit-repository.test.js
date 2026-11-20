import test, { beforeEach, mock } from "node:test";
import assert from "node:assert/strict";

const queries = [];
const results = [];

const pool = {
	async query(text, params) {
		queries.push({ sql: text.replace(/\s+/g, " ").trim(), params });
		const next = results.shift();
		if (next instanceof Error) throw next;
		return next ?? { rows: [] };
	}
};

mock.module(new URL("../backend/db.js", import.meta.url).href, {
	namedExports: { pool, query: (text, params) => pool.query(text, params) }
});

const { createUser, findUser } = await import("../backend/repositories/userRepository.js");
const { authenticateLogin, createPasswordHash } = await import("../backend/services/authService.js");
const {
	saveChallengePackage,
	getChallengePackage,
	updateChallengeStatus,
	updateCreatorChallenge,
	createAttempt,
	finishAttempt,
	getStudentHistory,
	saveTerminalHistory
} = await import("../backend/repositories/challengeRepository.js");

beforeEach(() => {
	queries.length = 0;
	results.length = 0;
});

test("C01-UT01 createUser stores a challenge creator with role PEMBUAT", async () => {
	const row = { id: 7, username: "creator", email: "creator@example.test", role: "PEMBUAT" };
	results.push({ rows: [row] });
	const user = await createUser({ username: "creator", email: "creator@example.test", passwordHash: "scrypt$x$y", role: "PEMBUAT" });
	assert.deepEqual(user, row);
	assert.match(queries[0].sql, /^INSERT INTO users/);
	assert.deepEqual(queries[0].params, ["creator", "creator@example.test", "scrypt$x$y", "PEMBUAT"]);
});

test("C01-UT02 findUser returns null for an unknown identifier", async () => {
	results.push({ rows: [] });
	assert.equal(await findUser("nobody"), null);
});

test("C01-UT03 findUser matches email or username case-insensitively", async () => {
	results.push({ rows: [{ id: 1, username: "Creator" }] });
	const user = await findUser("CREATOR@Example.test");
	assert.equal(user.id, 1);
	assert.match(queries[0].sql, /LOWER\(email\) = LOWER\(\$1\) OR LOWER\(username\) = LOWER\(\$1\)/);
	assert.deepEqual(queries[0].params, ["CREATOR@Example.test"]);
});

test("C02-UT01 createUser registers a student with the default role PELAJAR", async () => {
	results.push({ rows: [{ id: 2, role: "PELAJAR" }] });
	await createUser({ username: "student", email: "student@example.test", passwordHash: "scrypt$x$y" });
	assert.equal(queries[0].params[3], "PELAJAR");
});

test("C02-UT02 authenticateLogin returns the user without password_hash on a correct password", async () => {
	const passwordHash = await createPasswordHash("password123");
	results.push({ rows: [{ id: 3, username: "student", email: "s@example.test", role: "PELAJAR", password_hash: passwordHash }] });
	const user = await authenticateLogin("  student  ", "password123");
	assert.deepEqual(user, { id: 3, username: "student", email: "s@example.test", role: "PELAJAR" });
	assert.deepEqual(queries[0].params, ["student"]);
});

test("C02-UT03 authenticateLogin rejects a wrong password", async () => {
	const passwordHash = await createPasswordHash("password123");
	results.push({ rows: [{ id: 3, username: "student", role: "PELAJAR", password_hash: passwordHash }] });
	await assert.rejects(() => authenticateLogin("student", "wrong-password"), /Invalid identifier or password/);
});

test("C02-UT04 authenticateLogin rejects non-string credentials without querying the database", async () => {
	await assert.rejects(() => authenticateLogin(null, "password123"), /Invalid identifier or password/);
	assert.equal(queries.length, 0);
});

test("C03-UT01 saveChallengePackage stores metadata and the package buffer", async () => {
	const packageData = Buffer.from("PK");
	results.push({ rows: [{ id: 10, title: "Broken Repo", difficulty: "SEDANG", status: "DRAF" }] });
	const challenge = await saveChallengePackage({ creatorId: 7, title: "Broken Repo", description: "Fix it", difficulty: "SEDANG", packageData });
	assert.equal(challenge.status, "DRAF");
	assert.match(queries[0].sql, /^INSERT INTO challenges/);
	assert.deepEqual(queries[0].params, [7, "Broken Repo", "Fix it", "SEDANG", packageData]);
});

test("C03-UT02 getChallengePackage returns the stored package for an accessible challenge", async () => {
	const packageData = Buffer.from("PK");
	results.push({ rows: [{ package_data: packageData }] });
	assert.equal(await getChallengePackage(10, 3), packageData);
	assert.match(queries[0].sql, /status = 'TERPUBLIKASI' OR creator_id = \$2/);
	assert.deepEqual(queries[0].params, [10, 3]);
});

test("C03-UT03 getChallengePackage returns null when the challenge is not accessible", async () => {
	results.push({ rows: [] });
	assert.equal(await getChallengePackage(10, 99), null);
});

test("C03-UT04 updateChallengeStatus publishes a challenge owned by the creator", async () => {
	results.push({ rows: [{ id: 10, title: "Broken Repo", status: "TERPUBLIKASI" }] });
	const updated = await updateChallengeStatus({ id: 10, creatorId: 7, status: "TERPUBLIKASI" });
	assert.equal(updated.status, "TERPUBLIKASI");
	assert.deepEqual(queries[0].params, ["TERPUBLIKASI", 10, 7]);
});

test("C03-UT05 updateChallengeStatus returns null for a challenge owned by another creator", async () => {
	results.push({ rows: [] });
	assert.equal(await updateChallengeStatus({ id: 10, creatorId: 8, status: "DIJADWALKAN_HAPUS" }), null);
});

test("C03-UT06 updateCreatorChallenge does not edit challenges scheduled for deletion", async () => {
	results.push({ rows: [] });
	const updated = await updateCreatorChallenge({ id: 10, creatorId: 7, title: "New", description: "Desc", difficulty: "SULIT" });
	assert.equal(updated, null);
	assert.match(queries[0].sql, /status <> 'DIJADWALKAN_HAPUS'/);
	assert.deepEqual(queries[0].params, ["New", "Desc", "SULIT", 10, 7]);
});

test("C09-UT01 createAttempt records a new attempt as BERLANGSUNG with score 0", async () => {
	results.push({ rows: [{ id: 50, status: "BERLANGSUNG", score: 0 }] });
	const attempt = await createAttempt(3, 10);
	assert.equal(attempt.id, 50);
	assert.match(queries[0].sql, /VALUES \(\$1, \$2, 'BERLANGSUNG', 0\)/);
	assert.deepEqual(queries[0].params, [3, 10]);
});

test("C09-UT02 finishAttempt accepts the boundary scores 0 and 100", async () => {
	results.push({ rows: [{ id: 50, status: "GAGAL", score: 0 }] }, { rows: [{ id: 51, status: "SELESAI", score: 100 }] });
	assert.equal((await finishAttempt({ attemptId: 50, studentId: 3, status: "GAGAL", score: 0 })).score, 0);
	assert.equal((await finishAttempt({ attemptId: 51, studentId: 3, status: "SELESAI", score: 100 })).score, 100);
	assert.deepEqual(queries[1].params, ["SELESAI", 100, 51, 3]);
});

test("C09-UT03 finishAttempt rejects scores outside 0..100 and non-integer scores", async () => {
	for (const score of [-1, 101, 50.5, "80"]) {
		await assert.rejects(() => finishAttempt({ attemptId: 50, studentId: 3, status: "SELESAI", score }), /Invalid attempt score/);
	}
	assert.equal(queries.length, 0);
});

test("C09-UT04 finishAttempt rejects an unknown attempt status", async () => {
	await assert.rejects(() => finishAttempt({ attemptId: 50, studentId: 3, status: "BERLANGSUNG", score: 10 }), /Invalid attempt status/);
	assert.equal(queries.length, 0);
});

test("C09-UT05 finishAttempt returns null when the attempt is no longer active", async () => {
	results.push({ rows: [] });
	assert.equal(await finishAttempt({ attemptId: 50, studentId: 3, status: "SELESAI", score: 90 }), null);
	assert.match(queries[0].sql, /AND status = 'BERLANGSUNG'/);
});

test("C09-UT06 getStudentHistory returns the attempts of one student, newest first", async () => {
	const rows = [{ id: 51, challengeId: 10, status: "SELESAI", score: 100 }, { id: 50, challengeId: 10, status: "GAGAL", score: 0 }];
	results.push({ rows });
	assert.deepEqual(await getStudentHistory(3), rows);
	assert.match(queries[0].sql, /WHERE a\.student_id = \$1 ORDER BY a\.started_at DESC/);
	assert.deepEqual(queries[0].params, [3]);
});

test("C09-UT07 saveTerminalHistory stores null when a command has no output", async () => {
	await saveTerminalHistory({ attemptId: 50, command: "git status" });
	assert.match(queries[0].sql, /^INSERT INTO terminal_history/);
	assert.deepEqual(queries[0].params, [50, "git status", null]);
});
