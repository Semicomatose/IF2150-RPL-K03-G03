import { pool } from "../db.js";

export async function saveChallengePackage({ creatorId, title, description, difficulty, packageData }) {
	const result = await pool.query(`
		INSERT INTO challenges
			(creator_id, title, description, difficulty, package_data)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, title, difficulty, status, created_at
	`, [creatorId, title, description, difficulty, packageData]);

	return result.rows[0];
}

export async function getChallengeDetails(id, userId) {
	const result = await pool.query(`
		SELECT c.id, c.title, c.description, c.difficulty,
			   c.status, u.username AS creator
		FROM challenges c
		JOIN users u ON u.id = c.creator_id
		WHERE c.id = $1
		  AND (c.status = 'TERPUBLIKASI' OR c.creator_id = $2)
		LIMIT 1
	`, [id, userId]);

	return result.rows[0] ?? null;
}

export async function getChallengePackage(id, userId) {
	const result = await pool.query(`
		SELECT package_data
		FROM challenges
		WHERE id = $1
		  AND (status = 'TERPUBLIKASI' OR creator_id = $2)
		LIMIT 1
	`, [id, userId]);

	return result.rows[0]?.package_data ?? null;
}

export async function listChallenges(userId) {
	const result = await pool.query(`
		SELECT
			c.id,
			c.title,
			c.description,
			c.difficulty,
			c.status,
			c.created_at,
			u.username AS creator,
			(c.creator_id = $1) AS "isUserCreated",
			(c.status = 'TERPUBLIKASI') AS "isPublished"
		FROM challenges c
		JOIN users u ON u.id = c.creator_id
		WHERE c.status = 'TERPUBLIKASI'
		   OR (c.creator_id = $1 AND c.status <> 'TERPUBLIKASI')
		ORDER BY c.created_at DESC
	`, [userId]);

	return result.rows;
}

export async function createAttempt(studentId, challengeId) {
	const result = await pool.query(`
		INSERT INTO attempts (student_id, challenge_id, status, score)
		VALUES ($1, $2, 'BERLANGSUNG', 0)
		RETURNING id, student_id, challenge_id, status, score, started_at
	`, [studentId, challengeId]);

	return result.rows[0];
}

export async function finishAttempt({ attemptId, studentId, status, score }) {
	if (!["SELESAI", "GAGAL"].includes(status)) {
		throw new Error("Invalid attempt status.");
	}
	if (!Number.isInteger(score) || score < 0 || score > 100) {
		throw new Error("Invalid attempt score. Score must be an integer from 0 to 100.");
	}

	const result = await pool.query(`
		UPDATE attempts
		SET status = $1,
			score = $2,
			submitted_at = CURRENT_TIMESTAMP
		WHERE id = $3
		  AND student_id = $4
		  AND status = 'BERLANGSUNG'
		RETURNING id, status, score, submitted_at
	`, [status, score, attemptId, studentId]);

	return result.rows[0] ?? null;
}

export async function saveTerminalHistory({ attemptId, command, output }) {
	await pool.query(`
		INSERT INTO terminal_history (attempt_id, command, output)
		VALUES ($1, $2, $3)
	`, [attemptId, command, output ?? null]);
}

export async function getStudentHistory(studentId) {
	const result = await pool.query(`
		SELECT
			a.id,
			a.challenge_id AS "challengeId",
			c.title,
			a.status,
			a.score,
			a.started_at AS "startedAt",
			a.submitted_at AS "submittedAt"
		FROM attempts a
		JOIN challenges c ON c.id = a.challenge_id
		WHERE a.student_id = $1
		ORDER BY a.started_at DESC
	`, [studentId]);

	return result.rows;
}
