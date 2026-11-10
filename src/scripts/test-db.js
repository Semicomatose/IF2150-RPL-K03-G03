import { pool } from "../backend/db.js"

try {
	const result = await pool.query(`
		SELECT
			current_database() AS database,
			current_user AS username,
			NOW() AS connected_at
	`);

	console.log("Database connection successful!");
	console.log(result.rows[0]);

	const tables = await pool.query(`
		SELECT table_name
		FROM information_schema.tables
		WHERE table_schema = 'public'
		ORDER BY table_name
	`);

	console.log("\nAvailable tables:");
	for (const row of tables.rows) {
		console.log(` - ${row.table_name}`);
	}
} catch (error) {
	console.error("Database connection failed:", error.message);
	process.exitCode = 1;
} finally {
	await pool.end();
}
