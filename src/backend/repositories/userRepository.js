import { pool } from "../db.js";

export async function createUser({ username, email, passwordHash, role }) {
	const result = await pool.query(`
		INSERT INTO users (username, email, password_hash, role)
		VALUES ($1, $2, $3, $4)
		RETURNING id, username, email, role, created_at
	`, [username, email, passwordHash, role]);

	return result.rows[0];
}
