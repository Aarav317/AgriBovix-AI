// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { UploadPanel } from "./UploadPanel";
import { api, ApiError } from "../services/api";
vi.mock("../hooks/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "test", name: "Test Farmer", email: "test@example.test" },
  }),
}));
beforeEach(() => {
  URL.createObjectURL = vi.fn(() => "blob:test-preview");
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
function setup() {
  render(
    <MemoryRouter initialEntries={["/pashuvision/scan?task=health"]}>
      <UploadPanel workspace="pashuvision" />
    </MemoryRouter>,
  );
  return screen.getByLabelText("Upload an animal image");
}
describe("Image upload workflow", () => {
  it("previews a selected file, sends the correct workspace/task, and shows an honest unavailable error", async () => {
    const analyze = vi
      .spyOn(api, "analyze")
      .mockRejectedValue(
        new ApiError(
          503,
          "model_unavailable",
          "Image analysis is not connected yet. No prediction has been made.",
        ),
      );
    const input = setup();
    const file = new File(["test image content"], "animal.png", {
      type: "image/png",
    });
    fireEvent.change(input, { target: { files: [file] } });
    expect(
      screen.getByAltText("Selected animal for analysis").getAttribute("src"),
    ).toBe("blob:test-preview");
    fireEvent.click(screen.getByRole("button", { name: "Analyze Image" }));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toContain(
        "No prediction has been made",
      ),
    );
    expect(analyze).toHaveBeenCalledWith("pashuvision", file, "health");
    expect(screen.queryByText("AI PREDICTION · REQUIRES REVIEW")).toBeNull();
  });
  it("rejects unsupported files before creating a preview", () => {
    const input = setup();
    fireEvent.change(input, {
      target: {
        files: [
          new File(["x"], "bad.exe", { type: "application/octet-stream" }),
        ],
      },
    });
    expect(screen.getByRole("alert").textContent).toContain(
      "JPG, PNG, or WebP",
    );
    expect(screen.queryByAltText("Selected animal for analysis")).toBeNull();
  });
  it("rejects images above 8 MB", () => {
    const input = setup();
    fireEvent.change(input, {
      target: {
        files: [
          new File([new Uint8Array(8 * 1024 * 1024 + 1)], "big.png", {
            type: "image/png",
          }),
        ],
      },
    });
    expect(screen.getByRole("alert").textContent).toContain("too large");
  });
  it("removes the preview and releases its object URL", () => {
    const input = setup();
    fireEvent.change(input, {
      target: { files: [new File(["x"], "cow.png", { type: "image/png" })] },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Remove selected image" }),
    );
    expect(screen.queryByAltText("Selected animal for analysis")).toBeNull();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:test-preview");
  });
});
