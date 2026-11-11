import React from "react";
import { createRoot } from "react-dom/client";
import MainPage from "./MainPage.jsx";
import ChallengePage from "./ChallengePage.jsx";

const match = window.location.pathname.match(/^\/challenges\/(\d+)\/?$/);

createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		{match
			? <ChallengePage challengeId={match[1]} />
			: <MainPage />}
	</React.StrictMode>
);
