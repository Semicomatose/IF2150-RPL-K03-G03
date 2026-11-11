import React, { useState } from "react";
import "./auth.css";

export default function SignupPage() {
	const [email, setEmail] = useState("");
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");

	const handleSignup = async (e) => {
		e.preventDefault();
		if (password !== confirmPassword) {
			setError("Passwords do not match.");
			return;
		}

		try {
			const response = await fetch("/api/auth/signup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, username, password })
			});

			if (!response.ok) {
				throw new Error(await response.text() || "Signup failed.");
			}

			window.location.href = "/login";
		} catch (err) {
			setError(err.message);
		}
	};

	return (
		<div className="auth-page-wrapper">
			<div className="auth-brand-header">
				<img src="../assets/logo.svg" className="logo-icon" alt="Logo" />
				<span className="logo-text">commitment<strong>Issues</strong></span>
			</div>

			<div className="auth-card signup-card">
				<div className="auth-card-title-bar">
					<h2>-- Create a New Account --</h2>
				</div>

				<form onSubmit={handleSignup} className="auth-form">
					{error && <p className="auth-error">{error}</p>}

					<div className="input-row-wrapper">
						<div className="input-group">
							<span className="email-icon"></span>
							<input
								type="email"
								placeholder="* Email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
							/>
						</div>
						<div className="connection-line-top"></div>
					</div>

					<div className="input-row-wrapper">
						<div className="input-group">
							<span className="username-icon"></span>
							<input
								type="text"
								placeholder="* Username"
								value={username}
								onChange={(e) => setUsername(e.target.value)}
								required
							/>
						</div>
						<div className="connection-line-mid-1"></div>
					</div>

					<div className="input-row-wrapper">
						<div className="input-group">
							<span className="password-icon"></span>
							<input
								type="password"
								placeholder="* Password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
							/>
						</div>
						<div className="connection-line-mid-2"></div>
					</div>

					<div className="input-row-wrapper">
						<div className="input-group">
							<span className="password-icon"></span>
							<input
								type="password"
								placeholder="* Confirm Password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								required
							/>
						</div>
						<div className="connection-line-bottom"></div>
					</div>

					<div className="auth-action-container">
						<button type="submit" className="auth-submit-btn">
							Create Account
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
