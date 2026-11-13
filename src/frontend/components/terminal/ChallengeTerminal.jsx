import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import "./terminal.css";

export default function ChallengeTerminal({ sessionId, height = "400px", wsUrl }) {
	const containerRef = useRef(null);

	useEffect(() => {
		if (!sessionId || !containerRef.current) return undefined;

		const terminal = new Terminal({
			cursorBlink: true,
			convertEol: true,
			fontSize: 14,
			fontFamily: "Consolas, 'Courier New', monospace",
			scrollback: 2000,
			theme: {
				background: "#080a0f",
				foreground: "#e5e7eb",
				cursor: "#e5e7eb",
				red: "#ff8059",
				green: "#44bc44",
				blue: "#2fafff"
			}
		});

		const fitAddon = new FitAddon();
		terminal.loadAddon(fitAddon);
		terminal.open(containerRef.current);
		fitAddon.fit();
		terminal.focus();

		const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
		const socketUrl = wsUrl ?? `${protocol}//${window.location.host}/api/sessions/${sessionId}/terminal`;
		const socket = new WebSocket(socketUrl);

		terminal.writeln("Connecting to challenge terminal...");
		socket.onopen = () => terminal.writeln("\r\nConnected.");
		socket.onmessage = (event) => {
			try {
				const message = JSON.parse(event.data);
				if (message.type === "output" && typeof message.data === "string") {
					terminal.write(message.data);
				}
			} catch {
				terminal.writeln("\r\nInvalid server response.");
			}
		};
		socket.onerror = () => terminal.writeln("\r\n\x1b[31mConnection error.\x1b[0m");
		socket.onclose = (event) => {
			if (event.code !== 1000) terminal.writeln("\r\n\x1b[33mTerminal connection closed.\x1b[0m");
		};

		const inputSubscription = terminal.onData((data) => {
			if (socket.readyState === WebSocket.OPEN) {
				socket.send(JSON.stringify({ type: "input", data }));
			}
		});

		let resizeTimer;
		const resizeObserver = new ResizeObserver(() => {
			window.clearTimeout(resizeTimer);
			resizeTimer = window.setTimeout(() => {
				if (containerRef.current) fitAddon.fit();
			}, 100);
		});
		resizeObserver.observe(containerRef.current);

		return () => {
			window.clearTimeout(resizeTimer);
			resizeObserver.disconnect();
			inputSubscription.dispose();
			if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
				socket.close(1000, "Terminal component unmounted");
			}
			terminal.dispose();
		};
	}, [sessionId, wsUrl]);

	return (
		<div className="challenge-terminal">
			<div className="terminal-header"><span className="terminal-title">Terminal</span></div>
			<div ref={containerRef} className="terminal-container" style={{ height, minHeight: 0 }} />
		</div>
	);
}
