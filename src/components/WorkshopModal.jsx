import { useConference } from "../context/useConference";
import { formatDate } from "../utils/dateTime";

function PersonCard({ person }) {
  return (
    <div className="workshop-person-card">
      <div className="workshop-person-role">{person.role}</div>
      <h4>{person.name || `${person.role} ${person.number}`}</h4>
      {person.affiliation && (
        <div className="workshop-person-affiliation">{person.affiliation}</div>
      )}
      {person.bio && (
        <div className="workshop-person-bio">{person.bio}</div>
      )}
    </div>
  );
}

export default function WorkshopModal() {
  const {
    selectedWorkshop,
    closeWorkshopDetails,
    isSaved,
    toggleSave,
  } = useConference();

  if (!selectedWorkshop) return null;

  const item = {
    id: selectedWorkshop.id,
    title: selectedWorkshop.title,
    category: "Workshop",
    time: selectedWorkshop.time,
    room: selectedWorkshop.room,
    date: selectedWorkshop.date,
  };

  const hasDetails =
    selectedWorkshop.leads ||
    selectedWorkshop.coLeads ||
    selectedWorkshop.description ||
    selectedWorkshop.people?.length;

  return (
    <div
      className="presentation-modal-backdrop"
      role="presentation"
      onClick={closeWorkshopDetails}
    >
      <div
        className="presentation-modal workshop-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Workshop details"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="presentation-modal-header">
          <div>
            <div className="presentation-modal-kicker">
              {formatDate(selectedWorkshop.date)}
              {selectedWorkshop.time ? ` · ${selectedWorkshop.time}` : ""}
              {selectedWorkshop.room ? ` · ${selectedWorkshop.room}` : ""}
            </div>
            <h3>{selectedWorkshop.title}</h3>
          </div>
          <button
            type="button"
            className="presentation-modal-close"
            onClick={closeWorkshopDetails}
            aria-label="Close workshop details"
          >
            ×
          </button>
        </div>

        <div className="presentation-modal-body">
          <div className="presentation-detail-list">
            <article className="presentation-detail-card workshop-detail-card">
              {selectedWorkshop.leads && (
                <div className="presentation-detail-field">
                  <strong>Leads</strong>
                  <span>{selectedWorkshop.leads}</span>
                </div>
              )}

              {selectedWorkshop.coLeads && (
                <div className="presentation-detail-field">
                  <strong>Co-Leads</strong>
                  <span>{selectedWorkshop.coLeads}</span>
                </div>
              )}

              {selectedWorkshop.description && (
                <div className="presentation-detail-field workshop-justified-field">
                  <strong>Description</strong>
                  <span>{selectedWorkshop.description}</span>
                </div>
              )}

              {selectedWorkshop.people?.length > 0 && (
                <section className="workshop-about-leads">
                  <h4>About Leads</h4>
                  <div className="workshop-people-list">
                    {selectedWorkshop.people.map((person) => (
                      <PersonCard
                        person={person}
                        key={`${person.role}-${person.number}`}
                      />
                    ))}
                  </div>
                </section>
              )}

              {!hasDetails && (
                <div className="presentation-detail-field">
                  <strong>Workshop details</strong>
                  <span>Details will be added in the Workshops worksheet.</span>
                </div>
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
                    ? "Remove workshop from My Schedule"
                    : "Save workshop to My Schedule"
                }
              >
                {isSaved(item) ? "★" : "☆"}
              </button>
            </article>
          </div>
        </div>
      </div>
    </div>
  );
}
