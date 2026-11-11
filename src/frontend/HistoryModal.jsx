
import React from "react";
import "./modals.css";

function formatDate(date) {
	if (!date) return "Not submitted";

	const parsed = new Date(date);

	if (Number.isNaN(parsed.getTime())) return "Unknown date";

	return parsed.toLocaleString();
}

function getStatusLabel(status) {
	switch (status) {
		case "SELESAI":
			return "Completed";
		case "GAGAL":
			return "Failed";
		case "BERLANGSUNG":
			return "In progress";
		default:
			return status || "Unknown";
	}
}

export default function HistoryModal({
	isOpen,
	onClose,
	historyList = [],
	userChallenges = [],
	loading = false
}) {
	if (!isOpen) return null;

	return (
		<div className="modal-overlay history-overlay">
			<div className="history-top-bar">
				<button
					className="close-modal-btn white-close"
					onClick={onClose}
					aria-label="Close history"
				>
					✕
				</button>
			</div>

			<div className="history-content-wrapper">
				{/* Student attempt history */}
				<div className="history-column">
					<h2 className="history-section-title">
						Challenge History
					</h2>

					<div className="history-list-box">
						{loading ? (
							<p className="history-empty">
								Loading history...
							</p>
						) : historyList.length === 0 ? (
							<p className="history-empty">
								You haven't attempted any challenges yet.
							</p>
						) : (
							historyList.map((item) => (
								<div
									className="history-row-item"
									key={item.id}
								>
									<div className="hexagon-badge">
										{item.score ?? 0}
									</div>

									<div className="history-item-details">
										<span className="history-item-title">
											{item.title || "Untitled challenge"}
										</span>

										<span className="history-item-status">
											{getStatusLabel(item.status)}
											{" · "}
											{formatDate(
												item.submittedAt ||
												item.startedAt
											)}
										</span>
									</div>

									<span className="card-chevron">›</span>
								</div>
							))
						)}
					</div>
				</div>

				{/* Challenges created by this user */}
				<div className="history-column">
					<h2 className="history-section-title">
						Your Challenges
					</h2>

					<div className="history-list-box">
						{userChallenges.length === 0 ? (
							<p className="history-empty">
								You haven't created any challenges yet.
							</p>
						) : (
							userChallenges.map((item) => (
								<div
									className="history-row-item"
									key={item.id}
								>
									<div className="hexagon-badge">
										{item.difficulty?.slice(0, 1) || "C"}
									</div>

									<div className="history-item-details">
										<span className="history-item-title">
											{item.title || "Untitled challenge"}
										</span>

										<span className="history-item-status">
											{item.difficulty || "Unspecified difficulty"}
											{" · "}
											{item.status || "Unknown status"}
										</span>
									</div>

									<span className="card-chevron">›</span>
								</div>
							))
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
