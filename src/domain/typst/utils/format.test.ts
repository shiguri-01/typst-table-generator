import { describe, expect, it } from "vitest";

import { addIndent, escapeSet, formatFunction, isEscaped } from "./format";

describe("isEscaped", () => {
  it("returns false when index is at the start of the string", () => {
    expect(isEscaped("abc", 0)).toBe(false);
  });

  it("returns true when preceded by a single backslash", () => {
    expect(isEscaped("\\n", 1)).toBe(true);
  });

  it("returns false when preceded by two backslashes", () => {
    expect(isEscaped("\\\\n", 2)).toBe(false);
  });

  it("treats newline characters as escaped with an odd backslash count", () => {
    const source = "line\\\ncontinued";
    expect(isEscaped(source, source.indexOf("\n"))).toBe(true);
  });

  it("treats newline characters as unescaped with an even backslash count", () => {
    const source = "line\\\\\ncontinued";
    expect(isEscaped(source, source.indexOf("\n"))).toBe(false);
  });

  it("counts only contiguous backslashes before the index", () => {
    const source = "\\a\\\\b";
    expect(isEscaped(source, source.indexOf("b"))).toBe(false);
  });

  it("unescaped backslash", () => {
    const source = "\\";
    expect(isEscaped(source, 0)).toBe(false);
  });

  it("escaped backslash", () => {
    const source = "\\\\";
    expect(isEscaped(source, 1)).toBe(true);
  });
});

describe("escapeSet", () => {
  describe("single character patterns", () => {
    it("should escape target characters correctly", () => {
      const set = new Set(["*", "_"]);
      expect(escapeSet("hello*world", set)).toBe("hello\\*world");
      expect(escapeSet("_test_", set)).toBe("\\_test\\_");
    });

    it("should not re-escape already escaped characters", () => {
      const set = new Set(["*"]);
      expect(escapeSet("hello\\*world", set)).toBe("hello\\*world");
    });
  });

  describe("multi-character patterns", () => {
    it("should escape \\n by escaping only the first character (backslash)", () => {
      const set = new Set(["\\n"]);
      expect(escapeSet("line1\\nline2", set)).toBe("line1\\\\nline2");
    });

    it("should not re-escape already escaped \\n", () => {
      const set = new Set(["\\n"]);
      expect(escapeSet("line1\\\\nline2", set)).toBe("line1\\\\nline2");
    });

    it("should escape // by escaping only the first slash", () => {
      const set = new Set(["//"]);
      expect(escapeSet("http://example.com", set)).toBe("http:\\//example.com");
    });

    it("should not re-escape already escaped //", () => {
      const set = new Set(["//"]);
      expect(escapeSet("http:\\/\\/example.com", set)).toBe(
        "http:\\/\\/example.com",
      );
    });

    it("should handle multiple different patterns", () => {
      const set = new Set(["\\n", "//"]);
      expect(escapeSet("line1\\nline2//comment", set)).toBe(
        "line1\\\\nline2\\//comment",
      );
    });
  });

  describe("backslash escaping", () => {
    it("should escape single backslash when \\ is in the set", () => {
      const set = new Set(["\\"]);
      expect(escapeSet("path\\to\\file", set)).toBe("path\\\\to\\\\file");
    });

    describe("known limitations with backslash pattern", () => {
      it("should correctly escape single unescaped backslash", () => {
        const set = new Set(["\\"]);
        // 1つのバックスラッシュは正しくエスケープされる
        expect(escapeSet("\\", set)).toBe("\\\\");
      });

      it("cannot distinguish already-escaped backslash due to sequential processing", () => {
        const set = new Set(["\\"]);
        // "\\\\"（2つのバックスラッシュ）が来た場合、
        // - 1文字目はエスケープされていないバックスラッシュ
        // - 2文字目は（1文字目により）エスケープされているバックスラッシュ
        // と解釈される。
        // 結果、1文字目をエスケープするためのバックスラッシュが付与されて、3つのバックスラッシュが出力される。
        // 本来はエスケープ済みのバックスラッシュ（=バックスラッシュ2つ）として扱い、2つのバックスラッシュが出力されるべきである。
        expect(escapeSet("\\\\", set)).toBe("\\\\\\");
      });
    });
  });

  describe("pattern matching priority", () => {
    it("should match patterns in the order specified in the set", () => {
      // Setは挿入順を保持するので、最初にマッチしたものが優先される
      const set = new Set(["\\n", "\\"]);
      expect(escapeSet("test\\n", set)).toBe("test\\\\n");
    });

    it("should match single char when multi-char pattern does not match", () => {
      const set = new Set(["\\n", "\\"]);
      expect(escapeSet("test\\t", set)).toBe("test\\\\t"); // \tは\nにマッチしないので\にマッチ
    });
  });

  describe("consecutive patterns", () => {
    it("should escape multiple consecutive patterns", () => {
      const set = new Set(["\\n"]);
      expect(escapeSet("\\n\\n\\n", set)).toBe("\\\\n\\\\n\\\\n");
    });
  });

  describe("edge cases", () => {
    it("should handle empty strings", () => {
      const set = new Set(["*"]);
      expect(escapeSet("", set)).toBe("");
    });

    it("should return the string as-is when no patterns match", () => {
      const set = new Set(["*"]);
      expect(escapeSet("hello world", set)).toBe("hello world");
    });

    it("should handle empty set", () => {
      const set = new Set<string>();
      expect(escapeSet("hello*world\\ntest", set)).toBe("hello*world\\ntest");
    });
  });
});

