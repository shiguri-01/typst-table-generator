import type { StrokeValue, TableModel, TableStrokes } from "@/lib/table";

export type StylePresetId = "default" | "booktabs";

export interface TableArguments {
  stroke?: {
    x?: StrokeValue | "none";
    y?: StrokeValue | "none";
  };
  rowGutter?: string;
  columnGutter?: string;
  header?: {
    text?: {
      weight?: "bold" | "regular" | string;
    };
    stroke?: {
      top?: string;
      bottom?: string;
    };
  };
}

export interface StylePresetResult {
  tableArgs?: TableArguments;
  strokes?: TableStrokes;
}

export type StylePreset = (model: TableModel) => StylePresetResult;

type MutableRowStroke = NonNullable<TableStrokes["rows"]>[number];

function createRowStroke(length: number): MutableRowStroke[] {
  return Array.from({ length }, () => ({}));
}

export const STYLE_PRESETS: Record<StylePresetId, StylePreset> = {
  default: (model) => {
    const rowCount = model.rows.length;
    if (rowCount === 0) {
      return { tableArgs: defaultTableArgs };
    }

    const headerRows = Math.min(model.headerRows ?? 0, rowCount);
    const rows = createRowStroke(rowCount);

    if (headerRows > 0) {
      rows[headerRows - 1] = {
        ...rows[headerRows - 1],
        bottom: 0.5,
      };
    }

    rows[rowCount - 1] = {
      ...rows[rowCount - 1],
      bottom: 0.5,
    };

    return {
      tableArgs: defaultTableArgs,
      strokes: {
        rows,
      },
    };
  },
  booktabs: (model) => {
    const rowCount = model.rows.length;
    if (rowCount === 0) {
      return { tableArgs: booktabsArgs };
    }

    const headerRows = Math.min(model.headerRows ?? 0, rowCount);
    const rows = createRowStroke(rowCount);

    rows[0] = {
      ...rows[0],
      top: 1,
    };

    if (headerRows > 0) {
      rows[headerRows - 1] = {
        ...rows[headerRows - 1],
        bottom: 0.8,
      };
    }

    const bodyTopIndex = Math.max(headerRows, rowCount - 1);
    if (headerRows < rowCount && bodyTopIndex < rowCount) {
      rows[bodyTopIndex] = {
        ...rows[bodyTopIndex],
        top: 0.6,
      };
    }

    rows[rowCount - 1] = {
      ...rows[rowCount - 1],
      bottom: 1,
    };

    return {
      tableArgs: booktabsArgs,
      strokes: {
        rows,
      },
    };
  },
};

const defaultTableArgs: TableArguments = {
  stroke: { y: "none" },
  rowGutter: "6pt",
  columnGutter: "12pt",
  header: {
    text: { weight: "bold" },
    stroke: { bottom: "0.5pt" },
  },
};

const booktabsArgs: TableArguments = {
  stroke: { y: "none" },
  rowGutter: "8pt",
  columnGutter: "14pt",
  header: {
    text: { weight: "bold" },
    stroke: { bottom: "0.8pt" },
  },
};

export function applyStylePreset(
  model: TableModel,
  presetId: StylePresetId,
): StylePresetResult {
  const preset = STYLE_PRESETS[presetId];
  if (!preset) {
    return { strokes: model.strokes };
  }
  return preset(model);
}
