import { useConference } from "../context/useConference";

function priorityClass(priority) {
  return String(priority || "normal").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function DynamicAnnouncementCard({ announcement }) {
  return (
    <article className="announcement-card announcement-card-pinned announcement-card-dynamic">
      <div className="announcement-card-header">
        <div className="announcement-card-icon" aria-hidden="true">📌</div>
        <div className="announcement-card-meta">
          <div className="announcement-card-meta-row">
            <span className={`announcement-priority priority-${priorityClass(announcement.priority)}`}>
              {announcement.priority}
            </span>
            {announcement.date && <time>{announcement.date}</time>}
          </div>
        </div>
      </div>
      <h3 className="announcement-card-dynamic-title">
        {announcement.title || "Announcement"}
      </h3>
      <p className="announcement-card-message announcement-pinned-message">
        {announcement.content}
      </p>
    </article>
  );
}

export default function Announcements() {
  const {
    pinnedAnnouncements,
    announcementsLoading,
    announcementsError,
  } = useConference();

  return (
    <section className="announcements-page">
      <div className="page-heading">
        <h2>Announcements</h2>
      </div>

      <article className="announcement-card announcement-card-pinned">
        <div className="announcement-card-header">
          <div className="announcement-card-icon" aria-hidden="true">🧘</div>
          <div className="announcement-card-meta">
            <h3>Yoga</h3>
          </div>
        </div>
        <div className="announcement-card-message announcement-pinned-message">
          <p>Everyday 06:15 - 07:00 at Convention Centre</p>
        </div>
      </article>

      <article className="announcement-card announcement-card-pinned">
        <div className="announcement-card-header">
          <div className="announcement-card-icon" aria-hidden="true">📌</div>
          <div className="announcement-card-meta">
            <h3>Oral Talks &amp; Posters</h3>
          </div>
        </div>
        <div className="announcement-card-message announcement-pinned-message">
          <p><strong>Oral Talks</strong></p>
          <p>PPT or PDF. To be uploaded at the presentation upload counter.</p>
          <p>(Recommended presentation layout 16:9 aspect ratio)</p>
          <p><strong>Posters</strong></p>
          <p>Max. poster size:<br />A0</p>
          <p>Posters can be printed at the convention centre at a cost of ₹1,500 per poster, plus 18% GST.</p>
          <p>Recommended format for printing: PDF with A0 size layout.</p>
        </div>
      </article>

      {announcementsLoading ? (
        <div className="announcements-empty-card">
          <div className="announcements-empty-icon" aria-hidden="true">🔔</div>
          <h3>Loading additional announcements…</h3>
        </div>
      ) : announcementsError ? (
        <div className="announcements-empty-card">
          <div className="announcements-empty-icon" aria-hidden="true">⚠️</div>
          <h3>Additional announcements unavailable</h3>
          <p>{announcementsError}</p>
        </div>
      ) : (
        <div className="announcements-list">
          {pinnedAnnouncements.map((announcement) => (
            <DynamicAnnouncementCard
              announcement={announcement}
              key={announcement.id}
            />
          ))}
        </div>
      )}
    </section>
  );
}
