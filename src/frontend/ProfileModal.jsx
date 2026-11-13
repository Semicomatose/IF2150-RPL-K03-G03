import React from "react";
import "./modals.css";

export default function ProfileModal({ isOpen, onClose, userInfo = {} }) {
	if (!isOpen) return null;

	return (
		<div className="modal-overlay" onMouseDown={(event) => {
			if (event.target === event.currentTarget) onClose();
		}}>
			<section className="modal-container profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
				<div className="modal-header">
					<h2 id="profile-modal-title">-- Account --</h2>
					<button className="close-modal-btn" onClick={onClose} aria-label="Close account details">✕</button>
				</div>
				<div className="modal-body profile-body profile-body-readonly">
					<div className="profile-info-table">
						<div className="profile-row">
							<div className="profile-row-label">Username</div>
							<div className="profile-row-value">{userInfo.username || "Not available"}</div>
						</div>
						<div className="profile-row">
							<div className="profile-row-label">Email</div>
							<div className="profile-row-value">{userInfo.email || "Not available"}</div>
						</div>
						<div className="profile-row">
							<div className="profile-row-label">Role</div>
							<div className="profile-row-value">{userInfo.role || "Not available"}</div>
						</div>
						<p className="profile-readonly-note">Account details are read-only.</p>
					</div>
				</div>
			</section>
		</div>
	);
}
