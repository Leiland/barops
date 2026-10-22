// @vitest-environment jsdom
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LoginForm } from "@/app/login/login-form";
import { ForgotForm } from "@/app/forgot-password/forgot-form";
import { RegisterForm } from "@/app/register/register-form";

const signIn = vi.hoisted(() => vi.fn());
const push = vi.hoisted(() => vi.fn());
vi.mock("next-auth/react", () => ({ signIn }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); signIn.mockReset(); push.mockReset(); });

describe("formulario de login", () => {
  it("tiene etiquetas y muestra error genérico ante credenciales malas", async () => {
    signIn.mockResolvedValue({ error: "CredentialsSignin" });
    render(createElement(LoginForm));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "nadie@example.test" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "incorrecta" } });
    fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Usuario o contraseña incorrectos.");
    expect(signIn).toHaveBeenCalledWith("credentials", expect.objectContaining({ email: "nadie@example.test", redirect: false }));
  });

  it("deshabilita el botón durante el envío y maneja fallos de conexión", async () => {
    let reject!: (reason: Error) => void;
    signIn.mockReturnValue(new Promise((_resolve, fail) => { reject = fail; }));
    render(createElement(LoginForm));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@example.test" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "alguna-contraseña" } });
    fireEvent.click(screen.getByRole("button", { name: "Ingresar" }));
    expect(screen.getByRole("button", { name: "Ingresando…" })).toBeDisabled();
    reject(new Error("offline"));
    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos conectar");
    await waitFor(() => expect(screen.getByRole("button", { name: "Ingresar" })).toBeEnabled());
  });
});

describe("formulario de recuperación", () => {
  it("muestra el mismo mensaje sin revelar cuentas", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ message: "Si el email corresponde a una cuenta, recibirás instrucciones para restablecer la contraseña." }) }));
    render(createElement(ForgotForm));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "nadie@example.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar instrucciones" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Si el email corresponde");
    vi.unstubAllGlobals();
  });
  it("muestra un error comprensible si falla el servidor", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "No pudimos procesar la solicitud." }) }));
    render(createElement(ForgotForm));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "a@example.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar instrucciones" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos procesar la solicitud.");
  });
});

describe("formulario de registro", () => {
  it("envía exclusivamente email y contraseña y redirige al login", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ message: "Cuenta creada." }) });
    vi.stubGlobal("fetch", fetchMock);
    render(createElement(RegisterForm));

    expect(screen.queryByLabelText(/rol/i)).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: " Nuevo@Example.test " } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "Q7!mZ2@pL9#vX4$" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/login?registered=1"));
    const sent = JSON.parse(String(fetchMock.mock.calls[0][1].body));
    expect(sent).toEqual({ email: "nuevo@example.test", password: "Q7!mZ2@pL9#vX4$" });
    expect(sent).not.toHaveProperty("role");
    expect(sent).not.toHaveProperty("rol");
  });

  it("valida la longitud antes de llamar al servidor", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(createElement(RegisterForm));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "nuevo@example.test" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "muy-corta" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("entre 15 y 128 caracteres");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
