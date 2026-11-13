import React, { useEffect, useRef, useState } from "react";
import AppHeader from "./AppHeader.jsx";
import { uploadChallenge } from "./challengeApi.js";
import { DIFFICULTIES, difficultyLabel } from "./difficulty.js";
import "./main-page.css";
import "./auth.css";

const MAX_TITLE_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 300;
// Samakan dengan MAX_PACKAGE_BYTES di challengeSessionService.js
const MAX_PACKAGE_BYTES = 25 * 1024 * 1024;

function validatePackage(file) {
	if (!file) return "Please choose a challenge package (.zip).";
	if (!file.name.toLowerCase().endsWith(".zip")) return "Challenge package must be a .zip file.";
	if (file.size > MAX_PACKAGE_BYTES) return "Challenge package must not exceed 25 MB.";
	return "";
}

export default function UploadPage() {
	const [user, setUser] = useState(null);
	const [file, setFile] = useState(null);
	const [title, setTitle] = useState("");
	const [description, setDescription] = useState("");
	const [difficulty, setDifficulty] = useState(1);
	const [dragging, setDragging] = useState(false);
	const [error, setError] = useState("");
	const [uploading, setUploading] = useState(false);
	const fileInputRef = useRef(null);

	useEffect(() => {
		let active = true;

		async function loadUser() {
			try {
				const response = await fetch("/api/me", { credentials: "same-origin" });
				if (response.status === 401) {
					window.location.replace("/login");
					return;
				}
				const data = await response.json();
				if (!response.ok) throw new Error(data.error || "Failed to load account.");
				if (active) setUser(data.user);
			} catch (err) {
				if (active) setError(err.message);
			}
		}

		loadUser();
		return () => { active = false; };
	}, []);

	function selectFile(selected) {
		if (!selected) return;
		setFile(selected);
		setError(validatePackage(selected));
	}

	function handleDrop(event) {
		event.preventDefault();
		setDragging(false);
		selectFile(event.dataTransfer.files[0]);
	}

	async function handleSubmit(event) {
		event.preventDefault();

		const packageError = validatePackage(file);
		if (packageError) {
			setError(packageError);
			return;
		}

		setError("");
		setUploading(true);
		try {
			const data = await uploadChallenge({
				file,
				title: title.trim(),
				description: description.trim(),
				difficulty: DIFFICULTIES[difficulty - 1]
			});
			if (data) window.location.assign(`/challenges/${data.id}/evaluate`);
		} catch (err) {
			setError(err.message);
		} finally {
			setUploading(false);
		}
	}

	if (!user) {
		return <p className={`status-message${error ? " error" : ""}`}>{error || "Loading your account..."}</p>;
	}

	return (
		<div className="main-menu-wrapper">
			<AppHeader user={user} />

			<form className="upload-layout" onSubmit={handleSubmit}>
				<button
					type="button"
					className={`upload-dropzone${dragging ? " dragging" : ""}${file ? " has-file" : ""}`}
					onClick={() => fileInputRef.current?.click()}
					onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
					onDragLeave={() => setDragging(false)}
					onDrop={handleDrop}
				>
					{file ? (
						<>
							<span className="upload-file-name">{file.name}</span>
							<span className="upload-file-size">{(file.size / 1024).toFixed(1)} KB · click to change</span>
						</>
					) : (
						<span>Upload your challenge<br />here (.zip)</span>
					)}
				</button>
				<input
					ref={fileInputRef}
					type="file"
					accept=".zip,application/zip"
					hidden
					onChange={(event) => selectFile(event.target.files[0])}
				/>

				<section className="auth-card upload-card">
					<div className="auth-card-title-bar">
						<h2>-- Challenge Details --</h2>
					</div>

					<div className="auth-form">
						{error && <p className="auth-error" role="alert">{error}</p>}

						<div className="input-row-wrapper">
							<div className="input-group">
								<input
									type="text"
									placeholder="* Title"
									value={title}
									onChange={(event) => setTitle(event.target.value)}
									maxLength={MAX_TITLE_LENGTH}
									aria-label="Title"
									required
								/>
								<span className="input-counter">{title.length}/{MAX_TITLE_LENGTH}</span>
							</div>
						</div>

						<div className="input-row-wrapper">
							<div className="input-group textarea-group">
								<textarea
									placeholder="* Description"
									value={description}
									onChange={(event) => setDescription(event.target.value)}
									maxLength={MAX_DESCRIPTION_LENGTH}
									aria-label="Description"
									rows={4}
									required
								/>
								<span className="input-counter">{description.length}/{MAX_DESCRIPTION_LENGTH}</span>
							</div>
						</div>

						<div className="input-row-wrapper">
							<div className="input-group slider-group">
								<label htmlFor="upload-difficulty">* Difficulty</label>
								<div className="single-range">
									<span className="single-range-value" style={{ left: `${((difficulty - 1) / (DIFFICULTIES.length - 1)) * 100}%` }}>
										{difficultyLabel(DIFFICULTIES[difficulty - 1])}
									</span>
									<input
										id="upload-difficulty"
										type="range"
										min="1"
										max={DIFFICULTIES.length}
										value={difficulty}
										onChange={(event) => setDifficulty(Number(event.target.value))}
										aria-valuetext={difficultyLabel(DIFFICULTIES[difficulty - 1])}
									/>
								</div>
							</div>
						</div>

						<div className="auth-action-container">
							<button type="submit" className="auth-submit-btn" disabled={uploading}>
								{uploading ? "Uploading..." : "Upload"}
							</button>
						</div>
					</div>
				</section>
			</form>
		</div>
	);
}
