import http from "node:http";
import path from "node:path";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { WebSocketServer } from "ws";
import { initializeChallengeSession } from "./backend/services/challengeSessionService.js";
import { createRestrictedTerminalSession } from "./backend/services/terminalService.js";
import { authenticateLogin } from "./backend/services/authService.js";
import { verifyChallengeRepository } from "./backend/services/challengeVerificationService.js";

import {
	listChallenges,
	getChallengeDetails,
	createAttempt,
	finishAttempt,
	getStudentHistory,
	saveTerminalHistory
} from "./backend/repositories/challengeRepository.js";

const sessions = new Map();

const loginSessions = new Map();

const LOGIN_SESSION_TTL = 7 * 24 * 60 * 60 * 1000;
const COOKIE_NAME = "ci_session";

function getCookie(req, name) {
	const cookies = req.headers.cookie?.split(";") ?? [];
	for (const cookie of cookies) {
		const [key, ...value] = cookie.trim().split("=");
		if (key === name) {
			return decodeURIComponent(value.join("="));
		}
	}
	return null;
}

function getAuthenticatedUser(req) {
	const token = getCookie(req, COOKIE_NAME);
	if (!token) return null;

	const session = loginSessions.get(token);
	if (!session || session.expiresAt <= Date.now()) {
		loginSessions.delete(token);
		return null;
	}

	return session.user;
}

function requireAuthentication(req, res) {
    const user = getAuthenticatedUser(req);
    if (!user) {
        send(res, 401, { error: "Authentication required. Please log in." });
        return null;
    }
    return user;
}

function send(res, status, data) {
	res.writeHead(status, { "Content-Type": "application/json" });
	res.end(JSON.stringify(data));
}

