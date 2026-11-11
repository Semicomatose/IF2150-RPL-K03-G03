import http from "node:http";
import { WebSocketServer } from "ws";
import fs from "node:fs/promises";
import { initializeChallengeSession } from "./backend/services/challengeSessionService.js";
import { createRestrictedTerminalSession } from "./backend/services/terminalService.js";
import { authenticateLogin } from "./backend/services/authService.js";
import { getChallengeDetails } from "./backend/repositories/challengeRepository.js";
import { listChallenges } from "./backend/repositories/challengeRepository.js";

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

		if (req.method === "GET" && url.pathname === "/api/challenges") {
			try {
				const challenges = await listChallenges();
				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(JSON.stringify(challenges));
			} catch (error) {
				console.error("Failed to fetch challenges:", error);
				res.writeHead(500, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ message: "Failed to load challenges." }));
			}
			return;
		}

		if (req.method === "GET") {
			const match = url.pathname.match(/^\/api\/challenges\/(\d+)$/);

			if (match) {
				try {
					const challenge = await getChallengeDetails(match[1]);

					if (!challenge) {
						res.writeHead(404, {
							"Content-Type": "application/json"
						});
						res.end(JSON.stringify({
							message: "Challenge not found"
						}));
						return;
					}

					res.writeHead(200, {
						"Content-Type": "application/json"
					});
					res.end(JSON.stringify(challenge));
					return;
				} catch (error) {
					console.error("Failed to fetch challenge:", error);

					res.writeHead(500, {
						"Content-Type": "application/json"
					});
					res.end(JSON.stringify({
						message: "Failed to fetch challenge"
					}));
					return;
				}
			}
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

		const deleteMatch = url.pathname.match(/^\/api\/sessions\/([a-f0-9-]+)$/);

		if (req.method === "DELETE" && deleteMatch) {
			const sessionId = deleteMatch[1];
			const session = sessions.get(sessionId);
			if (!session) {
				return send(res, 404, { error: "Session not found" });
			}

			for (const ws of session.sockets) {
				ws.close(1000, "Session closed");
			}

			sessions.delete(sessionId);

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
