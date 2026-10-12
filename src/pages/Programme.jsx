import { useConference } from "../context/useConference";
import { COMPLEXION_EVENT_URL } from "../utils/constants";
import { formatDate, formatShortDate } from "../utils/dateTime";
import { formatProgrammeCategory, normaliseText, shouldHideProgrammeLabel } from "../utils/programmeFormatting";
export default function Programme() {
  const { schedule, selectedDateIndex, setSelectedDateIndex, selectedDay, isPosterView, allPosters, openPresentationGroup, openSinglePresentationGroup, openProgrammeInfoPopup, openToxicTrailSpecialSession, openWorkshopDetails, getWorkshopDetails, isSaved, toggleSave, getChairInfo, getSessionPresentationGroup, getSessionMetadataAtTime } = useConference();

  return (
    <section className="program-page">

      <div className="page-heading">

        <h2>
          Programme
        </h2>

        <p>
          Select a day to view the programme.
        </p>

      </div>

      <div className="date-selector">

        {schedule.map(
          (day, index) => (

            <button
              key={
                day.date?.toISOString() ||
                index
              }
              className={
                selectedDateIndex === index
                  ? "date-button active"
                  : "date-button"
              }
              onClick={() =>
                setSelectedDateIndex(
                  index
                )
              }
            >
              {formatShortDate(
                day.date
              )}
            </button>

          )
        )}

        <button
          type="button"
          className={
            isPosterView
              ? "date-button active poster-tab-button"
              : "date-button poster-tab-button"
          }
          onClick={() => setSelectedDateIndex(schedule.length)}
        >
          Posters
        </button>

      </div>

      {selectedDay && (

        <div className="day-program">

          <h3>
            {formatDate(
              selectedDay.date
            )}
          </h3>

          {/* =========================================
              ROOM TIMETABLE
              ========================================= */}

          {selectedDay.rooms.length > 0 &&
            selectedDay.rows.length > 0 && (

              <div className="programme-table-wrapper">

                <div
                  className="programme-grid"
                  style={{
                    gridTemplateColumns:
                      `minmax(150px, 0.9fr) repeat(${selectedDay.rooms.length}, minmax(180px, 1fr))`,
                  }}
                >

                  <div className="programme-header">
                    Time / Session
                  </div>

                  {selectedDay.rooms.map(
                    (
                      room,
                      index
                    ) => (

                      <div
                        className="programme-header"
                        key={`${room}-${index}`}
                      >
                        {room}
                      </div>

                    )
                  )}

                  {selectedDay.rows.map(
                    (row) =>
                      row.isTableSpecialFullWidth ? (
                        <div
                          className="programme-full-width-row programme-table-special-row-inside"
                          key={row.id}
                        >
                          <div className="programme-full-width-time">
                            {row.time}
                          </div>
                          <div className="programme-full-width-title">
                            {row.tableSpecialTitle}
                          </div>
                        </div>
                      ) : row.isConferenceWide ? (
                        <div
                          className="programme-full-width-row"
                          key={row.id}
                        >
                          <div className="programme-full-width-time">
                            {row.time}
                          </div>
                          <div className="programme-full-width-title">
                            {row.conferenceWideTitle}
                          </div>
                        </div>
                      ) : row.isPartialMerge ? (
                        <div
                          className="programme-row programme-partial-merge-row"
                          key={row.id}
                          style={{ display: "contents" }}
                        >
                          <div
                            className="programme-partial-merge-cell programme-partial-merge-cell-with-time"
                            key={`${row.id}-merged-break`}
                            style={{
                              gridColumn: `1 / ${2 + row.partialMergeRoomIndex}`,
                            }}
                          >
                            <strong>{row.partialMergeTitle}</strong>
                            {row.time && <span>{row.time}</span>}
                          </div>

                          {selectedDay.rooms.map((room, roomIndex) => {
                            const roomText = row.rooms[roomIndex] || "";

                            if (roomIndex < row.partialMergeRoomIndex) {
                              return null;
                            }

                            const item = {
                              id: `${row.id}-${roomIndex}`,
                              title: roomText || row.partialMergeTitle || "Special Event",
                              category: row.category,
                              time: row.time,
                              room,
                              date: row.date,
                            };

                            if (!roomText) {
                              return (
                                <div
                                  className="programme-cell empty"
                                  key={`${row.id}-${roomIndex}`}
                                >
                                  —
                                </div>
                              );
                            }

                            return (
                              <div
                                className="programme-cell programme-special-room-cell"
                                key={`${row.id}-${roomIndex}`}
                              >
                                <div className="programme-item-title">
                                  {formatProgrammeCategory(roomText)}
                                </div>

                                {row.category === "COMPLEXion of Change event" && (
                                  <a
                                    className="programme-external-link"
                                    href={COMPLEXION_EVENT_URL}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(event) => event.stopPropagation()}
                                  >
                                    View event details
                                  </a>
                                )}

                                <button
                                  className={
                                    isSaved(item)
                                      ? "save-button saved"
                                      : "save-button"
                                  }
                                  onClick={() => toggleSave(item)}
                                  aria-label={
                                    isSaved(item)
                                      ? "Remove from My Schedule"
                                      : "Save to My Schedule"
                                  }
                                >
                                  {isSaved(item) ? "★" : "☆"}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div
                          className="programme-row"
                          key={row.id}
                          style={{ display: "contents" }}
                        >
                          <div className="programme-time-cell">
                            {row.time && <strong>{row.time}</strong>}
                            {(() => {
                              const programmeLabel = formatProgrammeCategory(row.category);
                              return programmeLabel && !shouldHideProgrammeLabel(
                                programmeLabel,
                                row.date,
                                row.time
                              ) ? (
                                <div className="programme-time-session-label">
                                  {programmeLabel}
                                </div>
                              ) : null;
                            })()}
                          </div>

                          {selectedDay.rooms.map((room, roomIndex) => {
                            const roomText = row.rooms[roomIndex] || "";

                            if (!roomText) {
                              return (
                                <div
                                  className="programme-cell empty"
                                  key={`${row.id}-${roomIndex}`}
                                >
                                  —
                                </div>
                              );
                            }

                            if (roomText === "SIX_OCTOBER_COMPLEXION_TOXIC_TRAIL_STACK") {
                              const toxicTrailSession = getSessionMetadataAtTime(
                                room,
                                row.date,
                                "16:45"
                              );
                              const toxicTrailChairInfo = toxicTrailSession?.chairInfo;

                              return (
                                <div
                                  className="programme-cell programme-special-stacked-cell"
                                  key={`${row.id}-${roomIndex}`}
                                >
                                  <div
                                    className="programme-special-stacked-event programme-session-button"
                                    role="button"
                                    tabIndex={0}
                                    onClick={() =>
                                      openProgrammeInfoPopup({
                                        title: "COMPLEXion of Change event",
                                        description: "Screening of documentary on skin lightening and conversation with the producer",
                                        date: row.date,
                                        room,
                                        rowTime: "15:45 - 16:45",
                                      })
                                    }
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        openProgrammeInfoPopup({
                                          title: "COMPLEXion of Change event",
                                          description: "Screening of documentary on skin lightening and conversation with the producer",
                                          date: row.date,
                                          room,
                                          rowTime: "15:45 - 16:45",
                                        });
                                      }
                                    }}
                                  >
                                    <span className="programme-special-stacked-time">
                                      15:45 to 16:45
                                    </span>
                                    <span className="programme-special-stacked-title">
                                      COMPLEXion of Change event
                                    </span>
                                  </div>
                                  <div
                                    className="programme-special-stacked-event programme-special-stacked-event-secondary programme-session-button"
                                    role="button"
                                    tabIndex={0}
                                    onClick={() =>
                                      openToxicTrailSpecialSession(row.date, room)
                                    }
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault();
                                        openToxicTrailSpecialSession(row.date, room);
                                      }
                                    }}
                                  >
                                    <span className="programme-special-stacked-time">
                                      16:45 to 18:15
                                    </span>
                                    {toxicTrailSession?.sessionKind && (
                                      <span className="programme-session-kind">
                                        {toxicTrailSession.sessionKind}
                                      </span>
                                    )}
                                    <span className="programme-special-stacked-title">
                                      The Toxic Trail of Beauty: Unpacking Mercury in Cosmetics through Data and Action
                                    </span>
                                    {toxicTrailChairInfo && (
                                      <div className="programme-session-chair programme-special-stacked-chair">
                                        <div>Chair: {toxicTrailChairInfo.chair}</div>
                                        {toxicTrailChairInfo.coChairs.length > 0 && (
                                          <div>
                                            Co-Chairs: {toxicTrailChairInfo.coChairs.join(", ")}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            }

                            const item = {
                              id: `${row.id}-${roomIndex}`,
                              title: roomText,
                              category: row.category,
                              time: row.time,
                              room,
                              date: row.date,
                            };

                            const presentationGroup =
                              getSessionPresentationGroup(
                                roomText,
                                room,
                                row.date,
                                row.time,
                                row.id
                              );

                            const workshopDetails =
                              /workshop/i.test(row.category || "")
                                ? getWorkshopDetails(
                                    roomText,
                                    room,
                                    row.date,
                                    row.time
                                  )
                                : null;

                            const isClickableSession =
                              Boolean(workshopDetails) ||
                              presentationGroup.expectedCount > 0 ||
                              presentationGroup.presentations.length > 0;

                            return (
                              <div
                                className={
                                  isClickableSession
                                    ? "programme-cell programme-cell-clickable"
                                    : "programme-cell"
                                }
                                key={`${row.id}-${roomIndex}`}
                              >
                                <button
                                  type="button"
                                  className={
                                    isClickableSession
                                      ? "programme-session-button"
                                      : "programme-session-button programme-session-button-static"
                                  }
                                  onClick={() => {
                                    if (workshopDetails) {
                                      openWorkshopDetails(
                                        roomText,
                                        room,
                                        row.date,
                                        row.time
                                      );
                                      return;
                                    }

                                    if (isClickableSession) {
                                      if (presentationGroup.presentationGroups.length > 1) {
                                        return;
                                      }

                                      openPresentationGroup(
                                        roomText,
                                        room,
                                        row.date,
                                        row.time,
                                        row.id
                                      );
                                    }
                                  }}
                                  disabled={!isClickableSession}
                                >
                                  {presentationGroup.presentationGroups.length > 0 ? (
                                    <div className="programme-topic-list">
                                      {(() => {
                                        const groups = presentationGroup.presentationGroups;
                                        const allSameKind =
                                          groups.length > 1 &&
                                          groups.every(
                                            (group) =>
                                              group.sessionKind &&
                                              group.sessionKind === groups[0].sessionKind
                                          );

                                        if (allSameKind) {
                                          return (
                                            <>
                                              <span className="programme-session-kind">
                                                {groups[0].sessionKind}
                                              </span>
                                              {groups.map((group, groupIndex) => (
                                                <div
                                                  className="programme-topic-block"
                                                  key={`${group.name}-${groupIndex}`}
                                                  onClick={(event) => {
                                                    if (groups.length <= 1 || workshopDetails) return;
                                                    event.stopPropagation();
                                                    openSinglePresentationGroup(
                                                      group,
                                                      room,
                                                      row.date,
                                                      row.time
                                                    );
                                                  }}
                                                >
                                                  <span className="programme-item-title programme-topic-name">
                                                    {group.name}
                                                  </span>
                                                  {group.sessionChair && /special session/i.test(group.sessionKind) && (() => {
                                                    const chairInfo = getChairInfo(group.sessionChair);
                                                    if (!chairInfo) return null;
                                                    return (
                                                      <>
                                                        <div className="programme-session-chair">
                                                          <div>Chair: {chairInfo.chair}</div>
                                                          {chairInfo.coChairs.length > 0 && (
                                                            <div>Co-Chairs: {chairInfo.coChairs.join(", ")}</div>
                                                          )}
                                                        </div>
                                                      </>
                                                    );
                                                  })()}
                                                </div>
                                              ))}
                                            </>
                                          );
                                        }

                                        return groups.map((group, groupIndex) => (
                                          <div
                                            className="programme-topic-block"
                                            key={`${group.name}-${groupIndex}`}
                                            onClick={(event) => {
                                              if (groups.length <= 1 || workshopDetails) return;
                                              event.stopPropagation();
                                              openSinglePresentationGroup(
                                                group,
                                                room,
                                                row.date,
                                                row.time
                                              );
                                            }}
                                          >
                                            {group.sessionKind && (
                                              <span className="programme-session-kind">
                                                {group.sessionKind}
                                              </span>
                                            )}
                                            <span className="programme-item-title programme-topic-name">
                                              {group.name}
                                            </span>
                                            {group.sessionChair && /special session/i.test(group.sessionKind) && (() => {
                                              const chairInfo = getChairInfo(group.sessionChair);
                                              if (!chairInfo) return null;
                                              return (
                                                <>
                                                  <div className="programme-session-chair">
                                                    <div>Chair: {chairInfo.chair}</div>
                                                    {chairInfo.coChairs.length > 0 && (
                                                      <div>Co-Chairs: {chairInfo.coChairs.join(", ")}</div>
                                                    )}
                                                  </div>
                                                </>
                                              );
                                            })()}
                                          </div>
                                        ));
                                      })()}
                                    </div>
                                  ) : (
                                    <span className="programme-item-title">
                                      {formatProgrammeCategory(roomText)}
                                    </span>
                                  )}
                                </button>

                                {row.category === "COMPLEXion of Change event" && (
                                  <a
                                    className="programme-external-link"
                                    href={COMPLEXION_EVENT_URL}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    UNEP event details
                                  </a>
                                )}

                                <button
                                  className={
                                    isSaved(item)
                                      ? "save-button saved"
                                      : "save-button"
                                  }
                                  onClick={() => toggleSave(item)}
                                  aria-label={
                                    isSaved(item)
                                      ? "Remove from My Schedule"
                                      : "Save to My Schedule"
                                  }
                                >
                                  {isSaved(item) ? "★" : "☆"}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )
                  )}


                </div>

              </div>

            )}

          {/* =========================================
              SPECIAL EVENTS

              This remains outside the timetable so
              Wednesday can work without room headings.
              ========================================= */}


          {selectedDay.specialEvents.length > 0 && (

            <div className="special-events">

              {selectedDay.specialEvents.map(
                (event) => {

                  const item = {
                    id:
                      event.id,
                    title:
                      event.title,
                    category:
                      "Special Event",
                    time:
                      event.time,
                    room:
                      event.room,
                    date:
                      event.date,
                  };

                  return (
                    <div
                      className={
                        event.displayKind === "award"
                          ? "special-event-card programme-award-event-card"
                          : "special-event-card"
                      }
                      key={
                        event.id
                      }
                    >

                      {event.time && (
                        <div className="special-event-time">
                          {
                            event.time
                          }
                        </div>
                      )}

                      {normaliseText(event.title) ===
                        "complexion of change event @ goethe-zentrum hyderabad" ? (
                        <a
                          className="special-event-title programme-external-link"
                          href={COMPLEXION_EVENT_URL}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(clickEvent) => clickEvent.stopPropagation()}
                        >
                          {event.title}
                        </a>
                      ) : (
                        <div className="special-event-title">
                          {event.title}
                        </div>
                      )}

                      {event.room && (
                        <div className="special-event-description">
                          {
                            event.room
                          }
                        </div>
                      )}

                      {event.description && (
                        <div className="special-event-description">
                          {
                            event.description
                          }
                        </div>
                      )}

                      <button
                        className={
                          isSaved(
                            item
                          )
                            ? "save-button saved"
                            : "save-button"
                        }
                        onClick={() =>
                          toggleSave(
                            item
                          )
                        }
                        aria-label={
                          isSaved(
                            item
                          )
                            ? "Remove from My Schedule"
                            : "Save to My Schedule"
                        }
                      >
                        {isSaved(
                          item
                        )
                          ? "★"
                          : "☆"}
                      </button>

                    </div>
                  );
                }
              )}

            </div>
          )}

          <p className="poster-availability-note poster-availability-note-daily">
            <strong>Posters:</strong> All posters can be displayed throughout the conference, 04 Oct 2026 to 09 Oct 2026. Specific times for presenters will be updated when they are recommended to be present.
          </p>

        </div>
      )}

      {isPosterView && (
        <section className="poster-section poster-page-section">
          <div className="poster-section-heading">
            <h4>Posters</h4>
          </div>

          <p className="poster-availability-note poster-availability-note-top">
            <strong>Posters:</strong> All posters can be displayed throughout the conference, 04 Oct 2026 to 09 Oct 2026. Specific times for presenters will be updated when they are recommended to be present.
          </p>

          <div className="poster-size-note">
            <div className="poster-size-item">
              <strong>Max. poster size:</strong>
              <span>A0</span>
            </div>

            <div className="poster-size-item">
              <strong>Can be printed at the</strong>
              <span>convention centre.</span>
            </div>

            <div className="poster-size-item">
              <strong>Recommended format for printing:</strong>
              <span>PDF with A0 size layout.</span>
            </div>
          </div>

          {allPosters.length > 0 ? (
            <div className="poster-list">
              {allPosters.map((poster) => {
                const item = {
                  id: poster.id,
                  title: poster.title,
                  category: "Poster",
                  time: poster.time || "Throughout conference",
                  room: poster.location,
                  date: null,
                  abstractId: poster.abstractId,
                  leadAuthor: poster.leadAuthor,
                  coAuthors: poster.coAuthors,
                };

                return (
                  <article className="poster-card" key={poster.id}>
                    <div className="poster-card-id">
                      Abstract ID: {poster.abstractId || "—"}
                    </div>
                    <h5>{poster.title}</h5>
                    <div className="poster-card-author-row">
                      <strong>Lead author:</strong>
                      <span>{poster.leadAuthor || "Not listed"}</span>
                    </div>
                    <div className="poster-card-author-row">
                      <strong>Co-authors:</strong>
                      <span>{poster.coAuthors || "Not listed"}</span>
                    </div>

                    <button
                      className={
                        isSaved(item)
                          ? "save-button saved poster-save-button"
                          : "save-button poster-save-button"
                      }
                      onClick={() => toggleSave(item)}
                      aria-label={
                        isSaved(item)
                          ? "Remove poster from My Schedule"
                          : "Save poster to My Schedule"
                      }
                    >
                      {isSaved(item) ? "★" : "☆"}
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="poster-empty">
              Poster details are not available in the programme workbook yet.
            </div>
          )}

        </section>
      )}

      {!selectedDay &&
        !isPosterView &&
        schedule.length === 0 && (

          <div className="loading-message">
            Loading programme…
          </div>

        )}

    </section>
  );
}
