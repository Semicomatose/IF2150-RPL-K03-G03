import React, { useEffect, useState } from "react";
import "./main-page.css";

const styles = `
.creator-page {min-height:100vh;background:#0b0c10;color:#e5e7eb;font-family:monospace;padding-bottom:48px}
.creator-wrap {width:min(1180px,94%);margin:32px auto}
.creator-top {display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap}
.creator-top h1 {font-size:22px;font-weight:400}
.creator-back,.creator-action {border:1px solid #354052;background:#11151e;color:#e5e7eb;padding:9px 13px;border-radius:5px;text-decoration:none;font:inherit;cursor:pointer}
.creator-action.primary {background:#0284c7;border-color:#0284c7;color:white}
.creator-action.danger {border-color:#854d4d;color:#fecaca}
.creator-grid {display:grid;grid-template-columns:minmax(280px, .85fr) minmax(0,1.5fr);gap:20px;margin-top:24px}
.creator-panel {background:#10131b;border:1px solid #252b38;border-radius:8px;padding:18px;min-width:0}
.creator-panel h2 {font-size:16px;font-weight:400;margin:0 0 16px}
.creator-list {display:flex;flex-direction:column;gap:10px}
.creator-item {border:1px solid #303747;border-radius:6px;padding:13px;background:#0b0e15;text-align:left;color:inherit;cursor:pointer;font:inherit}
.creator-item.selected {border-color:#38bdf8}
.creator-item strong {display:block;color:#fff;margin-bottom:7px}
.creator-muted {color:#94a3b8;font-size:12px}
.creator-status {display:inline-block;border:1px solid #3c4658;border-radius:20px;padding:3px 8px;font-size:11px;margin-top:8px}
.creator-form {display:grid;gap:10px;margin-bottom:18px}
.creator-form input, .creator-form textarea, .creator-form select {width:100%;box-sizing:border-box;background:#080b11;border:1px solid #343b4b;border-radius:5px;padding:10px;color:#fff;font:inherit}
.creator-form textarea {min-height:80px;resize:vertical}
.creator-actions {display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.creator-metrics {display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:14px 0}
.creator-metric {background:#0b0e15;border:1px solid #2a3140;border-radius:6px;padding:12px}
.creator-metric b {display:block;font-size:20px;color:#fff}
.creator-metric span {font-size:11px;color:#94a3b8}
.creator-table-wrap {overflow-x:auto}
.creator-table {width:100%;border-collapse:collapse;font-size:12px}
.creator-table th, .creator-table td {text-align:left;padding:10px;border-bottom:1px solid #252b38;white-space:nowrap}
.creator-table th {color:#94a3b8;font-weight:400}
.creator-error {color:#fca5a5}
.creator-success {color:#86efac}
.creator-empty {color:#94a3b8;font-size:13px;padding:12px 0}
@media (max-width:800px) {
.creator-grid {grid-template-columns:1fr}
.creator-metrics {grid-template-columns:repeat(2,minmax(0,1fr))}
}
`;

async function api(url, options = {}) {
	const response = await fetch(url, { credentials: "same-origin", ...options, headers: { ...(options.headers || {}), ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}) } });
	const data = await response.json().catch(() => ({}));
	if (!response.ok) throw new Error(data.error || data.message || "Request failed.");
	return data;
}

