import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { useAppStore } from "./store";
import { router } from "./router";

describe("router", () => {
  beforeEach(() => {
    useAppStore.setState({ session: null });
  });

  it("has auth route pointing to LoginPage", () => {
    const memoryRouter = createMemoryRouter(router.routes, {
      initialEntries: ["/auth"]
    });
    render(<RouterProvider router={memoryRouter} />);
    expect(screen.getByText("CasinoDesk v3")).toBeDefined();
  });

  it("redirects to /auth when not authenticated", () => {
    const memoryRouter = createMemoryRouter(router.routes, {
      initialEntries: ["/"]
    });
    render(<RouterProvider router={memoryRouter} />);
    expect(screen.getByText("CasinoDesk v3")).toBeDefined();
  });
});
