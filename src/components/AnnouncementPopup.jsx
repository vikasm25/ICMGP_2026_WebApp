import { useConference } from "../context/useConference";

function priorityClass(priority) {
  return String(priority || "normal").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export default function AnnouncementPopup() {
  const {
    announcementPopupOpen,
    closeAnnouncementPopup,
    popupAnnouncements,
    announcementsLoading,
    announcementsError,
  } = useConference();

  if (!announcementPopupOpen) return null;

  return (
    <div className="announcement-popup-backdrop" role="presentation">
      <section
        className="announcement-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="announcement-popup-title"
      >
        <button
          type="button"
          className="announcement-popup-close"
          onClick={closeAnnouncementPopup}
          aria-label="Close announcement"
        >
          ×
        </button>

        <div className="announcement-popup-icon" aria-hidden="true">🔔</div>
        <h2 id="announcement-popup-title">Announcements</h2>

        {announcementsLoading ? (
          <p className="announcement-popup-status">Checking for the latest announcements…</p>
        ) : announcementsError ? (
          <p className="announcement-popup-status">{announcementsError}</p>
        ) : popupAnnouncements.length === 0 ? (
          <p className="announcement-popup-status">
            No announcement right now. Keep checking
          </p>
        ) : (
          <div className="announcement-popup-list">
            {popupAnnouncements.map((announcement) => (
              <article className="announcement-popup-item" key={announcement.id}>
                <div className="announcement-popup-item-meta">
                  <span className={`announcement-priority priority-${priorityClass(announcement.priority)}`}>
                    {announcement.priority}
                  </span>
                  {announcement.date && <time>{announcement.date}</time>}
                </div>
                {announcement.title && <h3>{announcement.title}</h3>}
                {announcement.content && (
                  <p className="announcement-popup-content">{announcement.content}</p>
                )}
              </article>
            ))}
          </div>
        )}

        <button
          type="button"
          className="announcement-popup-continue"
          onClick={closeAnnouncementPopup}
        >
          Continue
        </button>
      </section>
    </div>
  );
}
