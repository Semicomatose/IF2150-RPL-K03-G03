import http from "node:http";
import path from "node:path";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { WebSocketServer } from "ws";

import { pool } from "./backend/db.js";
import { initializeChallengeSession, validateChallengePackageBuffer } from "./backend/services/challengeSessionService.js";
import { createRestrictedTerminalSession } from "./backend/services/terminalService.js";
import { authenticateLogin, createPasswordHash } from "./backend/services/authService.js";
import { verifyChallengeRepository } from "./backend/services/challengeVerificationService.js";
import { createUser } from "./backend/repositories/userRepository.js";
import {
	listChallenges,
	getChallengeDetails,
	createAttempt,
	finishAttempt,
	getStudentHistory,
	saveTerminalHistory,
	saveChallengePackage,
	listCreatorChallenges,
	updateCreatorChallenge,
	updateChallengeStatus,
	getCreatorChallengeAttempts
} from "./backend/repositories/challengeRepository.js";

const sessions = new Map();
const loginSessions = new Map();

const LOGIN_SESSION_TTL = 7 * 24 * 60 * 60 * 1000;
const SESSION_IDLE_TTL = 2 * 60 * 60 * 1000;
const COOKIE_NAME = "ci_session";
const MAX_BODY_BYTES = 16 * 1024;

class HttpError extends Error {
	constructor(status, message) {
		super(message);
		this.status = status;
	}
}

function getCookie(req, name) {
	const cookies = req.headers.cookie?.split(";") ?? [];
	for (const cookie of cookies) {
		const [key, ...value] = cookie.trim().split("=");
		if (key === name) {
			try {
				return decodeURIComponent(value.join("="));
			} catch {
				return null;
			}
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

function requireAuthentication(req) {
	const user = getAuthenticatedUser(req);
	if (!user) throw new HttpError(401, "Authentication required. Please log in.");
	return user;
}

function send(res, status, data) {
	if (res.headersSent || res.destroyed) return;
	res.writeHead(status, {
		"Content-Type": "application/json; charset=utf-8",
		"Cache-Control": "no-store",
		"X-Content-Type-Options": "nosniff"
	});
	res.end(JSON.stringify(data));
}

async function readBody(req) {
	const chunks = [];
	let bytes = 0;

	for await (const chunk of req) {
		bytes += chunk.length;
		if (bytes > MAX_BODY_BYTES) {
			throw new HttpError(413, "Request body too large.");
		}
		chunks.push(chunk);
	}

	try {
		const parsed = JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
			throw new Error("Expected a JSON object.");
		}
		return parsed;
	} catch {
		throw new HttpError(400, "Request body must contain valid JSON.");
	}
}

function setSessionCookie(res, token) {
	const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
	res.setHeader(
		"Set-Cookie",
		`${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${LOGIN_SESSION_TTL / 1000}${secure}`
	);
}

function clearSessionCookie(res) {
	const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
	res.setHeader(
		"Set-Cookie",
		`${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0${secure}`
	);
}

async function removeSession(sessionId) {
	const session = sessions.get(sessionId);
	if (!session) return;

	sessions.delete(sessionId);
	for (const ws of session.sockets) {
		try {
			ws.close(1000, "Session closed");
		} catch {}
	}
	session.sockets.clear();

	await fs.rm(session.tempDir, { recursive: true, force: true });
}

async function failAndRemoveSession(sessionId, userId) {
	const session = sessions.get(sessionId);
	if (!session) return;

	if (!session.submitted && !session.creatorMode && session.attemptId) {
		await finishAttempt({
			attemptId: session.attemptId,
			studentId: userId,
			status: "GAGAL",
			score: 0
		});
	}

	await removeSession(sessionId);
}

async function createUserSession(user, res) {
	const token = randomUUID();
	loginSessions.set(token, {
		user,
		expiresAt: Date.now() + LOGIN_SESSION_TTL
	});
	setSessionCookie(res, token);
}

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

async function readMultipart(req) {
	const contentType = req.headers["content-type"] || "";
	const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
	if (!contentType.toLowerCase().startsWith("multipart/form-data") || !boundaryMatch) {
		throw new HttpError(400, "Expected multipart form data.");
	}
	const boundary = boundaryMatch[1] || boundaryMatch[2];
	const chunks = [];
	let size = 0;
	for await (const chunk of req) {
		size += chunk.length;
		if (size > MAX_UPLOAD_BYTES + 1024 * 1024) throw new HttpError(413, "Challenge ZIP exceeds 25 MB.");
		chunks.push(chunk);
	}
	const body = Buffer.concat(chunks);
	const delimiter = Buffer.from(`--${boundary}`);
	const fields = {};
	let cursor = 0;
	while (true) {
		const start = body.indexOf(delimiter, cursor);
		if (start < 0) break;
		let partStart = start + delimiter.length;
		if (body.subarray(partStart, partStart + 2).toString() === "--") break;
		if (body.subarray(partStart, partStart + 2).toString() === "\r\n") partStart += 2;
		const headerEnd = body.indexOf(Buffer.from("\r\n\r\n"), partStart);
		if (headerEnd < 0) break;
		const next = body.indexOf(delimiter, headerEnd + 4);
		if (next < 0) break;
		let partEnd = next;
		if (body.subarray(partEnd - 2, partEnd).toString() === "\r\n") partEnd -= 2;
		const headers = body.subarray(partStart, headerEnd).toString("utf8");
		const disposition = headers.match(/content-disposition:\s*form-data;([^\r\n]+)/i)?.[1] || "";
		const name = disposition.match(/name="([^"]+)"/)?.[1];
		const filename = disposition.match(/filename="([^"]*)"/)?.[1];
		if (name) {
			const value = body.subarray(headerEnd + 4, partEnd);
			fields[name] = filename !== undefined ? { filename, data: value } : value.toString("utf8");
		}
		cursor = next;
	}
	return fields;
}

