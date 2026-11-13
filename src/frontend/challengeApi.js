async function request(url, options, fallbackMessage) {
	const response = await fetch(url, { credentials: "same-origin", ...options });

	if (response.status === 401) {
		window.location.replace("/login");
		return null;
	}

	const data = await response.json().catch(() => ({}));
	if (!response.ok) {
		throw new Error(data.error || fallbackMessage);
	}

	return data;
}

export function uploadChallenge({ file, title, description, difficulty }) {
	const body = new FormData();
	body.append("title", title);
	body.append("description", description);
	body.append("difficulty", difficulty);
	body.append("challengeFile", file);

	return request("/api/challenges", { method: "POST", body }, "Failed to upload challenge.");
}

export async function getCreatorChallenge(challengeId) {
	const challenges = await request("/api/creator/challenges", {}, "Failed to load your challenges.");
	return challenges?.find((challenge) => String(challenge.id) === String(challengeId)) ?? null;
}

export function changeChallengeStatus(challengeId, action) {
	return request(`/api/creator/challenges/${challengeId}/${action}`, { method: "POST" }, "Failed to update challenge.");
}
