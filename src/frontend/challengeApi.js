// Endpoint di file ini belum ada di server.js; kontraknya dicatat di laporan agar bisa disamakan dengan backend.
const NOT_AVAILABLE = "This feature is not available on the server yet.";

async function request(url, options, fallbackMessage) {
	const response = await fetch(url, { credentials: "same-origin", ...options });

	if (response.status === 401) {
		window.location.replace("/login");
		return null;
	}

	const data = await response.json().catch(() => ({}));

	if (response.status === 404 && data.error === "Route not found.") {
		throw new Error(NOT_AVAILABLE);
	}
	if (!response.ok) {
		throw new Error(data.error || fallbackMessage);
	}

	return data;
}

export function uploadChallenge({ file, title, description, difficulty }) {
	const body = new FormData();
	body.append("package", file);
	body.append("title", title);
	body.append("description", description);
	body.append("difficulty", difficulty);

	return request("/api/challenges", { method: "POST", body }, "Failed to upload challenge.");
}

export function updateChallenge(challengeId, changes) {
	return request(`/api/challenges/${challengeId}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(changes)
	}, "Failed to update challenge.");
}
