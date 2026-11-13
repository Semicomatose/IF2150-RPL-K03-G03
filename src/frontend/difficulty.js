export const DIFFICULTIES = ["MUDAH", "SEDANG", "SULIT"];

const LABELS = {
	MUDAH: "Easy",
	SEDANG: "Medium",
	SULIT: "Hard"
};

export function difficultyLevel(difficulty) {
	return DIFFICULTIES.indexOf(difficulty) + 1;
}

export function difficultyLabel(difficulty) {
	return LABELS[difficulty] ?? "Unknown";
}
