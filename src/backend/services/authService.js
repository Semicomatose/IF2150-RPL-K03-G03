import crypto from "node:crypto";
import { promisify } from "node:util";
import { findUser } from "../repositories/userRepository.js";

const scrypt = promisify(crypto.scrypt);
const PASSWORD_KEY_LENGTH = 64;

export async function createPasswordHash(password) {
	if (typeof password !== "string" || !password) {
		throw new Error("A password is required.");
	}

	const salt = crypto.randomBytes(16).toString("hex");
	const derivedKey = await scrypt(password, salt, PASSWORD_KEY_LENGTH);
	return `scrypt$${salt}$${Buffer.from(derivedKey).toString("hex")}`;
}

async function verifyPassword(password, passwordHash) {
	if (typeof passwordHash !== "string") return false;

	const parts = passwordHash.split("$");
	if (parts.length !== 3 || parts[0] !== "scrypt" ||
		!/^[a-f0-9]{16,128}$/i.test(parts[1]) ||
		!/^(?:[a-f0-9]{2}){16,128}$/i.test(parts[2])) {
		return false;
	}

	const expected = Buffer.from(parts[2], "hex");
	const derived = Buffer.from(await scrypt(password, parts[1], expected.length));
	return expected.length === derived.length && crypto.timingSafeEqual(expected, derived);
}

export async function authenticateLogin(identifier, password) {
	if (typeof identifier !== "string" || typeof password !== "string") {
		throw new Error("Invalid identifier or password");
	}

	const user = await findUser(identifier.trim());
	if (!user || !(await verifyPassword(password, user.password_hash))) {
		throw new Error("Invalid identifier or password");
	}

	const { password_hash, ...passwordlessUser } = user;
	return passwordlessUser;
}
