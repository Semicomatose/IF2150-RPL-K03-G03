import React, { useState } from "react";
import "./modals.css";

export default function FilterModal({ isOpen, onClose, onApplyFilters }) {
	const [difficultyRange, setDifficultyRange] = useState({ min: 4, max: 9 });
	const [searchQuery, setSearchQuery] = useState("");

	if (!isOpen) return null;

	const handleSave = () => {
		if (onApplyFilters) {
			onApplyFilters({ difficultyRange, searchQuery });
		}
		onClose();
	};

	return (
		<div className="modal-overlay">
			<div className="modal-container filter-modal">
				<div className="modal-header">
					<h2>-- Filter Challenges --</h2>
					<button className="close-modal-btn" onClick={onClose}>✕</button>
				</div>
				<div className="modal-body filter-body">
					<div className="filter-group">
						<label>Difficulty</label>
						<div className="range-slider-wrapper">
							<div className="slider-labels">
								<span>{difficultyRange.min}</span>
								<span>{difficultyRange.max}</span>
							</div>
							<div className="slider-track-line">
								<div className="slider-thumb min-thumb"></div>
								<div className="slider-thumb max-thumb"></div>
							</div>
						</div>
					</div>

					<div className="filter-group">
						<label>Name Search</label>
						<div className="search-input-group">
							<span className="search-icon-placeholder"></span>
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
							/>
						</div>
					</div>

					<div className="filter-action-footer">
						<button className="btn-primary" onClick={handleSave}>
							Save Filters
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
