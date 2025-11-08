import { describe, expect, it, vi } from "vitest";
import { copyToClipboard } from "./utils";

describe("copyToClipboard", () => {
  it("should successfully copy text to clipboard", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    const clipboardMock = {
      writeText: writeTextMock,
    };
    // @ts-expect-error - mocking navigator.clipboard
    global.navigator = { clipboard: clipboardMock };

    const result = await copyToClipboard("test text");

    expect(result).toBe(true);
    expect(writeTextMock).toHaveBeenCalledWith("test text");
  });

  it("should return false when clipboard API is not available", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    // @ts-expect-error - mocking navigator.clipboard as undefined
    global.navigator = { clipboard: undefined };

    const result = await copyToClipboard("test text");

    expect(result).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Clipboard API is not available",
    );

    consoleErrorSpy.mockRestore();
  });

  it("should return false and log error when writeText fails", async () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const clipboardError = new Error("Permission denied");
    const writeTextMock = vi.fn().mockRejectedValue(clipboardError);
    const clipboardMock = {
      writeText: writeTextMock,
    };
    // @ts-expect-error - mocking navigator.clipboard
    global.navigator = { clipboard: clipboardMock };

    const result = await copyToClipboard("test text");

    expect(result).toBe(false);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "Failed to copy to clipboard:",
      clipboardError,
    );

    consoleErrorSpy.mockRestore();
  });
});
