import * as XLSXModule from "xlsx";

const XLSX = XLSXModule.default || XLSXModule;

const programmePath =
  "public/FullProgramme_10_sept_2026_updated_Final_AQ_Refined.xlsx";

const clean = (value) => String(value ?? "").trim();

function normalise(value) {
  return clean(value)
    .replace(/\s*\(\d+(?:\s+talks?)?\)/gi, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function parseTimeStart(value) {
  const text = clean(value);
  const match = text.match(/(\d{1,4})\s*:\s*(\d{2})/);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour > 23 && match[1].length === 4) {
    hour = Number(match[1].slice(-2));
  }

  if (hour > 23 || minute > 59) return null;
  return hour * 60 + minute;
}

function getSessionTokens(value) {
  return new Set(normalise(value).split(" ").filter(Boolean));
}

function matchScore(candidate, sessionName) {
  const a = normalise(candidate);
  const b = normalise(sessionName);

  if (!a || !b) return 0;
  if (a === b) return 1.2;
  if (a.includes(b)) return 1.02;
  if (b.includes(a)) return 0.94;

  const aTokens = getSessionTokens(a);
  const bTokens = getSessionTokens(b);
  if (!aTokens.size || !bTokens.size) return 0;

  let overlap = 0;
  aTokens.forEach((token) => {
    if (bTokens.has(token)) overlap += 1;
  });

  const smaller = Math.min(aTokens.size, bTokens.size);
  return smaller ? (overlap / smaller) * 0.8 : 0;
}

function extractCountedReferences(value) {
  const text = clean(value);
  if (!text) return [];

  const references = [];
  text.split(/\s*\+\s*/).forEach((segment) => {
    const matches = Array.from(segment.matchAll(/\((\d+)\)/g));
    if (!matches.length) return;

    matches.forEach((match, index) => {
      const previousEnd =
        index === 0
          ? 0
          : matches[index - 1].index + matches[index - 1][0].length;

      let name = segment.slice(previousEnd, match.index);
      name = name.replace(/^[\s&]+/, "").trim();
      name = name.replace(
        /^\d{1,4}\s*:\s*\d{2}\s*(?:-|–|—|to)\s*\d{1,4}\s*:\s*\d{2}\s*:\s*/i,
        ""
      );
      name = name.replace(/^\s*:\s*/, "").trim();

      if (!name) return;

      references.push({
        name,
        count: Number(match[1]) || 0,
      });
    });
  });

  return references;
}

function isDateSerial(value) {
  return typeof value === "number" && value >= 40000 && value <= 50000;
}

function readScheduleOccurrences(workbook) {
  const worksheet = workbook.Sheets.Schedule;
  if (!worksheet) return [];

  const rows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: null,
    raw: true,
  });

  const occurrences = [];
  let currentDate = null;
  let currentRooms = [];

  rows.forEach((row, rowIndex) => {
    if (isDateSerial(row[0])) {
      currentDate = row[0];
    }

    const possibleRooms = row.slice(2, 7).map(clean);
    const recognised = possibleRooms.filter((value) =>
      /auditorium|meeting room|conference room/i.test(value)
    );

    if (recognised.length >= 2) {
      currentRooms = possibleRooms;
      return;
    }

    const time = clean(row[1]);
    const start = parseTimeStart(time);
    if (start === null || !currentDate || !currentRooms.length) return;

    currentRooms.forEach((room, roomIndex) => {
      if (!room) return;

      const roomText = clean(row[roomIndex + 2]);
      if (!roomText) return;

      extractCountedReferences(roomText).forEach((reference, referenceIndex) => {
        occurrences.push({
          ...reference,
          date: currentDate,
          time,
          start,
          room,
          rowIndex,
          roomIndex,
          referenceIndex,
        });
      });
    });
  });

  return occurrences;
}

