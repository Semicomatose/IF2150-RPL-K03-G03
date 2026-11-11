import React, { useState } from "react";
import "./auth.css";

export default function LoginPage() {
	const [identifier, setIdentifier] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleLogin (event) {
		event.preventDefault();
		setError("");
		setLoading(true);
		try {
			const response = await fetch("/api/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
				body: JSON.stringify({ identifier, password })
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Login failed.");
			}

			window.location.href = "/";
		} catch (err) {
			setError(err.message);
		} finally {
            setLoading(false);
        }
	};

	return (
		<div className="auth-page-wrapper">
			 <div className="auth-brand-header">
				<img src="../assets/logo.svg" className="logo-icon" alt="Logo" />
				<span className="logo-text">commitment<strong>Issues</strong></span>
			</div>

			 <div className="auth-card">
				<div className="auth-card-title-bar">
					<h2>-- Log In --</h2>
				</div>

				<form onSubmit={handleLogin} className="auth-form">
					{error && <p className="auth-error">{error}</p>}

					<div className="input-row-wrapper">
						<div className="input-group">
							<span className="username-icon"></span>
							<input
								type="text"
								placeholder="* Email/Username"
								value={identifier}
								onChange={(e) => setIdentifier(e.target.value)}
								required
							/>
						</div>
						<div className="connection-line-top"></div>
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
						<div className="connection-line-bottom"></div>
					</div>

					<div className="auth-action-container">
						<button type="submit" disabled={loading} className="auth-submit-btn">
							{loading ? "Logging in..." : "Login"}
						</button>
						<div className="auth-switch-link">
															  Don’t have an account? <a href="/signup">Sign up</a>
						</div>
					</div>
				</form>
			</div>
		</div>
	);
}
