import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter , Routes, Route } from "react-router-dom";
import "./index.css";
import Home from "../src/pages/Home";
import { Toaster } from "sonner";

ReactDOM.createRoot(document.getElementById("root")).render(
  <HashRouter >
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
    <Toaster richColors closeButton position="top-right" />
  </HashRouter >
);
