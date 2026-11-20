import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
	classes,
	interfaces,
	functionalRequirements,
	nonFunctionalRequirements,
	manualTestCases,
	legacyTestTitles
} from "./traceability.js";

const srcDir = fileURLToPath(new URL("..", import.meta.url));
const scriptsDir = fileURLToPath(new URL(".", import.meta.url));
const hiuplPath = path.join(srcDir, "..", "docs", "M10", "K03_G03_HIUPL.md");
const ids = (prefix, count) => Array.from({ length: count }, (_, index) => `${prefix}${String(index + 1).padStart(2, "0")}`);

async function automatedTestTitles() {
	const titles = [];
	for (const file of await fs.readdir(scriptsDir)) {
		if (!file.endsWith(".test.js")) continue;
		const source = await fs.readFile(path.join(scriptsDir, file), "utf8");
		for (const match of source.matchAll(/^test\("([^"]+)"/gm)) titles.push(match[1]);
	}
	return titles;
}

async function resolvableTestIds() {
	const titles = await automatedTestTitles();
	const automated = new Set();
	for (const title of titles) {
		const id = title.match(/^([A-Z0-9]+-(?:UT|TC)\d{2})\s/)?.[1];
		if (id) automated.add(id);
	}
	for (const [id, title] of Object.entries(legacyTestTitles)) {
		if (titles.includes(title)) automated.add(id);
	}
	return { automated, titles };
}

test("traceability: every KF01-KF12 and KNF01-KNF05 has exactly one traceability entry", () => {
	assert.deepEqual(functionalRequirements.map((item) => item.id), ids("KF", 12));
	assert.deepEqual(nonFunctionalRequirements.map((item) => item.id), ids("KNF", 5));
	assert.deepEqual(classes.map((item) => item.id), ids("C", 9));
	assert.deepEqual(interfaces.map((item) => item.id), ids("I-", 10));
});

test("traceability: KF to KNF links agree in both directions", () => {
	for (const knf of nonFunctionalRequirements) {
		for (const kf of knf.functional) {
			assert.ok(functionalRequirements.find((item) => item.id === kf).nonFunctional.includes(knf.id), `${kf} should list ${knf.id}`);
		}
	}
	for (const kf of functionalRequirements) {
		for (const knf of kf.nonFunctional) {
			assert.ok(nonFunctionalRequirements.find((item) => item.id === knf).functional.includes(kf.id), `${knf} should list ${kf.id}`);
		}
	}
});

test("traceability: every referenced use case and class exists", () => {
	const classIds = new Set(classes.map((item) => item.id));
	for (const kf of functionalRequirements) {
		assert.ok(kf.useCases.length > 0, `${kf.id} has no use case`);
		for (const useCase of kf.useCases) assert.match(useCase, /^UC0[1-4]$/);
		for (const classId of kf.classes) assert.ok(classIds.has(classId), `${kf.id} references unknown ${classId}`);
	}
});

test("traceability: every referenced implementation file exists in src", async () => {
	const files = new Set([
		...classes.flatMap((item) => item.files),
		...interfaces.flatMap((item) => item.files),
		...functionalRequirements.flatMap((item) => item.files),
		...nonFunctionalRequirements.flatMap((item) => item.components)
	]);
	for (const file of files) await fs.access(path.join(srcDir, file));
});

test("traceability: every referenced test case ID exists as an automated test or a documented manual test", async () => {
	const { automated } = await resolvableTestIds();
	const hiupl = await fs.readFile(hiuplPath, "utf8");
	const referenced = [
		...classes.flatMap((item) => item.testCases),
		...interfaces.flatMap((item) => item.testCases),
		...functionalRequirements.flatMap((item) => item.testCases),
		...nonFunctionalRequirements.flatMap((item) => item.testCases)
	];
	for (const id of new Set(referenced)) {
		if (manualTestCases.includes(id)) assert.ok(hiupl.includes(id), `${id} is not documented in HIUPL`);
		else assert.ok(automated.has(id), `${id} has no automated test`);
	}
});

test("traceability: every automated test is traced to a class, interface, or requirement", async () => {
	const { automated } = await resolvableTestIds();
	const traced = new Set([
		...classes.flatMap((item) => item.testCases),
		...interfaces.flatMap((item) => item.testCases),
		...functionalRequirements.flatMap((item) => item.testCases),
		...nonFunctionalRequirements.flatMap((item) => item.testCases)
	]);
	const untraced = [...automated].filter((id) => !traced.has(id));
	assert.deepEqual(untraced, []);
});

test("traceability: every KF has a test case and every untested KNF states why", () => {
	for (const kf of functionalRequirements) assert.ok(kf.testCases.length > 0, `${kf.id} has no test case`);
	for (const knf of nonFunctionalRequirements) {
		if (knf.testCases.length === 0) assert.equal(typeof knf.notImplemented, "string", `${knf.id} needs a reason`);
	}
});
