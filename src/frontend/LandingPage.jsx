import React from "react";
import "./auth.css";

export default function LandingPage() {
	return (
		<div className="auth-page-wrapper" style={{ justifyContent: "space-between", padding: "24px 32px" }}>

			<header className="auth-brand-header" style={{ width: "100%", justifyContent: "flex-start", marginBottom: "0" }}>
				<img src="../assets/logo.svg" className="logo-icon" alt="Logo" />
				<span className="logo-text">commitment<strong>Issues</strong></span>
			</header>

			<main style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", margin: "auto" }}>
				<div style={{ marginBottom: "36px" }}>
					<img height="120" width="120" src="./assets/git.png" />
				</div>

				<h1 style={{ fontSize: "clamp(20px, 2.5vw, 28px)", fontWeight: "normal", color: "#ffffff", margin: "0 0 12px", letterSpacing: "0.5px" }}>
					Learn <span style={{ color: "#38bdf8", fontFamily: "monospace" }}>git</span> from zero through
				</h1>
				<p style={{ fontSize: "clamp(20px, 2.5vw, 28px)", fontWeight: "bold", color: "#ffffff", margin: "0 0 40px", letterSpacing: "0.5px" }}>
					handmade, practical, interactive challenges
				</p>

				<div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
					<a href="/signup" className="auth-submit-btn" style={{ textDecoration: "none", display: "inline-block", padding: "14px 56px" }}>
						Join Now
					</a>
					<div className="auth-switch-link">
						Already have an account? <a href="/login">Log in</a>
					</div>
				</div>
			</main>

			<div style={{ height: "28px" }}></div>
		</div>
	);
}
