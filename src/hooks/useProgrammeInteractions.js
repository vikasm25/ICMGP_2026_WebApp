import { useState } from "react";
import { cleanText, excelDateToDate, getSavedItemSortValue, sameCalendarDay, timeToMinutes } from "../utils/dateTime";
import { formatProgrammeCategory, formatSessionKind, normaliseText } from "../utils/programmeFormatting";

export function useProgrammeInteractions({
  schedule,
  selectedDateIndex,
  setSelectedDateIndex,
  presentationSessions,
  workshops = [],
  savedItems,
  setPage,
}) {
  const [selectedPresentationGroup, setSelectedPresentationGroup] = useState(null);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [programmeSearchQuery, setProgrammeSearchQuery] = useState("");

  const isPosterView = selectedDateIndex === schedule.length;

  const selectedDay =
    !isPosterView ? schedule[selectedDateIndex] : null;

  /*
   * presentationSessions is the data foundation for the Programme
   * and the header programme search. The search uses the same
   * workbook-derived records shown in the individual presentation
   * details, so there is no separate people database to maintain.
   */

  /*
   * My Schedule is always displayed chronologically.
   * Star order only decides which items are included; it
   * must never determine their display order.
   */
  const sortedSavedItems = [...savedItems].sort((a, b) => {
    const aValue = getSavedItemSortValue(a);
    const bValue = getSavedItemSortValue(b);

    if (aValue.date !== bValue.date) {
      return aValue.date - bValue.date;
    }

    if (aValue.time !== bValue.time) {
      return aValue.time - bValue.time;
    }

    return 0;
  });

  const allPosters = Array.from(
    new Map(
      presentationSessions
        .filter((item) => item.presentationType === "poster")
        .map((item) => [
          `${normaliseText(item.abstractId)}|${normaliseText(item.title)}`,
          item,
        ])
    ).values()
  ).sort((a, b) => {
    const aId = String(a.abstractId || "").trim();
    const bId = String(b.abstractId || "").trim();

    const aHasId = Boolean(aId);
    const bHasId = Boolean(bId);

    /* Posters with an Abstract ID always come first. */
    if (aHasId !== bHasId) {
      return aHasId ? -1 : 1;
    }

    if (!aHasId && !bHasId) {
      return a.title.localeCompare(b.title, undefined, {
        sensitivity: "base",
      });
    }

    const aNumMatch = aId.match(/\d+/);
    const bNumMatch = bId.match(/\d+/);
    const aNum = aNumMatch ? Number(aNumMatch[0]) : Number.POSITIVE_INFINITY;
    const bNum = bNumMatch ? Number(bNumMatch[0]) : Number.POSITIVE_INFINITY;

    if (aNum !== bNum) {
      return aNum - bNum;
    }

    return aId.localeCompare(bId, undefined, { numeric: true, sensitivity: "base" });
  });

  function parseTimeRange(value) {
    const text = cleanText(value);
    if (!text) return null;

    const match = text.match(
      /(\d{1,4})\s*:\s*(\d{2})\s*(am|pm)?\s*(?:-|–|—|to)\s*(\d{1,4})\s*:\s*(\d{2})\s*(am|pm)?/i
    );

    if (!match) return null;

    function toMinutes(hourText, minuteText, meridiem) {
      let hours = Number(hourText);
      const minutes = Number(minuteText);

      /*
       * The workbook contains one malformed time such as
       * 1111:05. For matching/sorting only, interpret the
       * duplicated leading hour as 11:05 without changing the
       * source text shown in the app.
       */
      if (hours > 23 && String(hourText).length === 4) {
        hours = Number(String(hourText).slice(-2));
      }

      if (hours > 23 || minutes > 59) return null;

      if (meridiem) {
        const period = meridiem.toLowerCase();
        if (period === "pm" && hours !== 12) hours += 12;
        if (period === "am" && hours === 12) hours = 0;
      }

      return hours * 60 + minutes;
    }

    const startMinutes = toMinutes(match[1], match[2], match[3]);
    const endMinutes = toMinutes(match[4], match[5], match[6] || match[3]);

    if (startMinutes === null || endMinutes === null) return null;

    return {
      start: startMinutes,
      end: endMinutes,
    };
  }

  function extractCountedSessionReferences(roomText) {
    const text = cleanText(roomText);
    if (!text) return [];

    const plusSegments = text.split(/\s*\+\s*/).map((segment) => segment.trim());
    const references = [];

    plusSegments.forEach((segment) => {
      const matches = Array.from(segment.matchAll(/\((\d+)\)/g));

      if (!matches.length) return;

      matches.forEach((match, index) => {
        const previousEnd = index === 0
          ? 0
          : matches[index - 1].index + matches[index - 1][0].length;

        let candidate = segment.slice(previousEnd, match.index);

        /* A session name may be separated from the next one by an ampersand. */
        candidate = candidate.replace(/^[\s&]+/, "").trim();

        /* Remove an embedded time prefix such as 16:45 - 18:30:. */
        candidate = candidate.replace(
          /^\d{1,4}\s*:\s*\d{2}\s*(?:-|–|—|to)\s*\d{1,4}\s*:\s*\d{2}\s*:\s*/i,
          ""
        );

        /* Remove a leading descriptive label when the workbook has one. */
        candidate = candidate.replace(/^\s*:\s*/, "").trim();

        if (!candidate) return;

        references.push({
          name: candidate,
          count: Number(match[1]),
        });
      });
    });

    return references;
  }

  function getSessionTokens(value) {
    return new Set(
      normaliseText(value)
        .replace(/[^a-z0-9]+/g, " ")
        .split(" ")
        .filter(Boolean)
    );
  }

  function getSessionMatchScore(candidate, sessionName) {
    const candidateKey = normaliseText(candidate);
    const sessionKey = normaliseText(sessionName);

    if (!candidateKey || !sessionKey) return 0;

    /* Exact session-name matches must always win over broader names. */
    if (candidateKey === sessionKey) return 1.2;

    if (candidateKey.includes(sessionKey)) {
      return 1.02;
    }

    if (sessionKey.includes(candidateKey)) {
      return 0.94;
    }

    const candidateTokens = getSessionTokens(candidateKey);
    const sessionTokens = getSessionTokens(sessionKey);

    if (!candidateTokens.size || !sessionTokens.size) return 0;

    let overlap = 0;
    candidateTokens.forEach((token) => {
      if (sessionTokens.has(token)) overlap += 1;
    });

    const smallerSize = Math.min(
      candidateTokens.size,
      sessionTokens.size
    );

    /* Token similarity is deliberately below exact/contains matches. */
    return smallerSize ? (overlap / smallerSize) * 0.8 : 0;
  }

  function getSessionOccurrenceOffset(
    sessionKey,
    targetRowId,
    targetRoom,
    targetDate
  ) {
    let offset = 0;

    for (const day of schedule) {
      if (!day?.rows) continue;

      /*
       * The offset is only for repeated occurrences within the same
       * conference day. Once Geological Processes was split into
       * separate 5-Oct and 6-Oct sheets, counting the 5-Oct
       * presentations here incorrectly shifted the 6-Oct blank
       * candidates past the end of the list.
       */
      if (targetDate && !sameCalendarDay(day.date, targetDate)) {
        continue;
      }

      for (const row of day.rows) {
        if (!row?.rooms) continue;

        for (let roomIndex = 0; roomIndex < row.rooms.length; roomIndex += 1) {
          const room = day.rooms?.[roomIndex] || "";

          if (
            row.id === targetRowId &&
            normaliseText(room) === normaliseText(targetRoom)
          ) {
            return offset;
          }

          const roomText = cleanText(row.rooms[roomIndex]);
          if (!roomText) continue;

          extractCountedSessionReferences(roomText).forEach((reference) => {
            const session = findBestSessionForReference(
              reference.name,
              room,
              row.date
            );

            if (session?.sessionNameKey === sessionKey) {
              offset += reference.count;
            }
          });
        }
      }
    }

    return offset;
  }

  function findBestSessionForReference(referenceName, room, date) {
    const roomKey = normaliseText(room);

    const candidates = presentationSessions.filter((item) => {
      if (item.presentationType !== "oral") return false;
      if (!item.sessionNameKey) return false;
      if (!item.dates.some((itemDate) => sameCalendarDay(itemDate, date))) {
        return false;
      }

      return true;
    });

    const ranked = candidates
      .map((item) => {
        const locationMatches =
          roomKey && item.locationKey
            ? roomKey === item.locationKey ||
              roomKey.includes(item.locationKey) ||
              item.locationKey.includes(roomKey)
            : false;

        const score = getSessionMatchScore(
          referenceName,
          item.sessionName
        );

        return {
          item,
          score,
          locationMatches,
        };
      })
      .filter(({ score }) => score >= 0.55)
      .sort((a, b) => {
        if (a.locationMatches !== b.locationMatches) {
          return Number(b.locationMatches) - Number(a.locationMatches);
        }

        return b.score - a.score;
      });

    if (!ranked.length) return null;

    /* Prefer the best room match; otherwise use the strongest name match. */
    const roomMatched = ranked.filter((candidate) => candidate.locationMatches);
    return (roomMatched[0] || ranked[0]).item;
  }

  function getChairInfo(sessionChair) {
    const text = cleanText(sessionChair);
    if (!text || /^(?:session\s*)?chair\s*\(s\)$/i.test(text)) {
      return null;
    }

    const names = text
      .split(/\s*,\s*/)
      .map((name) => name.trim())
      .filter(
        (name) =>
          name &&
          !/^(?:session\s*)?chair\s*\(s\)$/i.test(name)
      );

    if (!names.length) return null;

    return {
      chair: names[0],
      coChairs: names.slice(1),
    };
  }

  function getSessionSlotNumber(
    sessionKey,
    targetRowId,
    targetRoom,
    targetDate
  ) {
    if (!sessionKey) return null;

    let slotNumber = 0;

    for (const day of schedule) {
      if (!day?.rows) continue;

      for (const row of day.rows) {
        if (!row?.rooms) continue;

        for (let roomIndex = 0; roomIndex < row.rooms.length; roomIndex += 1) {
          const room = day.rooms?.[roomIndex] || "";
          const roomText = cleanText(row.rooms[roomIndex]);
          if (!roomText) continue;

          const references = extractCountedSessionReferences(roomText);

          for (const reference of references) {
            const matchedSession = findBestSessionForReference(
              reference.name,
              room,
              row.date
            );

            if (matchedSession?.sessionNameKey !== sessionKey) {
              continue;
            }

            slotNumber += 1;

            const isTarget =
              row.id === targetRowId &&
              normaliseText(room) === normaliseText(targetRoom) &&
              (!targetDate || sameCalendarDay(row.date, targetDate));

            if (isTarget) {
              return slotNumber;
            }
          }
        }
      }
    }

    return null;
  }

  function getSessionPresentationGroup(
    roomText,
    room,
    date,
    rowTime,
    rowId
  ) {
    let references = extractCountedSessionReferences(roomText);

    /*
     * 5 October — Auditorium, 16:00–18:00. The master schedule
     * currently shows Mercury monitoring for effectiveness evaluation
     * as 2 presentations, but one of those presentations has been
     * moved. The final participant-facing count for this topic is 1.
     * Keep the other programme references unchanged.
     */
    const sessionDateForCorrection = excelDateToDate(date);
    const isFiveOctoberSixteenHundredAuditorium =
      sessionDateForCorrection &&
      sessionDateForCorrection.getFullYear() === 2026 &&
      sessionDateForCorrection.getMonth() === 9 &&
      sessionDateForCorrection.getDate() === 5 &&
      normaliseText(room) === "auditorium" &&
      normaliseText(rowTime) === "16:00 - 18:00";

    if (isFiveOctoberSixteenHundredAuditorium) {
      references = references.map((reference) =>
        normaliseText(reference.name) ===
        "mercury monitoring for effectiveness evaluation"
          ? { ...reference, count: 1 }
          : reference
      );
    }

    /*
     * 5 October — Auditorium, 14:00–15:45.
     * The final participant-facing session contains eight presentations,
     * including Abstract 280 at 15:45–16:00.
     */
    const isFiveOctoberMercuryEffectivenessSession =
      sessionDateForCorrection &&
      sessionDateForCorrection.getFullYear() === 2026 &&
      sessionDateForCorrection.getMonth() === 9 &&
      sessionDateForCorrection.getDate() === 5 &&
      normaliseText(room) === "auditorium" &&
      normaliseText(rowTime) === "14:00 - 15:45";

    if (isFiveOctoberMercuryEffectivenessSession) {
      references = references.map((reference) =>
        normaliseText(reference.name) ===
        "mercury monitoring for effectiveness evaluation"
          ? { ...reference, count: 8 }
          : reference
      );
    }

    /*
     * 5 October — Freshwater & Oceans, Seminar Room 2, 10:50–12:50.
     * The final participant-facing session contains three presentations.
     * One workbook placeholder is removed, and Abstract 218 is restored
     * here as the supplied oral presentation. Keep this correction limited
     * to this exact session occurrence.
     */
    const isFiveOctoberFreshwaterOceans =
      sessionDateForCorrection &&
      sessionDateForCorrection.getFullYear() === 2026 &&
      sessionDateForCorrection.getMonth() === 9 &&
      sessionDateForCorrection.getDate() === 5 &&
      normaliseText(room) === "seminar room 2" &&
      normaliseText(rowTime) === "10:50 - 12:50";

    if (isFiveOctoberFreshwaterOceans) {
      references = references.map((reference) =>
        normaliseText(reference.name) === "freshwater & oceans"
          ? { ...reference, count: 3 }
          : reference
      );
    }

    /*
     * 8 October — Auditorium, 16:00–18:00.
     * The 8 October Auditorium block currently contains three Human Health
     * presentations, so the participant-facing count should be 3.
     * Keep this correction limited to this exact occurrence.
     */
    const isEightOctoberEnvironmentalHumanHealth =
      sessionDateForCorrection &&
      sessionDateForCorrection.getFullYear() === 2026 &&
      sessionDateForCorrection.getMonth() === 9 &&
      sessionDateForCorrection.getDate() === 8 &&
      normaliseText(room) === "auditorium" &&
      normaliseText(rowTime) === "16:00 - 18:00";

    if (isEightOctoberEnvironmentalHumanHealth) {
      references = references.map((reference) =>
        normaliseText(reference.name) === "human health"
          ? { ...reference, count: 3 }
          : reference
      );
    }

    const presentations = [];
    const presentationGroups = [];
    const unresolvedReferences = [];
    const seenPresentationIds = new Set();
    const rowRange = parseTimeRange(rowTime);

    references.forEach((reference) => {
      const session = findBestSessionForReference(
        reference.name,
        room,
        date
      );

      if (!session) {
        unresolvedReferences.push(reference);

        presentationGroups.push({
          name:
            excelDateToDate(date)?.getFullYear() === 2026 &&
            excelDateToDate(date)?.getMonth() === 9 &&
            excelDateToDate(date)?.getDate() === 8 &&
            normaliseText(reference.name) === "mercury and biodiversity"
              ? "Mercury and Biodiversity: Connecting Science with Global Policy"
              : formatProgrammeCategory(reference.name),
          sessionKind: "",
          sessionChair: "",
          expectedCount: 0,
          presentations: [],
        });
        return;
      }

      /*
       * 6 October — Auditorium, 16:00–18:00, Mercury and Selenium in
       * Living Organisms: Insights from Marine to Amazonian Studies.
       * The final oral presentation starts exactly at 18:00 (18:00–18:15).
       * The normal session-window rule intentionally uses a strict `<` at
       * the end boundary, so that presentation is otherwise excluded from
       * this 16:00–18:00 session. Include the exact boundary presentation
       * only for this session occurrence; do not change the global rule.
       */
      const sessionDateForBoundaryCheck = excelDateToDate(date);
      const isSixOctoberMercurySeleniumBoundarySession =
        sessionDateForBoundaryCheck &&
        sessionDateForBoundaryCheck.getFullYear() === 2026 &&
        sessionDateForBoundaryCheck.getMonth() === 9 &&
        sessionDateForBoundaryCheck.getDate() === 6 &&
        normaliseText(room) === "auditorium" &&
        normaliseText(rowTime) === "16:00 - 18:00" &&
        (
          normaliseText(reference.name) ===
            "mercury and selenium in living organisms: insights from marine to amazonian studies" ||
          normaliseText(session.sessionName) ===
            "mercury and selenium in living organisms: insights from marine to amazonian studies"
        );

      /*
       * 5 October — Auditorium, 14:00–15:45.
       * The workbook contains eight presentations for Mercury Monitoring
       * for Effectiveness Evaluation, with Abstract 280 beginning exactly
       * at the 15:45 boundary. Include that boundary presentation only
       * for this exact session occurrence.
       */
      const isFiveOctoberMercuryEffectivenessBoundarySession =
        sessionDateForBoundaryCheck &&
        sessionDateForBoundaryCheck.getFullYear() === 2026 &&
        sessionDateForBoundaryCheck.getMonth() === 9 &&
        sessionDateForBoundaryCheck.getDate() === 5 &&
        normaliseText(room) === "auditorium" &&
        normaliseText(rowTime) === "14:00 - 15:45" &&
        (
          normaliseText(reference.name) ===
            "mercury monitoring for effectiveness evaluation" ||
          normaliseText(session.sessionName) ===
            "mercury monitoring for effectiveness evaluation"
        );

      const sessionCandidates = presentationSessions
        .filter((item) => {
          if (item.presentationType !== "oral") return false;
          if (item.sessionNameKey !== session.sessionNameKey) return false;
          if (!item.dates.some((itemDate) => sameCalendarDay(itemDate, date))) {
            return false;
          }
          return true;
        });

      /*
       * Slot is the primary grouping key.
       *
       * A talk remains in its assigned Schedule slot even when the talk
       * itself extends past the nominal Schedule end time. This prevents
       * the final talk of a session from disappearing at a boundary.
       */
      const slotNumber = getSessionSlotNumber(
        session.sessionNameKey,
        rowId,
        room,
        date
      );

      const slotCandidates =
        slotNumber !== null
          ? sessionCandidates.filter(
              (item) => Number.parseInt(item.slot, 10) === slotNumber
            )
          : [];

      const fallbackTimeCandidates = sessionCandidates.filter((item) => {
        if (!rowRange) return true;

        const presentationRange = parseTimeRange(item.time);

        /* Blank times are retained only for the legacy fallback path. */
        if (!presentationRange) return true;

        return (
          presentationRange.start >= rowRange.start &&
          (
            presentationRange.start < rowRange.end ||
            (
              (
                isSixOctoberMercurySeleniumBoundarySession ||
                isFiveOctoberMercuryEffectivenessBoundarySession
              ) &&
              presentationRange.start === rowRange.end
            )
          )
        );
      });

      const candidates = (
        slotCandidates.length > 0
          ? slotCandidates
          : fallbackTimeCandidates
      ).sort(
        (a, b) => timeToMinutes(a.time) - timeToMinutes(b.time)
      );

      const timedCandidates = candidates.filter((item) =>
        Boolean(parseTimeRange(item.time))
      );
      const blankCandidates = candidates.filter((item) =>
        !parseTimeRange(item.time)
      );

      let selected = [];

      if (slotCandidates.length > 0) {
        selected = candidates;
      } else if (timedCandidates.length > 0) {
        /*
         * Legacy fallback for workbooks that do not yet contain Slot.
         * Do not cap timed talks using the stale bracket number.
         */
        selected = timedCandidates;
      }

      if (
        slotCandidates.length === 0 &&
        timedCandidates.length === 0 &&
        selected.length < reference.count
      ) {
        const usedBlankOffset = getSessionOccurrenceOffset(
          session.sessionNameKey,
          rowId,
          room,
          date
        );

        const sameRowEarlierCount = references
          .slice(0, references.indexOf(reference))
          .reduce((total, priorReference) => {
            const priorSession = findBestSessionForReference(
              priorReference.name,
              room,
              date
            );

            return priorSession?.sessionNameKey === session.sessionNameKey
              ? total + priorReference.count
              : total;
          }, 0);

        const blankStart = Math.max(
          0,
          usedBlankOffset + sameRowEarlierCount -
            Math.min(reference.count, selected.length)
        );

        const blankNeeded = reference.count - selected.length;
        selected = [
          ...selected,
          ...blankCandidates.slice(
            blankStart,
            blankStart + blankNeeded
          ),
        ];
      }

      const uniqueSelected = selected.filter((presentation) => {
        if (seenPresentationIds.has(presentation.id)) return false;
        seenPresentationIds.add(presentation.id);
        presentations.push(presentation);
        return true;
      });

      const sourceDrivenCount =
        slotCandidates.length > 0 || timedCandidates.length > 0;

      const effectiveCount = sourceDrivenCount
        ? uniqueSelected.length
        : Math.max(uniqueSelected.length, reference.count);

      const baseGroupName =
        excelDateToDate(date)?.getFullYear() === 2026 &&
        excelDateToDate(date)?.getMonth() === 9 &&
        excelDateToDate(date)?.getDate() === 8 &&
        normaliseText(reference.name) === "mercury and biodiversity"
          ? "Mercury and Biodiversity: Connecting Science with Global Policy"
          : formatProgrammeCategory(session.sessionName || reference.name);

      presentationGroups.push({
        name: baseGroupName,
        presentationCount: effectiveCount,
        sessionKind:
          sessionDateForCorrection &&
          sessionDateForCorrection.getFullYear() === 2026 &&
          sessionDateForCorrection.getMonth() === 9 &&
          sessionDateForCorrection.getDate() === 8 &&
          normaliseText(room) === "seminar room 2" &&
          (normaliseText(rowTime) === "14:00 - 15:45" ||
            normaliseText(rowTime) === "16:00 - 18:00") &&
          normaliseText(reference.name) === "science policy interface"
            ? "Special Session"
            : sessionDateForCorrection &&
                sessionDateForCorrection.getFullYear() === 2026 &&
                sessionDateForCorrection.getMonth() === 9 &&
                sessionDateForCorrection.getDate() === 8 &&
                normaliseText(room) === "seminar room 3/4" &&
                normaliseText(rowTime) === "14:00 - 15:45" &&
                (normaliseText(reference.name) === "mercury and biodiversity" ||
                normaliseText(reference.name) ===
                  "mercury and biodiversity: connecting science with global policy")
              ? "Special Session"
              : sessionDateForCorrection &&
                  sessionDateForCorrection.getFullYear() === 2026 &&
                  sessionDateForCorrection.getMonth() === 9 &&
                  sessionDateForCorrection.getDate() === 8 &&
                  normaliseText(room) === "seminar room 3/4" &&
                  normaliseText(rowTime) === "10:50 - 12:50" &&
                  (normaliseText(reference.name) === "mercury and biodiversity" ||
                    normaliseText(reference.name) ===
                      "mercury and biodiversity: connecting science with global policy")
                ? "Special Session"
              : sessionDateForCorrection &&
                  sessionDateForCorrection.getFullYear() === 2026 &&
                  sessionDateForCorrection.getMonth() === 9 &&
                  sessionDateForCorrection.getDate() === 5 &&
                  normaliseText(room) === "seminar room 3/4" &&
                  normaliseText(rowTime) === "16:00 - 18:00" &&
                  normaliseText(reference.name) ===
                    "mercury in geological processes"
                ? "Special Session"
                : sessionDateForCorrection &&
                    sessionDateForCorrection.getFullYear() === 2026 &&
                    sessionDateForCorrection.getMonth() === 9 &&
                    sessionDateForCorrection.getDate() === 6 &&
                    normaliseText(room) === "seminar room 3/4" &&
                    normaliseText(rowTime) === "10:50 - 12:50" &&
                    normaliseText(reference.name) ===
                      "mercury in geological processes"
                  ? "Special Session"
                   : sessionDateForCorrection &&
                    sessionDateForCorrection.getFullYear() === 2026 &&
                    sessionDateForCorrection.getMonth() === 9 &&
                    sessionDateForCorrection.getDate() === 6 &&
                    normaliseText(room) === "seminar room 2" &&
                    normaliseText(rowTime) === "14:00 - 15:45" &&
                    /toxic trail of beauty/i.test(normaliseText(reference.name))
                  ? "Special Session"
                  : formatSessionKind(session.sessionKind),
        sessionChair: session.sessionChair,
        expectedCount: effectiveCount,
        showCountUnderChair:
          sessionDateForCorrection &&
          sessionDateForCorrection.getFullYear() === 2026 &&
          sessionDateForCorrection.getMonth() === 9 &&
          sessionDateForCorrection.getDate() === 5 &&
          normaliseText(room) === "seminar room 2" &&
          normaliseText(rowTime) === "16:00 - 18:00" &&
          normaliseText(reference.name) ===
            "advances in machine learning and process-based models",
        presentations: uniqueSelected,
      });

      if (
        slotCandidates.length === 0 &&
        timedCandidates.length === 0 &&
        selected.length < reference.count
      ) {
        unresolvedReferences.push({
          name: reference.name,
          count: reference.count - selected.length,
        });
      }
    });

    presentations.sort(
      (a, b) => timeToMinutes(a.time) - timeToMinutes(b.time)
    );

    const expectedCount = presentationGroups.reduce(
      (total, group) => total + (group.expectedCount || 0),
      0
    );

    const linkedCount = presentations.length;
    const unresolvedCount = unresolvedReferences.reduce(
      (total, reference) => total + reference.count,
      0
    );

    return {
      references,
      expectedCount,
      linkedCount,
      unresolvedCount,
      unresolvedReferences,
      presentations,
      presentationGroups,
    };
  }

  function getSessionMetadataAtTime(room, date, startTime) {
    const roomKey = normaliseText(room);
    const targetStart = timeToMinutes(startTime);

    const matchedSession = presentationSessions.find((item) => {
      if (item.presentationType !== "oral") return false;
      if (!item.dates.some((itemDate) => sameCalendarDay(itemDate, date))) {
        return false;
      }
      if (roomKey && item.locationKey !== roomKey) return false;
      return timeToMinutes(item.time) === targetStart;
    });

    if (!matchedSession) return null;

    return {
      sessionName: matchedSession.sessionName || "",
      sessionKind: formatSessionKind(matchedSession.sessionKind),
      sessionChair: matchedSession.sessionChair || "",
      chairInfo: getChairInfo(matchedSession.sessionChair),
    };
  }

  function getWorkshopDetails(title, room, date, time) {
    const titleKey = normaliseText(title);
    const roomKey = normaliseText(room);
    const timeKey = normaliseText(time);

    if (!titleKey) return null;

    const candidates = workshops.filter((workshop) => {
      if (normaliseText(workshop.title) !== titleKey) return false;
      if (roomKey && normaliseText(workshop.room) !== roomKey) return false;
      if (timeKey && normaliseText(workshop.time) !== timeKey) return false;
      if (date && workshop.date && !sameCalendarDay(workshop.date, date)) return false;
      return true;
    });

    return candidates[0] || null;
  }

  function openWorkshopDetails(title, room, date, time) {
    const workshop = getWorkshopDetails(title, room, date, time);
    if (!workshop) return;
    setSelectedWorkshop(workshop);
  }

  function closeWorkshopDetails() {
    setSelectedWorkshop(null);
  }

  function openPresentationGroup(roomText, room, date, rowTime, rowId) {
    const group = getSessionPresentationGroup(
      roomText,
      room,
      date,
      rowTime,
      rowId
    );

    if (!group.expectedCount && !group.presentations.length) return;

    const sessionDateForTitleCorrection = excelDateToDate(date);
    const isFiveOctoberSixteenHundredAuditorium =
      sessionDateForTitleCorrection &&
      sessionDateForTitleCorrection.getFullYear() === 2026 &&
      sessionDateForTitleCorrection.getMonth() === 9 &&
      sessionDateForTitleCorrection.getDate() === 5 &&
      normaliseText(room) === "auditorium" &&
      normaliseText(rowTime) === "16:00 - 18:00";

    const isEightOctoberEnvironmentalHumanHealthTitle =
      sessionDateForTitleCorrection &&
      sessionDateForTitleCorrection.getFullYear() === 2026 &&
      sessionDateForTitleCorrection.getMonth() === 9 &&
      sessionDateForTitleCorrection.getDate() === 8 &&
      normaliseText(room) === "auditorium" &&
      normaliseText(rowTime) === "16:00 - 18:00";

    const correctedTitle = isEightOctoberEnvironmentalHumanHealthTitle
      ? roomText.replace(
          /Human Health\s*\(2\)/i,
          "Human Health (3)" 
        )
      : isFiveOctoberSixteenHundredAuditorium
        ? roomText.replace(
            /Mercury monitoring for effectiveness evaluation\s*\(2\)/i,
            "Mercury monitoring for effectiveness evaluation (2)"
          )
        : roomText;

    const dynamicTitle =
      group.presentationGroups.length > 0
        ? group.presentationGroups
            .map((item) => {
              const baseName = formatProgrammeCategory(item.name);
              const count =
                item.presentations?.length ??
                item.presentationCount ??
                item.expectedCount ??
                0;

              return count > 0 ? `${baseName} (${count})` : baseName;
            })
            .join(" + ")
        : formatProgrammeCategory(correctedTitle);

    setSelectedPresentationGroup({
      title: dynamicTitle || correctedTitle,
      room,
      date,
      rowTime,
      ...group,
    });
  }

  function openSinglePresentationGroup(group, room, date, rowTime) {
    if (!group) return;

    const presentations = Array.isArray(group.presentations)
      ? group.presentations
      : [];
    const expectedCount =
      group.expectedCount ??
      group.presentationCount ??
      presentations.length;
    const linkedCount = presentations.length;
    const unresolvedCount = Math.max(0, expectedCount - linkedCount);
    const baseTitle = formatProgrammeCategory(group.name);
    const displayCount =
      presentations.length ||
      group.presentationCount ||
      group.expectedCount ||
      0;

    setSelectedPresentationGroup({
      title:
        displayCount > 0
          ? `${baseTitle} (${displayCount})`
          : baseTitle,
      room,
      date,
      rowTime,
      expectedCount,
      linkedCount,
      unresolvedCount,
      unresolvedReferences:
        unresolvedCount > 0
          ? [{ name: group.name, count: unresolvedCount }]
          : [],
      presentations,
      presentationGroups: [group],
    });
  }

  function openProgrammeInfoPopup({
    title,
    description,
    date,
    room,
    rowTime,
  }) {
    if (!title || !description) return;

    setSelectedPresentationGroup({
      title,
      room,
      date,
      rowTime,
      expectedCount: 0,
      linkedCount: 0,
      unresolvedCount: 0,
      unresolvedReferences: [],
      presentations: [],
      presentationGroups: [
        {
          name: description,
          sessionKind: "",
          sessionChair: "",
          presentations: [],
        },
      ],
    });
  }

  function openToxicTrailSpecialSession(date, room) {
    const matchedSession = findBestSessionForReference(
      "Toxic Trail of Beauty",
      room,
      date
    );

    if (!matchedSession) return;

    const toxicTrailPresentations = presentationSessions
      .filter((item) => {
        if (item.presentationType !== "oral") return false;
        if (item.sessionNameKey !== matchedSession.sessionNameKey) return false;
        if (!item.dates.some((itemDate) => sameCalendarDay(itemDate, date))) {
          return false;
        }

        const range = parseTimeRange(item.time);
        return Boolean(range) && range.start >= 16 * 60;
      })
      .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

    if (!toxicTrailPresentations.length) return;

    const chairInfo = getChairInfo(matchedSession.sessionChair);
    const presentationCount = toxicTrailPresentations.length;
    const firstTime = cleanText(toxicTrailPresentations[0]?.time);
    const lastTime = cleanText(
      toxicTrailPresentations[toxicTrailPresentations.length - 1]?.time
    );
    const firstStart = firstTime.match(/^(\d{1,2}:\d{2})/)?.[1] || "";
    const lastEnd =
      lastTime.match(/(?:[-–—]|to)\s*(\d{1,2}:\d{2})\s*$/i)?.[1] || "";
    const sessionTime =
      firstStart && lastEnd ? `${firstStart} - ${lastEnd}` : firstTime;

    const sessionTitle = `${matchedSession.sessionName} (${presentationCount})`;

    setSelectedPresentationGroup({
      title: sessionTitle,
      room,
      date,
      rowTime: sessionTime,
      expectedCount: presentationCount,
      linkedCount: presentationCount,
      unresolvedCount: 0,
      unresolvedReferences: [],
      presentations: toxicTrailPresentations,
      presentationGroups: [
        {
          name: matchedSession.sessionName,
          presentationCount,
          sessionKind: formatSessionKind(matchedSession.sessionKind),
          sessionChair: matchedSession.sessionChair || "",
          chairInfo,
          presentations: toxicTrailPresentations,
        },
      ],
    });
  }

  function closePresentationGroup() {
    setSelectedPresentationGroup(null);
  }

  /*
   * =======================================================
   * PROGRAMME SEARCH
   * =======================================================
   *
   * Search the same presentation records used by the Programme.
   * This lets participants search for a person, presentation,
   * session, abstract ID, chair, or room directly from the header.
   */
  const programmeSearchResults = (() => {
    const query = normaliseText(programmeSearchQuery);

    if (query.length < 2) return [];

    const queryTokens = query.split(" ").filter(Boolean);
    const matches = [];

    presentationSessions.forEach((presentation) => {
      const searchableParts = [
        presentation.leadAuthor,
        presentation.coAuthors,
        presentation.title,
        presentation.sessionName,
        presentation.abstractId,
        presentation.sessionChair,
        presentation.location,
        presentation.presentationType,
      ];

      const haystack = normaliseText(searchableParts.join(" | "));
      if (!haystack) return;

      const matchesAllTokens = queryTokens.every((token) =>
        haystack.includes(token)
      );
      if (!matchesAllTokens) return;

      const leadAuthorKey = normaliseText(presentation.leadAuthor);
      const coAuthorsKey = normaliseText(presentation.coAuthors);
      const titleKey = normaliseText(presentation.title);
      const sessionKey = normaliseText(presentation.sessionName);
      const abstractIdKey = normaliseText(presentation.abstractId);

      let score = 0;
      if (leadAuthorKey.includes(query)) score += 100;
      if (coAuthorsKey.includes(query)) score += 90;
      if (titleKey.includes(query)) score += 80;
      if (sessionKey.includes(query)) score += 70;
      if (abstractIdKey.includes(query)) score += 60;
      if (haystack === query) score += 50;

      if (presentation.presentationType === "poster") {
        matches.push({
          kind: "presentation",
          presentation,
          date: null,
          score,
        });
        return;
      }

      const dates =
        Array.isArray(presentation.dates) && presentation.dates.length
          ? presentation.dates
          : [null];

      dates.forEach((date) => {
        matches.push({
          kind: "presentation",
          presentation,
          date,
          score,
        });
      });
    });

    workshops.forEach((workshop) => {
      const peopleSearchText = (workshop.people || [])
        .flatMap((person) => [
          person.name,
          person.affiliation,
          person.bio,
          person.role,
        ])
        .join(" | ");

      const searchableParts = [
        workshop.title,
        workshop.leads,
        workshop.coLeads,
        workshop.description,
        workshop.room,
        workshop.time,
        peopleSearchText,
        "workshop",
      ];

      const haystack = normaliseText(searchableParts.join(" | "));
      if (!haystack) return;

      const matchesAllTokens = queryTokens.every((token) =>
        haystack.includes(token)
      );
      if (!matchesAllTokens) return;

      const titleKey = normaliseText(workshop.title);
      const leadsKey = normaliseText(workshop.leads);
      const coLeadsKey = normaliseText(workshop.coLeads);
      const peopleKey = normaliseText(peopleSearchText);
      const descriptionKey = normaliseText(workshop.description);

      let score = 0;
      if (titleKey.includes(query)) score += 100;
      if (leadsKey.includes(query)) score += 95;
      if (coLeadsKey.includes(query)) score += 92;
      if (peopleKey.includes(query)) score += 90;
      if (descriptionKey.includes(query)) score += 70;
      if (haystack === query) score += 50;

      matches.push({
        kind: "workshop",
        workshop,
        date: workshop.date,
        score,
      });
    });

    const seen = new Set();

    return matches
      .filter((result) => {
        const resultDate = excelDateToDate(result.date);
        const dateKey = resultDate
          ? `${resultDate.getFullYear()}-${resultDate.getMonth()}-${resultDate.getDate()}`
          : "no-date";

        const itemKey =
          result.kind === "workshop"
            ? `workshop::${result.workshop.id}`
            : `presentation::${result.presentation.id}`;

        const key = `${itemKey}::${dateKey}`;

        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;

        const aDate = excelDateToDate(a.date);
        const bDate = excelDateToDate(b.date);

        if (aDate && bDate && aDate.getTime() !== bDate.getTime()) {
          return aDate.getTime() - bDate.getTime();
        }
        if (aDate && !bDate) return -1;
        if (!aDate && bDate) return 1;

        const aTime =
          a.kind === "workshop"
            ? a.workshop.time
            : a.presentation.time;
        const bTime =
          b.kind === "workshop"
            ? b.workshop.time
            : b.presentation.time;

        return timeToMinutes(aTime) - timeToMinutes(bTime);
      })
      .slice(0, 16);
  })();

  function openProgrammeSearchResult(result) {
    setProgrammeSearchQuery("");

    if (result?.kind === "workshop" && result.workshop) {
      const workshopDate = excelDateToDate(result.workshop.date);

      if (workshopDate) {
        const dateIndex = schedule.findIndex((day) =>
          sameCalendarDay(day?.date, workshopDate)
        );
        if (dateIndex >= 0) setSelectedDateIndex(dateIndex);
      }

      setPage("program");
      setSelectedWorkshop(result.workshop);
      return;
    }

    const presentation = result?.presentation;
    if (!presentation) return;

    if (presentation.presentationType === "poster") {
      setSelectedDateIndex(schedule.length);
      setPage("program");
      setSelectedPresentationGroup({
        title: presentation.title || "Poster",
        room: presentation.location,
        date: null,
        rowTime: presentation.time || "Throughout conference",
        expectedCount: 1,
        linkedCount: 1,
        unresolvedCount: 0,
        unresolvedReferences: [],
        presentations: [presentation],
        presentationGroups: [
          {
            name: presentation.sessionName || "Poster",
            sessionKind: "Poster",
            sessionChair: presentation.sessionChair || "",
            presentations: [presentation],
          },
        ],
      });
      return;
    }

    const resultDate = excelDateToDate(result?.date);

    if (resultDate) {
      const dateIndex = schedule.findIndex((day) =>
        sameCalendarDay(day?.date, resultDate)
      );
      if (dateIndex >= 0) setSelectedDateIndex(dateIndex);
    }

    setPage("program");

    /*
     * Oral/award search results open directly in the same in-window
     * detail modal used by normal programme sessions, but focused on
     * the specific searched presentation.
     */
    setSelectedPresentationGroup({
      title: presentation.sessionName || presentation.title,
      room: presentation.location,
      date: resultDate,
      rowTime: presentation.time,
      expectedCount: 1,
      linkedCount: 1,
      unresolvedCount: 0,
      unresolvedReferences: [],
      presentations: [presentation],
      presentationGroups: [
        {
          name: presentation.sessionName || "Presentation",
          sessionKind: presentation.sessionKind || "",
          sessionChair: presentation.sessionChair || "",
          presentations: [presentation],
        },
      ],
    });
  }


  return {
    isPosterView,
    selectedDay,
    sortedSavedItems,
    allPosters,
    getChairInfo,
    getSessionPresentationGroup,
    getSessionMetadataAtTime,
    getWorkshopDetails,
    openWorkshopDetails,
    closeWorkshopDetails,
    selectedWorkshop,
    openPresentationGroup,
    openSinglePresentationGroup,
    openProgrammeInfoPopup,
    openToxicTrailSpecialSession,
    selectedPresentationGroup,
    closePresentationGroup,
    programmeSearchQuery,
    setProgrammeSearchQuery,
    programmeSearchResults,
    openProgrammeSearchResult,
  };
}
