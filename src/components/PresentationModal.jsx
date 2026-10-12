import { useConference } from "../context/useConference";
import { formatDate } from "../utils/dateTime";

export default function PresentationModal() {
  const { selectedPresentationGroup, closePresentationGroup, isSaved, toggleSave } = useConference();
  return (
    <>
      {selectedPresentationGroup && (
        <div
          className="presentation-modal-backdrop"
          role="presentation"
          onClick={closePresentationGroup}
        >
          <div
            className="presentation-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Individual presentations"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="presentation-modal-header">
              <div>
                <div className="presentation-modal-kicker">
                  {formatDate(selectedPresentationGroup.date)}
                  {selectedPresentationGroup.room
                    ? ` · ${selectedPresentationGroup.room}`
                    : ""}
                </div>
                <h3>{selectedPresentationGroup.title}</h3>
              </div>

              <button
                type="button"
                className="presentation-modal-close"
                onClick={closePresentationGroup}
                aria-label="Close presentation details"
              >
                ×
              </button>
            </div>

            <div className="presentation-modal-body">
              <div className="presentation-detail-list">
                {selectedPresentationGroup.presentationGroups.map((group, groupIndex) => (
                  <div
                    className="presentation-group"
                    key={`${group.name}-${groupIndex}`}
                  >
                    <h4 className="presentation-group-heading">
                      {group.name}
                      {group.presentations?.length > 0
                        ? ` (${group.presentations.length})`
                        : ""}
                    </h4>

                    {group.presentations.map((presentation) => {
                      const item = {
                        id: presentation.id,
                        title: presentation.title,
                        category:
                          presentation.presentationType === "award"
                            ? "Award"
                            : presentation.presentationType === "poster"
                              ? "Poster"
                              : "Oral presentation",
                        time: presentation.time,
                        room: selectedPresentationGroup.room,
                        date: selectedPresentationGroup.date,
                        abstractId: presentation.abstractId,
                        leadAuthor: presentation.leadAuthor,
                        coAuthors: presentation.coAuthors,
                      };

                      return (
                        <article className="presentation-detail-card" key={presentation.id}>
                          <div className="presentation-detail-topline">
                            <span>{presentation.time || "Time to be confirmed"}</span>
                            {presentation.presentationType !== "award" && (
                              <span>
                                Abstract ID: {presentation.abstractId || "Not listed"}
                              </span>
                            )}
                          </div>

                          <h4>{presentation.title || "Presentation title not available"}</h4>

                          {presentation.presentationType === "award" ? (
                            presentation.leadAuthor ? (
                              <div className="presentation-award-name">
                                {presentation.leadAuthor}
                              </div>
                            ) : null
                          ) : (
                            <>
                              <div className="presentation-detail-field">
                                <strong>Lead author</strong>
                                <span>{presentation.leadAuthor || "Not listed"}</span>
                              </div>

                              <div className="presentation-detail-field">
                                <strong>Co-authors</strong>
                                <span>{presentation.coAuthors || "Not listed"}</span>
                              </div>
                            </>
                          )}

                          <button
                            className={
                              isSaved(item)
                                ? "save-button saved presentation-save-button"
                                : "save-button presentation-save-button"
                            }
                            onClick={() => toggleSave(item)}
                            aria-label={
                              isSaved(item)
                                ? "Remove presentation from My Schedule"
                                : "Save presentation to My Schedule"
                            }
                          >
                            {isSaved(item) ? "★" : "☆"}
                          </button>
                        </article>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
