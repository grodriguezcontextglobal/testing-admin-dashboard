import { describe, it, expect, vi } from "vitest";
import { act, render, renderHook, screen } from "@testing-library/react";
import {
  InstallPromptProvider,
  useInstallPromptContext,
} from "./useInstallPromptContext";

function TwoConsumers() {
  const a = useInstallPromptContext();
  const b = useInstallPromptContext();
  return (
    <>
      <span data-testid="a">{String(a.canInstall)}</span>
      <span data-testid="b">{String(b.canInstall)}</span>
    </>
  );
}

function makeInstallPromptEvent(outcome = "accepted") {
  const event = new Event("beforeinstallprompt", { cancelable: true });
  event.prompt = vi.fn().mockResolvedValue(undefined);
  event.userChoice = Promise.resolve({ outcome, platform: "" });
  return event;
}

describe("useInstallPromptContext", () => {
  it("lanza un error si se usa fuera de InstallPromptProvider", () => {
    const { result } = renderHook(() => {
      try {
        return useInstallPromptContext();
      } catch (error) {
        return error;
      }
    });

    expect(result.current).toBeInstanceOf(Error);
    expect(result.current.message).toBe(
      "useInstallPromptContext must be used within an InstallPromptProvider",
    );
  });

  it("expone canInstall/promptInstall dentro del provider", () => {
    const { result } = renderHook(() => useInstallPromptContext(), {
      wrapper: InstallPromptProvider,
    });

    expect(result.current.canInstall).toBe(false);

    act(() => {
      window.dispatchEvent(makeInstallPromptEvent());
    });

    expect(result.current.canInstall).toBe(true);
  });

  it("comparte una sola instancia entre varios consumidores", () => {
    render(
      <InstallPromptProvider>
        <TwoConsumers />
      </InstallPromptProvider>,
    );

    act(() => {
      window.dispatchEvent(makeInstallPromptEvent());
    });

    expect(screen.getByTestId("a")).toHaveTextContent("true");
    expect(screen.getByTestId("b")).toHaveTextContent("true");
  });
});
