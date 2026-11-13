import { pool } from "../db.js";

export async function createUser({ username, email, passwordHash, role }) {
	const result = await pool.query(`
		INSERT INTO users (username, email, password_hash, role)
		VALUES ($1, $2, $3, $4)
		RETURNING id, username, email, role, created_at
	`, [username, email, passwordHash, role]);

	return result.rows[0];
}

export async function findUser(identifier) {
	const result = await pool.query(`
		SELECT id, username, email, password_hash
		FROM users
		WHERE email = $1 OR username = $1
	`, [identifier]);

	return result.rows[0] || null;
}

export async function findUserById(id) {
	const result = await pool.query(`
		SELECT id, username, email, role, avatar_url, created_at
		FROM users
		WHERE id = $1
	`, [id]);

	return result.rows[0] ?? null;
}

export async function updateUserProfile(id, updates) {
	const allowedColumns = ["username", "email", "password_hash", "avatar_url"];
	const entries = Object.entries(updates).filter(([key]) => allowedColumns.includes(key));

	if (entries.length === 0) {
		throw new Error("No valid fields to update");
	}

	const setClauses = entries.map(([key], idx) => `${key} = $${idx + 1}`).join(", ");
	const values = entries.map(([, val]) => val);

	const result = await pool.query(`
		UPDATE users
		SET ${setClauses}
		WHERE id = $${values.length + 1}
		RETURNING id, username, email, role, avatar_url, created_at
	`, [...values, id]);

	return result.rows[0];
}

export async function getChallengeHistoryByUser(userId) {
	const result = await pool.query(`
		SELECT 
			c.id AS challenge_id,
			c.title,
			c.difficulty,
			uc.status,
			uc.updated_at
		FROM user_challenges uc
		JOIN challenges c ON c.id = uc.challenge_id
		WHERE uc.user_id = $1
		ORDER BY uc.updated_at DESC
	`, [userId]);

	return result.rows;
}

export async function getChallengesByCreator(creatorId) {
	const result = await pool.query(`
		SELECT 
			c.id,
			c.title,
			c.difficulty,
			c.status,
			c.created_at,
			COUNT(DISTINCT uc.user_id)::int AS total_players
		FROM challenges c
		LEFT JOIN user_challenges uc ON uc.challenge_id = c.id
		WHERE c.creator_id = $1
		GROUP BY c.id
		ORDER BY c.created_at DESC
	`, [creatorId]);

	return result.rows;
}

export async function upsertUserChallengeProgress(userId, challengeId, status) {
	const result = await pool.query(`
		INSERT INTO user_challenges (user_id, challenge_id, status, updated_at)
		VALUES ($1, $2, $3, NOW())
		ON CONFLICT (user_id, challenge_id)
		DO UPDATE SET 
			status = EXCLUDED.status,
			updated_at = NOW()
		RETURNING *
	`, [userId, challengeId, status]);

	return result.rows[0];
}
