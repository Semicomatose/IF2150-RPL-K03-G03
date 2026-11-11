import React, { useEffect, useState } from "react";
import ChallengeTerminal from "./components/terminal/ChallengeTerminal.jsx";

export default function ChallengePage({ challengeId }) {
	const [sessionId, setSessionId] = useState(null);
	const [challenge, setChallenge] = useState(null);
	const [error, setError] = useState("");

	useEffect(() => {
		let active = true;
		let createdSessionId = null;

		async function createSession() {
			try {
				const response = await fetch("/api/sessions", {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						challengeId: Number(challengeId)
					})
				});

				if (!response.ok) {
					throw new Error(await response.text());
				}

				const data = await response.json();
				createdSessionId = data.sessionId || data.id;

				if (!createdSessionId) {
					throw new Error("Backend did not return a session ID.");
				}

				if (!active) {
					await fetch(`/api/sessions/${createdSessionId}`, {
						method: "DELETE"
					});
					return;
				}

				setSessionId(createdSessionId);
			} catch (err) {
				if (active) {
					setError(err.message);
				}
			}
		}

		createSession();

		return () => {
			active = false;

			if (createdSessionId) {
				fetch(`/api/sessions/${createdSessionId}`, {
					method: "DELETE"
				}).catch(console.error);
			}
		};
	}, [challengeId]);

	useEffect(() => {
		let active = true;

		async function fetchChallenge() {
			try {
				const response = await fetch(`/api/challenges/${challengeId}`);

				if (!response.ok) {
					throw new Error("Failed to fetch challenge details.");
				}

				const data = await response.json();

				if (active) {
					setChallenge(data);
				}
			} catch (err) {
				if (active) {
					setError(err.message);
				}
			}
		}

		fetchChallenge();

		return () => {
			active = false;
		};
	}, [challengeId]);

	function exitChallenge() {
		window.location.href = "/";
	}

	if (error) return <p>Session error: {error}</p>;
	if (!sessionId) return <p>Creating challenge session...</p>;

	return (
		<div className="challenge-page-wrapper">
			<header className="challenge-header">
				<a href="/" className="header-brand">
					<img src="../assets/logo.svg" className="logo-icon" />
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
							<button className="text-action-btn">Hint</button>
							<button className="text-action-btn">Give Up</button>
						</div>
					</div>
				</section>

				<section className="terminal-column">
					<ChallengeTerminal
						sessionId={sessionId}
						height="400px"
					/>

					<div className="action-buttons-row">
						<button className="btn btn-blue">Restart</button>
						<button className="btn btn-blue">Submit</button>
					</div>
				</section>
			</main>
		</div>
	);
}
