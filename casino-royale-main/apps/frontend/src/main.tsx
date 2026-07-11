import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import { ThemeInitializer } from "./app/ThemeInitializer";
import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeInitializer />
    <RouterProvider router={router} />
  </React.StrictMode>
);
