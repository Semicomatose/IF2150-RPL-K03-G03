const range = (prefix, from, to) => Array.from({ length: to - from + 1 }, (_, index) => `${prefix}${String(from + index).padStart(2, "0")}`);

export const legacyTestTitles = {
	"C05-UT01": "package validator rejects non-Buffer and empty input",
	"C05-UT02": "package validator accepts outer ZIP with repo.zip containing repo/.git",
	"C07-UT01": "git session accepts a directory containing .git",
	"C07-UT02": "git session rejects a directory without .git",
	"C07-UT03": "git status and log return successful output",
	"C07-UT04": "git command allowlist rejects unknown commands",
	"C07-UT05": "git add rejects path traversal and option injection",
	"C07-UT06": "git add stages a valid relative file",
	"C07-UT07": "verification returns not-found result when verify.sh is absent",
	"C07-UT08": "verification interprets exit code 100 as passed",
	"C07-UT09": "verification interprets exit code 0 as a valid zero score",
	"C07-UT10": "verification preserves partial scores from exit codes 1 through 99",
	"C07-UT11": "terminal initializes and supports pwd and help",
	"C07-UT12": "terminal blocks attempts to leave repository root",
	"C07-UT13": "terminal rejects malformed input messages"
};

export const manualTestCases = [
	"UC01-TC01", "UC01-TC02",
	"UC02-TC01", "UC02-TC02", "UC02-TC03",
	"UC03-TC01", "UC03-TC02", "UC03-TC03",
	"UC04-TC01", "UC04-TC02"
];

export const classes = [
	{ id: "C01", name: "PembuatTantangan", depth: "Sedang", files: ["backend/repositories/userRepository.js"], testCases: range("C01-UT", 1, 3) },
	{ id: "C02", name: "Pelajar", depth: "Sedang", files: ["backend/repositories/userRepository.js", "backend/services/authService.js"], testCases: range("C02-UT", 1, 4) },
	{ id: "C03", name: "Tantangan", depth: "Sedang", files: ["backend/repositories/challengeRepository.js"], testCases: range("C03-UT", 1, 6) },
	{ id: "C04", name: "WindowEdit", depth: "Sedang", files: ["frontend/UploadPage.jsx"], testCases: ["C04-UT01"] },
	{ id: "C05", name: "EditController", depth: "Mendalam", files: ["frontend/challengeApi.js", "backend/services/challengeSessionService.js"], testCases: range("C05-UT", 1, 10) },
	{ id: "C06", name: "WindowEnvironment", depth: "Sedang", files: ["frontend/ChallengePage.jsx"], testCases: ["C06-UT01"] },
	{
		id: "C07",
		name: "EnvironmentController",
		depth: "Mendalam",
		files: [
			"backend/services/terminalService.js",
			"backend/services/gitService.js",
			"backend/services/challengeVerificationService.js",
			"backend/services/challengeSessionService.js"
		],
		testCases: range("C07-UT", 1, 24)
	},
	{ id: "C08", name: "WindowRiwayat", depth: "Sedang", files: ["frontend/HistoryModal.jsx"], testCases: range("C08-UT", 1, 5) },
	{ id: "C09", name: "RiwayatTantangan", depth: "Sedang", files: ["backend/repositories/challengeRepository.js"], testCases: range("C09-UT", 1, 7) }
];

