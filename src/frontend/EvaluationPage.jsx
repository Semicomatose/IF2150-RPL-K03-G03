import React, { useEffect, useState } from "react";
import ChallengeTerminal from "./components/terminal/ChallengeTerminal.jsx";
import AppHeader from "./AppHeader.jsx";
import useChallengeSession from "./useChallengeSession.js";
import { updateChallenge } from "./challengeApi.js";
import { difficultyLabel } from "./difficulty.js";
import "./main-page.css";
import "./modals.css";

const STATUS_LABELS = {
	DRAF: "Not Published",
	TERPUBLIKASI: "Published",
	DIJADWALKAN_HAPUS: "Scheduled for Deletion"
};

function HintModal({ initialHint, onClose, onSave }) {
	const [hint, setHint] = useState(initialHint);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");

	async function handleSubmit(event) {
		event.preventDefault();
		setSaving(true);
		setError("");
		try {
			await onSave(hint.trim());
			onClose();
		} catch (err) {
			setError(err.message);
		} finally {
			setSaving(false);
		}
	}

	return (
		<div className="modal-overlay" onMouseDown={(event) => {
			if (event.target === event.currentTarget) onClose();
		}}>
			<section className="modal-container hint-modal" role="dialog" aria-modal="true" aria-labelledby="hint-modal-title">
				<div className="modal-header">
					<h2 id="hint-modal-title">-- Edit Hint --</h2>
					<button className="close-modal-btn" onClick={onClose} aria-label="Close hint editor">✕</button>
				</div>
				<form className="modal-body filter-body" onSubmit={handleSubmit}>
					{error && <p className="modal-error" role="alert">{error}</p>}
					<textarea
						className="hint-textarea"
						value={hint}
						onChange={(event) => setHint(event.target.value)}
						placeholder="Write a hint for this challenge"
						maxLength={300}
						rows={5}
						autoFocus
					/>
					<div className="filter-action-footer">
						<button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
						<button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Hint"}</button>
					</div>
				</form>
			</section>
		</div>
	);
}

function EvaluationEnvironment({ challenge: initialChallenge, user }) {
	const { sessionId, error: sessionError } = useChallengeSession(initialChallenge.id);
	const [challenge, setChallenge] = useState(initialChallenge);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState("");
	const [isHintOpen, setIsHintOpen] = useState(false);

	const isPublished = challenge.status === "TERPUBLIKASI";
	const isScheduledForDeletion = challenge.status === "DIJADWALKAN_HAPUS";

	async function changeStatus(status, confirmMessage) {
		if (busy || !window.confirm(confirmMessage)) return false;
		setBusy(true);
		setError("");
		try {
			await updateChallenge(challenge.id, { status });
			setChallenge((current) => ({ ...current, status }));
			return true;
		} catch (err) {
			setError(err.message);
			return false;
		} finally {
			setBusy(false);
		}
	}

	async function togglePublish() {
		if (isPublished) {
			await changeStatus("DRAF", "Unpublish this challenge? Students will no longer see it.");
		} else {
			await changeStatus("TERPUBLIKASI", "Publish this challenge? Students will be able to attempt it.");
		}
	}

	async function deleteChallenge() {
		const deleted = await changeStatus("DIJADWALKAN_HAPUS", "Delete this challenge? It will be scheduled for deletion.");
		if (deleted) window.location.assign("/");
	}

	async function saveHint(hint) {
		await updateChallenge(challenge.id, { hint });
		setChallenge((current) => ({ ...current, hint }));
	}

	async function exitEvaluation() {
		if (sessionId) {
			await fetch(`/api/sessions/${sessionId}`, { method: "DELETE", credentials: "same-origin" }).catch(() => {});
		}
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
						</p>
						{challenge.hint && <p className="description-text hint-text">Hint: {challenge.hint}</p>}
						<div className="description-actions">
							<button className="text-action-btn" type="button" onClick={() => setIsHintOpen(true)} disabled={busy}>Edit Hint</button>
						</div>
					</div>
				</section>

				<section className="terminal-column">
					{sessionId ? (
						<ChallengeTerminal key={sessionId} sessionId={sessionId} height="min(52vh, 520px)" />
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

			{isHintOpen && (
				<HintModal initialHint={challenge.hint ?? ""} onClose={() => setIsHintOpen(false)} onSave={saveHint} />
			)}
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
				const [userResponse, challengeResponse] = await Promise.all([
					fetch("/api/me", { credentials: "same-origin" }),
					fetch(`/api/challenges/${challengeId}`, { credentials: "same-origin" })
				]);
				if (userResponse.status === 401 || challengeResponse.status === 401) {
					window.location.replace("/login");
					return;
				}

				const userData = await userResponse.json();
				if (!userResponse.ok) throw new Error(userData.error || "Failed to load account.");
				const challengeData = await challengeResponse.json();
				if (!challengeResponse.ok) throw new Error(challengeData.error || "Failed to fetch challenge details.");

				// GET /api/challenges/:id belum mengirim creator_id, jadi kepemilikan dicek lewat username pembuat.
				if (challengeData.creator !== userData.user.username) {
					throw new Error("Only the creator of this challenge can open the evaluation view.");
				}

				if (active) {
					setUser(userData.user);
					setChallenge(challengeData);
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
