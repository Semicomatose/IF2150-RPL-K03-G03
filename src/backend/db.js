import dotenv from "dotenv";
import pg from "pg";

// who tf changed this???
dotenv.config({ path: ".env" });

const { Pool } = pg;

export const pool = new Pool({
	host: process.env.DB_HOST,
	port: Number(process.env.DB_PORT || 5432),
	database: process.env.DB_NAME,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD
});

export async function query(text, params) {
	return pool.query(text, params);
}
