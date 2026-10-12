import { useEffect, useState } from "react";
import {
  PINNED_ANNOUNCEMENTS_FILE,
  POPUP_ANNOUNCEMENTS_FILE,
} from "../utils/constants";

function splitSemicolonLine(line) {
  const fields = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ";" && !quoted) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  fields.push(current.trim());
  return fields;
}

function clean(value) {
  return String(value ?? "").trim().replace(/\\n/g, "\n");
}

function parseAnnouncementText(text, sourceName) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  if (lines.length <= 1) return [];

  return lines.slice(1).map((line, index) => {
    const fields = splitSemicolonLine(line);
    return {
      id: clean(fields[0]) || `${sourceName}-${index + 1}`,
      serialNo: clean(fields[0]),
      date: clean(fields[1]),
      priority: clean(fields[2]) || "Normal",
      title: clean(fields[3]),
      content: clean(fields.slice(4).join(";")),
    };
  }).filter((item) => item.title || item.content);
}

async function loadFile(path, sourceName) {
  const response = await fetch(`${path}?v=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`${sourceName} could not be loaded (${response.status}).`);
  }
  return parseAnnouncementText(await response.text(), sourceName);
}

export function useAnnouncements() {
  const [pinnedAnnouncements, setPinnedAnnouncements] = useState([]);
  const [popupAnnouncements, setPopupAnnouncements] = useState([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadAnnouncements() {
      try {
        const [pinned, popup] = await Promise.all([
          loadFile(PINNED_ANNOUNCEMENTS_FILE, "Pinned announcements"),
          loadFile(POPUP_ANNOUNCEMENTS_FILE, "Popup announcements"),
        ]);

        if (!isMounted) return;
        setPinnedAnnouncements(pinned);
        setPopupAnnouncements(popup);
        setAnnouncementsError("");
      } catch (error) {
        console.error("Could not load announcements:", error);
        if (!isMounted) return;
        setPinnedAnnouncements([]);
        setPopupAnnouncements([]);
        setAnnouncementsError("Announcements could not be loaded right now.");
      } finally {
        if (isMounted) setAnnouncementsLoading(false);
      }
    }

    loadAnnouncements();
    return () => {
      isMounted = false;
    };
  }, []);

  return {
    pinnedAnnouncements,
    popupAnnouncements,
    announcementsLoading,
    announcementsError,
  };
}
