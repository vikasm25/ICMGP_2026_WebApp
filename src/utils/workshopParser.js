import * as XLSX from "xlsx";
import { cleanText, excelDateToDate } from "./dateTime";
import { normaliseText } from "./programmeFormatting";

function isActive(value) {
  const text = normaliseText(value);
  return !text || ["yes", "true", "1", "active"].includes(text);
}

function normaliseHeader(value) {
  return cleanText(value)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function getValue(row, ...names) {
  const wanted = new Set(names.map(normaliseHeader));

  for (const [key, value] of Object.entries(row)) {
    if (wanted.has(normaliseHeader(key))) {
      return cleanText(value);
    }
  }

  return "";
}

function collectPeople(row) {
  const people = new Map();

  Object.entries(row).forEach(([rawKey, rawValue]) => {
    const key = normaliseHeader(rawKey);
    const value = cleanText(rawValue);

    const match = key.match(/^(co lead|lead)\s+(\d+)\s+(name|affiliation|bio)$/i);
    if (!match) return;

    const role = match[1].toLowerCase() === "co lead" ? "Co-Lead" : "Lead";
    const number = Number(match[2]);
    const field = match[3].toLowerCase();
    const personKey = `${role}::${number}`;

    if (!people.has(personKey)) {
      people.set(personKey, {
        role,
        number,
        name: "",
        affiliation: "",
        bio: "",
      });
    }

    people.get(personKey)[field] = value;
  });

  return [...people.values()]
    .filter((person) => person.name || person.affiliation || person.bio)
    .sort((a, b) => {
      if (a.role !== b.role) return a.role === "Lead" ? -1 : 1;
      return a.number - b.number;
    });
}

export function parseWorkshopsSheet(workbook) {
  const worksheet = workbook.Sheets.Workshops;
  if (!worksheet) return [];

  /*
   * Rows 1–2 are human-readable section bands.
   * Row 3 contains the actual unique column names used by the parser.
   */
  const rows = XLSX.utils.sheet_to_json(worksheet, {
    range: 2,
    defval: "",
    raw: true,
  });

  return rows
    .filter((row) => isActive(getValue(row, "Active")))
    .map((row, index) => {
      const people = collectPeople(row);

      const leads =
        getValue(row, "Leads") ||
        people
          .filter((person) => person.role === "Lead" && person.name)
          .map((person) => person.name)
          .join(", ");

      const coLeads =
        getValue(row, "Co-Leads", "Co Leads") ||
        people
          .filter((person) => person.role === "Co-Lead" && person.name)
          .map((person) => person.name)
          .join(", ");

      return {
        id: getValue(row, "Workshop ID", "Workshop_ID") || `workshop-${index + 1}`,
        date: excelDateToDate(
          Object.entries(row).find(([key]) => normaliseHeader(key) === "date")?.[1]
        ),
        time: getValue(row, "Time"),
        room: getValue(row, "Room"),
        title: getValue(row, "Workshop Title", "Workshop_Title"),
        leads,
        coLeads,
        description: getValue(row, "Description", "Workshop Details", "Workshop_Details"),
        people,
      };
    })
    .filter((workshop) => workshop.title);
}
