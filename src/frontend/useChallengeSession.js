import { useEffect, useRef, useState } from "react";

function deleteSession(sessionId, options = {}) {
	return fetch(`/api/sessions/${sessionId}`, {
		method: "DELETE",
		credentials: "same-origin",
		...options
	});
}

export default function useChallengeSession(challengeId) {
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
				deleteSession(activeSessionId, { keepalive: true }).catch(() => {});
			}
		}

		window.addEventListener("pagehide", closeActiveSession);
		return () => {
			window.removeEventListener("pagehide", closeActiveSession);
			closeActiveSession();
		};
	}, []);

	useEffect(() => {
		let active = true;
		let createdSessionId = null;

		async function createSession() {
			try {
				const response = await fetch("/api/sessions", {
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
					await deleteSession(createdSessionId);
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
				deleteSession(createdSessionId).catch((err) => console.error("Session cleanup failed:", err));
			}
		};
	}, [challengeId]);

	return { sessionId, setSessionId, error };
}
