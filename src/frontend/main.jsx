import React from "react";
import { createRoot } from "react-dom/client";

import MainPage from "./MainPage.jsx";
import ChallengePage from "./ChallengePage.jsx";
import EvaluationPage from "./EvaluationPage.jsx";
import UploadPage from "./UploadPage.jsx";
import LandingPage from "./LandingPage.jsx";
import CreatorEvaluationPage from "./CreatorEvaluationPage.jsx";
import LoginPage from "./LoginPage.jsx";
import SignupPage from "./SignupPage.jsx";
import CreatorDashboard from "./CreatorDashboard.jsx";

const path = window.location.pathname;

const challengeMatch = path.match(/^\/challenges\/(\d+)\/?$/);
const evaluationMatch = path.match(/^\/challenges\/(\d+)\/evaluate\/?$/);
const creatorEvaluationMatch = path.match(/^\/creator\/evaluate\/(\d+)\/?$/);

let page;
if (path === "/welcome") {
	page = <LandingPage />;
} else if (path === "/login") {
	page = <LoginPage />;
} else if (path === "/signup") {
	page = <SignupPage />;
} else if (path === "/create-challenge") {
	page = <UploadPage />;
} else if (path === "/creator" || path === "/creator/") {
	page = <CreatorDashboard />;
} else if (creatorEvaluationMatch) {
	page = (
		<CreatorEvaluationPage challengeId={creatorEvaluationMatch[1]} />
	);
} else if (evaluationMatch) {
	page = <EvaluationPage challengeId={evaluationMatch[1]} />;
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
