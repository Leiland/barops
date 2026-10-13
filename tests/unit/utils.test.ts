import { describe, expect, it } from "vitest";
import { cn } from "../../lib/utils";

describe("cn", () => {
  it("resuelve clases de Tailwind que compiten entre sí", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});
