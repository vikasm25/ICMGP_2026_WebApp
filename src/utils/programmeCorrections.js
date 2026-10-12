import { cleanText, excelDateToDate, timeToMinutes } from "./dateTime";
import { normaliseText } from "./programmeFormatting";

export function applyFinalProgrammeCorrections(days) {
  days.forEach((day) => {
    if (!day?.date) return;

    const date = excelDateToDate(day.date);
    if (!date) return;

    const dayNumber = date.getDate();
    const monthNumber = date.getMonth();

    if (monthNumber !== 9) return; // October 2026

    /* ---------------------------------------------------------
       4 October — Workshops
       ---------------------------------------------------------
       Workshop placement is now controlled entirely by the final
       programme workbook's Workshops sheet. Do not hard-code room
       or time overrides here; changing Date / Time / Room in Excel
       must flow through to the web app unchanged.
       --------------------------------------------------------- */

    /* ---------------------------------------------------------
       5 October — remove the OLD standalone Women's Event at
       18:30–20:00. It may be represented by the workbook as a
       normal timetable row, so filter the row as well as specialEvents.
       The corrected 18:45–20:15 Women in Science Event is preserved.
       --------------------------------------------------------- */
    if (dayNumber === 5) {
      const isOldWomensEventText = (value) =>
        /women(?:'|’)s\s+event/i.test(cleanText(value));

      day.specialEvents = (day.specialEvents || []).filter((event) => {
        const eventTime = normaliseText(event?.time);
        const eventTitle = normaliseText(event?.title);

        const isOldWomensEvent =
          /18\s*:\s*30\s*(?:[-–—]|to)\s*20\s*:\s*00/i.test(eventTime) &&
          isOldWomensEventText(eventTitle);

        return !isOldWomensEvent;
      });

      day.rows = (day.rows || []).filter((row) => {
        const rowTime = cleanText(row?.time);

        if (
          !/18\s*:\s*30\s*(?:[-–—]|to)\s*20\s*:\s*00/i.test(rowTime)
        ) {
          return true;
        }

        const isOldWomensRow = (row.rooms || []).some((roomText) =>
          isOldWomensEventText(roomText)
        );

        return !isOldWomensRow;
      });
    }

    /* ---------------------------------------------------------
       5 October — keep the 16:00–18:00 session row separate from
       the Women in Science award/event cards.

       The Schedule workbook combines:
       "Advances in machine learning ... + Award talks under Women in Science"

       Participant display should show Machine Learning in the timetable,
       while the three award/event items appear as independent cards below.
       --------------------------------------------------------- */
    if (dayNumber === 5) {
      const removeAwardTalkSegment = (value) =>
        cleanText(value)
          .split(/\s*\+\s*/)
          .filter(
            (segment) =>
              !/award\s+talks\s+under\s+women\s+in\s+science/i.test(
                cleanText(segment)
              )
          )
          .join(" + ")
          .trim();

      day.rows = (day.rows || []).map((row) => {
        const rowTime = normaliseText(row?.time);

        if (
          !/16\s*:\s*00\s*(?:[-–—]|to)\s*18\s*:\s*00/i.test(rowTime)
        ) {
          return row;
        }

        return {
          ...row,
          rooms: (row.rooms || []).map(removeAwardTalkSegment),
        };
      });

      const awardEventIds = new Set([
        "05oct-emerging-researcher-award",
        "05oct-lifetime-achievement-award",
        "05oct-women-in-science-event",
      ]);

      day.specialEvents = (day.specialEvents || []).filter(
        (event) => !awardEventIds.has(event?.id)
      );

      day.specialEvents.push(
        {
          id: "05oct-emerging-researcher-award",
          time: "17:20 to 17:55",
          title: "Emerging Researcher Award",
          room: "Meeting Room 1",
          description: "(Virtual) Qingru Wu",
          date: day.date,
          displayKind: "award",
        },
        {
          id: "05oct-lifetime-achievement-award",
          time: "18:15 to 18:40",
          title: "Lifetime Achievement Award",
          room: "Meeting Room 1",
          description: "(Virtual) Professor. Mae Gustin",
          date: day.date,
          displayKind: "award",
        },
        {
          id: "05oct-women-in-science-event",
          time: "18:45 to 20:15",
          title: "Women in Science Event Followed by Apero",
          room: "4th Floor Dinning Hall, International Guest House (IGH) ",
          description: "",
          date: day.date,
          displayKind: "award",
        }
      );
    }

    /* ---------------------------------------------------------
       6 October — the COMPLEXion/Toxic Trail item is actually
       at 16:45–18:30. Keep it OUTSIDE Session 3 as a separate
       timetable row in its existing room. Session 3 remains
       16:00–18:00 in the other rooms, so the overlap is shown
       naturally as parallel programming.
       --------------------------------------------------------- */
    if (dayNumber === 6) {
      /*
       * 6 October — Seminar Room 2.
       * Remove the separate 16:45–18:30 COMPLEXion row and place the
       * requested two-part display inside the existing 16:00–18:00
       * timetable row.
       */

      day.rows = day.rows
        .filter((row) => {
          const rowTime = normaliseText(row.time);
          const isSeparateComplexionRow =
            /16\s*:\s*45\s*(?:[-–—]|to)\s*18\s*:\s*30/i.test(rowTime) &&
            row.rooms?.some((roomText) =>
              /COMPLEXion\s+of\s+Change\s+event/i.test(cleanText(roomText))
            );

          return !isSeparateComplexionRow;
        })
        .map((row) => {
          const rowTime = normaliseText(row.time);
          if (!/16\s*:\s*00\s*(?:[-–—]|to)\s*18\s*:\s*00/i.test(rowTime)) {
            return row;
          }

          return {
            ...row,
            rooms: row.rooms.map((roomText, roomIndex) => {
              if (
                roomIndex < day.rooms.length &&
                normaliseText(day.rooms[roomIndex]) === "seminar room 2"
              ) {
                return "SIX_OCTOBER_COMPLEXION_TOXIC_TRAIL_STACK";
              }
              return roomText;
            }),
          };
        });
    }

    /* ---------------------------------------------------------
       8 October — 15:15–16:00 is a coffee break in the first
       three rooms, while Room X hosts the ICMGP 2030
       host presentation. Keep that row as the partial merge.

       The separate 17:30–18:30 conference wrap is stored as a
       room-only special event. Convert it into a normal timetable
       row in Room X so the time and venue both appear
       inside the main schedule table.
       --------------------------------------------------------- */
    if (dayNumber === 8) {
      day.rows = day.rows.map((row) => {
        const categoryText = normaliseText(row.category);
        const timeText = normaliseText(row.time);

        if (
          categoryText === "coffee break" &&
          timeText.includes("15:15") &&
          timeText.includes("16:00")
        ) {
          const presentationIndex = row.rooms.findIndex((roomText) =>
            normaliseText(roomText).includes("presentation for icmgp 2030 host")
          );

          if (presentationIndex !== -1) {
            return {
              ...row,
              isPartialMerge: true,
              partialMergeRoomIndex: presentationIndex,
              partialMergeTitle: "Coffee Break",
              partialMergeExcludedRoom:
                day.rooms[presentationIndex] || "Room X",
            };
          }
        }

        return row;
      });

      const wrapEvents = [];
      const remainingSpecialEvents = [];

      day.specialEvents.forEach((event, eventIndex) => {
        if (
          /exco\s+and\s+ssc\s+conference\s+wrap/i.test(
            cleanText(event.title)
          )
        ) {
          const roomIndex = Math.max(
            0,
            day.rooms.findIndex(
              (room) => normaliseText(room) === "room x"
            )
          );

          wrapEvents.push({
            id: `row-08oct-exco-ssc-wrap-${eventIndex}`,
            category: "Exco and SSC conference wrap",
            time: "17:30 - 18:30",
            rooms: day.rooms.map((_, index) =>
              index === roomIndex ? "Exco and SSC conference wrap" : ""
            ),
            date: day.date,
          });
          return;
        }

        remainingSpecialEvents.push(event);
      });

      day.specialEvents = remainingSpecialEvents;
      day.rows.push(...wrapEvents);
    }

    /* ---------------------------------------------------------
       9 October — only the Auditorium is needed.
       Remove the unused room columns for this day.
       --------------------------------------------------------- */

    day.rows.sort((a, b) => {
      const aTime = timeToMinutes(a.time);
      const bTime = timeToMinutes(b.time);
      if (aTime !== bTime) return aTime - bTime;
      return 0;
    });
  });

  return days;
}
