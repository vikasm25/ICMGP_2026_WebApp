import logo from "../assets/ICMGP-2026-logo.png";
import { useConference } from "../context/useConference";
import { excelDateToDate, formatDate } from "../utils/dateTime";
import { normaliseText } from "../utils/programmeFormatting";

export default function Header() {
  const { page, goToPage, programmeSearchQuery, setProgrammeSearchQuery, programmeSearchResults, openProgrammeSearchResult } = useConference();
  return (
    <header className="app-header">

      <div className="header-inner">

        <img
          src={logo}
          alt="ICMGP 2026"
          className="app-logo"
        />

        <div className="header-title">

          <div className="header-main-title">
            ICMGP 2026
          </div>

          <div className="header-subtitle">
            Hyderabad, India
          </div>

        </div>

        <div className="programme-search">
          <div className="programme-search-box">
            <span className="programme-search-icon" aria-hidden="true">
              🔍
            </span>

            <input
              type="search"
              value={programmeSearchQuery}
              onChange={(event) =>
                setProgrammeSearchQuery(event.target.value)
              }
              placeholder="Search programme..."
              aria-label="Search oral presentations, posters, workshops, people, sessions, rooms, or abstract IDs"
            />
          </div>

          {normaliseText(programmeSearchQuery).length >= 2 && (
            <div
              className="programme-search-results"
              role="listbox"
              aria-label="Programme search results"
            >
              {programmeSearchResults.length > 0 ? (
                programmeSearchResults.map((result) => {
                  const isWorkshop = result.kind === "workshop";
                  const workshop = result.workshop;
                  const presentation = result.presentation;
                  const resultDate = excelDateToDate(result.date);

                  const key = isWorkshop
                    ? `workshop::${workshop.id}`
                    : `${presentation.id}::${resultDate
                        ? resultDate.toISOString().slice(0, 10)
                        : "no-date"
                    }`;

                  return (
                    <button
                      type="button"
                      className="programme-search-result"
                      key={key}
                      onClick={() =>
                        openProgrammeSearchResult(result)
                      }
                    >
                      <div className="programme-search-result-kind">
                        {isWorkshop
                          ? "🧩 WORKSHOP"
                          : presentation.presentationType === "poster"
                            ? "🖼️ POSTER"
                            : "🗣️ ORAL"}
                      </div>

                      {!isWorkshop && presentation.abstractId && (
                        <div className="programme-search-result-abstract">
                          Abstract ID: {presentation.abstractId}
                        </div>
                      )}

                      <div className="programme-search-result-title">
                        {isWorkshop
                          ? workshop.title
                          : presentation.title ||
                            "Presentation title not available"}
                      </div>

                      {isWorkshop ? (
                        <>
                          {workshop.leads && (
                            <div className="programme-search-result-author">
                              <strong>Leads:</strong>{" "}
                              {workshop.leads}
                            </div>
                          )}

                          {workshop.coLeads && (
                            <div className="programme-search-result-author">
                              <strong>Co-Leads:</strong>{" "}
                              {workshop.coLeads}
                            </div>
                          )}

                          <div className="programme-search-result-meta">
                            {resultDate
                              ? formatDate(resultDate)
                              : "Date not listed"}
                            {" · "}
                            {workshop.time || "Time to be confirmed"}
                            {workshop.room
                              ? ` · ${workshop.room}`
                              : ""}
                          </div>
                        </>
                      ) : (
                        <>
                          {presentation.leadAuthor && (
                            <div className="programme-search-result-author">
                              <strong>Lead author:</strong>{" "}
                              {presentation.leadAuthor}
                            </div>
                          )}

                          {presentation.coAuthors && (
                            <div className="programme-search-result-author">
                              <strong>Co-authors:</strong>{" "}
                              {presentation.coAuthors}
                            </div>
                          )}

                          {presentation.presentationType === "poster" ? (
                            <div className="programme-search-result-meta programme-search-result-poster-meta">
                              Poster
                            </div>
                          ) : (
                            <div className="programme-search-result-meta">
                              {resultDate
                                ? formatDate(resultDate)
                                : "Date not listed"}
                              {" · "}
                              {presentation.time ||
                                "Time to be confirmed"}
                              {presentation.location
                                ? ` · ${presentation.location}`
                                : ""}
                            </div>
                          )}

                          {presentation.sessionName && (
                            <div className="programme-search-result-session">
                              <strong>Session:</strong>{" "}
                              {presentation.sessionName}
                            </div>
                          )}
                        </>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="programme-search-empty">
                  No programme matches found.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="header-actions">
          <button
            type="button"
            className={page === "announcements" ? "header-action active" : "header-action"}
            onClick={() => goToPage("announcements")}
            aria-label="Announcements"
            title="Announcements"
          >
            <span aria-hidden="true">🔔</span>
          </button>

          <button
            type="button"
            className={page === "info" ? "header-action active" : "header-action"}
            onClick={() => goToPage("info")}
            aria-label="Info"
            title="Info"
          >
            <span aria-hidden="true">ℹ</span>
          </button>

          <button
            type="button"
            className={page === "map" ? "header-action active" : "header-action"}
            onClick={() => goToPage("map")}
            aria-label="Map"
            title="Map"
          >
            <span aria-hidden="true">📍</span>
          </button>
        </div>

      </div>

    </header>
  );
}
