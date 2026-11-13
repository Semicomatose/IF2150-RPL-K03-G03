import React, { useEffect, useState } from "react";
import "./modals.css";

export default function FilterModal({ isOpen, onClose, onApplyFilters, initialQuery = "" }) {
	const [searchQuery, setSearchQuery] = useState(initialQuery);

	useEffect(() => {
		if (isOpen) setSearchQuery(initialQuery);
	}, [isOpen, initialQuery]);

	if (!isOpen) return null;

	function handleSave(event) {
		event.preventDefault();
		onApplyFilters?.({ searchQuery: searchQuery.trim() });
		onClose();
	}

	function clearFilters() {
		setSearchQuery("");
		onApplyFilters?.({ searchQuery: "" });
		onClose();
	}

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
					<div className="filter-group">
						<label htmlFor="challenge-search">Search challenges</label>
						<div className="search-input-group">
							<input
								style={{outline: 0}}
								id="challenge-search"
								type="search"
								value={searchQuery}
								onChange={(event) => setSearchQuery(event.target.value)}
								placeholder="Search by title, description, or creator"
								autoFocus
							/>
						</div>
					</div>
					<div className="filter-action-footer">
						<button type="button" className="btn-secondary" onClick={clearFilters}>Clear</button>
						<button type="submit" className="btn-primary">Apply filters</button>
					</div>
				</form>
			</section>
		</div>
	);
}
