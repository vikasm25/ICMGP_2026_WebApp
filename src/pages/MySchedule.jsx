import { useConference } from "../context/useConference";
import { formatDate } from "../utils/dateTime";
export default function MySchedule() {
  const { savedItems, sortedSavedItems, toggleSave } = useConference();
  return (
    <section className="saved-page">

      <div className="page-heading">

        <h2>
          My Schedule
        </h2>

        <p>
          Your saved sessions and events.
        </p>

      </div>

      {savedItems.length === 0 ? (

        <div className="empty-state">

          <div className="empty-state-icon">
            ☆
          </div>

          <h3>
            No saved sessions yet
          </h3>

          <p>
            Tap a star next to a session, presentation, or poster
            in the Programme to add it here.
          </p>

        </div>

      ) : (

        <div className="saved-list">

          {sortedSavedItems.map(
            (item) => (

              <div
                className="saved-card"
                key={item.id}
              >

                <div className="saved-card-date">
                  {formatDate(
                    item.date
                  )}
                </div>

                <div className="saved-card-time">
                  {item.time ||
                    "Time to be confirmed"}
                </div>

                <div className="saved-card-title">
                  {
                    item.title
                  }
                </div>

                {item.room && (
                  <div className="saved-card-room">
                    {
                      item.room
                    }
                  </div>
                )}

                <button
                  className="save-button saved"
                  onClick={() =>
                    toggleSave(
                      item
                    )
                  }
                  aria-label="Remove from My Schedule"
                >
                  ★
                </button>

              </div>

            )
          )}

        </div>

      )}

    </section>
  );
}
