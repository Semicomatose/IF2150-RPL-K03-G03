import React from "react";
import "./modals.css";

const EDIT_UNAVAILABLE = "Editing is not available yet";

export default function ProfileModal({ isOpen, onClose, userInfo = {} }) {
	if (!isOpen) return null;

	const rows = [
		{ icon: "username-icon", label: "Username", value: userInfo.username },
		{ icon: "email-icon", label: "Email", value: userInfo.email },
		{ icon: "password-icon", label: "Password", value: "********" }
	];

	return (
		<div className="modal-overlay" onMouseDown={(event) => {
			if (event.target === event.currentTarget) onClose();
		}}>
			<section className="modal-container profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-modal-title">
				<div className="modal-header">
					<h2 id="profile-modal-title">-- Options --</h2>
					<button className="close-modal-btn" onClick={onClose} aria-label="Close options">✕</button>
				</div>
				<div className="modal-body profile-body">
					<div className="profile-picture-column">
						<span className="default-profile-pic" aria-label="Profile picture" role="img"></span>
						<div className="profile-picture-actions">
							<button type="button" className="text-link-btn" disabled title={EDIT_UNAVAILABLE}>Edit</button>
							<button type="button" className="text-link-btn" disabled title="Profile pictures are not available yet">Delete</button>
						</div>
					</div>

					<div className="profile-info-table">
						{rows.map((row) => (
							<div className="profile-row" key={row.label}>
								<div className="profile-row-label">
									<span className="profile-row-icon"><span className={row.icon} aria-hidden="true"></span></span>
									{row.label}
								</div>
								<div className="profile-row-value">
									<strong>{row.value || "Not available"}</strong>
									<button type="button" className="text-link-btn" disabled title={EDIT_UNAVAILABLE}>Edit</button>
								</div>
							</div>
						))}
						{userInfo.role && (
							<div className="profile-row">
								<div className="profile-row-label">
									<span className="profile-row-icon"></span>
									Role
								</div>
								<div className="profile-row-value"><strong>{userInfo.role}</strong></div>
							</div>
						)}
					</div>
				</div>
			</section>
		</div>
	);
}
