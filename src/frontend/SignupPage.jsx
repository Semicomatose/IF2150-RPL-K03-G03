import React, { useState } from "react";
import logo from "../assets/logo.svg";
import "./auth.css";

export default function SignupPage() {
	const [email, setEmail] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSignup(event) {
		event.preventDefault();
		setError("");

		if (password !== confirmPassword) {
			setError("Passwords do not match.");
			return;
		}

		setLoading(true);
		try {
			const response = await fetch("/api/auth/signup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "same-origin",
				body: JSON.stringify({ email, username, password })
			});
			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Signup failed.");
			}

			const loginResponse = await fetch("/api/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "same-origin",
				body: JSON.stringify({ identifier: username, password })
			});
			window.location.replace(loginResponse.ok ? "/" : "/login");
		} catch (err) {
			setError(err.message || "Signup failed.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="auth-page-wrapper">
			<div className="auth-brand-header">
				<img src={logo} className="logo-icon" alt="Logo" />
				<span className="logo-text">commitment<strong>Issues</strong></span>
			</div>

			<div className="auth-card signup-card">
				<div className="auth-card-title-bar">
					<h2>-- Create a New Account --</h2>
				</div>

				<form onSubmit={handleSignup} className="auth-form">
					{error && <p className="auth-error" role="alert">{error}</p>}

					<div className="input-row-wrapper">
						<div className="input-group">
							<span className="email-icon" aria-hidden="true"></span>
							<input type="email" placeholder="* Email" value={email}
								   onChange={(event) => setEmail(event.target.value)} maxLength={255} required />
						</div>
						<div className="connection-line-top"></div>
					</div>

					<div className="input-row-wrapper">
						<div className="input-group">
							<span className="username-icon" aria-hidden="true"></span>
							<input type="text" placeholder="* Username" value={username}
								   onChange={(event) => setUsername(event.target.value)} minLength={3} maxLength={12} required />
						</div>
						<div className="connection-line-mid-1"></div>
					</div>

					<div className="input-row-wrapper">
						<div className="input-group">
							<span className="password-icon" aria-hidden="true"></span>
							<input type="password" placeholder="* Password" value={password}
								   onChange={(event) => setPassword(event.target.value)} minLength={8} required />
						</div>
						<div className="connection-line-mid-2"></div>
					</div>

					<div className="input-row-wrapper">
						<div className="input-group">
							<span className="password-icon" aria-hidden="true"></span>
							<input type="password" placeholder="* Confirm Password" value={confirmPassword}
								   onChange={(event) => setConfirmPassword(event.target.value)} minLength={8} required />
						</div>
						<div className="connection-line-bottom"></div>
					</div>

					<div className="auth-action-container">
						<button type="submit" className="auth-submit-btn" disabled={loading}>
							{loading ? "Creating account..." : "Create Account"}
						</button>
						<div className="auth-switch-link">
							Already have an account? <a href="/login">Log in</a>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}