async function closeSession(sessionId) {
	const session = sessions.get(sessionId);
	if (!session) return;

	for (const ws of session.sockets) {
		ws.close(1000, "Session closed");
	}

	sessions.delete(sessionId);

	await fs.rm(session.tempDir, {
		recursive: true,
		force: true
	});
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
			const token = randomUUID();

			loginSessions.set(token, {
				user,
				expiresAt: Date.now() + LOGIN_SESSION_TTL
			});

			const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

			res.setHeader("Set-Cookie",
				`${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${LOGIN_SESSION_TTL / 1000}${secure}`);

			return send(res, 200, { message: "Login successful", user });
		}

		if (req.method === "GET" && url.pathname === "/api/challenges") {
			const user = requireAuthentication(req, res);
			if (!user) return;

			try {
				const challenges = await listChallenges(user.id);
				return send(res, 200, challenges);
			} catch (error) {
				console.error("Failed to fetch challenges:", error);
				return send(res, 500, {
					error: "Failed to load challenges."
				});
			}
		}

		if (req.method === "GET" && url.pathname === "/api/history") {
			const user = requireAuthentication(req, res);
			if (!user) return;

			const history = await getStudentHistory(user.id);

			return send(res, 200, history);
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

		if (req.method === "GET" && url.pathname === "/api/me") {
			const user = getAuthenticatedUser(req);
			if (!user) {
				return send(res, 401, { error: "Not authenticated" });
			}
			return send(res, 200, { user });
		}

		if (req.method === "POST" && url.pathname === "/api/logout") {
			const token = getCookie(req, COOKIE_NAME);
			const user = token ? loginSessions.get(token)?.user : null;
			if (user) {
				for (const [sessionId, session] of sessions.entries()) {
					if (session.userId != user.id) continue;

					for (const ws of session.sockets) {
						ws.close(1000, "User logged out");
					}

					sessions.delete(sessionId);

					await fs.rm(session.tempDir, {
						recursive: true,
						force: true,
					});
				}
			}

			if (token) {
				loginSessions.delete(token);
			}

			res.setHeader(
				"Set-Cookie",
				`${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${
					process.env.NODE_ENV === "production" ? "; Secure" : ""
				}`);

			return send(res, 200, { message: "Logout successful" });
		}

		if (req.method === "POST" && url.pathname === "/api/sessions") {
			const user = requireAuthentication(req, res);
			if (!user) return;

			const { challengeId } = await readBody(req);

			if (!challengeId || !Number.isInteger(Number(challengeId))) {
				return send(res, 400, {
					error: "A valid challengeId is required."
				});
			}

			const id = Number(challengeId);
			const session = await initializeChallengeSession(id);

			try {
				const attempt = await createAttempt(user.id, id);

				sessions.set(session.sessionId, {
					userId: user.id,
					challengeId: id,
					attemptId: attempt.id,
					directory: session.repositoryDirectory,
					tempDir: session.tempDir,
					sockets: new Set(),
					lastActivityAt: Date.now(),
					submitted: false
				});

				return send(res, 201, {
					sessionId: session.sessionId,
					attemptId: attempt.id
				});
			} catch (error) {
				await fs.rm(session.tempDir, {
					recursive: true,
					force: true
				});

				throw error;
			}
		}

		const submitMatch = url.pathname.match(/^\/api\/sessions\/([a-f0-9-]+)\/submit$/);

		if (req.method === "POST" && submitMatch) {
			const user = requireAuthentication(req, res);
			if (!user) return;

			const sessionId = submitMatch[1];
			const session = sessions.get(sessionId);

			if (!session) {
				return send(res, 404, {
					error: "Session not found."
				});
			}

			if (session.userId !== user.id) {
				return send(res, 403, {
					error: "You do not own this session."
				});
			}

			if (session.submitted) {
				return send(res, 409, {
					error: "This attempt has already been submitted."
				});
			}

			const verification = await verifyChallengeRepository({
				repositoryDirectory: session.directory,
				scriptPath: path.join(session.tempDir, "verify.sh")
			});

			const attempt = await finishAttempt({
				attemptId: session.attemptId,
				studentId: user.id,
				status: verification.ok ? "SELESAI" : "GAGAL",
				score: verification.score
			});

			session.submitted = true;

			for (const ws of session.sockets) {
				ws.close(1000, "Challenge submitted");
			}

			session.sockets.clear();

			return send(res, 200, {
				message: "Challenge submitted.",
				attempt,
				verification
			});
		}

		const restartMatch = url.pathname.match(/^\/api\/sessions\/([a-f0-9-]+)\/restart$/);

		if (req.method === "POST" && restartMatch) {
			const user = requireAuthentication(req, res);
			if (!user) return;

			const oldSessionId = restartMatch[1];
			const oldSession = sessions.get(oldSessionId);

			if (!oldSession) {
				return send(res, 404, {
					error: "Session not found."
				});
			}

			if (oldSession.userId !== user.id) {
				return send(res, 403, {
					error: "You do not own this session."
				});
			}

			const newSession = await initializeChallengeSession(oldSession.challengeId);

			let newAttempt;
			try {
				newAttempt = await createAttempt(
					user.id,
					oldSession.challengeId
				);
			} catch (error) {
				await fs.rm(newSession.tempDir, {
					recursive: true,
					force: true
				});

				throw error;
			}

			if (!oldSession.submitted) {
				const closedAttempt = await finishAttempt({
					attemptId: oldSession.attemptId,
					studentId: user.id,
					status: "GAGAL",
					score: 0
				});

				if (!closedAttempt) {
					await fs.rm(newSession.tempDir, {
						recursive: true,
						force: true
					});

					await finishAttempt({
						attemptId: newAttempt.id,
						studentId: user.id,
						status: "GAGAL",
						score: 0
					});

					return send(res, 409, {
						error: "The previous attempt could not be closed."
					});
				}
			}

			const newSessionData = {
				userId: user.id,
				challengeId: oldSession.challengeId,
				attemptId: newAttempt.id,
				directory: newSession.repositoryDirectory,
				tempDir: newSession.tempDir,
				sockets: new Set(),
				lastActivityAt: Date.now(),
				submitted: false
			};

			sessions.set(newSession.sessionId, newSessionData);

			await closeSession(oldSessionId);

			return send(res, 201, {
				message: "Challenge restarted.",
				sessionId: newSession.sessionId,
				attemptId: newAttempt.id
			});
		}

		const deleteMatch = url.pathname.match(/^\/api\/sessions\/([a-f0-9-]+)$/);

		if (req.method === "DELETE" && deleteMatch) {
			const user = requireAuthentication(req, res);
			if (!user) return;

			const sessionId = deleteMatch[1];
			const session = sessions.get(sessionId);
			if (!session) {
				return send(res, 404, { error: "Session not found." });
			}

			if (session.userId !== user.id) {
				return send(res, 403, {
					error: "You do not own this session."
				});
			}

			if (!session.submitted) {
				await finishAttempt({
					attemptId: session.attemptId,
					studentId: user.id,
					status: "GAGAL",
					score: 0
				});
			}

			for (const ws of session.sockets) {
				ws.close(1000, "Session closed");
			}

			await closeSession(sessionId);

			return send(res, 200, {
				message: "Session closed."
			});
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
	try {
		const url = new URL(req.url, "http://localhost");
		const match = url.pathname.match(/^\/api\/sessions\/([a-f0-9-]+)\/terminal$/);

		if (!match) {
			socket.destroy();
			return;
		}

		const user = getAuthenticatedUser(req);
		if (!user) {
			socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
			socket.destroy();
			return;
		}

		const sessionId = match[1];
		const session = sessions.get(sessionId);
		if (!session) {
			socket.destroy();
			return;
		}

		if (session.userId !== user.id) {
			socket.write(
				"HTTP/1.1 403 Forbidden\r\n\r\n"
			);
			socket.destroy();
			return;
		}

		if (session.submitted) {
			socket.write("HTTP/1.1 409 Conflict\r\n\r\n");
			socket.destroy();
			return;
		}

		wss.handleUpgrade(req, socket, head, (ws) => {
			session.sockets.add(ws);
			session.lastActivityAt = Date.now();

			createRestrictedTerminalSession(
				ws,
				session.directory,
				{
					onCommand: async ({ command, output }) => {
						await saveTerminalHistory({
							attemptId: session.attemptId,
							command,
							output
						});
					}
				}
			);

			ws.on("close", () => {
				session.sockets.delete(ws);
			});

			ws.on("error", (error) => {
				console.error("WebSocket error:", error.message);
			});
		});
	} catch (error) {
		console.error("WebSocket upgrade error:", error);
		socket.destroy();
	}
});

server.listen(3000, "127.0.0.1", () => {
	console.log("Server running at http://localhost:3000");
});
