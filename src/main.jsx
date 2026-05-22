import React from "react";
import ReactDOM from "react-dom/client";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./css/styles.css";

import "./js/tomtom-config.js";
import "./js/tomtom-traffic.js";
import "./js/tomtom-routing.js";

import App from "./App.jsx";

window.L = L;

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
