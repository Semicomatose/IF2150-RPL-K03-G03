import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { pool, environmentSkipReason, createAccount, cleanupDatabase } from "./test-integration-support.js";
import {
	saveChallengePackage,
	createAttempt,
	finishAttempt,
	getStudentHistory,
	listCreatorChallenges
} from "../backend/repositories/challengeRepository.js";

const skip = await environmentSkipReason();

let creator;

before(async () => {
	if (skip) return;
	creator = await createAccount("PEMBUAT");
});

after(async () => {
	if (!skip) await cleanupDatabase();
	await pool.end();
});

async function newChallenge(title) {
	return saveChallengePackage({ creatorId: creator.id, title, description: "KNF test", difficulty: "SEDANG", packageData: Buffer.from("PK") });
}

test("KNF03-TC01 attempts from 25 students submitted concurrently are all stored without loss", { skip }, async () => {
	const challenge = await newChallenge("KNF03 concurrency");
	const students = await Promise.all(Array.from({ length: 25 }, () => createAccount("PELAJAR")));

	const finished = await Promise.all(students.flatMap((student, index) => [
		(async () => {
			const attempt = await createAttempt(student.id, challenge.id);
			return finishAttempt({ attemptId: attempt.id, studentId: student.id, status: "SELESAI", score: 100 });
		})(),
		(async () => {
			const attempt = await createAttempt(student.id, challenge.id);
			return finishAttempt({ attemptId: attempt.id, studentId: student.id, status: "GAGAL", score: index % 100 });
		})()
	]));
	assert.equal(finished.filter(Boolean).length, 50);

	const stored = await pool.query("SELECT student_id, status, score FROM attempts WHERE challenge_id = $1", [challenge.id]);
	assert.equal(stored.rows.length, 50);
	assert.equal(new Set(finished.map((attempt) => String(attempt.id))).size, 50);

	for (const [index, student] of students.entries()) {
		const history = (await getStudentHistory(student.id)).filter((item) => String(item.challengeId) === String(challenge.id));
		assert.deepEqual(history.map((item) => [item.status, Number(item.score)]).sort(), [["GAGAL", index % 100], ["SELESAI", 100]]);
	}
});

test("KNF04-TC01 the creator dashboard list carries a correct recap of attempts per challenge", { skip }, async () => {
	const challenge = await newChallenge("KNF04 recap");
	const [first, second, third] = await Promise.all([createAccount("PELAJAR"), createAccount("PELAJAR"), createAccount("PELAJAR")]);
	const done = await createAttempt(first.id, challenge.id);
	await finishAttempt({ attemptId: done.id, studentId: first.id, status: "SELESAI", score: 100 });
	const failed = await createAttempt(second.id, challenge.id);
	await finishAttempt({ attemptId: failed.id, studentId: second.id, status: "GAGAL", score: 30 });
	await createAttempt(third.id, challenge.id);

	const recap = (await listCreatorChallenges(creator.id)).find((item) => String(item.id) === String(challenge.id));
	assert.equal(recap.attemptCount, 3);
	assert.equal(recap.completedCount, 1);
	assert.equal(recap.averageScore, 65);
});
