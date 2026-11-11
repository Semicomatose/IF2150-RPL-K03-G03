import crypto, { scryptSync } from "node:crypto";
import { findUser } from "../repositories/userRepository.js";

function verifyPassword(password, passwordHash) {
	const parts = passwordHash.split('$');
	if (parts.length !== 3 || parts[0] !== "scrypt") {
		return false;
	}

	const salt = parts[1];
	const hash = parts[2];

	const hashBuffer = Buffer.from(hash, "hex");
	const keyLength = hashBuffer.length;
	const derivedKey = crypto.scryptSync(password, salt, keyLength);

	return crypto.timingSafeEqual(hashBuffer, derivedKey);
}

export async function authenticateLogin(identifier, password) {
	const user = await findUser(identifier);
	if (!user) {
		throw new Error("Invalid identifier or password");
	}

	const passwordValid = verifyPassword(password, user.password_hash);
	if (!passwordValid) {
		throw new Error("Invalid identifier or password");
	}

	const { password_hash, ...passwordlessUser } = user;
	return passwordlessUser;
}