function getMetadata(rows) {
  let sessionName = "";
  let location = "";
  const dates = [];

  rows.slice(0, 10).forEach((row) => {
    row.forEach((value, index) => {
      const key = normalise(value);

      if (isDateSerial(value) && !dates.includes(value)) {
        dates.push(value);
      }

      if (!sessionName && key === "session name") {
        for (let next = index + 1; next < row.length; next += 1) {
          if (clean(row[next])) {
            sessionName = clean(row[next]);
            break;
          }
        }
      }

      if (!location && key === "location") {
        for (let next = index + 1; next < row.length; next += 1) {
          if (clean(row[next])) {
            location = clean(row[next]);
            break;
          }
        }
      }
    });
  });

  return { sessionName, location, dates };
}

function isStandaloneMarker(row, marker) {
  const values = row.map((value) => normalise(value)).filter(Boolean);
  return values.length === 1 && values[0] === marker;
}

function findHeaderIndex(values, candidates) {
  return values.findIndex((value) => {
    const key = normalise(value);
    return candidates.some((candidate) => key === candidate || key.includes(candidate));
  });
}

function deepClone(value) {
  if (!value) return undefined;
  return JSON.parse(JSON.stringify(value));
}

const workbook = XLSX.readFile(programmePath, {
  cellStyles: true,
  cellNF: true,
  cellFormula: true,
});

const scheduleOccurrences = readScheduleOccurrences(workbook);
let changedSheets = 0;
let assignedRows = 0;
const unmatchedSheets = [];

