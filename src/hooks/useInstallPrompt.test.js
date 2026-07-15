import { describe, it, expect, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useInstallPrompt } from "./useInstallPrompt";

function makeInstallPromptEvent(outcome = "accepted") {
  const event = new Event("beforeinstallprompt", { cancelable: true });
  event.prompt = vi.fn().mockResolvedValue(undefined);
  event.userChoice = Promise.resolve({ outcome, platform: "" });
  return event;
}

describe("useInstallPrompt", () => {
  it("empieza sin poder instalar", () => {
    const { result } = renderHook(() => useInstallPrompt());
    expect(result.current.canInstall).toBe(false);
  });

  it("puede instalar una vez el navegador dispara beforeinstallprompt", () => {
    const { result } = renderHook(() => useInstallPrompt());
    const event = makeInstallPromptEvent();

    act(() => {
      window.dispatchEvent(event);
    });

    expect(result.current.canInstall).toBe(true);
  });

  it("previene el mini-infobar nativo del navegador", () => {
    renderHook(() => useInstallPrompt());
    const event = makeInstallPromptEvent();
    const preventDefaultSpy = vi.spyOn(event, "preventDefault");

    act(() => {
      window.dispatchEvent(event);
    });

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it("promptInstall() dispara el prompt guardado y limpia el estado al resolver", async () => {
    const { result } = renderHook(() => useInstallPrompt());
    const event = makeInstallPromptEvent("accepted");

    act(() => {
      window.dispatchEvent(event);
    });
    expect(result.current.canInstall).toBe(true);

    let choice;
    await act(async () => {
      choice = await result.current.promptInstall();
    });

    expect(event.prompt).toHaveBeenCalledTimes(1);
    expect(choice).toEqual({ outcome: "accepted", platform: "" });
    expect(result.current.canInstall).toBe(false);
  });

  it("promptInstall() no hace nada si no hay un evento capturado", async () => {
    const { result } = renderHook(() => useInstallPrompt());

    let choice = "not-called";
    await act(async () => {
      choice = await result.current.promptInstall();
    });

    expect(choice).toBeNull();
  });

  it("appinstalled deja canInstall en false", () => {
    const { result } = renderHook(() => useInstallPrompt());
    const event = makeInstallPromptEvent();

    act(() => {
      window.dispatchEvent(event);
    });
    expect(result.current.canInstall).toBe(true);

    act(() => {
      window.dispatchEvent(new Event("appinstalled"));
    });
    expect(result.current.canInstall).toBe(false);
  });
});