export const interfaces = [
	{ id: "I-01", name: "Landing Page", boundary: "GET /api/me", files: ["frontend/LandingPage.jsx", "server.js"], testCases: ["INT-TC01"] },
	{ id: "I-02", name: "Signup", boundary: "POST /api/auth/signup -> users", files: ["frontend/SignupPage.jsx", "server.js", "backend/repositories/userRepository.js", "backend/services/authService.js"], testCases: ["INT-TC02", "INT-TC03"] },
	{ id: "I-03", name: "Login", boundary: "POST /api/login -> users", files: ["frontend/LoginPage.jsx", "server.js", "backend/services/authService.js"], testCases: ["INT-TC04", "INT-TC05"] },
	{ id: "I-04", name: "Main Menu", boundary: "GET /api/challenges -> challenges", files: ["frontend/MainPage.jsx", "server.js", "backend/repositories/challengeRepository.js"], testCases: ["INT-TC09"] },
	{ id: "I-05", name: "Filter Challenges Modal", boundary: "difficulty stored by POST /api/challenges and read by GET /api/challenges", files: ["frontend/FilterModal.jsx", "frontend/difficulty.js", "server.js"], testCases: ["INT-TC08"] },
	{ id: "I-06", name: "Profile Options Modal", boundary: "POST /api/logout", files: ["frontend/ProfileModal.jsx", "frontend/AppHeader.jsx", "server.js"], testCases: ["INT-TC13"] },
	{ id: "I-07", name: "History", boundary: "GET /api/history -> attempts", files: ["frontend/HistoryModal.jsx", "server.js", "backend/repositories/challengeRepository.js"], testCases: ["INT-TC12"] },
	{ id: "I-08", name: "Challenge Upload", boundary: "POST /api/challenges -> package validation -> challenges", files: ["frontend/UploadPage.jsx", "frontend/challengeApi.js", "server.js", "backend/services/challengeSessionService.js"], testCases: ["INT-TC06", "INT-TC07"] },
	{ id: "I-09", name: "Challenge Environment", boundary: "POST /api/sessions, terminal WebSocket, submit -> attempts, terminal_history", files: ["frontend/ChallengePage.jsx", "frontend/components/terminal/ChallengeTerminal.jsx", "server.js", "backend/services/terminalService.js", "backend/services/challengeVerificationService.js"], testCases: ["INT-TC11"] },
	{ id: "I-10", name: "Evaluation Environment", boundary: "POST /api/creator/sessions, terminal WebSocket, verify", files: ["frontend/EvaluationPage.jsx", "frontend/CreatorEvaluationPage.jsx", "server.js", "backend/services/challengeVerificationService.js"], testCases: ["INT-TC10"] }
];

export const functionalRequirements = [
	{
		id: "KF01",
		nonFunctional: [],
		useCases: ["UC01"],
		classes: ["C01", "C03", "C04", "C05"],
		files: ["frontend/UploadPage.jsx", "frontend/challengeApi.js", "server.js", "backend/services/challengeSessionService.js", "backend/repositories/challengeRepository.js"],
		testCases: ["UC01-TC01", "UC01-TC02", "UC01-TC03", "UC01-TC04", "C03-UT01", "C04-UT01", ...range("C05-UT", 1, 7), "INT-TC06", "INT-TC07", "INT-TC08"]
	},
	{
		id: "KF02",
		nonFunctional: [],
		useCases: ["UC02"],
		classes: ["C01", "C03", "C06", "C07"],
		files: ["frontend/EvaluationPage.jsx", "frontend/CreatorEvaluationPage.jsx", "frontend/CreatorDashboard.jsx", "frontend/challengeApi.js", "server.js", "backend/services/terminalService.js", "backend/services/challengeVerificationService.js", "backend/repositories/challengeRepository.js"],
		testCases: ["UC02-TC01", "UC02-TC02", "UC02-TC03", "UC02-TC04", "UC02-TC05", "C03-UT04", "C03-UT05", "C03-UT06", "C05-UT08", "C05-UT09", "C05-UT10", ...range("C07-UT", 7, 13), "INT-TC10"]
	},
	{
		id: "KF03",
		nonFunctional: ["KNF01"],
		useCases: ["UC01"],
		classes: ["C03", "C05", "C07"],
		files: ["backend/services/challengeSessionService.js", "backend/services/gitService.js"],
		testCases: ["UC01-TC01", "UC01-TC02", "C07-UT01", "C07-UT02", ...range("C07-UT", 14, 17), "KNF01-TC01", "KNF01-TC02"]
	},
	{
		id: "KF04",
		nonFunctional: [],
		useCases: ["UC03"],
		classes: ["C02", "C06"],
		files: ["frontend/MainPage.jsx", "frontend/FilterModal.jsx", "frontend/ChallengePage.jsx", "frontend/components/terminal/ChallengeTerminal.jsx", "server.js", "backend/repositories/challengeRepository.js", "backend/services/terminalService.js", "backend/services/gitService.js"],
		testCases: ["UC03-TC01", "UC03-TC02", "UC03-TC03", "UC03-TC04", "C03-UT02", "C03-UT03", "C06-UT01", ...range("C07-UT", 3, 6), ...range("C07-UT", 11, 13), ...range("C07-UT", 18, 24), "INT-TC09", "INT-TC11"]
	},
	{
		id: "KF05",
		nonFunctional: [],
		useCases: ["UC03"],
		classes: ["C02", "C07"],
		files: ["frontend/ChallengePage.jsx", "server.js", "backend/services/challengeVerificationService.js", "backend/repositories/challengeRepository.js"],
		testCases: ["UC03-TC01", "UC03-TC04", ...range("C07-UT", 7, 10), ...range("C09-UT", 2, 5), "INT-TC11"]
	},
	{
		id: "KF06",
		nonFunctional: ["KNF02"],
		useCases: ["UC03"],
		classes: ["C02", "C03", "C06", "C07"],
		files: ["frontend/components/terminal/ChallengeTerminal.jsx", "backend/services/terminalService.js", "backend/services/gitService.js", "backend/services/challengeVerificationService.js"],
		testCases: ["UC03-TC01", "UC03-TC04", ...range("C07-UT", 1, 13), ...range("C07-UT", 18, 24), "INT-TC11", "KNF02-TC01"]
	},
	{
		id: "KF07",
		nonFunctional: [],
		useCases: ["UC03"],
		classes: ["C02", "C06", "C07"],
		files: ["frontend/ChallengePage.jsx", "backend/services/challengeVerificationService.js"],
		testCases: ["UC03-TC01", "UC03-TC04", "UC03-TC05", "C07-UT07", "C07-UT08"]
	},
	{
		id: "KF08",
		nonFunctional: [],
		useCases: ["UC03"],
		classes: ["C02", "C06", "C07"],
		files: ["frontend/ChallengePage.jsx", "server.js", "backend/services/challengeSessionService.js", "backend/repositories/challengeRepository.js"],
		testCases: ["UC03-TC01", "UC03-TC05", "C09-UT01"]
	},
	{
		id: "KF09",
		nonFunctional: [],
		useCases: ["UC03"],
		classes: ["C02", "C07", "C09"],
		files: ["server.js", "backend/repositories/challengeRepository.js"],
		testCases: ["UC03-TC01", "UC03-TC05", "UC03-TC06", "C09-UT01"]
	},
	{
		id: "KF10",
		nonFunctional: ["KNF03"],
		useCases: ["UC03"],
		classes: ["C02", "C07", "C09"],
		files: ["backend/repositories/challengeRepository.js", "server.js"],
		testCases: ["UC03-TC01", "UC03-TC05", "C09-UT01", "C09-UT07", "INT-TC11", "KNF03-TC01"]
	},
	{
		id: "KF11",
		nonFunctional: ["KNF04"],
		useCases: ["UC04"],
		classes: ["C01", "C08", "C09"],
		files: ["frontend/CreatorDashboard.jsx", "server.js", "backend/repositories/challengeRepository.js"],
		testCases: ["UC04-TC01", "UC04-TC02", "UC04-TC03", "KNF04-TC01"]
	},
	{
		id: "KF12",
		nonFunctional: ["KNF05"],
		useCases: ["UC04"],
		classes: ["C02", "C08", "C09"],
		files: ["frontend/HistoryModal.jsx", "server.js", "backend/repositories/challengeRepository.js"],
		testCases: ["UC04-TC01", "UC04-TC02", "UC04-TC03", ...range("C08-UT", 1, 3), "C09-UT02", "C09-UT06", "INT-TC12"]
	}
];

