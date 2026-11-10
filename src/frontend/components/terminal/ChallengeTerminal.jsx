import { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";

import "@xterm/xterm/css/xterm.css";
import "./terminal.css";

export default function ChallengeTerminal({sessionId, height = "400px", wsUrl}) {
	const containerRef = useRef(null);

	useEffect(() => {
		if (!sessionId || !containerRef.current) return;

		const terminal = new Terminal({
			cursorBlink: true,
			convertEol: false,
			fontSize: 14,
			fontFamily: "Consolas, monospace",
			theme: {
				background: "#000000",
				foreground: "#FFFFFF",
				cursor: "#FFFFFF",
				red: "FF8059",
				green: "#44BC44",
				blue: "#2FAFFF",
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
		socket.onopen = () => {
			terminal.writeln("\r\nConnected.");
		};

		socket.onmessage = (event) => {
			try {
				const message = JSON.parse(event.data);

				if (message.type === "output") {
					terminal.write(message.data.replace(/\r?\n/g, "\r\n"));
				}
			} catch {
				terminal.writeln("\r\nInvalid server response.");
			}
		};

		socket.onerror = () => {
			terminal.writeln("\r\n\x1b[31mConnection error.\x1b[0m");
		};

		socket.onclose = () => {
			terminal.writeln("\r\n\x1b[33mTerminal connection closed.\x1b[0m");
		};

		const inputSubscription = terminal.onData((data) => {
			if (socket.readyState == WebSocket.OPEN) {
				socket.send(JSON.stringify({
					type: "input",
					data
				}));
			}
		});

		let resizeTimer;
		const resizeObserver = new ResizeObserver(() => {
			clearTimeout(resizeTimer);
			resizeTimer = setTimeout(() => {
				if (fitAddon) {
					fitAddon.fit();
				}
			}, 50);
		});

		resizeObserver.observe(containerRef.current);

		return () => {
			clearTimeout(resizeTimer);
			resizeObserver.disconnect();
			inputSubscription.dispose();
			socket.close();
			terminal.dispose();
		};
	}, [sessionId, wsUrl]);

	return (
		<div className="challenge-terminal">
			<div className="terminal-header">
				<span className="terminal-title">Terminal</span>
			</div>
			<div ref={containerRef} className="terminal-container" style={{ height }} />
		</div>
	);
}
