import { useState } from "react";
import "./CSS/index.css";
import { ConferenceProvider } from "./context/ConferenceContext";
import { useAnnouncements } from "./hooks/useAnnouncements";
import { useProgrammeData } from "./hooks/useProgrammeData";
import { useProgrammeInteractions } from "./hooks/useProgrammeInteractions";
import { useSavedSchedule } from "./hooks/useSavedSchedule";
import { useVisualSettings } from "./styles/useVisualSettings";
import Header from "./components/Header";
import BottomNav from "./components/BottomNav";
import AnnouncementPopup from "./components/AnnouncementPopup";
import PresentationModal from "./components/PresentationModal";
import WorkshopModal from "./components/WorkshopModal";
import Home from "./pages/Home";
import Programme from "./pages/Programme";
import MySchedule from "./pages/MySchedule";
import MapPage from "./pages/MapPage";
import Announcements from "./pages/Announcements";
import Sponsors from "./pages/Sponsors";
import SpecialIssues from "./pages/SpecialIssues";
import Info from "./pages/Info";

function App() {
  const [page, setPage] = useState("home");
  const [announcementPopupOpen, setAnnouncementPopupOpen] = useState(false);
  const [hasLeftHome, setHasLeftHome] = useState(false);

  useVisualSettings();
  const programme = useProgrammeData();
  const saved = useSavedSchedule();
  const announcements = useAnnouncements();

  function goToPage(targetPage) {
    if (!hasLeftHome && page === "home" && targetPage !== "home") {
      setHasLeftHome(true);
      if (
        targetPage !== "announcements" &&
        announcements.popupAnnouncements.length > 0
      ) {
        setAnnouncementPopupOpen(true);
      }
    }
    setPage(targetPage);
  }

  function closeAnnouncementPopup() {
    setAnnouncementPopupOpen(false);
  }

  function openMap(query) {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  const interactions = useProgrammeInteractions({
    schedule: programme.schedule,
    selectedDateIndex: programme.selectedDateIndex,
    setSelectedDateIndex: programme.setSelectedDateIndex,
    presentationSessions: programme.presentationSessions,
    workshops: programme.workshops,
    savedItems: saved.savedItems,
    setPage: goToPage,
  });

  const app = {
    page,
    setPage: goToPage,
    goToPage,
    openMap,
    announcementPopupOpen,
    closeAnnouncementPopup,
    ...programme,
    ...saved,
    ...announcements,
    ...interactions,
  };

  return (
    <ConferenceProvider value={app}>
      <div className={`app ${page === "home" ? "app-home" : ""}`}>
        <Header />
        <main className={`app-content ${page === "home" ? "app-content-home" : ""}`}>
          {page === "home" && <Home />}
          {page === "program" && <Programme />}
          {page === "saved" && <MySchedule />}
          {page === "map" && <MapPage />}
          {page === "announcements" && <Announcements />}
          {page === "sponsors" && <Sponsors />}
          {page === "special-issues" && <SpecialIssues />}
          {page === "info" && <Info />}
        </main>
        <BottomNav />
        <AnnouncementPopup />
        <PresentationModal />
        <WorkshopModal />
      </div>
    </ConferenceProvider>
  );
}

export default App;
