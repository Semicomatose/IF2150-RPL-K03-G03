import React, { useEffect } from "react";
import logo from "../assets/logo.svg";
import gitLogo from "../assets/git.png";
import "./main-page.css";
import "./auth.css";

export default function LandingPage() {
	useEffect(() => {
		fetch("/api/me", { credentials: "same-origin" })
			.then((response) => {
				if (response.ok) window.location.replace("/");
			})
			.catch(() => {});
	}, []);

	return (
		<div className="main-menu-wrapper">
			<header className="main-header">
				<a href="/welcome" className="header-brand">
					<img src={logo} className="logo-icon" alt="" />
					<span className="logo-text">commitment<strong>Issues</strong></span>
				</a>
			</header>

			<main className="landing-content">
				<img src={gitLogo} className="landing-logo" alt="Git logo" />
				<h1 className="landing-tagline">
					<span>Learn <span className="landing-accent">git</span> from zero through</span>
					<strong>handmade, practical, interactive challenges</strong>
				</h1>

				<div className="auth-action-container landing-actions">
					<a href="/signup" className="auth-submit-btn">Join Now</a>
					<div className="auth-switch-link">
						Already have an account? <a href="/login">Log in</a>
					</div>
				</div>
			</main>
		</div>
	);
}
