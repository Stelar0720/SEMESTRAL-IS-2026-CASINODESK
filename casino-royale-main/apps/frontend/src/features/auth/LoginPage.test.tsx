import { beforeEach, describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LoginPage } from "./LoginPage";
import { useAppStore } from "../../app/store";
import type { UserSession } from "../../app/types";

const cashierSession: UserSession = {
  id: "u-cajero",
  fullName: "Jose Ramos",
  initials: "YR",
  role: "Cajero",
  station: "CAJA-01",
  accessToken: "token"
};

describe("LoginPage", () => {
  beforeEach(() => {
    useAppStore.setState({
      session: null,
      transactions: [],
      alerts: [],
      rtes: [],
      audit: [],
      loginWithCredentials: async () => cashierSession
    });
  });

  it("renders credential fields and demo users", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    expect(screen.getByText("Inicio de sesión")).toBeDefined();
    expect(screen.getByLabelText("Usuario")).toBeDefined();
    expect(screen.getByLabelText("Contraseña")).toBeDefined();
    expect(screen.getByText("cajero")).toBeDefined();
    expect(screen.getByText("oficial")).toBeDefined();
  });

  it("renders brand title", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    expect(screen.getByText("CasinoDesk v3")).toBeDefined();
    expect(screen.getByText("AML/CFT, KYC condicional, RTE, ROS y trazabilidad regulatoria")).toBeDefined();
  });

  it("submits username and password", async () => {
    let receivedUsername = "";
    let receivedPassword = "";
    useAppStore.setState({
      loginWithCredentials: async (username, password) => {
        receivedUsername = username;
        receivedPassword = password;
        return cashierSession;
      }
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    fireEvent.change(screen.getByLabelText("Usuario"), { target: { value: "cajero" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "demo" } });
    fireEvent.click(screen.getByText("Ingresar"));

    await waitFor(() => {
      expect(receivedUsername).toBe("cajero");
      expect(receivedPassword).toBe("demo");
    });
  });

  it("shows invalid credential errors", async () => {
    useAppStore.setState({
      loginWithCredentials: async () => {
        throw new Error("Usuario o contraseña incorrectos.");
      }
    });

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByText("Ingresar"));

    expect(await screen.findByRole("alert")).toHaveTextContent("Usuario o contraseña incorrectos.");
  });
});
