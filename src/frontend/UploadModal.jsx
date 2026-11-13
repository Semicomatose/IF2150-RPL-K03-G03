
import React, { useRef, useState } from "react";
import "./modals.css";

export default function UploadModal({ isOpen, onClose, onUploadSuccess }) {
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [difficulty, setDifficulty] = useState("Easy");
	const [file, setFile] = useState(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const fileInput = useRef(null);

	if (!isOpen) return null;

	async function handleSubmit(event) {
		event.preventDefault();
		setError("");

		if (!file) return setError("Please upload a challenge archive (.zip).");
		if (!file.name.toLowerCase().endsWith(".zip")) {
			return setError("Only .zip archives are accepted.");
		}
		if (file.size > 25 * 1024 * 1024) {
			return setError("The ZIP file must be 25 MB or smaller.");
		}
		if (title.trim().length > 50) {
			return setError("Title must be 50 characters or fewer.");
		}

		setLoading(true);

		const formData = new FormData();
		formData.append("title", title.trim());
		formData.append("description", description.trim());
		formData.append("difficulty", difficulty);
		formData.append("challengeFile", file);

		try {
			const response = await fetch("/api/challenges", {
				method: "POST",
				credentials: "same-origin",
				body: formData
			});

			const data = await response.json();

			if (!response.ok) {
				throw new Error(data.error || "Failed to upload challenge.");
			}

			setTitle("");
			setDescription("");
			setDifficulty("Easy");
			setFile(null);

			if (fileInput.current) {
				fileInput.current.value = "";
			}

			onUploadSuccess?.(data);
			onClose();
		} catch (err) {
			setError(err.message || "Failed to upload challenge.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div
			className="modal-overlay"
			onMouseDown={event => {
				if (event.target === event.currentTarget && !loading) onClose();
			}}
		>
			<div
				className="challenge-upload-layout"
				style={{
					display: "flex",
					flexWrap: "wrap",
					gap: 24,
					width: "min(1100px, 95%)",
					background: "#0b0c10",
					border: "1px solid #232733",
					borderRadius: 8,
					padding: 32,
					boxSizing: "border-box",
					alignItems: "stretch"
				}}
			>
				<div
					className="upload-dropzone"
					role="button"
					tabIndex={0}
					onClick={() => fileInput.current?.click()}
					onKeyDown={event => {
						if (event.key === "Enter" || event.key === " ") {
							fileInput.current?.click();
						}
					}}
					style={{
						flex: "1 1 260px",
						border: "2px dashed #38bdf8",
						borderRadius: 8,
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						padding: 40,
						textAlign: "center",
						background: "#080a0f",
						cursor: "pointer",
						minHeight: 300
					}}
				>
					<input
						ref={fileInput}
						type="file"
						accept=".zip,application/zip"
						style={{ display: "none" }}
						onChange={event => setFile(event.target.files?.[0] || null)}
					/>

					<span style={{ color: "#aab5c5", fontSize: 14, lineHeight: 1.6 }}>
						{file ? `Selected: ${file.name}` : "Upload your challenge\nhere (.zip)"}
					</span>

					<small style={{ color: "#64748b", marginTop: 12 }}>
						Maximum size: 25 MB
					</small>
				</div>

				<div
					className="auth-card"
					style={{
						flex: "1.2 1 320px",
						maxWidth: "none",
						border: "1px solid #232733"
					}}
				>
					<div className="auth-card-title-bar">
						<h2>-- Challenge Details --</h2>
					</div>

					<form onSubmit={handleSubmit} className="auth-form" style={{ padding: 32 }}>
						{error && <p className="auth-error" role="alert">{error}</p>}

						<div className="input-row-wrapper">
							<div className="input-group">
								<input
									type="text"
									placeholder="* Title"
									value={title}
									maxLength={50}
									onChange={event => setTitle(event.target.value)}
									required
								/>
							</div>
							<div className="connection-line-top" />
						</div>

						<div className="input-row-wrapper">
							<div
								className="input-group"
								style={{ height: 100, padding: "12px 16px" }}
							>
								<textarea
									placeholder="* Description"
									value={description}
									onChange={event => setDescription(event.target.value)}
									required
									style={{
										background: "transparent",
										border: "none",
										outline: "none",
										color: "#fff",
										fontSize: 14,
										fontFamily: "monospace",
										width: "100%",
										height: "100%",
										resize: "none"
									}}
								/>
							</div>
							<div className="connection-line-bottom" />
						</div>

						<div className="input-row-wrapper">
							<div
								className="input-group"
								style={{
									flexDirection: "column",
									alignItems: "flex-start",
									height: "auto",
									padding: 16
								}}
							>
								<label
									htmlFor="challenge-difficulty"
									style={{
										fontSize: 14,
										color: "#6b7280",
										marginBottom: 8
									}}
								>
									* Difficulty
								</label>

								<select
									id="challenge-difficulty"
									value={difficulty}
									onChange={event => setDifficulty(event.target.value)}
									required
									style={{
										width: "100%",
										padding: "10px 12px",
										background: "#080a0f",
										border: "1px solid #232733",
										borderRadius: 6,
										color: "#fff",
										fontSize: 14,
										fontFamily: "monospace",
										cursor: "pointer"
									}}
								>
									<option value="Easy">Easy</option>
									<option value="Medium">Medium</option>
									<option value="Hard">Hard</option>
								</select>
							</div>
						</div>

						<div className="auth-action-container" style={{ marginTop: 16 }}>
							<button
								type="submit"
								disabled={loading}
								className="auth-submit-btn"
							>
								{loading ? "Uploading..." : "Upload as Draft"}
							</button>
						</div>

						<p style={{
							   color: "#718096",
							   fontSize: 11,
							   textAlign: "center"
						   }}>
							New challenges are saved as drafts. Publish them from Manage Challenges.
						</p>
					</form>
				</div>
			</div>
		</div>
	);
}
