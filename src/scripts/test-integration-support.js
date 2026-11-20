import { spawn } from "node:child_process";
import { once } from "node:events";
import net from "node:net";
import { fileURLToPath } from "node:url";
import WebSocket from "ws";
import { pool } from "../backend/db.js";
import { createUser } from "../backend/repositories/userRepository.js";
import { createPasswordHash } from "../backend/services/authService.js";
import { commandExists } from "./test-fixtures.js";

export { pool };

const srcDir = fileURLToPath(new URL("..", import.meta.url));
const createdUserIds = [];

export async function environmentSkipReason({ needsShellTools = false } = {}) {
	try {
		await pool.query("SELECT 1");
	} catch (error) {
		return `PostgreSQL from .env is not reachable (${error.message || error.code})`;
	}
	if (needsShellTools) {
		for (const [tool, flag] of [["bash", "--version"], ["git", "--version"], ["unzip", "-v"], ["zipinfo", "-h"], ["zip", "-v"]]) {
			if (!(await commandExists(tool, [flag]))) return `${tool} is required to run challenge sessions`;
		}
	}
	return false;
}

async function freePort() {
	const server = net.createServer();
	server.listen(0, "127.0.0.1");
	await once(server, "listening");
	const { port } = server.address();
	server.close();
	await once(server, "close");
	return port;
}

export async function startServer() {
	const port = await freePort();
	const child = spawn(process.execPath, ["server.js"], {
		cwd: srcDir,
		env: { ...process.env, PORT: String(port), HOST: "127.0.0.1", NODE_ENV: "test" },
		stdio: ["ignore", "pipe", "pipe"]
	});
	child.stderr.resume();
	await new Promise((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error("Server did not start within 15 seconds")), 15_000);
		child.stdout.on("data", (chunk) => {
			if (String(chunk).includes("Server running")) {
				clearTimeout(timer);
				resolve();
			}
		});
		child.once("exit", (code) => {
			clearTimeout(timer);
			reject(new Error(`Server exited early with code ${code}`));
		});
	});
	return {
		port,
		baseUrl: `http://127.0.0.1:${port}`,
		async stop() {
			if (child.exitCode !== null) return;
			child.kill("SIGTERM");
			await once(child, "exit");
		}
	};
}

export function createClient(baseUrl) {
	let cookie = "";

	async function call(method, pathname, { json, form } = {}) {
		const headers = cookie ? { Cookie: cookie } : {};
		let body;
		if (form) {
			body = form;
		} else if (json !== undefined) {
			headers["Content-Type"] = "application/json";
			body = JSON.stringify(json);
		}
		const response = await fetch(baseUrl + pathname, { method, headers, body });
		const setCookie = response.headers.get("set-cookie");
		if (setCookie) cookie = setCookie.split(";")[0];
		const text = await response.text();
		let data = text;
		try { data = text ? JSON.parse(text) : null; } catch {}
		return { status: response.status, data };
	}

	return {
		get cookie() { return cookie; },
		get: (pathname) => call("GET", pathname),
		post: (pathname, json) => call("POST", pathname, { json }),
		put: (pathname, json) => call("PUT", pathname, { json }),
		del: (pathname) => call("DELETE", pathname),
		upload: (pathname, form) => call("POST", pathname, { form })
	};
}

export function uniqueName(prefix) {
	return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export async function createAccount(role) {
	const username = uniqueName(role === "PEMBUAT" ? "itcreator" : "itstudent");
	const password = "password123";
	const user = await createUser({
		username,
		email: `${username}@example.test`,
		passwordHash: await createPasswordHash(password),
		role
	});
	createdUserIds.push(user.id);
	return { ...user, password };
}

export async function trackUsername(username) {
	const result = await pool.query("SELECT id FROM users WHERE username = $1", [username]);
	for (const row of result.rows) createdUserIds.push(row.id);
}

export async function loginAs(baseUrl, account) {
	const client = createClient(baseUrl);
	const response = await client.post("/api/login", { identifier: account.username, password: account.password });
	if (response.status !== 200) throw new Error(`Login failed for ${account.username}: ${response.status}`);
	return client;
}

export function challengeForm({ title, packageBuffer, description = "Integration test challenge", difficulty = "5", filename = "challenge.zip" }) {
	const form = new FormData();
	form.append("title", title);
	form.append("description", description);
	form.append("difficulty", difficulty);
	form.append("challengeFile", new Blob([packageBuffer], { type: "application/zip" }), filename);
	return form;
}

export async function openTerminal(port, cookie, terminalPath) {
	const ws = new WebSocket(`ws://127.0.0.1:${port}${terminalPath}`, { headers: { Cookie: cookie } });
	let output = "";
	ws.on("message", (raw) => {
		const message = JSON.parse(String(raw));
		if (message.type === "output") output += message.data;
	});
	await once(ws, "open");

	async function waitUntil(predicate, timeoutMs = 10_000) {
		const start = Date.now();
		while (!predicate()) {
			if (Date.now() - start > timeoutMs) throw new Error(`Timed out waiting for terminal output: ${JSON.stringify(output.slice(-200))}`);
			await new Promise((resolve) => setTimeout(resolve, 20));
		}
	}

	await waitUntil(() => /terminal ready[\s\S]*\$ $/.test(output));

	return {
		async run(command) {
			const start = output.length;
			ws.send(JSON.stringify({ type: "input", data: `${command}\r` }));
			await waitUntil(() => {
				const chunk = output.slice(start);
				return chunk.includes("\r\n") && chunk.endsWith("$ ");
			});
			return output.slice(start);
		},
		async close() {
			if (ws.readyState === WebSocket.CLOSED) return;
			ws.close();
			await once(ws, "close");
		}
	};
}

export async function cleanupDatabase() {
	const ids = createdUserIds.splice(0);
	if (!ids.length) return;
	await pool.query(`
		DELETE FROM terminal_history
		WHERE attempt_id IN (
			SELECT a.id FROM attempts a JOIN challenges c ON c.id = a.challenge_id
			WHERE a.student_id = ANY($1) OR c.creator_id = ANY($1)
		)
	`, [ids]);
	await pool.query(`
		DELETE FROM attempts
		WHERE student_id = ANY($1)
		   OR challenge_id IN (SELECT id FROM challenges WHERE creator_id = ANY($1))
	`, [ids]);
	await pool.query("DELETE FROM challenges WHERE creator_id = ANY($1)", [ids]);
	await pool.query("DELETE FROM users WHERE id = ANY($1)", [ids]);
}
