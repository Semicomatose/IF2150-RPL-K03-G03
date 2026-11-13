import React, { useEffect, useState } from "react";
import { DIFFICULTIES, difficultyLabel } from "./difficulty.js";
import "./modals.css";

export const DEFAULT_FILTERS = {
	searchQuery: "",
	minDifficulty: 1,
	maxDifficulty: DIFFICULTIES.length
};

export default function FilterModal({ isOpen, onClose, onApplyFilters, initialFilters = DEFAULT_FILTERS }) {
	const [filters, setFilters] = useState(initialFilters);

	useEffect(() => {
		if (isOpen) setFilters(initialFilters);
	}, [isOpen, initialFilters]);

	if (!isOpen) return null;

	function updateFilter(key, value) {
		setFilters((current) => ({ ...current, [key]: value }));
	}

	function handleSave(event) {
		event.preventDefault();
		onApplyFilters?.({ ...filters, searchQuery: filters.searchQuery.trim() });
		onClose();
	}

	function clearFilters() {
		onApplyFilters?.(DEFAULT_FILTERS);
		onClose();
	}

	const max = DIFFICULTIES.length;
	const rangeStart = ((filters.minDifficulty - 1) / (max - 1)) * 100;
	const rangeEnd = ((filters.maxDifficulty - 1) / (max - 1)) * 100;

	return (
		<div className="modal-overlay" onMouseDown={(event) => {
			if (event.target === event.currentTarget) onClose();
		}}>
			<section className="modal-container filter-modal" role="dialog" aria-modal="true" aria-labelledby="filter-modal-title">
				<div className="modal-header">
					<h2 id="filter-modal-title">-- Filter Challenges --</h2>
					<button className="close-modal-btn" onClick={onClose} aria-label="Close filters">✕</button>
				</div>
				<form className="modal-body filter-body" onSubmit={handleSave}>
					<div className="filter-row">
						<span className="filter-row-label" id="difficulty-label">Difficulty</span>
						<div className="dual-range" style={{ "--range-start": `${rangeStart}%`, "--range-end": `${rangeEnd}%` }}>
							<div className="dual-range-track"></div>
							<input
								type="range"
								min="1"
								max={max}
								value={filters.minDifficulty}
								onChange={(event) => updateFilter("minDifficulty", Math.min(Number(event.target.value), filters.maxDifficulty))}
								aria-labelledby="difficulty-label"
								aria-valuetext={difficultyLabel(DIFFICULTIES[filters.minDifficulty - 1])}
							/>
							<input
								type="range"
								min="1"
								max={max}
								value={filters.maxDifficulty}
								onChange={(event) => updateFilter("maxDifficulty", Math.max(Number(event.target.value), filters.minDifficulty))}
								aria-labelledby="difficulty-label"
								aria-valuetext={difficultyLabel(DIFFICULTIES[filters.maxDifficulty - 1])}
							/>
							<div className="dual-range-ticks">
								{DIFFICULTIES.map((difficulty, index) => (
									<span key={difficulty} className={index + 1 >= filters.minDifficulty && index + 1 <= filters.maxDifficulty ? "active" : ""}>
										{index + 1} · {difficultyLabel(difficulty)}
									</span>
								))}
							</div>
						</div>
					</div>

					<div className="filter-row">
						<label className="filter-row-label" htmlFor="challenge-search">Name Search</label>
						<div className="search-input-group">
							<span className="magnifying-glass-icon search-icon" aria-hidden="true"></span>
							<input
								style={{outline: 0}}
								id="challenge-search"
								type="search"
								value={filters.searchQuery}
								onChange={(event) => updateFilter("searchQuery", event.target.value)}
								autoFocus
							/>
						</div>
					</div>

					<div className="filter-action-footer">
						<button type="button" className="btn-secondary" onClick={clearFilters}>Clear</button>
						<button type="submit" className="btn-primary">Save Filters</button>
					</div>
				</form>
			</section>
		</div>
	);
}
