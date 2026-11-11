import React, { useEffect, useState, useRef } from "react";
import "./main-page.css";

export default function MainPage({ username = "Username" }) {
	const [challenges, setChallenges] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [menuOpen, setMenuOpen] = useState(false);
	const profileRef = useRef(null);

	useEffect(() => {
		let active = true;

		async function fetchChallenges() {
			try {
				const response = await fetch("/api/challenges");

				if (!response.ok) {
					throw new Error("Failed to load challenges.");
				}

				const data = await response.json();

				if (active) {
					setChallenges(data);
				}
			} catch (err) {
				if (active) setError(err.message);
			} finally {
				if (active) setLoading(false);
			}
		}

		fetchChallenges();

		function handleClickOutside(event) {
			if (profileRef.current && !profileRef.current.contains(event.target)) {
				setMenuOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);

		return () => {
			active = false;
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	const availableChallenges = challenges.filter(c => !c.isUserCreated);
	const yourChallenges = challenges.filter(c => c.isUserCreated);

	return (
		<div className="main-menu-wrapper">
			<header className="main-header">
				<a href="/" className="header-brand">
					<img src="../assets/logo.svg" className="logo-icon"></img>
					<span className="logo-text">commitment<strong>Issues</strong></span>
				</a>

				<div className="header-profile-container" ref={profileRef}>
					<button
						className="user-avatar-btn"
						onClick={() => setMenuOpen(!menuOpen)}
						aria-label="User Menu"
					>
						<img src="../assets/user.jpg" className="user-avatar-icon" />
					</button>

					{menuOpen && (
						<div className="profile-dropdown-menu">
							<a href="/profile" className="dropdown-item">
								<span className="item-icon"></span> Profile
							</a>
							<a href="/history" className="dropdown-item">
								<span className="item-icon"></span> History
							</a>
							<button className="dropdown-item logout-item" onClick={() => alert("Logging out...")}>
								<span className="item-icon"></span> Logout
							</button>
						</div>
					)}
				</div>
			</header>

			<main className="main-menu-content">
				<h1 className="welcome-greeting">Welcome, <strong>{username}</strong>!</h1>

				{loading && <p className="status-message">Loading challenges...</p>}
				{error && <p className="status-message error">{error}</p>}

				{!loading && !error && (
					<>
						<section className="challenge-section">
							<div className="section-title-wrapper">
								<h2>Available Challenges</h2>
								<span className="filter-icon">filter</span>
							</div>

							<div className="horizontal-scroll-container">
								{availableChallenges.map((challenge, index) => (
									<a
										href={`/challenges/${challenge.id}`}
										key={challenge.id}
										className="menu-card"
									>
										<div className="card-top-bar">
											<div className="hexagon-badge">{index + 1}</div>
											<div className="card-header-info">
												<h3>{challenge.title}</h3>
												<span className="creator-text">by: {challenge.creator || "ChallengeMaker"}</span>
											</div>
											<span className="card-chevron">›</span>
										</div>
										<div className="card-body-content">
											<p>{challenge.description}</p>
										</div>
									</a>
								))}
							</div>
						</section>

						<section className="challenge-section">
							<h2 className="centered-section-title">Your Challenges</h2>

							<div className="horizontal-scroll-container">
								{yourChallenges.map((challenge, index) => (
									<a
										href={`/challenges/${challenge.id}`}
										key={challenge.id}
										className="menu-card"
									>
										<div className="card-top-bar">
											<div className="hexagon-badge">{challenge.codeNumber || index + 1}</div>
											<div className="card-header-info">
												<h3>{challenge.title}</h3>
												<span className="creator-text">by: {challenge.creator || "ChallengeMaker"}</span>
											</div>
											<span className="card-chevron">›</span>
										</div>
										<div className="card-body-content">
											<p>{challenge.description}</p>
										</div>
										<div className="card-status-footer">
											<span className={`status-pill ${challenge.isPublished ? "published" : "not-published"}`}>
												{challenge.isPublished ? "Published" : "Not Published"}
											</span>
										</div>
									</a>
								))}

								<a href="/create-challenge" className="menu-card create-card">
									<div className="create-card-content">
										<span className="plus-icon">+</span>
										<span>Create New Challenge</span>
									</div>
								</a>
							</div>
						</section>
					</>
				)}
			</main>
		</div>
	);
}
