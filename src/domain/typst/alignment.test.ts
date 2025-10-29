import { describe, expect, it } from "vitest";
import {
  ALIGN_AUTO,
  type Align,
  DEFAULT_ALIGN,
  formatAlign,
} from "./alignment";

describe("formatAlign", () => {
  it('should return "horizontal + vertical" when both are provided', () => {
    const align: Align = { horizontal: "left", vertical: "top" };
    expect(formatAlign(align)).toBe("left + top");
  });

  it('should return "horizontal + vertical" for another combination of values', () => {
    const align: Align = { horizontal: "center", vertical: "bottom" };
    expect(formatAlign(align)).toBe("center + bottom");
  });

  it("should return only the horizontal value when only horizontal is provided", () => {
    const align: Align = { horizontal: "right" };
    expect(formatAlign(align)).toBe("right");
  });

  it("should return only the vertical value when only vertical is provided", () => {
    const align: Align = { vertical: "horizon" };
    expect(formatAlign(align)).toBe("horizon");
  });

  it("should return ALIGN_AUTO when the align object is empty", () => {
    const align: Align = {};
    expect(formatAlign(align)).toBe(ALIGN_AUTO);
  });

  it("should return ALIGN_AUTO when DEFAULT_ALIGN is passed", () => {
    expect(formatAlign(DEFAULT_ALIGN)).toBe(ALIGN_AUTO);
  });
});
