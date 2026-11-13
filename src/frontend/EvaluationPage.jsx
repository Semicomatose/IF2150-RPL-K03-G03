import React, { useEffect, useState } from "react";
import ChallengeTerminal from "./components/terminal/ChallengeTerminal.jsx";
import AppHeader from "./AppHeader.jsx";
import useChallengeSession from "./useChallengeSession.js";
import { changeChallengeStatus, getCreatorChallenge } from "./challengeApi.js";
import { difficultyLabel } from "./difficulty.js";
import "./main-page.css";

const STATUS_LABELS = {
	DRAF: "Not Published",
	TERPUBLIKASI: "Published",
	DIJADWALKAN_HAPUS: "Scheduled for Deletion"
};

function EvaluationEnvironment({ challenge: initialChallenge, user }) {
	const { sessionId, error: sessionError } = useChallengeSession(initialChallenge.id, "/api/creator/sessions");
	const [challenge, setChallenge] = useState(initialChallenge);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");

	const isPublished = challenge.status === "TERPUBLIKASI";
	const isScheduledForDeletion = challenge.status === "DIJADWALKAN_HAPUS";
	const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";

	async function runAction(action, confirmMessage) {
		if (busy || !window.confirm(confirmMessage)) return null;
		setBusy(true);
		setError("");
		try {
			const updated = await changeChallengeStatus(challenge.id, action);
			if (updated) setChallenge((current) => ({ ...current, status: updated.status }));
			return updated;
		} catch (err) {
			setError(err.message);
			return null;
		} finally {
			setBusy(false);
		}
	}

	function togglePublish() {
		if (isPublished) {
			runAction("unpublish", "Unpublish this challenge? Students will no longer see it.");
		} else {
			runAction("publish", "Publish this challenge? Students will be able to attempt it.");
		}
	}

	async function deleteChallenge() {
		const updated = await runAction("schedule-delete", "Delete this challenge? It will be scheduled for deletion.");
		if (updated) window.location.assign("/");
	}

	function exitEvaluation() {
		window.location.assign("/");
	}

	return (
		<div className="challenge-page-wrapper">
			<AppHeader user={user} />

			<div className="challenge-title-bar evaluation-title-bar">
				<button className="close-btn" aria-label="Exit evaluation" onClick={exitEvaluation} disabled={busy}>✕</button>
				<h1 className="challenge-title">-- {challenge.title} --</h1>
				<p className="challenge-subtitle">Evaluation View</p>
			</div>

			<main className="challenge-content-grid">
				<section className="card-container description-card">
					<div className="card-header"><h2>Description</h2></div>
					<div className="card-body">
						<p className="description-text">{challenge.description}</p>
						<p className="description-text">
							Difficulty: {difficultyLabel(challenge.difficulty)}
							<br />
							Status: {STATUS_LABELS[challenge.status] ?? challenge.status}
							<br />
							Attempts: {challenge.attemptCount ?? 0} · Average score: {challenge.averageScore ?? "-"}
						</p>
						<div className="description-actions">
							<button className="text-action-btn" type="button" disabled title="Hints are not available yet">Edit Hint</button>
						</div>
					</div>
				</section>

				<section className="terminal-column">
					{sessionId ? (
						<ChallengeTerminal
							key={sessionId}
							sessionId={sessionId}
							height="min(52vh, 520px)"
							wsUrl={`${protocol}//${window.location.host}/api/creator/sessions/${sessionId}/terminal`}
						/>
					) : (
						<p className={`status-message${sessionError ? " error" : ""}`} role={sessionError ? "alert" : undefined}>
							{sessionError || "Preparing test terminal..."}
						</p>
					)}
					{error && <p className="status-message error" role="alert">{error}</p>}
					<div className="action-buttons-row">
						<button className="btn btn-red" type="button" onClick={deleteChallenge} disabled={busy || isScheduledForDeletion}>
							Delete Challenge
						</button>
						<button className="btn btn-red" type="button" onClick={togglePublish} disabled={busy || isScheduledForDeletion}>
							{isPublished ? "Unpublish" : "Publish"}
						</button>
					</div>
				</section>
			</main>
		</div>
	);
}

export default function EvaluationPage({ challengeId }) {
	const [user, setUser] = useState(null);
	const [challenge, setChallenge] = useState(null);
	const [error, setError] = useState("");

	useEffect(() => {
		let active = true;

		async function loadPage() {
			try {
				const response = await fetch("/api/me", { credentials: "same-origin" });
				if (response.status === 401) {
					window.location.replace("/login");
					return;
				}
				const data = await response.json();
				if (!response.ok) throw new Error(data.error || "Failed to load account.");
				if (data.user.role !== "PEMBUAT") {
					throw new Error("Only challenge creators can open the evaluation view.");
				}

				const ownedChallenge = await getCreatorChallenge(challengeId);
				if (!ownedChallenge) {
					throw new Error("Challenge not found or you are not its creator.");
				}

				if (active) {
					setUser(data.user);
					setChallenge(ownedChallenge);
				}
			} catch (err) {
				if (active) setError(err.message);
			}
		}

		loadPage();
		return () => { active = false; };
	}, [challengeId]);

	if (error) {
		return (
			<div className="status-message error" role="alert">
				<p>{error}</p>
				<a href="/" className="status-link">Back to main menu</a>
			</div>
		);
	}
	if (!challenge) {
		return <p className="status-message">Loading challenge...</p>;
	}

	return <EvaluationEnvironment challenge={challenge} user={user} />;
}