function requireCreator(user) {
	if (user.role !== "PEMBUAT") throw new HttpError(403, "Only challenge creators can manage challenges.");
}

function requireCreatorSession(session, user) {
	if (!session || !session.creatorMode) throw new HttpError(404, "Evaluation session not found.");
	if (String(session.userId) !== String(user.id)) throw new HttpError(403, "You do not own this evaluation session.");
}

function difficultyLabel(value) {
	if (["MUDAH", "SEDANG", "SULIT"].includes(value)) return value;
	const number = Number(value);
	if (!Number.isInteger(number) || number < 1 || number > 10) throw new HttpError(400, "Difficulty must be between 1 and 10.");
	return number <= 3 ? "MUDAH" : number <= 7 ? "SEDANG" : "SULIT";
}

const server = http.createServer(async (req, res) => {
	try {
		const url = new URL(req.url, "http://localhost");

		if (req.method === "POST" && url.pathname === "/api/auth/signup") {
			const { email, username, password } = await readBody(req);

			const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
			const normalizedUsername = typeof username === "string" ? username.trim() : "";

			if (!normalizedEmail || !normalizedUsername || typeof password !== "string") {
				throw new HttpError(400, "Email, username, and password are required.");
			}
			if (normalizedEmail.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
				throw new HttpError(400, "Please provide a valid email address.");
			}
			if (normalizedUsername.length < 3 || normalizedUsername.length > 50) {
				throw new HttpError(400, "Username must be between 3 and 50 characters.");
			}
			if (!/^[a-zA-Z0-9_.-]+$/.test(normalizedUsername)) {
				throw new HttpError(400, "Username may contain letters, numbers, dots, underscores, and hyphens only.");
			}
			if (password.length < 8 || Buffer.byteLength(password, "utf8") > 1024) {
				throw new HttpError(400, "Password must be at least 8 characters and no more than 1024 bytes.");
			}

			const passwordHash = await createPasswordHash(password);
			try {
				const user = await createUser({
					username: normalizedUsername,
					email: normalizedEmail,
					passwordHash,
					role: "PELAJAR"
				});
				return send(res, 201, {
					message: "Account created successfully.",
					user
				});
			} catch (error) {
				if (error.code === "23505") {
					const constraint = error.constraint || "";
					const message = constraint.includes("email")
						? "That email address is already registered."
						: constraint.includes("username")
							? "That username is already taken."
							: "An account with those details already exists.";
					throw new HttpError(409, message);
				}
				throw error;
			}
		}

		if (req.method === "POST" && url.pathname === "/api/login") {
			const { identifier, password } = await readBody(req);
			if (typeof identifier !== "string" || !identifier.trim() ||
				typeof password !== "string" || !password) {
				throw new HttpError(400, "Identifier and password are required.");
			}

			const user = await authenticateLogin(identifier.trim(), password);
			await createUserSession(user, res);
			return send(res, 200, { message: "Login successful", user });
		}

		if (req.method === "GET" && url.pathname === "/api/me") {
			const user = requireAuthentication(req);
			return send(res, 200, { user });
		}

		if (req.method === "POST" && url.pathname === "/api/logout") {
			const token = getCookie(req, COOKIE_NAME);
			const user = token ? loginSessions.get(token)?.user : null;

			if (user) {
				const ownedSessionIds = [...sessions.entries()]
					.filter(([, session]) => String(session.userId) === String(user.id))
					.map(([sessionId]) => sessionId);

				for (const sessionId of ownedSessionIds) {
					await failAndRemoveSession(sessionId, user.id);
				}
			}

			if (token) loginSessions.delete(token);
			clearSessionCookie(res);
			return send(res, 200, { message: "Logout successful" });
		}

		if (req.method === "POST" && url.pathname === "/api/challenges") {
			const user = requireAuthentication(req);
			requireCreator(user);
			const fields = await readMultipart(req);
			const title = String(fields.title || "").trim();
			const description = String(fields.description || "").trim();
			const upload = fields.challengeFile;
			if (!title || title.length > 50) throw new HttpError(400, "Title is required and must be at most 50 characters.");
			if (!description) throw new HttpError(400, "Description is required.");
			if (!upload || !upload.data?.length || !upload.filename.toLowerCase().endsWith(".zip")) throw new HttpError(400, "Please upload a valid .zip challenge archive.");
			if (upload.data.length > MAX_UPLOAD_BYTES) throw new HttpError(413, "Challenge ZIP exceeds 25 MB.");
			if (upload.data[0] !== 0x50 || upload.data[1] !== 0x4b) throw new HttpError(400, "Uploaded file is not a valid ZIP archive.");
			try { await validateChallengePackageBuffer(upload.data); }
			catch (error) { throw new HttpError(400, error.message); }
			const challenge = await saveChallengePackage({ creatorId: user.id, title, description, difficulty: difficultyLabel(fields.difficulty), packageData: upload.data });
			return send(res, 201, challenge);
		}

		if (req.method === "GET" && url.pathname === "/api/creator/challenges") {
			const user = requireAuthentication(req); requireCreator(user);
			return send(res, 200, await listCreatorChallenges(user.id));
		}

		if (req.method === "POST" && url.pathname === "/api/creator/sessions") {
			const user = requireAuthentication(req);
			requireCreator(user);
			const { challengeId } = await readBody(req);
			if (challengeId === undefined || !/^\d+$/.test(String(challengeId)) || Number(challengeId) <= 0) {
				throw new HttpError(400, "A valid challengeId is required.");
			}
			const id = Number(challengeId);
			if (!Number.isSafeInteger(id) || id <= 0) throw new HttpError(400, "A valid challengeId is required.");

			const ownedChallenges = await listCreatorChallenges(user.id);
			if (!ownedChallenges.some((challenge) => String(challenge.id) === String(id))) {
				throw new HttpError(404, "Challenge not found.");
			}

			const evaluation = await initializeChallengeSession(id, user.id);
			sessions.set(evaluation.sessionId, {
				userId: user.id,
				challengeId: id,
				attemptId: null,
				directory: evaluation.repositoryDirectory,
				tempDir: evaluation.tempDir,
				sockets: new Set(),
				lastActivityAt: Date.now(),
				submitted: false,
				submitting: false,
				creatorMode: true
			});
			return send(res, 201, { sessionId: evaluation.sessionId });
		}

		const creatorVerifyMatch = url.pathname.match(/^\/api\/creator\/sessions\/([a-f0-9-]+)\/verify$/i);
		if (req.method === "POST" && creatorVerifyMatch) {
			const user = requireAuthentication(req);
			requireCreator(user);
			const sessionId = creatorVerifyMatch[1];
			const session = sessions.get(sessionId);
			requireCreatorSession(session, user);
			if (session.submitted || session.submitting) throw new HttpError(409, "This evaluation has already been verified.");
			session.submitting = true;
			session.lastActivityAt = Date.now();
			try {
				const verification = await verifyChallengeRepository({
					repositoryDirectory: session.directory,
					scriptPath: path.join(session.tempDir, "verify.sh")
				});
				session.submitted = true;
				for (const ws of session.sockets) {
					try { ws.close(1000, "Evaluation verified"); } catch {}
				}
				session.sockets.clear();
				return send(res, 200, { verification });
			} finally {
				session.submitting = false;
			}
		}

		const creatorSessionMatch = url.pathname.match(/^\/api\/creator\/sessions\/([a-f0-9-]+)$/i);
		if (req.method === "DELETE" && creatorSessionMatch) {
			const user = requireAuthentication(req);
			requireCreator(user);
			const sessionId = creatorSessionMatch[1];
			const session = sessions.get(sessionId);
			requireCreatorSession(session, user);
			if (session.submitting) throw new HttpError(409, "Verification is still running.");
			await removeSession(sessionId);
			return send(res, 200, { message: "Evaluation session closed." });
		}

		const creatorAttemptsMatch = url.pathname.match(/^\/api\/creator\/challenges\/(\d+)\/attempts$/);
		if (req.method === "GET" && creatorAttemptsMatch) {
			const user = requireAuthentication(req); requireCreator(user);
			const attempts = await getCreatorChallengeAttempts(creatorAttemptsMatch[1], user.id);
			return send(res, 200, { attempts, total: attempts.length,
				completed: attempts.filter(a => a.status === "SELESAI").length,
				failed: attempts.filter(a => a.status === "GAGAL").length,
				active: attempts.filter(a => a.status === "BERLANGSUNG").length,
				averageScore: attempts.filter(a => a.status !== "BERLANGSUNG").length
					? Math.round(attempts.filter(a => a.status !== "BERLANGSUNG").reduce((sum, a) => sum + Number(a.score || 0), 0) / attempts.filter(a => a.status !== "BERLANGSUNG").length) : null
			});
		}

		const creatorChallengeMatch = url.pathname.match(/^\/api\/creator\/challenges\/(\d+)$/);
		if (req.method === "PUT" && creatorChallengeMatch) {
			const user = requireAuthentication(req); requireCreator(user);
			const body = await readBody(req);
			const title = typeof body.title === "string" ? body.title.trim() : "";
			const description = typeof body.description === "string" ? body.description.trim() : "";
			if (!title || title.length > 50 || !description) throw new HttpError(400, "A title (max 50 characters) and description are required.");
			const updated = await updateCreatorChallenge({ id: creatorChallengeMatch[1], creatorId: user.id, title, description, difficulty: difficultyLabel(body.difficulty) });
			if (!updated) throw new HttpError(404, "Challenge not found or cannot be edited.");
			return send(res, 200, updated);
		}

		const creatorStatusMatch = url.pathname.match(/^\/api\/creator\/challenges\/(\d+)\/(publish|unpublish|schedule-delete)$/);
		if (req.method === "POST" && creatorStatusMatch) {
			const user = requireAuthentication(req); requireCreator(user);
			const nextStatus = creatorStatusMatch[2] === "publish" ? "TERPUBLIKASI" : creatorStatusMatch[2] === "unpublish" ? "DRAF" : "DIJADWALKAN_HAPUS";
			const updated = await updateChallengeStatus({ id: creatorStatusMatch[1], creatorId: user.id, status: nextStatus });
			if (!updated) throw new HttpError(404, "Challenge not found.");
			return send(res, 200, updated);
		}

		if (req.method === "GET" && url.pathname === "/api/challenges") {
			const user = requireAuthentication(req);
			return send(res, 200, await listChallenges(user.id));
		}

		if (req.method === "GET" && url.pathname === "/api/history") {
			const user = requireAuthentication(req);
			return send(res, 200, await getStudentHistory(user.id));
		}

		const challengeMatch = url.pathname.match(/^\/api\/challenges\/(\d+)$/);
		if (req.method === "GET" && challengeMatch) {
			const user = requireAuthentication(req);
			const challenge = await getChallengeDetails(challengeMatch[1], user.id);
			if (!challenge) throw new HttpError(404, "Challenge not found.");
			return send(res, 200, challenge);
		}

		if (req.method === "POST" && url.pathname === "/api/sessions") {
			const user = requireAuthentication(req);
			if (user.role !== "PELAJAR") throw new HttpError(403, "Only students can start challenge attempts.");
			const { challengeId } = await readBody(req);

			if (challengeId === undefined || !/^\d+$/.test(String(challengeId)) || Number(challengeId) <= 0) {
				throw new HttpError(400, "A valid challengeId is required.");
			}

			const id = Number(challengeId);
			if (!Number.isSafeInteger(id) || id <= 0) {
				throw new HttpError(400, "A valid challengeId is required.");
			}
			const accessibleChallenge = await getChallengeDetails(id, user.id);
			if (!accessibleChallenge) throw new HttpError(404, "Challenge not found.");
			const session = await initializeChallengeSession(id, user.id);

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
					submitted: false,
					submitting: false
				});

				return send(res, 201, {
					sessionId: session.sessionId,
					attemptId: attempt.id
				});
			} catch (error) {
				await fs.rm(session.tempDir, { recursive: true, force: true });
				throw error;
			}
		}

		const submitMatch = url.pathname.match(/^\/api\/sessions\/([a-f0-9-]+)\/submit$/i);
		if (req.method === "POST" && submitMatch) {
			const user = requireAuthentication(req);
			const sessionId = submitMatch[1];
			const session = sessions.get(sessionId);

			if (!session) throw new HttpError(404, "Session not found.");
			if (String(session.userId) !== String(user.id)) throw new HttpError(403, "You do not own this session.");
			if (session.submitted || session.submitting) throw new HttpError(409, "This attempt has already been submitted.");

			session.submitting = true;
			session.lastActivityAt = Date.now();

			try {
				const verification = await verifyChallengeRepository({
					repositoryDirectory: session.directory,
					scriptPath: path.join(session.tempDir, "verify.sh")
				});

				const score = Number.isInteger(verification.score) && verification.score >= 0 && verification.score <= 100
					? verification.score
					: 0;

				const attempt = await finishAttempt({
					attemptId: session.attemptId,
					studentId: user.id,
					status: verification.passed === true ? "SELESAI" : "GAGAL",
					score
				});

				if (!attempt) {
					throw new HttpError(409, "This attempt is no longer active.");
				}

				session.submitted = true;
				for (const ws of session.sockets) {
					try { ws.close(1000, "Challenge submitted"); } catch {}
				}
				session.sockets.clear();

				return send(res, 200, {
					message: "Challenge submitted.",
					attempt,
					verification
				});
			} finally {
				session.submitting = false;
			}
		}

		const restartMatch = url.pathname.match(/^\/api\/sessions\/([a-f0-9-]+)\/restart$/i);
		if (req.method === "POST" && restartMatch) {
			const user = requireAuthentication(req);
			const oldSessionId = restartMatch[1];
			const oldSession = sessions.get(oldSessionId);

			if (!oldSession) throw new HttpError(404, "Session not found.");
			if (oldSession.creatorMode) throw new HttpError(400, "Use a new evaluation session to restart the preview.");
			if (String(oldSession.userId) !== String(user.id)) throw new HttpError(403, "You do not own this session.");
			if (oldSession.submitting) throw new HttpError(409, "The current attempt is being submitted.");

			const newSession = await initializeChallengeSession(oldSession.challengeId, user.id);
			let newAttempt;

			try {
				newAttempt = await createAttempt(user.id, oldSession.challengeId);
			} catch (error) {
				await fs.rm(newSession.tempDir, { recursive: true, force: true });
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
					await fs.rm(newSession.tempDir, { recursive: true, force: true });
					await finishAttempt({
						attemptId: newAttempt.id,
						studentId: user.id,
						status: "GAGAL",
						score: 0
					});
					throw new HttpError(409, "The previous attempt could not be closed.");
				}
			}

			sessions.set(newSession.sessionId, {
				userId: user.id,
				challengeId: oldSession.challengeId,
				attemptId: newAttempt.id,
				directory: newSession.repositoryDirectory,
				tempDir: newSession.tempDir,
				sockets: new Set(),
				lastActivityAt: Date.now(),
				submitted: false,
				submitting: false
			});

			await removeSession(oldSessionId);
			return send(res, 201, {
				message: "Challenge restarted.",
				sessionId: newSession.sessionId,
				attemptId: newAttempt.id
			});
		}

		const deleteMatch = url.pathname.match(/^\/api\/sessions\/([a-f0-9-]+)$/i);
		if (req.method === "DELETE" && deleteMatch) {
			const user = requireAuthentication(req);
			const sessionId = deleteMatch[1];
			const session = sessions.get(sessionId);

			if (!session) throw new HttpError(404, "Session not found.");
			if (String(session.userId) !== String(user.id)) throw new HttpError(403, "You do not own this session.");
			if (session.submitting) throw new HttpError(409, "The attempt is currently being submitted.");

			await failAndRemoveSession(sessionId, user.id);
			return send(res, 200, { message: "Session closed." });
		}

		return send(res, 404, { error: "Route not found." });
	} catch (error) {
		console.error(error);
		const status = error instanceof HttpError
			  ? error.status
			  : error.code === "23505"
			  ? 409
			  : error.code === "22P02"
			  ? 400
			  : 500;

		return send(res, status, {
			error: status === 500 && process.env.NODE_ENV === "production"
				? "An unexpected server error occurred."
				: error.message || "An unexpected server error occurred."
		});
	}
});