export default function CreatorDashboard() {
	const [items, setItems] = useState([]);
	const [selected, setSelected] = useState(null);
	const [attemptData, setAttemptData] = useState(null);
	const [edit, setEdit] = useState({ title: "", description: "", difficulty: "SEDANG" });
	const [loading, setLoading] = useState(true);
	const [busy, setBusy] = useState(false);
	const [message, setMessage] = useState("");
	const [error, setError] = useState("");

	async function loadChallenges(selectId = null) {
		const data = await api("/api/creator/challenges");
		setItems(data);
		const current = data.find(item => String(item.id) === String(selectId)) || data.find(item => String(item.id) === String(selected?.id)) || data[0] || null;
		setSelected(current);
		if (current) setEdit({ title: current.title, description: current.description, difficulty: current.difficulty });
		else setAttemptData(null);
		return current;
	}

	async function loadAttempts(challenge) {
		if (!challenge) return setAttemptData(null);
		try { setAttemptData(await api(`/api/creator/challenges/${challenge.id}/attempts`)); }
		catch (err) { setError(err.message); }
	}

	useEffect(() => {
		let alive = true;
		(async () => {
			try {
				const me = await api("/api/me");
				if (me.user?.role !== "PEMBUAT") { window.location.replace("/"); return; }
				const data = await api("/api/creator/challenges");
				if (alive) { setItems(data); setSelected(data[0] || null); if (data[0]) setEdit({ title: data[0].title, description: data[0].description, difficulty: data[0].difficulty }); }
			} catch (err) { if (alive) setError(err.message); }
			finally { if (alive) setLoading(false); }
		})();
		return () => { alive = false; };
	}, []);

	useEffect(() => { loadAttempts(selected); }, [selected?.id]);

	async function runAction(action) {
		if (!selected) return;
		setBusy(true); setError(""); setMessage("");
		try {
			if (action === "save") {
				await api(`/api/creator/challenges/${selected.id}`, { method: "PUT", body: JSON.stringify(edit) });
				setMessage("Challenge details saved.");
			} else {
				const labels = {
					publish: "Publish this challenge? Students will be able to start attempts.",
					unpublish: "Unpublish this challenge? Students will no longer be able to start new attempts.",
					"schedule-delete": "Mark this challenge for deletion? It will be hidden from students."
				};

				if (!window.confirm(labels[action])) return;
				await api(`/api/creator/challenges/${selected.id}/${action}`, { method: "POST" });
				setMessage(action === "schedule-delete" ?
					"Challenge marked for deletion." :
					`Challenge ${action === "publish" ?
						"published" : "unpublished"
					}.`);
			}
			const current = await loadChallenges(selected.id);
			await loadAttempts(current);
		} catch (err) {
			setError(err.message);
		} finally {
			setBusy(false);
		}
	}

	return <div className="creator-page"><style>{styles}</style>
			   <header className="main-header">
				   <a href="/" className="header-brand">
					   <img src="../assets/logo.svg" className="logo-icon"></img>
					   <span className="logo-text">commitment<strong>Issues</strong></span>
				   </a>
				   <a href="/" className="creator-back">Back to challenges</a>
			   </header>
			   <main className="creator-wrap">
				   <div className="creator-top">
					   <h1>Challenge Management</h1>
					   <span className="creator-muted">Creator workspace</span>
					</div>
					{error && <p className="creator-error" role="alert">{error}</p>}
					{message && <p className="creator-success">{message}</p>}
					{loading ?
					<p className="creator-muted">Loading your challenges...</p> :
					<div className="creator-grid">
						<section className="creator-panel">
							<h2>Your challenges ({items.length})</h2>
							<div className="creator-list">
								{items.map(item =>
									<button
										key={item.id}
										className={`creator-item ${selected?.id === item.id ? "selected" : ""}`}
										onClick={() => { setSelected(item); setEdit({ title: item.title, description: item.description, difficulty: item.difficulty }); }}>
										<strong>{item.title}</strong>
										<span className="creator-muted">{item.attemptCount} attempts · {item.difficulty}</span>
										<br/>
										<span className="creator-status">{item.status === "TERPUBLIKASI" ? "Published" : item.status === "DIJADWALKAN_HAPUS" ? "Pending deletion" : "Draft"}</span>
									</button>)}
						 {!items.length && <p className="creator-empty">No challenges yet. Use the upload button on the main page to create one.</p>}
					 </div>
				 </section>
				 <section className="creator-panel">
					 <h2>Challenge details &amp; attempts</h2>
					{!selected ? <p className="creator-empty">Select a challenge to view its details and attempt data.</p> : <>
						<form className="creator-form" onSubmit={event => { event.preventDefault(); runAction("save"); }}>
							<label className="creator-muted">
								Title <input
										  maxLength={50}
										  required
										  value={edit.title}
										  onChange={event => setEdit({ ...edit, title: event.target.value })}
									  />
							</label>
							<label className="creator-muted">
								Description <textarea
												required
												value={edit.description || ""}
												onChange={event => setEdit({ ...edit, description: event.target.value })}
											/>
							</label>
							<label className="creator-muted">
								Difficulty <select
											   value={edit.difficulty}
											   onChange={event => setEdit({ ...edit, difficulty: event.target.value })}>
											   <option value="MUDAH">Easy</option>
											   <option value="SEDANG">Medium</option>
											   <option value="SULIT">Hard</option>
										   </select>
							</label>
							<div className="creator-actions">
								<button
									className="creator-action primary"
									disabled={busy || selected.status === "DIJADWALKAN_HAPUS"}>
									Save changes
								</button>
								{selected.status === "TERPUBLIKASI" ?
								 <button
									 type="button"
									 className="creator-action"
									 disabled={busy}
									 onClick={() => runAction("unpublish")}>
									 Unpublish
								 </button> :
								 <button
									 type="button"
									 className="creator-action primary"
									 disabled={busy || selected.status === "DIJADWALKAN_HAPUS"}
									 onClick={() => runAction("publish")}>
									 Publish
								 </button>}
								{selected.status !== "DIJADWALKAN_HAPUS" &&
								 <button
									 type="button"
									 className="creator-action danger"
									 disabled={busy}
									 onClick={() => runAction("schedule-delete")}>
									 Schedule deletion
								 </button>}
							</div>
						</form>
						<h2>Attempt overview</h2>
							 <div className="creator-metrics">
								 {
									 [
										 { label: "Total", value: attemptData?.total ?? "—" },
										 { label: "Completed", value: attemptData?.completed ?? "—" },
										 { label: "Failed", value: attemptData?.failed ?? "—" },
										 { label: "Average score", value: attemptData?.averageScore ?? "—" }
									 ].map(metric =>
										 <div className="creator-metric"
											  key={metric.label}>
											 <b>{metric.value}</b><span>{metric.label}</span>
										 </div>)
								 }
							 </div>
								 <div className="creator-table-wrap">
									 <table className="creator-table">
										 <thead>
											 <tr>
												 <th>Student</th>
												 <th>Status</th>
												 <th>Score</th>
												 <th>Started</th>
												 <th>Submitted</th>
											 </tr>
										 </thead>
										 <tbody>
											 {(attemptData?.attempts || []).map(attempt =>
												 <tr key={attempt.id}>
													 <td>{attempt.student}</td>
													 <td>{attempt.status}</td>
													 <td>{attempt.score}</td>
													 <td>{attempt.startedAt ? new Date(attempt.startedAt).toLocaleString() : "—"}</td>
													 <td>{attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : "—"}</td>
												 </tr>)}
										 </tbody>
									 </table>
									 {attemptData && !attemptData.attempts.length && <p className="creator-empty">No attempts have been recorded for this challenge.</p>}
								 </div>
					</>}
				</section>
			</div>}
		</main>
	</div>;
}
