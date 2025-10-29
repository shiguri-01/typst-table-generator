export const isEscaped = (source: string, index: number): boolean => {
  let backslashCount = 0;
  for (let lookback = index - 1; lookback >= 0; lookback -= 1) {
    if (source[lookback] === "\\") {
      backslashCount += 1;
    } else {
      break;
    }
  }
  return backslashCount % 2 === 1;
};

export const ESCAPE_CHARS = new Set(["//"]);

export const escapeSet = (source: string, set: Set<string>): string => {
  const patterns = Array.from(set);

  let result = "";
  for (let i = 0; i < source.length; i++) {
    let matched = false;

    for (const pattern of patterns) {
      if (source.startsWith(pattern, i) && !isEscaped(source, i)) {
        // パターンの最初の文字だけをエスケープ
        result += `\\${pattern}`;
        i += pattern.length - 1; // パターン全体をスキップ
        matched = true;
        break;
      }
    }

    if (!matched) {
      result += source[i];
    }
  }
  return result;
};

export type EscapeOption = Set<string> | false;

const splitUnescapedLines = (source: string): string[] => {
  const lines: string[] = [];
  let current = "";

  const normalized = source.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  for (let i = 0; i < normalized.length; i++) {
    const ch = normalized[i];

    if (ch === "\n" && !isEscaped(normalized, i)) {
      lines.push(current);
      current = "";
    } else {
      current += ch;
    }
  }

  lines.push(current);
  return lines;
};

const INDENT = "  ";

export const addIndent = (source: string): string =>
  splitUnescapedLines(source)
    .map((line) => `${INDENT}${line}`)
    .join("\n");

/** Wrap value as a Typst content block: `[ ... ]` */
export const toContentBlock = (value: string): string => {
  return `[${value}]`;
};

interface FormatFunctionArg {
  /**
   * Typst function name.
   * @example "table.cell"
   */
  name: string;

  args: {
    /**
     * The unnamed argument of the Typst function call.
     *
     * - This corresponds to a *non-keyword* argument.
     * - Its position (before or after named arguments) does not affect semantics.
     * - The value must already be a valid Typst expression string.
     */
    unnamed?: string;

    /**
     * Named arguments of the Typst function call.
     *
     * - Represents keyword arguments: `key: value`
     * - Values must already be valid Typst expression strings.
     * - Order is preserved in output but generally irrelevant semantically.
     */
    named?: Record<string, string>;
  };
}

interface FormatFunctionOptions {
  /**
   * If true, place arguments in multiple lines (with indentation).
   *
   * @defaultValue false
   */
  multipleLine?: boolean;
}

export const formatFunction = (
  { name, args }: FormatFunctionArg,
  options?: FormatFunctionOptions,
): string => {
  const { unnamed: unnamedArg, named: namedArg } = args;
  const { multipleLine = false } = options ?? {};

  const formattedNamedArgs = namedArg
    ? Object.entries(namedArg).map(([k, v]) => `${k}: ${v}`)
    : [];
  const formattedArgs = [
    ...formattedNamedArgs,
    ...(unnamedArg ? [unnamedArg] : []),
  ];

  if (formattedArgs.length === 0) {
    return `${name}()`;
  }

  if (multipleLine) {
    const indented = formattedArgs.map((arg) => addIndent(arg)).join(",\n");
    return `${name}(\n${indented}\n)`;
  }
  return `${name}(${formattedArgs.join(", ")})`;
};