const wss = new WebSocketServer({ noServer: true, maxPayload: 4096 });
server.on("upgrade", (req, socket, head) => {
	try {
		const url = new URL(req.url, "http://localhost");

		const match = url.pathname.match(
			/^\/api\/(creator\/sessions|sessions)\/([a-f0-9-]+)\/terminal$/i
		);

		if (!match) {
			socket.destroy();
			return;
		}

		const routeType = match[1];
		const sessionId = match[2];

		const user = getAuthenticatedUser(req);

		if (!user) {
			socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
			socket.destroy();
			return;
		}

		const session = sessions.get(sessionId);

		if (!session) {
			socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
			socket.destroy();
			return;
		}

		const isCreatorRoute = routeType === "creator/sessions";

		if (Boolean(session.creatorMode) !== isCreatorRoute) {
			socket.write("HTTP/1.1 404 Not Found\r\n\r\n");
			socket.destroy();
			return;
		}

		if (String(session.userId) !== String(user.id)) {
			socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
			socket.destroy();
			return;
		}

		if (session.submitted || session.submitting) {
			socket.write("HTTP/1.1 409 Conflict\r\n\r\n");
			socket.destroy();
			return;
		}

		wss.handleUpgrade(req, socket, head, (ws) => {
			session.sockets.add(ws);
			session.lastActivityAt = Date.now();

			createRestrictedTerminalSession(ws, session.directory, {
				onActivity: () => {
					session.lastActivityAt = Date.now();
				},

				onCommand: async ({ command, output }) => {
					// Only student sessions save terminal history.
					if (!session.creatorMode && session.attemptId) {
						await saveTerminalHistory({
							attemptId: session.attemptId,
							command,
							output
						});
					}
				}
			});

			ws.on("close", () => session.sockets.delete(ws));
			ws.on("error", (error) => {
				console.error("WebSocket error:", error.message);
			});
		});
	} catch (error) {
		console.error("WebSocket upgrade error:", error);
		socket.destroy();
	}
});

const cleanupTimer = setInterval(async () => {
	const now = Date.now();

	for (const [token, login] of loginSessions) {
		if (login.expiresAt <= now) loginSessions.delete(token);
	}

	for (const [sessionId, session] of sessions) {
		if (session.submitting || now - session.lastActivityAt < SESSION_IDLE_TTL) continue;
		try {
			await failAndRemoveSession(sessionId, session.userId);
		} catch (error) {
			console.error("Failed to clean up expired challenge session:", error);
		}
	}
}, 5 * 60 * 1000);
cleanupTimer.unref();

const port = Number(process.env.PORT || 3000);
const host = process.env.HOST || (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");

server.listen(port, host, () => {
	console.log(`Server running at http://${host}:${port}`);
});

async function shutdown(signal) {
	console.log(`${signal} received; shutting down...`);
	clearInterval(cleanupTimer);
	server.close();
	for (const [sessionId, session] of sessions) {
		try { await failAndRemoveSession(sessionId, session.userId); } catch (error) {
			console.error("Session cleanup failed:", error);
		}
	}
	await pool.end().catch((error) => console.error("Database shutdown failed:", error));
	process.exit(0);
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
