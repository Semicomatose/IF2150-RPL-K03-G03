import { pool } from "../backend/db.js";
import { authenticateLogin } from "../backend/services/authService.js";

console.log("DB host:", process.env.DB_HOST);
console.log("DB port:", process.env.DB_PORT);
console.log("DB name:", process.env.DB_NAME);

try {
    const retrieveUsername = await authenticateLogin("demo-user", "password123");
	console.log("Authenticated user:", retrieveUsername);

    const retrieveEmail = await authenticateLogin("demo@enneffdee.com", "password123");
	console.log("Authenticated email:", retrieveEmail);

    try {
        await authenticateLogin("demo-user", "erroneouspass");
    }
    catch (error) {
        console.error("This is supposed to be an error message for a purposefully erroneous password.")
        console.log("Expected error:", error.message);
    }

    try {
        await authenticateLogin("nonexistent", "password123");
    }
    catch (error) {
        console.error("This is supposed to be an error message for a purposefully nonexistent user.")
        console.log("Expected error:", error.message);
    }

    console.log("\nTest succeeded.");
    
}

catch (error) {
    console.error("Test failed: ", error);
}

finally {
    await pool.end();
}