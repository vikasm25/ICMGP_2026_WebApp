import * as XLSX from "xlsx";

import { cleanText, formatProgrammeTime } from "./dateTime";
import { findHeaderIndex, normaliseText, parseSessionDateValue } from "./programmeFormatting";

function createPresentationHeaderMap(values, rowIndex) {
  const abstractIdIndex = findHeaderIndex(values, [
    "abstract id",
    "author id",
  ]);

  const titleIndex = findHeaderIndex(values, [
    "title",
    "abstract title",
  ]);

  if (abstractIdIndex === -1 || titleIndex === -1) {
    return null;
  }

  return {
    time: findHeaderIndex(values, ["time"]),
    slot: findHeaderIndex(values, ["slot"]),
    abstractId: abstractIdIndex,
    title: titleIndex,
    leadAuthor: findHeaderIndex(values, [
      "lead author",
      "lead  author",
      "submitting author",
    ]),
    coAuthors: findHeaderIndex(values, [
      "co-authors",
      "co-author(s)",
      "co-author",
    ]),
    abstractCategory: findHeaderIndex(values, [
      "abstract category",
    ]),
    reviewStatus: findHeaderIndex(values, [
      "review status",
    ]),
    rowIndex,
  };
}

function createHeaderlessPosterMap(values, rowIndex) {
  /*
   * A few overall sheets omit the poster header row entirely. Their
   * participant rows still follow the workbook's standard layout:
   * [blank, Abstract ID, Title, Lead author, Co-authors, ...].
   * Infer that layout only inside a Poster section and only when the
   * row contains a usable title and author field. This keeps notes and
   * blank rows out without maintaining a second poster data source.
   */
  const titleIndex = 2;
  const leadAuthorIndex = 3;
  const coAuthorsIndex = 4;
  const title = cleanText(values[titleIndex]);
  const abstractId = cleanText(values[1]);
  const leadAuthor = cleanText(values[leadAuthorIndex]);

  if (!title || title.length < 8 || (!abstractId && !leadAuthor)) {
    return null;
  }

  return {
    time: -1,
    slot: -1,
    abstractId: 1,
    title: titleIndex,
    leadAuthor: leadAuthorIndex,
    coAuthors: coAuthorsIndex,
    abstractCategory: -1,
    reviewStatus: -1,
    rowIndex,
  };
}

