// strict mode enabled for highlighting potential problems
import { StrictMode } from "react";

import { createRoot } from "react-dom/client";

// Global CSS
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";

import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<App />
	</StrictMode>
);
