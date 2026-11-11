import React from "react";
import "./modals.css";

export default function ProfileModal({ isOpen, onClose, userInfo = {} }) {
	if (!isOpen) return null;

	return (
		<div className="modal-overlay">
			<div className="modal-container profile-modal">
				<div className="modal-header">
					<h2>-- Options --</h2>
					<button className="close-modal-btn" onClick={onClose}>✕</button>
				</div>
				<div className="modal-body profile-body">
					<div className="profile-avatar-section">
						<div className="large-avatar-circle" />
						<div className="profile-action-links">
							<button className="text-link">Edit</button>
							<button className="text-link">Delete</button>
						</div>
					</div>

					<div className="profile-info-table">
						<div className="profile-row">
							<div className="profile-row-label">
								<span className="icon-placeholder"></span> Username
							</div>
							<div className="profile-row-value">
								<span>{userInfo.username || "Username"}</span>
								<button className="edit-link">Edit</button>
							</div>
						</div>

						<div className="profile-row">
							<div className="profile-row-label">
								<span className="icon-placeholder"></span> Email
							</div>
							<div className="profile-row-value">
								<span>{userInfo.email || "lorem@ipsum.com"}</span>
								<button className="edit-link">Edit</button>
							</div>
						</div>

						<div className="profile-row">
							<div className="profile-row-label">
								<span className="icon-placeholder"></span> Password
							</div>
							<div className="profile-row-value">
								<span>********</span>
								<button className="edit-link">Edit</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
