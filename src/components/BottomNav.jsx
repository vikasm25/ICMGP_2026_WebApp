import { useConference } from "../context/useConference";

export default function BottomNav() {
  const { page, goToPage } = useConference();
  return (
    <nav className="bottom-nav">
      <button className={page === "home" ? "nav-button active" : "nav-button"} onClick={() => goToPage("home")}>
        <span className="nav-icon">⌂</span>
        <span>Home</span>
      </button>

      <button className={page === "program" ? "nav-button active" : "nav-button"} onClick={() => goToPage("program")}>
        <span className="nav-icon">▤</span>
        <span>Programme</span>
      </button>

      <button className={page === "saved" ? "nav-button active" : "nav-button"} onClick={() => goToPage("saved")}>
        <span className="nav-icon">★</span>
        <span>My Schedule</span>
      </button>

      <button className={page === "sponsors" ? "nav-button active" : "nav-button"} onClick={() => goToPage("sponsors")}>
        <span className="nav-icon">◈</span>
        <span>Sponsors &amp;<br />Exhibitors</span>
      </button>

      <button className={page === "special-issues" ? "nav-button active" : "nav-button"} onClick={() => goToPage("special-issues")}>
        <span className="nav-icon">▥</span>
        <span>Special<br />Issues</span>
      </button>

    </nav>
  );
}
