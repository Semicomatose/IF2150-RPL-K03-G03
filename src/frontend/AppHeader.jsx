import React, { useEffect, useRef, useState } from "react";
import ProfileModal from "./ProfileModal.jsx";
import HistoryModal from "./HistoryModal.jsx";
import logo from "../assets/logo.svg";
import avatar from "../assets/user.jpg";
import gearIcon from "../assets/Gear.png";
import historyIcon from "../assets/History.png";
import exitIcon from "../assets/Exit.png";
import "./main-page.css";
import "./modals.css";

export default function AppHeader({ user }) {
	const [menuOpen, setMenuOpen] = useState(false);
	const [isProfileOpen, setIsProfileOpen] = useState(false);
	const [isHistoryOpen, setIsHistoryOpen] = useState(false);
	const [history, setHistory] = useState([]);
	const [challenges, setChallenges] = useState([]);
	const [historyLoading, setHistoryLoading] = useState(false);
	const [historyError, setHistoryError] = useState("");
	const [logoutError, setLogoutError] = useState("");
	const profileRef = useRef(null);

	useEffect(() => {
		function handleClickOutside(event) {
			if (profileRef.current && !profileRef.current.contains(event.target)) setMenuOpen(false);
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	async function openHistory() {
		setMenuOpen(false);
		setIsHistoryOpen(true);
		setHistoryLoading(true);
		setHistoryError("");
		try {
			const [historyResponse, challengesResponse] = await Promise.all([
				fetch("/api/history", { credentials: "same-origin" }),
				fetch("/api/challenges", { credentials: "same-origin" })
			]);
			if (historyResponse.status === 401 || challengesResponse.status === 401) {
				window.location.replace("/login");
				return;
			}

			const historyData = await historyResponse.json();
			if (!historyResponse.ok) throw new Error(historyData.error || "Failed to load history.");
			const challengesData = await challengesResponse.json();
			if (!challengesResponse.ok) throw new Error(challengesData.error || "Failed to load challenges.");

			setHistory(historyData);
			setChallenges(challengesData);
		} catch (err) {
			setHistoryError(err.message);
		} finally {
			setHistoryLoading(false);
		}
	}

	async function handleLogout() {
		try {
			const response = await fetch("/api/logout", { method: "POST", credentials: "same-origin" });
			if (!response.ok) {
				const data = await response.json().catch(() => ({}));
				throw new Error(data.error || "Logout failed.");
			}
			window.location.replace("/login");
		} catch (err) {
			setLogoutError(err.message);
		}
	}

	return (
		<>
			<header className="main-header">
				<a href="/" className="header-brand">
					<img src={logo} className="logo-icon" alt="" />
					<span className="logo-text">commitment<strong>Issues</strong></span>
				</a>

				<div className="header-profile-container" ref={profileRef}>
					{logoutError && <span className="header-error" role="alert">{logoutError}</span>}
					<button className="user-avatar-btn" onClick={() => setMenuOpen((open) => !open)} aria-label="User menu" aria-expanded={menuOpen}>
						<img src={avatar} className="user-avatar-icon" alt="" />
					</button>

					{menuOpen && (
						<div className="profile-dropdown-menu">
							<button className="dropdown-item" onClick={() => { setMenuOpen(false); setIsProfileOpen(true); }}>
								<img src={gearIcon} className="item-icon" alt="" /> Profile
							</button>
							<button className="dropdown-item" onClick={openHistory}>
								<img src={historyIcon} className="item-icon" alt="" /> History
							</button>
							<button className="dropdown-item logout-item" onClick={handleLogout}>
								<img src={exitIcon} className="item-icon" alt="" /> Logout
							</button>
						</div>
					)}
				</div>
			</header>

			<ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} userInfo={user} />
			<HistoryModal
				isOpen={isHistoryOpen}
				onClose={() => setIsHistoryOpen(false)}
				historyList={history}
				challenges={challenges}
				loading={historyLoading}
				error={historyError}
			/>
		</>
	);
}
