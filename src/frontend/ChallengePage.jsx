import React, { useEffect, useState } from "react";
import ChallengeTerminal from "./components/terminal/ChallengeTerminal.jsx";
import AppHeader from "./AppHeader.jsx";
import useChallengeSession from "./useChallengeSession.js";
import { difficultyLabel } from "./difficulty.js";
import "./main-page.css";

export default function ChallengePage({ challengeId }) {
    const { sessionId, setSessionId, error: sessionError } = useChallengeSession(challengeId);
    const [challenge, setChallenge] = useState(null);
    const [error, setError] = useState("");
    const [result, setResult] = useState(null);
    const [busy, setBusy] = useState(false);
    const [showHint, setShowHint] = useState(false);
    const [userInfo, setUserInfo] = useState({ username: "", email: "", role: "" });

    useEffect(() => {
        let active = true;
        async function loadChallenge() {
            try {
                const response = await fetch(`/api/challenges/${challengeId}`, { credentials: "same-origin" });
                if (response.status === 401) {
                    window.location.replace("/login");
                    return;
                }
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || data.message || "Failed to fetch challenge details.");
                if (active) setChallenge(data);
            } catch (err) {
                if (active) setError(err.message);
            }
        }
        loadChallenge();
        return () => { active = false; };
    }, [challengeId]);

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
                if (active) setUserInfo({
                    username: data.user.username || "",
                    email: data.user.email || "",
                    role: data.user.role || ""
                });
            } catch (err) {
                if (active) setError(err.message);
            }
        }
        loadUser();
        return () => { active = false; };
    }, []);

    async function closeCurrentSession() {
        if (!sessionId) return;
        try {
            const response = await fetch(`/api/sessions/${sessionId}`, {
                method: "DELETE",
                credentials: "same-origin"
            });
            if (!response.ok && response.status !== 404) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.error || "Failed to close challenge session.");
            }
        } catch (err) {
            console.error("Failed to close challenge session:", err);
        }
    }

    async function exitChallenge() {
        if (busy) return;
        await closeCurrentSession();
        window.location.assign("/");
    }

    async function submitChallenge() {
        if (!sessionId || busy || result) return;
        setBusy(true);
        setError("");
        try {
            const response = await fetch(`/api/sessions/${sessionId}/submit`, {
                method: "POST",
                credentials: "same-origin"
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to submit challenge.");
            setResult(data.verification);
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    async function restartChallenge() {
        if (!sessionId || busy) return;
        if (!window.confirm("Restart this challenge? Your current attempt will be marked as failed.")) return;

        setBusy(true);
        setError("");
        try {
            const response = await fetch(`/api/sessions/${sessionId}/restart`, {
                method: "POST",
                credentials: "same-origin"
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Failed to restart challenge.");
            setResult(null);
            setSessionId(data.sessionId);
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    }

    const pageError = sessionError || error;
    if (pageError && !sessionId) {
        return <p className="status-message error" role="alert">{pageError}</p>;
    }
    if (!sessionId) {
        return <p className="status-message">Creating challenge session...</p>;
    }

    return (
        <div className="challenge-page-wrapper">
            <AppHeader user={userInfo} />

            <div className="challenge-title-bar">
                <button className="close-btn" aria-label="Exit challenge" onClick={exitChallenge} disabled={busy}>✕</button>
                <h1 className="challenge-title">{challenge ? `-- ${challenge.title} --` : "Loading challenge..."}</h1>
            </div>

            <main className="challenge-content-grid">
                <section className="card-container description-card">
                    <div className="card-header"><h2>Description</h2></div>
                    <div className="card-body">
                        <p className="description-text">{challenge?.description ?? "Loading description..."}</p>
                        <p className="description-text">Difficulty: {challenge ? difficultyLabel(challenge.difficulty) : "..."}</p>
                        {showHint && challenge?.hint && <p className="description-text hint-text">Hint: {challenge.hint}</p>}
                        <div className="description-actions">
                            <button
                                className="text-action-btn"
                                type="button"
                                onClick={() => setShowHint((shown) => !shown)}
                                disabled={!challenge?.hint}
                                title={challenge?.hint ? undefined : "Hints are not available yet"}
                            >
                                {showHint ? "Hide Hint" : "Hint"}
                            </button>
                            <button className="text-action-btn" type="button" onClick={exitChallenge} disabled={busy}>Give Up</button>
                        </div>
                    </div>
                </section>

                <section className="terminal-column">
                    <ChallengeTerminal key={sessionId} sessionId={sessionId} height="min(52vh, 520px)" />
                    {error && <p className="status-message error" role="alert">{error}</p>}
                    {result && (
                        <div className="submission-result">
                            <h3>{result.error ? "Verification error" : result.passed ? "Challenge completed!" : result.score > 0 ? "Challenge partially completed" : "Challenge not completed"}</h3>
                            {result.error ? (
                                <p className="status-message error">{result.error}</p>
                            ) : (
                                <p>Score: {result.score}/100</p>
                            )}
                            <div className="verification-output"><pre>{result.output || "No output."}</pre></div>
                        </div>
                    )}
                    <div className="action-buttons-row">
                        <button className="btn btn-blue" type="button" onClick={restartChallenge} disabled={busy}>
                            {busy ? "Please wait..." : "Restart"}
                        </button>
                        <button className="btn btn-blue" type="button" onClick={submitChallenge} disabled={busy || !!result}>
                            {busy ? "Please wait..." : result ? "Submitted" : "Submit"}
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
}