describe("addIndent", () => {
  it("keeps escaped newlines within the same indented line", () => {
    expect(addIndent("row1\\\nrow2")).toBe("  row1\\\nrow2");
  });
});

describe("escapeChars", () => {
  it("escapes characters in the provided set when unescaped", () => {
    expect(escapeSet("a#b", new Set(["#"]))).toBe("a\\#b");
  });

  it("does not double-escape characters already escaped", () => {
    expect(escapeSet("a\\#b", new Set(["#"]))).toBe("a\\#b");
  });

  it("ignores characters not present in the set", () => {
    expect(escapeSet("abc", new Set(["#"]))).toBe("abc");
  });
});

describe("formatFunction", () => {
  it("returns 'name()' when no arguments are provided", () => {
    expect(formatFunction({ name: "foo", args: {} })).toBe("foo()");
  });

  it("formats with only unnamed argument", () => {
    expect(formatFunction({ name: "bar", args: { unnamed: "42" } })).toBe(
      "bar(42)",
    );
  });

  it("formats with only named arguments", () => {
    expect(
      formatFunction({ name: "baz", args: { named: { x: "1", y: "2" } } }),
    ).toBe("baz(x: 1, y: 2)");
  });

  it("formats with both named and unnamed arguments", () => {
    expect(
      formatFunction({
        name: "qux",
        args: { named: { a: "A" }, unnamed: "B" },
      }),
    ).toBe("qux(a: A, B)");
  });

  it("formats with multiple named arguments", () => {
    expect(
      formatFunction({
        name: "multi",
        args: { named: { x: "1", y: "2", z: "3" } },
      }),
    ).toBe("multi(x: 1, y: 2, z: 3)");
  });

  it("formats with multipleLine option", () => {
    expect(
      formatFunction(
        { name: "foo", args: { named: { x: "1" }, unnamed: "2" } },
        { multipleLine: true },
      ),
    ).toBe("foo(\n  x: 1,\n  2\n)");
  });

  it("includes unnamed argument if it is an empty string", () => {
    expect(formatFunction({ name: "empty", args: { unnamed: "" } })).toBe(
      "empty()",
    );
  });

  it("formats with empty named object and unnamed", () => {
    expect(
      formatFunction({
        name: "onlyUnnamed",
        args: { named: {}, unnamed: "foo" },
      }),
    ).toBe("onlyUnnamed(foo)");
  });

  it("formats with both named and unnamed missing", () => {
    expect(
      formatFunction({ name: "none", args: { named: {}, unnamed: undefined } }),
    ).toBe("none()");
  });
});
