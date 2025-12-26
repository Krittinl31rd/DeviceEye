import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";
import Home from "../src/pages/Home";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Routes>
      {/* <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="/project/:id" element={<Dashboard />} />
      </Route> */}
      <Route path="/" element={<Home />} />

      {/* <Route path="*" element={<NotFound />} /> */}
    </Routes>
  </BrowserRouter>
);
