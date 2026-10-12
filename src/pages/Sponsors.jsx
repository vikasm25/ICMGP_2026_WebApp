import lumexLogo from "../assets/lumex logo(1).png";
import nimdLogo from "../assets/NIMD.png";
import nipponLogo from "../assets/nIPPON(1).png";
import tzaLogo from "../assets/tza.png";
import hcvbLogo from "../assets/HCVB.png";
import gardisLogo from "../assets/GARDIS.png";
import hiyoshiLogo from "../assets/Hiyoshi.png";
import milestoneLogo from "../assets/Milestone.png";
import environmentalScienceJournalsLogo from "../assets/ES.png";
import frontiersLogo from "../assets/Frontiers.png";
import estLogo from "../assets/EST.png";
import kpLogo from "../assets/KP.png";
import picLogo from "../assets/PIC.png";
import smartLogo from "../assets/smart.png";
export default function Sponsors() {
  return (
    <section className="sponsors-page">
      <div className="page-heading">
        <h2>Sponsors &amp; Exhibitors</h2>
      </div>

      <div className="sponsor-section-card">
        <h3 className="sponsor-section-title">Gold Sponsors</h3>

        <div className="gold-sponsor-list">
          <div className="gold-sponsor-logo-wrap">
            <img src={nipponLogo} alt="NIC - A Rigaku Company" />
          </div>
          <div className="gold-sponsor-logo-wrap">
            <img src={lumexLogo} alt="LUMEX" />
          </div>
          <div className="gold-sponsor-logo-wrap">
            <img src={nimdLogo} alt="National Institute for Minamata Disease" />
          </div>
        </div>
      </div>

      <div className="sponsor-section-card">
        <h3 className="sponsor-section-title">Silver Sponsors</h3>

        <div className="silver-sponsor-list">
          <div className="silver-sponsor-logo-wrap">
            <img src={tzaLogo} alt="Telangana Tourism / Telangana Zaroorana" />
          </div>
          <div className="silver-sponsor-logo-wrap">
            <img src={hcvbLogo} alt="Hyderabad Convention Visitors Bureau" />
          </div>
          <div className="silver-sponsor-logo-wrap silver-sponsor-kp">
            <img src={kpLogo} alt="Kumamoto Prefectural Government" />
            <div className="silver-sponsor-logo-name">Kumamoto Prefectural Government</div>
          </div>
        </div>
      </div>

      <div className="sponsor-section-card">
        <h3 className="sponsor-section-title">Other Sponsors &amp; Exhibitors</h3>

        <div className="exhibitor-grid other-sponsors-grid">
          <div className="exhibitor-logo-wrap">
            <img src={gardisLogo} alt="Gardis" />
          </div>
          <div className="exhibitor-logo-wrap">
            <img src={hiyoshiLogo} alt="Hiyoshi India Ecological Services Pvt Ltd" />
          </div>
          <div className="exhibitor-logo-wrap">
            <img src={milestoneLogo} alt="Milestone Helping Chemists" />
          </div>
          <div className="exhibitor-logo-wrap">
            <img src={picLogo} alt="PIC" />
          </div>
          <div className="exhibitor-logo-wrap">
            <img src={smartLogo} alt="Smart Scientific" />
          </div>
        </div>
      </div>

      <div className="sponsor-section-card">
        <h3 className="sponsor-section-title">Journal Partners</h3>

        <div className="journal-partner-grid">
          <div className="journal-partner-row journal-partner-row-frontiers">
            <div className="journal-partner-logo-wrap frontiers-logo-wrap">
              <img src={frontiersLogo} alt="Frontiers" />
            </div>
          </div>

          <div className="journal-partner-row journal-partner-row-secondary">
            <div className="journal-partner-logo-wrap secondary-journal-logo-wrap">
              <img src={estLogo} alt="EST" />
            </div>
            <div className="journal-partner-logo-wrap secondary-journal-logo-wrap">
              <img
                src={environmentalScienceJournalsLogo}
                alt="Environmental Science Journals"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
