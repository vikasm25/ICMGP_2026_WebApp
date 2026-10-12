import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { PROGRAMME_FILE } from "../utils/constants";
import { parsePresentationSheets } from "../utils/programmeParser";
import { parseScheduleSheet } from "../utils/scheduleParser";
import { parseWorkshopsSheet } from "../utils/workshopParser";

export function useProgrammeData() {
  const [schedule, setSchedule] = useState([]);
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [presentationSessions, setPresentationSessions] = useState([]);
  const [workshops, setWorkshops] = useState([]);

  useEffect(() => {
    async function loadSchedule() {
      try {
        const response = await fetch(PROGRAMME_FILE, { cache: "no-store" });
        if (!response.ok) {
          throw new Error(`Programme workbook could not be loaded (${response.status}).`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array", cellDates: false });
        const workshops = parseWorkshopsSheet(workbook);
        const days = parseScheduleSheet(workbook, workshops);
        setSchedule(days);
        setPresentationSessions(parsePresentationSheets(workbook));
        setWorkshops(workshops);
        setSelectedDateIndex((current) => (current >= days.length ? 0 : current));
      } catch (error) {
        console.error("Could not load final programme:", error);
        setSchedule([]);
        setPresentationSessions([]);
        setWorkshops([]);
      }
    }
    loadSchedule();
  }, []);

  return {
    schedule,
    selectedDateIndex,
    setSelectedDateIndex,
    presentationSessions,
    workshops,
  };
}
