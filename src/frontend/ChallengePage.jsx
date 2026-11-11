import React, { useEffect, useState } from "react";
import ChallengeTerminal from "./components/terminal/ChallengeTerminal.jsx";

export default function ChallengePage({ challengeId }) {
	const [sessionId, setSessionId] = useState(null);
	const [challenge, setChallenge] = useState(null);
	const [error, setError] = useState("");
	const [result, setResult] = useState(null);
	const [busy, setBusy] = useState(false);

	useEffect(() => {
		let active = true;

		async function fetchChallenge() {
			try {
				const response = await fetch(
					`/api/challenges/${challengeId}`,
					{ credentials: "same-origin" }
				);

				if (response.status === 401) {
					window.location.replace("/login");
					return;
				}

				const data = await response.json();

				if (!response.ok) {
					throw new Error(
						data.error ||
							data.message ||
							"Failed to fetch challenge details."
					);
				}

				if (active) setChallenge(data);
			} catch (err) {
				if (active) setError(err.message);
			}
		}

		fetchChallenge();

		return () => {
			active = false;
		};
	}, [challengeId]);

	useEffect(() => {
		let active = true;
		let createdSessionId = null;

		async function createSession() {
			try {
				const response = await fetch("/api/sessions", {
					method: "POST",
					credentials: "same-origin",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						challengeId: Number(challengeId)
					})
				});

				if (response.status === 401) {
					window.location.replace("/login");
					return;
				}

				const data = await response.json();

				if (!response.ok) {
					throw new Error(
						data.error || "Failed to create challenge session."
					);
				}

				createdSessionId = data.sessionId;

				if (!active) {
					await fetch(`/api/sessions/${createdSessionId}`, {
						method: "DELETE",
						credentials: "same-origin"
					});
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
				fetch(`/api/sessions/${createdSessionId}`, {
					method: "DELETE",
					credentials: "same-origin"
				}).catch(console.error);
			}
		};
	}, [challengeId]);

	async function closeCurrentSession() {
		if (!sessionId) return;

		try {
			await fetch(`/api/sessions/${sessionId}`, {
				method: "DELETE",
				credentials: "same-origin"
			});
		} catch (err) {
			console.error("Failed to close challenge session:", err);
		}
	}

	async function exitChallenge() {
		await closeCurrentSession();
		window.location.href = "/";
	}

	async function submitChallenge() {
		if (!sessionId || busy || result) return;

		setBusy(true);
		setError("");

		try {
			const response = await fetch(
				`/api/sessions/${sessionId}/submit`,
				{
					method: "POST",
					credentials: "same-origin"
				}
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(
					data.error || "Failed to submit challenge."
				);
			}

			setResult(data.verification);
		} catch (err) {
			setError(err.message);
		} finally {
			setBusy(false);
		}
	}

	async function restartChallenge() {
		if (!sessionId || busy) return;

		const confirmed = window.confirm(
			"Restart this challenge? Your current attempt will be marked as failed."
		);

		if (!confirmed) return;

		setBusy(true);
		setError("");

		try {
			const response = await fetch(
				`/api/sessions/${sessionId}/restart`,
				{
					method: "POST",
					credentials: "same-origin"
				}
			);

			const data = await response.json();

			if (!response.ok) {
				throw new Error(
					data.error || "Failed to restart challenge."
				);
			}

			setResult(null);
			setSessionId(data.sessionId);
		} catch (err) {
			setError(err.message);
		} finally {
			setBusy(false);
		}
	}

	if (error && !sessionId) {
		return <p className="status-message error">{error}</p>;
	}

	if (!sessionId) {
		return <p className="status-message">Creating challenge session...</p>;
	}

	return (
		<div className="challenge-page-wrapper">
			<header className="challenge-header">
				<a href="/" className="header-brand">
					<img src="../assets/logo.svg" className="logo-icon" alt="" />
					<span className="logo-text">
						commitment<strong>Issues</strong>
					</span>
				</a>

				<div className="header-profile">
					<div className="user-avatar" />
				</div>
			</header>

			<div className="challenge-title-bar">
				<button
					className="close-btn"
					aria-label="Exit challenge"
					onClick={exitChallenge}
					disabled={busy}
				>
					✕
				</button>

				<h1 className="challenge-title">
					{challenge?.title ?? "Loading challenge..."}
				</h1>
			</div>

			<main className="challenge-content-grid">
				<section className="card-container description-card">
					<div className="card-header">
						<h2>Description</h2>
					</div>

					<div className="card-body">
						<p className="description-text">
							{challenge?.description ?? "Loading description..."}
						</p>

						<p className="description-text">
							Difficulty: {challenge?.difficulty ?? "..."}
						</p>

						<div className="description-actions">
							<button className="text-action-btn" disabled>
								Hint
							</button>

							<button
								className="text-action-btn"
								onClick={exitChallenge}
								disabled={busy}
							>
								Give Up
							</button>
						</div>
					</div>
				</section>

				<section className="terminal-column">
					<ChallengeTerminal
						key={sessionId}
						sessionId={sessionId}
						height="400px"
					/>

					{error && (
						<p className="status-message error">{error}</p>
					)}

					{result && (
						<div className="submission-result">
							<h3>
								{result.passed
								 ? "Challenge completed!"
								 : "Challenge not completed"}
							</h3>

							<p>Score: {result.score}/100</p>

							<ul>
								{result.checks.map((check) => (
									<li key={check.name}>
										{check.passed ? "✓" : "✗"}{" "}
										<strong>{check.name}:</strong>{" "}
										{check.message}
									</li>
								))}
							</ul>
						</div>
					)}

					<div className="action-buttons-row">
						<button
							className="btn btn-blue"
							onClick={restartChallenge}
							disabled={busy}
						>
							{busy ? "Please wait..." : "Restart"}
						</button>

						<button
							className="btn btn-blue"
							onClick={submitChallenge}
							disabled={busy || !!result}
						>
							{busy
							 ? "Please wait..."
							 : result
							 ? "Submitted"
							 : "Submit"}
						</button>
					</div>
				</section>
			</main>
		</div>
	);
}
