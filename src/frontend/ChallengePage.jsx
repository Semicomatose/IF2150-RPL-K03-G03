import React, { useEffect, useState } from "react";
import ChallengeTerminal from "./components/terminal/ChallengeTerminal.jsx";

export default function ChallengePage() {
	const [sessionId, setSessionId] = useState(null);
	const [error, setError] = useState("");

	useEffect(() => {
		let active = true;
		let createdSessionId;

		async function createSession() {
			try {
				const response = await fetch("/api/sessions", {
					method: "POST",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						challengeId: 11
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

				if (active) {
					setSessionId(createdSessionId);
				}
			} catch (err) {
				if (active) setError(err.message);
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
	}, []);

	if (error) return <p>Session error: {error}</p>;
	if (!sessionId) return <p>Creating challenge session...</p>;

	return (
		<div className="challenge-page-wrapper">
			<header className="challenge-header">
				<div className="header-brand">
					<span className="logo-icon">⚡</span>
					<span className="logo-text">commitment<strong>Issues</strong></span>
				</div>
				<div className="header-profile">
					<div className="user-avatar" />
				</div>
			</header>

			<div className="challenge-title-bar">
				<button className="close-btn" aria-label="Close">✕</button>
				<h1 className="challenge-title">-- Challenge Name --</h1>
			</div>

			<main className="challenge-content-grid">
				<section className="card-container description-card">
					<div className="card-header">
						<h2>Description</h2>
					</div>
					<div className="card-body">
						<p className="description-text">
							Lorem ipsum dolor sit amet consectetur adipiscing elit. Arcu tincidunt
							eiusmod curae nullam augue magna. Ea excepteur mollit viverra qui nibh
							reprehenderit est egestas molestie cillum suscipit ante aliquip donec
							tortor. Feugiat lacus pariatur laborum faucibus duis augue qui dolore
							anim ligula ante aute.
						</p>
						<p className="description-text">
							Anim nibh arcu fugiat reprehenderit suspendisse tempus qui voluptate
							volutpat voluptate donec vel potenti. Fugiat dolor mauris mollit
							tempor habitant lobortis enim. Est in tempor magna condimentum
							scelerisque ad irure varius. Aliquip anim pharetra egestas esse
							laboris esse posuere id est nulla tincidunt molestie suspendisse
							incididunt enim.
						</p>

						<div className="objectives-section">
							<h3>Objectives</h3>
							<ul className="objectives-list">
								<li className="objective-satisfied">Example satisfied objective</li>
								<li className="objective-unsatisfied">Example unsatisfied objective</li>
							</ul>
						</div>

						<div className="description-actions">
							<button className="text-action-btn">Hint</button>
							<button className="text-action-btn">Give Up</button>
						</div>
					</div>
				</section>

				<section className="terminal-column">
					<ChallengeTerminal sessionId={sessionId} height="400px" />

					<div className="action-buttons-row">
						<button className="btn btn-blue">Restart</button>
						<button className="btn btn-blue">Submit</button>
					</div>
				</section>
			</main>
		</div>
	);
}
