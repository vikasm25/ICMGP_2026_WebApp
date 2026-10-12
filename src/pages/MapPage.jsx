import { useConference } from "../context/useConference";
export default function MapPage() {
  const { openMap } = useConference();
  return (
    <section className="map-page">

      <div className="page-heading">

        <h2>
          Map
        </h2>

        <p>
          Find the conference venue on
          Google Maps.
        </p>

      </div>

      <div className="map-cards">

        <div className="map-card">

          <div className="map-card-icon">
            📍
          </div>

          <div className="map-card-content">

            <h3>
              IIT Hyderabad
            </h3>

            <p>
              Kandi, Sangareddy,
              Telangana
            </p>

            <button
              className="map-button"
              onClick={() =>
                openMap(
                  "Indian Institute of Technology Hyderabad, Kandi, Telangana"
                )
              }
            >
              Open in Google Maps
            </button>

          </div>

        </div>

        <div className="map-card">

          <div className="map-card-icon">
            🏛️
          </div>

          <div className="map-card-content">

            <h3>
              Convention Centre, IITH
            </h3>

            <p>
              Main venue for ICMGP 2026
            </p>

            <button
              className="map-button"
              onClick={() =>
                openMap(
                  "IIT Hyderabad Convention Centre, Kandi, Telangana"
                )
              }
            >
              Open in Google Maps
            </button>

          </div>

        </div>

        <div className="map-card">

          <div className="map-card-icon">
            🏨
          </div>

          <div className="map-card-content">

            <h3>
              International Guest House (IGH)
            </h3>

            <p>
              IIT Hyderabad campus
            </p>

            <button
              className="map-button"
              onClick={() =>
                openMap(
                  "International Guest House (IGH), IIT Hyderabad, Kandi, Telangana"
                )
              }
            >
              Open in Google Maps
            </button>

          </div>

        </div>

      </div>

    </section>
  );
}
