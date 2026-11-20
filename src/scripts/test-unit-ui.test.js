import test, { after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { uploadChallenge, getCreatorChallenge, changeChallengeStatus } from "../frontend/challengeApi.js";

const srcDir = fileURLToPath(new URL("..", import.meta.url));
const stubs = {
	"@xterm/xterm": "export class Terminal {}",
	"@xterm/addon-fit": "export class FitAddon {}"
};

let vite = null;
let viteUnavailable = false;

try {
	const { createServer } = await import("vite");
	vite = await createServer({
		root: srcDir,
		configFile: false,
		logLevel: "silent",
		appType: "custom",
		server: { middlewareMode: true, hmr: false },
		plugins: [
			(await import("@vitejs/plugin-react")).default(),
			{
				name: "ssr-test-stubs",
				enforce: "pre",
				resolveId(id) {
					if (id in stubs || id.endsWith(".css")) return `\0stub:${id}`;
				},
				load(id) {
					if (!id.startsWith("\0stub:")) return null;
					return stubs[id.slice("\0stub:".length)] ?? "export default {};";
				}
			}
		]
	});
} catch (error) {
	viteUnavailable = `Vite SSR is unavailable in this environment: ${error.message}`;
}

after(async () => {
	await vite?.close();
});

async function render(file, props) {
	const Component = (await vite.ssrLoadModule(file)).default;
	return renderToStaticMarkup(React.createElement(Component, props));
}

const fetchCalls = [];
let nextResponse;
const redirects = [];

beforeEach(() => {
	fetchCalls.length = 0;
	redirects.length = 0;
	globalThis.window = { location: { replace: (url) => redirects.push(url) } };
	globalThis.fetch = async (url, options = {}) => {
		fetchCalls.push({ url, options });
		return nextResponse();
	};
});

function respondWith(status, body) {
	nextResponse = () => new Response(body === undefined ? "" : JSON.stringify(body), { status });
}

test("C04-UT01 UploadPage first renders the account loading state without an error", { skip: viteUnavailable }, async () => {
	const html = await render("/frontend/UploadPage.jsx");
	assert.match(html, /<p class="status-message">Loading your account\.\.\.<\/p>/);
	assert.doesNotMatch(html, /role="alert"|error/);
});

test("C05-UT05 uploadChallenge sends the metadata and package as multipart form data", async () => {
	respondWith(201, { id: 12, status: "DRAF" });
	const file = new Blob(["PK"], { type: "application/zip" });
	const result = await uploadChallenge({ file, title: "Broken Repo", description: "Fix it", difficulty: "SEDANG" });
	assert.deepEqual(result, { id: 12, status: "DRAF" });
	assert.equal(fetchCalls[0].url, "/api/challenges");
	assert.equal(fetchCalls[0].options.method, "POST");
	assert.equal(fetchCalls[0].options.credentials, "same-origin");
	const body = fetchCalls[0].options.body;
	assert.equal(body.get("title"), "Broken Repo");
	assert.equal(body.get("description"), "Fix it");
	assert.equal(body.get("difficulty"), "SEDANG");
	assert.equal(await body.get("challengeFile").text(), "PK");
});

test("C05-UT06 uploadChallenge surfaces the server error message", async () => {
	respondWith(400, { error: "Please upload a valid .zip challenge archive." });
	await assert.rejects(() => uploadChallenge({ file: new Blob(["x"]), title: "t", description: "d", difficulty: "MUDAH" }), /valid \.zip challenge archive/);
});

test("C05-UT07 uploadChallenge falls back to a generic message when the error body is not JSON", async () => {
	respondWith(500);
	await assert.rejects(() => uploadChallenge({ file: new Blob(["x"]), title: "t", description: "d", difficulty: "MUDAH" }), /Failed to upload challenge\./);
});

test("C05-UT08 getCreatorChallenge finds a creator challenge by id and returns null when absent", async () => {
	respondWith(200, [{ id: 3, title: "A" }, { id: 12, title: "B" }]);
	assert.deepEqual(await getCreatorChallenge("12"), { id: 12, title: "B" });
	respondWith(200, [{ id: 3, title: "A" }]);
	assert.equal(await getCreatorChallenge(12), null);
	assert.equal(fetchCalls[1].url, "/api/creator/challenges");
});

test("C05-UT09 an unauthenticated response redirects to the login page", async () => {
	respondWith(401, { error: "Authentication required. Please log in." });
	assert.equal(await changeChallengeStatus(12, "publish"), null);
	assert.deepEqual(redirects, ["/login"]);
});

test("C05-UT10 changeChallengeStatus posts the requested action for the challenge", async () => {
	respondWith(200, { id: 12, status: "TERPUBLIKASI" });
	assert.deepEqual(await changeChallengeStatus(12, "publish"), { id: 12, status: "TERPUBLIKASI" });
	assert.equal(fetchCalls[0].url, "/api/creator/challenges/12/publish");
	assert.equal(fetchCalls[0].options.method, "POST");
});

test("C06-UT01 ChallengePage first renders the session creation state", { skip: viteUnavailable }, async () => {
	const html = await render("/frontend/ChallengePage.jsx", { challengeId: "5" });
	assert.equal(html, '<p class="status-message">Creating challenge session...</p>');
});

const history = [
	{ id: 1, challengeId: 10, title: "Broken Repo", status: "SELESAI", score: 100, submittedAt: "2026-11-20T10:00:00Z" },
	{ id: 2, challengeId: 11, title: "", status: "BERLANGSUNG", score: 0 }
];

test("C08-UT01 HistoryModal lists attempts with status, score, and a link to redo the challenge", { skip: viteUnavailable }, async () => {
	const html = await render("/frontend/HistoryModal.jsx", { isOpen: true, historyList: history, challenges: [{ id: 10, difficulty: "SULIT" }] });
	assert.match(html, /href="\/challenges\/10"/);
	assert.match(html, /Broken Repo/);
	assert.match(html, /Finished \(100\)/);
	assert.match(html, /Untitled challenge/);
	assert.match(html, /On Progress/);
	assert.doesNotMatch(html, /On Progress \(/);
});

test("C08-UT02 HistoryModal shows an empty message when there is no history", { skip: viteUnavailable }, async () => {
	const html = await render("/frontend/HistoryModal.jsx", { isOpen: true, historyList: [] });
	assert.match(html, /You haven&#x27;t attempted any challenges yet\./);
});

test("C08-UT03 HistoryModal shows the loading error as an alert", { skip: viteUnavailable }, async () => {
	const html = await render("/frontend/HistoryModal.jsx", { isOpen: true, error: "Failed to load history." });
	assert.match(html, /<p class="history-empty error" role="alert">Failed to load history\.<\/p>/);
});

test("C08-UT04 HistoryModal renders nothing while closed", { skip: viteUnavailable }, async () => {
	assert.equal(await render("/frontend/HistoryModal.jsx", { isOpen: false, historyList: history }), "");
});

test("C08-UT05 HistoryModal lists only challenges created by the user with evaluation links", { skip: viteUnavailable }, async () => {
	const challenges = [
		{ id: 10, title: "Mine", status: "DRAF", isUserCreated: true },
		{ id: 11, title: "Someone Else", status: "TERPUBLIKASI", isUserCreated: false }
	];
	const html = await render("/frontend/HistoryModal.jsx", { isOpen: true, historyList: [], challenges });
	assert.match(html, /href="\/challenges\/10\/evaluate"/);
	assert.match(html, /Not Published/);
	assert.doesNotMatch(html, /Someone Else/);
});
