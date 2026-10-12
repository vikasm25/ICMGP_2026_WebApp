import * as XLSX from "xlsx";
import { cleanText, excelDateToDate, formatProgrammeTime, isDateValue, sameCalendarDay } from "./dateTime";
import { getConferenceWideLabel, getRoomHeaders, isTotalTalkRow, normaliseText } from "./programmeFormatting";
import { applyFinalProgrammeCorrections } from "./programmeCorrections";

export function parseScheduleSheet(workbook, workshops = []) {
  const mainSheetName = "Schedule";
  const worksheet =
    workbook.Sheets[mainSheetName];

  if (!worksheet) {
    throw new Error(
      "Final Schedule sheet not found in the workbook."
    );
  }

  const rows =
    XLSX.utils.sheet_to_json(
      worksheet,
      {
        header: 1,
        defval: null,
        raw: true,
      }
    );

  const days = [];

  let currentDay = null;
  let currentRooms = [];

  rows.forEach(
    (row, rowIndex) => {
      if (
        !row ||
        row.length === 0
      ) {
        return;
      }

      const firstCell = row[0];

      /* -----------------------------------------------
         START OF A NEW CONFERENCE DAY
         ----------------------------------------------- */

      if (
        isDateValue(firstCell)
      ) {
        const date =
          excelDateToDate(
            firstCell
          );

        currentDay = {
          date,
          rows: [],
          specialEvents: [],
          rooms: [],
        };

        currentRooms = [];

        days.push(
          currentDay
        );

        return;
      }

      if (!currentDay) {
        return;
      }

      /* -----------------------------------------------
         IGNORE TOTAL-TALK ADMINISTRATIVE ROWS
         ----------------------------------------------- */

      if (
        isTotalTalkRow(row)
      ) {
        return;
      }

      /* -----------------------------------------------
         ROOM HEADER
         ----------------------------------------------- */

      const possibleRooms =
        getRoomHeaders(row);

      if (
        possibleRooms.length >= 2
      ) {
        currentRooms =
          possibleRooms;

        currentDay.rooms =
          possibleRooms;

        return;
      }

      const cleanedRow =
        row.map(cleanText);

      /* -------------------------------------------------
         The final workbook repeats the poster availability
         note inside the Schedule sheet. It is informational
         content, not a timetable row, so do not display it
         inside the daily programme table. The note is shown
         once at the bottom of the dedicated Posters tab.
         ------------------------------------------------- */
      const isPosterAvailabilityNote =
        cleanedRow.some((value) =>
          normaliseText(value).startsWith(
            "posters: all posters can be displayed throughout the conference"
          )
        );

      if (isPosterAvailabilityNote) {
        return;
      }

      const hasAnyValue =
        cleanedRow.some(
          Boolean
        );

      if (!hasAnyValue) {
        return;
      }

      /* =================================================
         DAYS WITHOUT ROOM HEADINGS
         ================================================= */

      if (
        currentRooms.length === 0
      ) {
        const values =
          cleanedRow.filter(
            Boolean
          );

        if (
          values.length === 1
        ) {
          currentDay.specialEvents.push(
            {
              id:
                `special-${rowIndex}`,
              time: "",
              title:
                values[0],
              description: "",
              room: "",
              date:
                currentDay.date,
            }
          );

          return;
        }

        if (
          values.length === 2
        ) {
          currentDay.specialEvents.push(
            {
              id:
                `special-${rowIndex}`,
              time:
                formatProgrammeTime(values[0]),
              title:
                values[1],
              description: "",
              room: "",
              date:
                currentDay.date,
            }
          );

          return;
        }

        if (
          values.length >= 3
        ) {
          currentDay.specialEvents.push(
            {
              id:
                `special-${rowIndex}`,
              time:
                `${formatProgrammeTime(values[0])} · ${values[1]}`,
              title:
                values[2],
              description:
                values
                  .slice(3)
                  .join(" · "),
              room: "",
              date:
                currentDay.date,
            }
          );

          return;
        }
      }

      const category =
        cleanText(row[0]);

      const time =
        formatProgrammeTime(row[1]);

      const scheduleRoomValues =
        currentRooms.map(
          (_, roomIndex) =>
            cleanText(
              row[
                roomIndex + 2
              ]
            )
        );

      /*
       * WORKSHOPS SHEET IS THE SOURCE OF TRUTH
       * ---------------------------------------
       * Workshop placement is taken from the Workshops sheet,
       * not from the cached text/formula result in Schedule.
       *
       * This means changing a workshop's Room in Excel moves it
       * to the corresponding room column in the app without
       * breaking its popup/details.
       */
      const isWorkshopRow =
        /^workshops?$/i.test(
          normaliseText(category)
        );

      const roomValues =
        isWorkshopRow
          ? currentRooms.map((room) => {
              const workshop = workshops.find((item) =>
                sameCalendarDay(item.date, currentDay.date) &&
                normaliseText(item.time) === normaliseText(time) &&
                normaliseText(item.room) === normaliseText(room)
              );

              return workshop?.title || "";
            })
          : scheduleRoomValues;

      const conferenceWideTitle =
        getConferenceWideLabel(
          category,
          roomValues
        );

      /* =================================================
         ROOM-SPECIFIC SPECIAL EVENT
         ================================================= */

      if (
        currentRooms.length > 0 &&
        !category &&
        !time &&
        roomValues.some(Boolean)
      ) {
        roomValues.forEach(
          (
            value,
            roomIndex
          ) => {
            if (!value) {
              return;
            }

            currentDay.specialEvents.push(
              {
                id:
                  `special-${rowIndex}-${roomIndex}`,
                time: "",
                title:
                  value,
                description: "",
                room:
                  currentRooms[
                    roomIndex
                  ] || "",
                date:
                  currentDay.date,
              }
            );
          }
        );

        return;
      }

      /* =================================================
         CONFERENCE-WIDE EVENT ROW
         ================================================= */

      if (
        currentRooms.length > 0 &&
        conferenceWideTitle &&
        time
      ) {
        currentDay.rows.push({
          id: `row-${rowIndex}`,
          category,
          time,
          rooms: roomValues,
          date: currentDay.date,
          isConferenceWide: true,
          conferenceWideTitle,
        });

        return;
      }

      /* =================================================
         GENERAL SPECIAL EVENT
         ================================================= */

      if (
        currentRooms.length > 0 &&
        category &&
        time &&
        !roomValues.some(Boolean)
      ) {
        currentDay.specialEvents.push(
          {
            id:
              `special-${rowIndex}`,
            time,
            title:
              category,
            description: "",
            room: "",
            date:
              currentDay.date,
          }
        );

        return;
      }

      /* =================================================
         NORMAL PROGRAMME ROW
         ================================================= */

      if (
        category ||
        time ||
        roomValues.some(Boolean)
      ) {
        currentDay.rows.push(
          {
            id:
              `row-${rowIndex}`,
            category,
            time,
            rooms:
              roomValues,
            date:
              currentDay.date,
            isConferenceWide: false,
            conferenceWideTitle: "",
          }
        );
      }
    }
  );

  return applyFinalProgrammeCorrections(days);
}
