import React from "react";
import HexBadge from "./HexBadge.jsx";
import { difficultyLabel, difficultyLevel } from "./difficulty.js";
import "./modals.css";

const STATUS_LABELS = {
	SELESAI: "Finished",
	GAGAL: "Failed",
	BERLANGSUNG: "On Progress"
};

const CHALLENGE_STATUS_LABELS = {
	DRAF: "Not Published",
	TERPUBLIKASI: "Published",
	DIJADWALKAN_HAPUS: "Scheduled for Deletion"
};

function formatDate(date) {
	if (!date) return "";

	const parsed = new Date(date);
	if (Number.isNaN(parsed.getTime())) return "";

	return parsed.toLocaleString(undefined, {
		year: "2-digit",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit"
	});
}

export default function HistoryModal({
	isOpen,
	onClose,
	historyList = [],
	challenges = [],
	loading = false,
	error = ""
}) {
	if (!isOpen) return null;

	const challengeById = new Map(challenges.map((challenge) => [String(challenge.id), challenge]));
	const userChallenges = challenges.filter((challenge) => challenge.isUserCreated);

	function renderList(items, emptyMessage, renderItem) {
		if (loading) return <p className="history-empty">Loading history...</p>;
		if (error) return <p className="history-empty error" role="alert">{error}</p>;
		if (items.length === 0) return <p className="history-empty">{emptyMessage}</p>;
		return items.map(renderItem);
	}

	return (
		<div className="modal-overlay history-overlay" role="dialog" aria-modal="true" aria-label="History">
			<div className="history-top-bar">
				<button className="close-modal-btn white-close" onClick={onClose} aria-label="Close history">✕</button>
			</div>

			<div className="history-content-wrapper">
				<div className="history-column">
					<h2 className="history-section-title">Challenge History</h2>

					<div className="history-list-box">
						{renderList(historyList, "You haven't attempted any challenges yet.", (item) => {
							const difficulty = challengeById.get(String(item.challengeId))?.difficulty;
							return (
								<a className="history-row-item" key={item.id} href={`/challenges/${item.challengeId}`}>
									<HexBadge value={difficultyLevel(difficulty) || "?"} title={difficultyLabel(difficulty)} />
									<span className="history-item-title">{item.title || "Untitled challenge"}</span>
									<span className="history-item-status">
										{STATUS_LABELS[item.status] ?? item.status}
										{item.status !== "BERLANGSUNG" && ` (${item.score ?? 0})`}
										{" "}
										<span className="history-item-date">{formatDate(item.submittedAt || item.startedAt)}</span>
									</span>
									<span className="card-chevron">›</span>
								</a>
							);
						})}
					</div>
				</div>

				<div className="history-column">
					<h2 className="history-section-title">Your Challenges</h2>

					<div className="history-list-box">
						{renderList(userChallenges, "You haven't created any challenges yet.", (item) => (
							<a className="history-row-item" key={item.id} href={`/challenges/${item.id}/evaluate`}>
								<HexBadge value={difficultyLevel(item.difficulty) || "?"} title={difficultyLabel(item.difficulty)} />
								<span className="history-item-title">{item.title || "Untitled challenge"}</span>
								<span className="history-item-status">{CHALLENGE_STATUS_LABELS[item.status] ?? item.status}</span>
								<span className="card-chevron">›</span>
							</a>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
