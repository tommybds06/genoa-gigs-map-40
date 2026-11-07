import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registraServiceWorker } from "./lib/notifiche/canale";

// Solo per le notifiche push (public/sw.js): niente cache.
registraServiceWorker();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