export function parsePresentationSheets(workbook) {
  const presentationSessions = [];

  workbook.SheetNames.forEach((sheetName) => {
    if (sheetName === "Schedule" || sheetName === "Workshops") {
      return;
    }

    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
      return;
    }

    const rows = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: null,
      raw: true,
    });

    if (!rows.length) {
      return;
    }

    /*
     * Some session sheets keep abstracts that were subsequently
     * moved to another session. Their titles may still sit inside
     * the Oral section with blank times. Collect those abstract IDs
     * so they cannot be mistaken for talks in this session.
     */
    const movedAbstractIds = new Set();

    rows.forEach((row) => {
      const rowText = row.map(cleanText).join(" ");

      if (!/moved/i.test(rowText)) return;

      const markedIds = Array.from(
        rowText.matchAll(/#\s*(\d{2,4})/g)
      );

      markedIds.forEach((match) => {
        movedAbstractIds.add(normaliseText(match[1]));
      });

      const plainIds = Array.from(
        rowText.matchAll(/\b(\d{2,4})\b/g)
      );

      plainIds.forEach((match) => {
        movedAbstractIds.add(normaliseText(match[1]));
      });
    });

    let sessionName = "";
    let sessionKind = "";
    let sessionChair = "";
    let location = "";
    const sessionDates = [];

    /* ---------------------------------------------------------
       Read the metadata area at the top of each session sheet.
       --------------------------------------------------------- */
    rows.slice(0, 6).forEach((row) => {
      if (!row) return;

      row.forEach((cell, index) => {
        const value = cleanText(cell);
        const lower = value.toLowerCase();

        if (lower === "session name" && row[index + 1]) {
          sessionName = cleanText(row[index + 1]);
        }

        if (lower === "location" && row[index + 1]) {
          location = cleanText(row[index + 1]);
        }

        if (
          lower === "special session" ||
          lower === "general session" ||
          lower === "special session convenors"
        ) {
          sessionKind = value;

          if (
            lower === "special session" ||
            lower === "special session convenors"
          ) {
            /*
             * Some workbook sheets use:
             *   Special Session | Chair(s) | Name 1, Name 2
             * while others use:
             *   Special Session | Name 1, Name 2
             *
             * Skip the intermediate "Chair(s)" label when it is present.
             */
            let chairValue = "";
            for (let nextIndex = index + 1; nextIndex < row.length; nextIndex += 1) {
              const candidate = cleanText(row[nextIndex]);
              if (!candidate) continue;

              if (/^(?:session\s*)?chair\s*\(s\)$/i.test(candidate)) {
                continue;
              }

              chairValue = candidate;
              break;
            }

            sessionChair = chairValue;
          }
        }
      });

      const possibleDate = parseSessionDateValue(row[0]);

      if (Array.isArray(possibleDate)) {
        sessionDates.push(...possibleDate);
      } else if (possibleDate) {
        sessionDates.push(possibleDate);
      }
    });

    let currentType = "";
    let headerMap = null;

    rows.forEach((row, rowIndex) => {
      if (!row) return;

      const values = row.map(cleanText);
      const rowLower = values.map((value) => value.toLowerCase());

      /*
       * Treat Oral / Poster as section markers only when the marker is
       * the row's only meaningful value.
       *
       * Presentation data rows can legitimately contain the word
       * "Poster" or "Oral" in another column (for example category or
       * status). Those rows must still be parsed as presentations.
       */
      const nonEmptyLower = rowLower.filter(Boolean);
      const sectionMarker =
        nonEmptyLower.length === 1 &&
        (nonEmptyLower[0] === "oral" || nonEmptyLower[0] === "poster")
          ? nonEmptyLower[0]
          : "";

      if (sectionMarker) {
        currentType = sectionMarker;
        headerMap = null;
        return;
      }

      if (!currentType) {
        return;
      }

      const detectedHeaderMap = createPresentationHeaderMap(values, rowIndex);

      if (detectedHeaderMap) {
        headerMap = detectedHeaderMap;
        return;
      }

      if (currentType === "poster" && !headerMap) {
        headerMap = createHeaderlessPosterMap(values, rowIndex);
      }

      if (!headerMap) {
        return;
      }

      const title =
        headerMap.title >= 0
          ? cleanText(row[headerMap.title])
          : "";

      const abstractId =
        headerMap.abstractId >= 0
          ? cleanText(row[headerMap.abstractId])
          : "";

      const leadAuthor =
        headerMap.leadAuthor >= 0
          ? cleanText(row[headerMap.leadAuthor])
          : "";

      const coAuthors =
        headerMap.coAuthors >= 0
          ? cleanText(row[headerMap.coAuthors])
          : "";

      const time =
        headerMap.time >= 0
          ? formatProgrammeTime(row[headerMap.time])
          : "";

      const slot =
        headerMap.slot >= 0
          ? cleanText(row[headerMap.slot])
          : "";

      const abstractCategory =
        headerMap.abstractCategory >= 0
          ? cleanText(row[headerMap.abstractCategory])
          : "";

      const reviewStatus =
        headerMap.reviewStatus >= 0
          ? cleanText(row[headerMap.reviewStatus])
          : "";

      const fullRowText = values.join(" | " );

      /*
       * Poster rows that are explicitly marked as being moved to
       * an oral session are internal workbook notes, not final
       * participant-facing posters. Skip them here so the final
       * Posters section does not show stale classifications.
       */
      if (
        currentType === "poster" &&
        /(?:will be moved|moved)\b.*\b(?:as\s+)?oral\b/i.test(fullRowText)
      ) {
        return;
      }

      /*
       * Ignore explanatory / administrative rows that have no
       * presentation title and no abstract identifier.
       */
      if (!title && !abstractId) {
        return;
      }

      /*
       * A participant-facing poster must have a usable title.
       * Rows with only an abstract ID and no title are workbook
       * administration/placeholder records and are not displayed.
       */
      if (currentType === "poster" && !title) {
        return;
      }

      /*
       * The ASGM "_all" sheet is a combined reference sheet.
       * Its oral records duplicate the dated 05/06 Oct sheets,
       * while its poster section contains useful poster records.
       */
      if (
        (
          /_all$/i.test(sheetName) ||
          normaliseText(sheetName) === "geologic_processes"
        ) &&
        currentType === "oral"
      ) {
        return;
      }

      if (
        currentType === "oral" &&
        movedAbstractIds.has(
          normaliseText(abstractId).replace(/^#/, "")
        )
      ) {
        return;
      }

      const record = {
        id: [
          sheetName,
          currentType,
          abstractId || `row-${rowIndex}`,
          normaliseText(title),
        ].join("::"),
        sheetName,
        sessionKind,
        sessionChair,
        sessionName,
        sessionNameKey: normaliseText(sessionName),
        location,
        locationKey: normaliseText(location),
        dates: sessionDates.map((date) => date),
        presentationType: currentType,
        time,
        slot,
        abstractId,
        title,
        leadAuthor,
        coAuthors,
        abstractCategory,
        reviewStatus,
      };

      presentationSessions.push(record);
    });
  });

  /*
   * Remove exact duplicates while keeping the richest record.
   */
  const deduplicated = new Map();

  presentationSessions.forEach((record) => {
    const key = record.presentationType === "poster"
      ? [
          "poster",
          normaliseText(record.abstractId),
          normaliseText(record.title),
        ].join("|")
      : [
          record.presentationType,
          record.sessionNameKey,
          normaliseText(record.location),
          normaliseText(record.abstractId),
          normaliseText(record.title),
        ].join("|");

    const existing = deduplicated.get(key);

    if (!existing) {
      deduplicated.set(key, record);
      return;
    }

    const existingScore =
      Number(Boolean(existing.time)) +
      Number(Boolean(existing.leadAuthor)) +
      Number(Boolean(existing.coAuthors)) +
      Number(Boolean(existing.location));

    const newScore =
      Number(Boolean(record.time)) +
      Number(Boolean(record.leadAuthor)) +
      Number(Boolean(record.coAuthors)) +
      Number(Boolean(record.location));

    if (newScore > existingScore) {
      deduplicated.set(key, record);
    }
  });

  return Array.from(deduplicated.values());
}
