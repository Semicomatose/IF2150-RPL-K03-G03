import { pool } from "../db.js";

export async function createUser({ username, email, passwordHash, role = "PELAJAR" }) {
	const result = await pool.query(`
		INSERT INTO users (username, email, password_hash, role)
		VALUES ($1, $2, $3, $4)
		RETURNING id, username, email, role, created_at
	`, [username, email, passwordHash, role]);

	return result.rows[0];
}

export async function findUser(identifier) {
	const result = await pool.query(`
		SELECT id, username, email, password_hash, role, created_at
		FROM users
		WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($1)
		LIMIT 1
	`, [identifier]);

	return result.rows[0] || null;
}
