import { pool } from "../db.js";

export async function saveChallengePackage({
	creatorId,
	title,
	description,
	difficulty,
	packageData
}) {
	const result = await pool.query(`
		INSERT INTO challenges
		(creator_id, title, description, difficulty, package_data)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, title, difficulty, status, created_at
	`, [creatorId, title, description, difficulty, packageData]);

	return result.rows[0];
}

export async function getChallengePackage(id) {
	const result = await pool.query(`
		SELECT package_data
		FROM challenges
		WHERE id = $1
	`, [id]);

	return result.rows[0]?.package_data ?? null;
}

export async function listChallenges() {
	const result = await pool.query(`
		SELECT c.id, c.title, c.difficulty, c.status, c.created_at, u.username
		AS creator
		FROM challenges c
		JOIN users u ON u.id = c.creator_id
		ORDER BY c.created_at DESC
	`);

	return result.rows;
}