export const nonFunctionalRequirements = [
	{
		id: "KNF01",
		parameter: "Security",
		description: "Bila setup script dieksekusi, maka sistem harus mengisolasinya dengan hak akses terbatas agar tidak dieksploitasi malware.",
		functional: ["KF03"],
		components: ["backend/services/challengeSessionService.js"],
		testCases: ["KNF01-TC01", "KNF01-TC02"]
	},
	{
		id: "KNF02",
		parameter: "Reliability",
		description: "Selama pemeriksaan repositori otomatis, sistem harus memproses validasi dengan tingkat ketersediaan tinggi tanpa kegagalan sistem.",
		functional: ["KF06"],
		components: ["backend/services/challengeVerificationService.js"],
		testCases: ["KNF02-TC01"]
	},
	{
		id: "KNF03",
		parameter: "Reliability",
		description: "Sistem harus mampu mencatat dan menyimpan riwayat setiap percobaan dari seluruh Pelajar tanpa kehilangan data.",
		functional: ["KF10"],
		components: ["backend/repositories/challengeRepository.js"],
		testCases: ["KNF03-TC01"]
	},
	{
		id: "KNF04",
		parameter: "Ergonomy",
		description: "Ketika Pembuat Tantangan membuka menu laporan, sistem harus memiliki tampilan antarmuka dashboard yang intuitif agar memudahkan pembuat tantangan dalam membaca hasil Pelajar.",
		functional: ["KF11"],
		components: ["frontend/CreatorDashboard.jsx", "backend/repositories/challengeRepository.js"],
		testCases: ["KNF04-TC01"]
	},
	{
		id: "KNF05",
		parameter: "Compatibility",
		description: "Sistem harus menyediakan fitur ekspor data nilai dan status kelulusan ke dalam format umum, seperti CSV.",
		functional: ["KF12"],
		components: [],
		testCases: [],
		notImplemented: "Belum ada fitur ekspor nilai dan status kelulusan ke CSV di src/."
	}
];
