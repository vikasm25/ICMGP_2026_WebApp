import { cleanText, excelDateToDate } from "./dateTime";

export function formatProgrammeCategory(value) {
  let cleaned = cleanText(value)
    .replace(/\s*\(\d+(?:\s+talks?)?\)/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  // Remove only the generic numbered Session label.
  // If an actual event/programme name follows it, keep that name.
  // Examples:
  //   "Session 1" -> ""
  //   "Session 1 - Japan Open House" -> "Japan Open House"
  //   "Session 2: Workshop" -> "Workshop"
  //   "Session Chair" -> unchanged
  //   "Special Session 1" -> unchanged
  cleaned = cleaned.replace(/^Session\s+\d+\s*(?:[-–—:]+\s*)?/i, "").trim();

  return cleaned;
}

export function formatSessionKind(value) {
  const text = cleanText(value).toLowerCase();

  if (text === "special session" || text === "special session convenors") {
    return "Special Session";
  }

  if (text === "general session") {
    return "General Session";
  }

  return "";
}

/*
 * On 5 October 2026, the 16:00–18:00 timetable row uses
 * "Any discussion" as a generic Time / Session label.  Keep the
 * actual time, but do not show that generic label to participants.
 * This is deliberately limited to that exact date, time, and label
 * so that other discussion/event labels elsewhere remain unchanged.
 */
export function shouldHideProgrammeLabel(value, date, time) {
  const label = cleanText(value).toLowerCase();
  const timeText = cleanText(time).replace(/\s+/g, " ").trim();

  /* The programme rows keep their date as an Excel/JS date value, so
     compare the actual date instead of relying on how that Date object
     happens to stringify in the browser. */
  const programmeDate = excelDateToDate(date);
  const isOctober5 =
    programmeDate &&
    programmeDate.getFullYear() === 2026 &&
    programmeDate.getMonth() === 9 &&
    programmeDate.getDate() === 5;

  const isFourToSix =
    /16\s*:\s*00\s*[-–—]\s*18\s*:\s*00/.test(timeText);

  const isAnyDiscussionLabel =
    /^(?:\+\s*)?any\s+discussions?$/i.test(label);

  return isAnyDiscussionLabel && isOctober5 && isFourToSix;
}

export function isTotalTalkRow(row) {
  const firstCell = cleanText(row[0]).toLowerCase();
  const secondCell = cleanText(row[1]).toLowerCase();

  return (
    firstCell.includes("total talks") ||
    secondCell.includes("total talks")
  );
}

/*
 * Room headings begin from Excel column C.
 *
 * Sunday has FIVE rooms.
 * Monday / Tuesday / Thursday have FOUR.
 * Friday has THREE.
 */
export function getRoomHeaders(row) {
  const possibleRooms = row
    .slice(2, 7)
    .map(cleanText)
    .filter(Boolean);

  const roomKeywords = [
    "auditorium",
    "meeting room",
    "conference room",
    "seminar room"
  ];

  const recognisedRooms =
    possibleRooms.filter((value) =>
      roomKeywords.some((keyword) =>
        value.toLowerCase().includes(keyword)
      )
    );

  /*
   * At least two recognised room names are required.
   *
   * This prevents a row such as
   * "Exco and SSC conference wrap"
   * from being mistaken for a room-header row.
   */
  if (recognisedRooms.length >= 2) {
    return possibleRooms;
  }

  return [];
}

export function normaliseText(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function getConferenceWideLabel(category, roomValues) {
  const conferenceWideKeywords = [
    "lunch",
    "coffee break",
    "welcome reception",
    "networking & dinner",
    "networking and dinner",
    "gala dinner",
  ];

  const categoryText = cleanText(category);
  const roomTexts = (roomValues || []).map(cleanText).filter(Boolean);
  const allTexts = [categoryText, ...roomTexts];

  if (!allTexts.some(Boolean)) return "";

  const isConferenceWideText = (value) => {
    const normalized = normaliseText(value);
    return conferenceWideKeywords.some((keyword) =>
      normalized.includes(keyword)
    );
  };

  if (!allTexts.every((value) => !value || isConferenceWideText(value))) {
    return "";
  }

  const labels = [];
  allTexts.forEach((value) => {
    if (!value) return;
    const normalized = normaliseText(value);
    if (labels.some((label) => normaliseText(label) === normalized)) return;
    labels.push(value);
  });

  return labels.join(" · ");
}

export function parseSessionDateValue(value) {
  if (typeof value === "number" && value >= 40000) {
    return excelDateToDate(value);
  }

  if (value instanceof Date) {
    return excelDateToDate(value);
  }

  const text = cleanText(value);

  if (!text) return null;

  const fullDate = text.match(
    /^(\d{1,2})\s*(?:-|\/)?\s*(oct|sep|nov)\w*\s*(2026)?$/i
  );

  if (fullDate) {
    const monthNames = {
      sep: 8,
      oct: 9,
      nov: 10,
    };

    return new Date(
      2026,
      monthNames[fullDate[2].toLowerCase().slice(0, 3)],
      Number(fullDate[1])
    );
  }

  const combinedDate = text.match(
    /^(\d{1,2})\s*(?:and|&)\s*(\d{1,2})\s*(oct|sep|nov)\w*/i
  );

  if (combinedDate) {
    const monthNames = {
      sep: 8,
      oct: 9,
      nov: 10,
    };

    const month =
      monthNames[combinedDate[3].toLowerCase().slice(0, 3)];

    return [
      new Date(2026, month, Number(combinedDate[1])),
      new Date(2026, month, Number(combinedDate[2])),
    ];
  }

  return null;
}

export function findHeaderIndex(headers, candidates) {
  return headers.findIndex((header) => {
    const value = normaliseText(header);
    return candidates.some((candidate) =>
      value === candidate || value.includes(candidate)
    );
  });
}
