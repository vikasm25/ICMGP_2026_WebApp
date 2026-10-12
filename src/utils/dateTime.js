import * as XLSX from "xlsx";

export function excelDateToDate(value) {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);

    if (parsed) {
      return new Date(
        parsed.y,
        parsed.m - 1,
        parsed.d,
        parsed.H || 0,
        parsed.M || 0,
        parsed.S || 0
      );
    }
  }

  /*
   * Only accept proper YYYY-MM-DD style strings.
   * This prevents ordinary Excel text from becoming
   * accidental dates.
   */
  if (typeof value === "string") {
    const text = value.trim();

    if (/^\d{4}-\d{1,2}-\d{1,2}/.test(text)) {
      const parsed = new Date(text);

      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }

  return null;
}

export function isDateValue(value) {
  if (value instanceof Date) {
    return !Number.isNaN(value.getTime());
  }

  if (typeof value === "number") {
    return XLSX.SSF.parse_date_code(value) !== null;
  }

  if (typeof value === "string") {
    return /^\d{4}-\d{1,2}-\d{1,2}/.test(
      value.trim()
    );
  }

  return false;
}

export function formatDate(value) {
  const date = excelDateToDate(value);

  if (!date) return "";

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatShortDate(value) {
  const date = excelDateToDate(value);

  if (!date) return "";

  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/* =========================================================
   MY SCHEDULE SORTING HELPERS
   ========================================================= */

export function timeToMinutes(value) {
  if (!value) return Number.POSITIVE_INFINITY;

  const text = formatProgrammeTime(value).toLowerCase();

  /*
   * Use the first time in a range such as:
   * 09:00 - 10:00
   * 9:00 AM - 10:00 AM
   * 09:00–10:00
   */
  const match = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);

  if (!match) return Number.POSITIVE_INFINITY;

  let hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const meridiem = match[3];

  if (meridiem) {
    if (meridiem.toLowerCase() === "pm" && hours !== 12) {
      hours += 12;
    }

    if (meridiem.toLowerCase() === "am" && hours === 12) {
      hours = 0;
    }
  }

  if (hours > 23 || minutes > 59) {
    return Number.POSITIVE_INFINITY;
  }

  return hours * 60 + minutes;
}

export function getSavedItemSortValue(item) {
  const date = excelDateToDate(item?.date);

  return {
    date: date && !Number.isNaN(date.getTime())
      ? new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        ).getTime()
      : Number.POSITIVE_INFINITY,
    time: timeToMinutes(item?.time),
  };
}

/* =========================================================
   EXCEL / PROGRAMME HELPERS
   ========================================================= */

export function cleanText(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

/*
 * Excel stores a time-only cell as a fraction of one day:
 *   14:00 -> 0.5833333333333334
 *   14:15 -> 0.59375
 *   14:30 -> 0.6041666666666666
 *   14:45 -> 0.6145833333333334
 *
 * The workbook is read with raw:true, so the app receives that
 * numeric value instead of Excel's displayed HH:MM formatting.
 * Convert time-only Excel fractions to participant-facing HH:MM.
 * Existing text times such as "14:00 - 15:45" are left unchanged.
 */
export function formatProgrammeTime(value) {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";

    const hours = value.getHours();
    const minutes = value.getMinutes();

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  if (typeof value === "number" && Number.isFinite(value) && value >= 0 && value < 1) {
    const totalMinutes = Math.round(value * 24 * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;

    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  const text = cleanText(value);

  /*
   * Some workbook/read paths may turn an Excel time fraction into
   * a numeric string. Only convert numeric strings in the 0–1 range
   * because this helper is used only for time fields.
   */
  if (/^\d+(?:\.\d+)?$/.test(text)) {
    const numericValue = Number(text);

    if (Number.isFinite(numericValue) && numericValue >= 0 && numericValue < 1) {
      const totalMinutes = Math.round(numericValue * 24 * 60);
      const hours = Math.floor(totalMinutes / 60) % 24;
      const minutes = totalMinutes % 60;

      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    }
  }

  return text;
}

export function sameCalendarDay(a, b) {
  const da = excelDateToDate(a);
  const db = excelDateToDate(b);

  if (!da || !db) return false;

  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}
