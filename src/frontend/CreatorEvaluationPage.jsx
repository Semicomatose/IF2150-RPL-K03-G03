import React, { useEffect, useRef, useState } from "react";
import ChallengeTerminal from "./components/terminal/ChallengeTerminal.jsx";
import "./main-page.css";

export default function CreatorEvaluationPage({ challengeId }) {
	const [challenge, setChallenge] = useState(null);
	const [sessionId, setSessionId] = useState(null);
	const [verification, setVerification] = useState(null);
	const [error, setError] = useState("");
	const [busy, setBusy] = useState(false);
	const activeSessionRef = useRef(null);

	useEffect(() => {
		activeSessionRef.current = sessionId;
	}, [sessionId]);

	useEffect(() => {
		let active = true;
		let createdSessionId = null;

		async function startEvaluation() {
			try {
				const challengeResponse = await fetch("/api/creator/challenges", {
					credentials: "same-origin"
				});

				if (challengeResponse.status === 401) {
					window.location.replace("/login");
					return;
				}

				const challenges = await challengeResponse.json();

				if (!challengeResponse.ok) {
					throw new Error(challenges.error || "Could not load challenges.");
				}

				const challengeData = challenges.find(
					(item) => String(item.id) === String(challengeId)
				);

				if (!challengeData) {
					throw new Error("Challenge not found or you do not own this challenge.");
				}

				if (active) setChallenge(challengeData);

				const sessionResponse = await fetch("/api/creator/sessions", {
					method: "POST",
					credentials: "same-origin",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ challengeId: Number(challengeId) })
				});
				if (sessionResponse.status === 401) {
					window.location.replace("/login");
					return;
				}
				const sessionData = await sessionResponse.json();
				if (!sessionResponse.ok) {
					throw new Error(sessionData.error || "Could not start evaluation session.");
				}

				createdSessionId = sessionData.sessionId;
				if (!active) {
					await fetch(`/api/creator/sessions/${createdSessionId}`, {
						method: "DELETE", credentials: "same-origin"
					});
					return;
				}
				setSessionId(createdSessionId);
			} catch (err) {
				if (active) setError(err.message || "Could not start evaluation.");
			}
		}

		startEvaluation();
		return () => {
			active = false;
			if (createdSessionId) {
				fetch(`/api/creator/sessions/${createdSessionId}`, {
					method: "DELETE", credentials: "same-origin", keepalive: true
				}).catch(() => {});
			}
		};
	}, [challengeId]);

	async function closeSession() {
		const id = activeSessionRef.current;
		if (id) {
			await fetch(`/api/creator/sessions/${id}`, {
				method: "DELETE", credentials: "same-origin", keepalive: true
			}).catch(() => {});
			activeSessionRef.current = null;
		}
	}

	async function exitEvaluation() {
		if (busy) return;
		await closeSession();
		window.location.assign("/");
	}

	async function verifyChallenge() {
		if (!sessionId || busy || verification) return;
		setBusy(true);
		setError("");
		try {
			const response = await fetch(`/api/creator/sessions/${sessionId}/verify`, {
				method: "POST", credentials: "same-origin"
			});
			const data = await response.json();
			if (!response.ok) throw new Error(data.error || "Verification failed.");
			setVerification(data.verification);
		} catch (err) {
			setError(err.message || "Verification failed.");
		} finally {
			setBusy(false);
		}
	}

	if (error && !sessionId) {
		return <p className="status-message error" role="alert">{error}</p>;
	}
	if (!sessionId) {
		return <p className="status-message">Preparing evaluation environment...</p>;
	}

	return (
		<div className="challenge-page-wrapper creator-evaluation-page">
			<header className="challenge-header">
				<a href="/" className="header-brand">
					<img src="../assets/logo.svg" className="logo-icon" alt="" />
					<span className="logo-text">commitment<strong>Issues</strong></span>
				</a>
			</header>

			<div className="challenge-title-bar">
				<button className="close-btn" aria-label="Exit evaluation" onClick={exitEvaluation} disabled={busy}>✕</button>
				<div>
					<h1 className="challenge-title">{challenge?.title ?? "Loading challenge..."}</h1>
					<p className="evaluation-subtitle">Evaluation View</p>
				</div>
			</div>

			<main className="challenge-content-grid">
				<section className="card-container description-card">
					<div className="card-header"><h2>Description</h2></div>
					<div className="card-body">
						<p className="description-text">{challenge?.description ?? "Loading description..."}</p>
						<p className="description-text">Difficulty: {challenge?.difficulty ?? "..."}</p>
					</div>
				</section>

				<section className="terminal-column">
					<ChallengeTerminal
						key={sessionId}
						sessionId={sessionId}
						height="min(52vh, 520px)"
						wsUrl={`${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/api/creator/sessions/${sessionId}/terminal`}
					/>
					{error && <p className="status-message error" role="alert">{error}</p>}
					{verification && (
						<div className="submission-result">
							<h3>{verification.error ? "Verification error" : verification.passed ? "Challenge verification passed" : verification.score > 0 ? "Partially satisfied" : "Challenge verification failed"}</h3>
							{verification.error
							 ? <p className="status-message error">{verification.error}</p>
							 : <p>Score: {verification.score}/100</p>}
							<div className="verification-output"><pre>{verification.output || "No output."}</pre></div>
						</div>
					)}
					<div className="action-buttons-row">
						<button className="btn btn-blue" type="button" onClick={exitEvaluation} disabled={busy}>Exit Evaluation</button>
						<button className="btn btn-blue" type="button" onClick={verifyChallenge} disabled={busy || !!verification}>
							{busy ? "Verifying..." : verification ? "Verified" : "Verify Challenge"}
						</button>
					</div>
				</section>
			</main>
		</div>
	);
}
