import React from "react";
import { createRoot } from "react-dom/client";

import MainPage from "./MainPage.jsx";
import ChallengePage from "./ChallengePage.jsx";
import LoginPage from "./LoginPage.jsx";
import SignupPage from "./SignupPage.jsx";

const path = window.location.pathname;
const challengeMatch = path.match(/^\/challenges\/(\d+)\/?$/);

let page;
if (path === "/login") {
	page = <LoginPage />;
} else if (path === "/signup") {
	page = <SignupPage />;
} else if (challengeMatch) {
	page = (
		<ChallengePage challengeId={challengeMatch[1]} />
	);
} else {
	page = <MainPage />;
}

createRoot(document.getElementById("root")).render(
	<React.StrictMode>
		{page}
	</React.StrictMode>
);