workbook.SheetNames.forEach((sheetName) => {
  if (sheetName === "Schedule" || sheetName === "Workshops") return;

  const worksheet = workbook.Sheets[sheetName];
  if (!worksheet) return;

  const rows = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: null,
    raw: true,
  });

  const metadata = getMetadata(rows);
  if (!metadata.sessionName) return;

  let oralMarkerRow = -1;
  let headerRow = -1;
  let abstractIdIndex = -1;
  let titleIndex = -1;
  let timeIndex = -1;
  let slotIndex = -1;

  for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];

    if (oralMarkerRow < 0) {
      if (isStandaloneMarker(row, "oral")) {
        oralMarkerRow = rowIndex;
      }
      continue;
    }

    if (isStandaloneMarker(row, "poster")) break;

    const values = row.map(clean);
    const absIndex = findHeaderIndex(values, ["abstract id", "author id"]);
    const ttlIndex = findHeaderIndex(values, ["title", "abstract title"]);

    if (absIndex !== -1 && ttlIndex !== -1) {
      headerRow = rowIndex;
      abstractIdIndex = absIndex;
      titleIndex = ttlIndex;
      timeIndex = findHeaderIndex(values, ["time"]);
      slotIndex = findHeaderIndex(values, ["slot"]);
      break;
    }
  }

  if (headerRow < 0) return;

  if (slotIndex < 0) {
    const headerValues = rows[headerRow] || [];
    let lastUsed = -1;
    headerValues.forEach((value, index) => {
      if (clean(value)) lastUsed = index;
    });
    slotIndex = lastUsed + 1;

    const address = XLSX.utils.encode_cell({ r: headerRow, c: slotIndex });
    const styleSourceIndex = timeIndex >= 0 ? timeIndex : titleIndex;
    const styleSourceAddress = XLSX.utils.encode_cell({
      r: headerRow,
      c: styleSourceIndex,
    });

    worksheet[address] = {
      t: "s",
      v: "Slot",
      s: deepClone(worksheet[styleSourceAddress]?.s),
    };

    rows[headerRow][slotIndex] = "Slot";

    if (!worksheet["!cols"]) worksheet["!cols"] = [];
    if (!worksheet["!cols"][slotIndex]) {
      worksheet["!cols"][slotIndex] = { wch: 8 };
    }

    const range = XLSX.utils.decode_range(worksheet["!ref"]);
    range.e.c = Math.max(range.e.c, slotIndex);
    worksheet["!ref"] = XLSX.utils.encode_range(range);
  }

  const occurrences = scheduleOccurrences
    .map((occurrence) => ({
      ...occurrence,
      score: matchScore(occurrence.name, metadata.sessionName),
      locationMatches:
        metadata.location &&
        (normalise(metadata.location) === normalise(occurrence.room) ||
          normalise(metadata.location).includes(normalise(occurrence.room)) ||
          normalise(occurrence.room).includes(normalise(metadata.location))),
    }))
    .filter((occurrence) => occurrence.score >= 0.55)
    .sort((a, b) => {
      if (a.date !== b.date) return a.date - b.date;
      if (a.rowIndex !== b.rowIndex) return a.rowIndex - b.rowIndex;
      if (a.roomIndex !== b.roomIndex) return a.roomIndex - b.roomIndex;
      return a.referenceIndex - b.referenceIndex;
    });

  occurrences.forEach((occurrence, index) => {
    occurrence.slot = index + 1;
  });

  if (!occurrences.length) {
    unmatchedSheets.push(sheetName);
  }

  const occurrenceDates = new Set(occurrences.map((item) => item.date));
  const canUseTimeBoundaries = occurrences.length > 1 && occurrenceDates.size === 1;

  const oralRows = [];
  for (let rowIndex = headerRow + 1; rowIndex < rows.length; rowIndex += 1) {
    const row = rows[rowIndex];

    if (isStandaloneMarker(row, "poster")) break;

    const title = titleIndex >= 0 ? clean(row[titleIndex]) : "";
    const abstractId = abstractIdIndex >= 0 ? clean(row[abstractIdIndex]) : "";

    if (!title && !abstractId) continue;

    oralRows.push({
      rowIndex,
      ordinal: oralRows.length,
      start: timeIndex >= 0 ? parseTimeStart(row[timeIndex]) : null,
    });
  }

  function fallbackSlotByOrdinal(ordinal) {
    if (!occurrences.length) return 1;

    let cumulative = 0;
    for (const occurrence of occurrences) {
      cumulative += Math.max(0, occurrence.count || 0);
      if (ordinal < cumulative) return occurrence.slot;
    }

    return occurrences[occurrences.length - 1].slot;
  }

  oralRows.forEach((oralRow) => {
    const slotAddress = XLSX.utils.encode_cell({
      r: oralRow.rowIndex,
      c: slotIndex,
    });

    const existingSlot = clean(worksheet[slotAddress]?.v);
    if (existingSlot) return;

    let slot = 1;

    if (occurrences.length === 1) {
      slot = 1;
    } else if (canUseTimeBoundaries && oralRow.start !== null) {
      const eligible = occurrences.filter(
        (occurrence) => occurrence.start <= oralRow.start
      );
      slot = (eligible[eligible.length - 1] || occurrences[0]).slot;
    } else {
      slot = fallbackSlotByOrdinal(oralRow.ordinal);
    }

    const styleSourceIndex = timeIndex >= 0 ? timeIndex : titleIndex;
    const styleSourceAddress = XLSX.utils.encode_cell({
      r: oralRow.rowIndex,
      c: styleSourceIndex,
    });

    worksheet[slotAddress] = {
      t: "n",
      v: slot,
      s: deepClone(worksheet[styleSourceAddress]?.s),
    };

    assignedRows += 1;
  });

  if (oralRows.length) {
    changedSheets += 1;
  }
});

if (assignedRows > 0) {
  XLSX.writeFile(workbook, programmePath, {
    cellStyles: true,
    bookType: "xlsx",
  });

  console.log(
    `Added/filled Slot values in ${changedSheets} session sheets (${assignedRows} oral rows).`
  );
} else {
  console.log("Programme Slot columns are already populated. No workbook rewrite needed.");
}

if (unmatchedSheets.length) {
  console.log(
    "Session sheets without a counted Schedule occurrence (Slot defaults/fallbacks used where needed):",
    unmatchedSheets.join(", ")
  );
}
