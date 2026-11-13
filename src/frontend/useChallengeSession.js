import { useEffect, useRef, useState } from "react";

function deleteSession(basePath, sessionId, options = {}) {
	return fetch(`${basePath}/${sessionId}`, {
		method: "DELETE",
		credentials: "same-origin",
		...options
	});
}

export default function useChallengeSession(challengeId, basePath = "/api/sessions") {
	const [sessionId, setSessionId] = useState(null);
	const [error, setError] = useState("");
	const currentSessionIdRef = useRef(null);

	useEffect(() => {
		currentSessionIdRef.current = sessionId;
	}, [sessionId]);

	// Sesi terakhir (bisa berganti karena restart) tetap ditutup walau pengguna pindah halaman tanpa tombol keluar.
	// Navigasi lewat link biasa tidak meng-unmount React, jadi perlu pagehide juga.
	useEffect(() => {
		function closeActiveSession() {
			const activeSessionId = currentSessionIdRef.current;
			if (activeSessionId) {
				currentSessionIdRef.current = null;
				deleteSession(basePath, activeSessionId, { keepalive: true }).catch(() => {});
			}
		}

		window.addEventListener("pagehide", closeActiveSession);
		return () => {
			window.removeEventListener("pagehide", closeActiveSession);
			closeActiveSession();
		};
	}, [basePath]);

	useEffect(() => {
		let active = true;
		let createdSessionId = null;

		async function createSession() {
			try {
				const response = await fetch(basePath, {
					method: "POST",
					credentials: "same-origin",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ challengeId: Number(challengeId) })
				});
				if (response.status === 401) {
					window.location.replace("/login");
					return;
				}
				const data = await response.json();
				if (!response.ok) throw new Error(data.error || "Failed to create challenge session.");

				createdSessionId = data.sessionId;
				if (!active) {
					await deleteSession(basePath, createdSessionId);
					return;
				}
				setSessionId(createdSessionId);
			} catch (err) {
				if (active) setError(err.message);
			}
		}

		createSession();
		return () => {
			active = false;
			if (createdSessionId) {
				deleteSession(basePath, createdSessionId).catch((err) => console.error("Session cleanup failed:", err));
			}
		};
	}, [challengeId, basePath]);

	return { sessionId, setSessionId, error };
}
