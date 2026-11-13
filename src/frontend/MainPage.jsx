import React, { useEffect, useState } from "react";
import AppHeader from "./AppHeader.jsx";
import FilterModal, { DEFAULT_FILTERS } from "./FilterModal.jsx";
import HexBadge from "./HexBadge.jsx";
import { difficultyLabel, difficultyLevel } from "./difficulty.js";
import "./main-page.css";
import "./modals.css";
import "./creator-ui.css";

const STATUS_PILLS = {
	TERPUBLIKASI: { className: "published", label: "Published" },
	DRAF: { className: "not-published", label: "Not Published" },
	DIJADWALKAN_HAPUS: { className: "scheduled-delete", label: "Scheduled for Deletion" }
};

function ChallengeCard({ challenge, href, showStatus }) {
	const pill = STATUS_PILLS[challenge.status] ?? STATUS_PILLS.DRAF;

	return (
		<a href={href} className="menu-card">
			<div className="card-top-bar">
				<HexBadge value={difficultyLevel(challenge.difficulty) || "?"} title={difficultyLabel(challenge.difficulty)} />
				<div className="card-header-info">
					<h3>{challenge.title}</h3>
					<span className="creator-text">by: {challenge.creator || "ChallengeMaker"}</span>
				</div>
				<span className="card-chevron">›</span>
			</div>
			<div className="card-body-content">
				<p>{challenge.description}</p>
			</div>
			{showStatus && (
				<div className="card-status-footer">
					<span className={`status-pill ${pill.className}`}>{pill.label}</span>
				</div>
			)}
		</a>
	);
}

export default function MainPage() {
	const [user, setUser] = useState(null);
	const [challenges, setChallenges] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [filters, setFilters] = useState(DEFAULT_FILTERS);
	const [isFilterOpen, setIsFilterOpen] = useState(false);

	useEffect(() => {
		let active = true;

		async function initializePage() {
			try {
				const authResponse = await fetch("/api/me", { credentials: "same-origin" });

				if (authResponse.status === 401) {
					window.location.replace("/welcome");
					return;
				}
				if (!authResponse.ok) {
					throw new Error("Failed to verify login.");
				}

				const authData = await authResponse.json();
				if (!active) return;
				setUser(authData.user);

				const challengeResponse = await fetch("/api/challenges", { credentials: "same-origin" });
				if (!challengeResponse.ok) {
					throw new Error("Failed to load challenges.");
				}

				const challengeData = await challengeResponse.json();
				if (active) setChallenges(challengeData);
			} catch (err) {
				if (active) setError(err.message);
			} finally {
				if (active) setLoading(false);
			}
		}

		initializePage();
		return () => { active = false; };
	}, []);

	function matchesFilters(challenge) {
		const query = filters.searchQuery.toLocaleLowerCase();
		const level = difficultyLevel(challenge.difficulty);
		const matchesQuery = !query || [challenge.title, challenge.description, challenge.creator]
			.some((value) => String(value ?? "").toLocaleLowerCase().includes(query));

		return matchesQuery && level >= filters.minDifficulty && level <= filters.maxDifficulty;
	}

	const isFiltered = Object.keys(DEFAULT_FILTERS).some((key) => filters[key] !== DEFAULT_FILTERS[key]);
	const availableChallenges = challenges.filter((c) => !c.isUserCreated && matchesFilters(c));
	const yourChallenges = challenges.filter((c) => c.isUserCreated);

	if (error) {
		return <p className="status-message error">{error}</p>;
	}

	if (loading || !user) {
		return <p className="status-message">Loading your account...</p>;
	}

	return (
		<div className="main-menu-wrapper">
			<AppHeader user={user} />

			<main className="main-menu-content">
				<h1 className="welcome-greeting">Welcome, <strong>{user.username}</strong>!</h1>

				{user.role === "PELAJAR" && <section className="challenge-section">
					<div className="section-title-wrapper">
						<h2>Available Challenges</h2>
						<button
							className={`filter-btn${isFiltered ? " active" : ""}`}
							onClick={() => setIsFilterOpen(true)}
							aria-label="Filter challenges"
							title={isFiltered ? "Filters applied" : "Filter challenges"}
						>
							<span className="filter-icon" aria-hidden="true"></span>
						</button>
					</div>
					<div className="horizontal-scroll-container">
						{availableChallenges.map((challenge) => (
							<ChallengeCard key={challenge.id} challenge={challenge} href={`/challenges/${challenge.id}`} />
						))}
						{availableChallenges.length === 0 && (
							<p className="empty-section-message">
								{isFiltered ? "No challenges match your filters." : "No challenges are available yet."}
							</p>
						)}
					</div>
				</section>}

				{user.role === "PEMBUAT" && <section className="challenge-section">
					<div className="section-title-wrapper">
						<h2 className="centered-section-title">Your Challenges</h2>
						<a className="creator-dashboard-link" href="/creator">Manage challenges &amp; attempts</a>
					</div>

					<div className="horizontal-scroll-container">
						{yourChallenges.map((challenge) => (
							<ChallengeCard key={challenge.id} challenge={challenge} href={`/challenges/${challenge.id}/evaluate`} showStatus />
						))}

						<a href="/create-challenge" className="menu-card create-card">
							<div className="create-card-content">
								<span className="plus-icon">+</span>
								<span>Create New Challenge</span>
							</div>
						</a>
					</div>
				</section>}
			</main>

			<FilterModal
				isOpen={isFilterOpen}
				onClose={() => setIsFilterOpen(false)}
				initialFilters={filters}
				onApplyFilters={setFilters}
			/>
		</div>
	);
}
