import http from "node:http";
import { WebSocketServer } from "ws";
import fs from "node:fs/promises";
import { initializeChallengeSession } from "./backend/services/challengeSessionService.js";
import { createRestrictedTerminalSession } from "./backend/services/terminalService.js";
import { authenticateLogin } from "./backend/services/authService.js";
import { authenticateLogin, hashPassword } from "./backend/services/authService.js";
import { findUserById, updateUserProfile } from "./backend/repositories/userRepository.js";
import { getChallengesByCreator, getChallengeHistoryByUser } from "./backend/repositories/challengeRepository.js";

const sessions = new Map();

function send(res, status, data) {
	res.writeHead(status, { "Content-Type": "application/json" });
	res.end(JSON.stringify(data));
}

async function readBody(req) {
	let body = "";

	for await (const chunk of req) {
		body += chunk;
		if (body.length > 16_384) {
			throw new Error("Request body too large");
		}
	}

	return JSON.parse(body || "{}");
}

const server = http.createServer(async (req, res) => {
	try {
		const url = new URL(req.url, "http://localhost");

		if (req.method === "POST" && url.pathname === "/api/login") {
			const { identifier, password } = await readBody(req);

			if (!identifier || !password) {
				return send(res, 400, { error: "Identifier and password are required" });
			}

			const user = await authenticateLogin(identifier, password);
			return send(res, 200, {
				message: "Login successful",
				user
			});
		}

		if (req.method === "POST" && url.pathname === "/api/sessions") {
			const { challengeId } = await readBody(req);

			if (!challengeId) {
				return send(res, 400, { error: "challengeId is required" });
			}

			const session = await initializeChallengeSession(challengeId);
			sessions.set(session.sessionId, {
				directory: session.repositoryDirectory,
				tempDir: session.tempDir,
				sockets: new Set(),
				lastActivityAt: Date.now()
			});

			return send(res, 201, { sessionId: session.sessionId });
		}

		const match = url.pathname.match(/^\/api\/sessions\/([a-f0-9-]+)$/);

		if (req.method === "DELETE" && match) {
			const session = sessions.get(match[1]);
			if (!session) {
				return send(res, 404, { error: "Session not found" });
			}

			for (const ws of session.sockets) {
				ws.close(1000, "Session closed");
			}

			sessions.delete(match[1]);

			await fs.rm(session.tempDir, {
				recursive: true,
				force: true
			});

			return send(res, 200, { message: "Session closed" });
		}

		return send(res, 404, { error: "Route not found" });
	} catch (error) {
		console.error(error);

		let status = 400;
		if (error.message.includes("Invalid")) {
			status = 401;
		}

		return send(res, status, { error: error.message });
	}
});

const wss = new WebSocketServer({ noServer: true, maxPayload: 4096 });

server.on("upgrade", async (req, socket, head) => {
	const url = new URL(req.url, "http://localhost");

	const match = url.pathname.match(/^\/api\/sessions\/([a-f0-9-]+)\/terminal$/);

	if (!match) {
		socket.destroy();
		return;
	}

	const sessionId = match[1];
	const session = sessions.get(sessionId);
	if (!session) {
		socket.destroy();
		return;
	}

	wss.handleUpgrade(req, socket, head, (ws) => {
		session.sockets.add(ws);
		session.lastActivityAt = Date.now();
		createRestrictedTerminalSession(ws, session.directory);
		ws.on("close", () => {
			session.sockets.delete(ws);
		});
		ws.on("error", (error) => {
			console.error("Websocket error:", error.message);
		});
	});
});

server.listen(3000, "127.0.0.1", () => {
	console.log("Server running at http://localhost:3000");
});

const userMatch = url.pathname.match(/^\/api\/users\/(\d+)$/);
if (userMatch) {
	const userId = Number(userMatch[1]);

	if (req.method === "GET") {
		const user = await findUserById(userId);
		if (!user) return send(res, 404, { error: "User not found" });
		return send(res, 200, { user });
	}

	if (req.method === "PATCH") {
		const body = await readBody(req);
		const updates = {};

		if (body.username !== undefined) updates.username = body.username;
		if (body.email !== undefined) updates.email = body.email;
		if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url;
		if (body.password) {
			updates.password_hash = hashPassword(body.password);
		}

		const updatedUser = await updateUserProfile(userId, updates);
		return send(res, 200, { user: updatedUser });
	}
}

const userChallengesMatch = url.pathname.match(/^\/api\/users\/(\d+)\/challenges$/);
if (req.method === "GET" && userChallengesMatch) {
	const userId = Number(userChallengesMatch[1]);
	const [history, created] = await Promise.all([
		getChallengeHistoryByUser(userId),
		getChallengesByCreator(userId)
	]);

	return send(res, 200, { history, created });
}
