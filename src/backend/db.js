import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: process.env.ENV_FILE || ".env" });

const { Pool } = pg;

export const pool = new Pool({
	host: process.env.DB_HOST,
	port: Number(process.env.DB_PORT || 5432),
	database: process.env.DB_NAME,
	user: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	max: Number(process.env.DB_POOL_MAX || 10),
	idleTimeoutMillis: 30_000,
	connectionTimeoutMillis: 5_000
});

pool.on("error", (error) => {
	console.error("Unexpected PostgreSQL pool error:", error);
});

export async function query(text, params) {
	return pool.query(text, params);
}
