import React, { useEffect, useState, useRef } from "react";
import ProfileModal from "./ProfileModal.jsx";
import FilterModal from "./FilterModal.jsx";
import HistoryModal from "./HistoryModal.jsx";
import "./main-page.css";
import "./modals.css";

export default function MainPage() {
    const [username, setUsername] = useState("");
	const [challenges, setChallenges] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [menuOpen, setMenuOpen] = useState(false);
	const [authenticated, setAuthenticated] = useState(false);
	const [history, setHistory] = useState([]);
	const [historyLoading, setHistoryLoading] = useState(false);

	const [isProfileOpen, setIsProfileOpen] = useState(false);
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [isHistoryOpen, setIsHistoryOpen] = useState(false);

	const profileRef = useRef(null);

	async function fetchHistory() {
		setHistoryLoading(true);

		try {
			const response = await fetch("/api/history", {
				credentials: "same-origin"
			});

			if (response.status === 401) {
				window.location.replace("/login");
				return;
			}

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to load history.");
			}

			setHistory(data);
		} catch (err) {
			setError(err.message);
		} finally {
			setHistoryLoading(false);
		}
	}

	async function openHistory() {
		setMenuOpen(false);
		setIsHistoryOpen(true);
		await fetchHistory();
	}

	async function handleLogout() {
		try {
			const response = await fetch("/api/logout", {
				method: "POST",
				credentials: "same-origin"
			});

			if (!response.ok) {
				throw new Error("Logout failed.");
			}

			window.location.replace("/login");
		} catch (err) {
			setError(err.message);
		}
	}

	useEffect(() => {
		let active = true;

		async function initializePage() {
			try {
				const authResponse = await fetch("/api/me", {
					credentials: "same-origin"
				});

				if (authResponse.status === 401) {
					window.location.replace("/login");
					return;
				}

				if (!authResponse.ok) {
					throw new Error("Failed to verify login.");
				}

				const authData = await authResponse.json();
				if (!active) return;

				setUsername(authData.user.username);
				setAuthenticated(true);

				const challengeResponse = await fetch("/api/challenges", {
					credentials: "same-origin"
				});

				if (!challengeResponse.ok) {
					throw new Error("Failed to load challenges.");
				}

				const challengeData = await challengeResponse.json();
				if (active) {
					setChallenges(challengeData);
				}
			} catch (err) {
				if (active) {
					setError(err.message);
				}
			} finally {
				if (active) {
					setLoading(false);
				}
			}
		}

		initializePage();

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

	if (error) {
		return <p className="status-message error">{error}</p>;
	}

	if (loading || !authenticated) {
		return <p className="status-message">Loading your account...</p>;
	}

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
						<img src="./assets/user.jpg" className="user-avatar-icon" />
					</button>

					{menuOpen && (
						<div className="profile-dropdown-menu">
							<button className="dropdown-item" onClick={() => { setMenuOpen(false); setIsProfileOpen(true); }}>
								<span className="profile-icon"></span> Profile
							</button>
							<button className="dropdown-item" onClick={openHistory}>
								<span className="history-icon"></span> History
							</button>
							<button className="dropdown-item logout-item" onClick={handleLogout}>
								<span className="logout-icon"></span> Logout
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
								<span className="filter-icon" onClick={() => setIsFilterOpen(true)}></span>
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

			<ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} userInfo={{ username }} />
			<FilterModal isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
			<HistoryModal
				isOpen={isHistoryOpen}
				onClose={() => setIsHistoryOpen(false)}
				historyList={history}
				userChallenges={yourChallenges}
				loading={historyLoading}
			/>
		</div>
	);
}
