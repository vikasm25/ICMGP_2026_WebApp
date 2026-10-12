import lifeLogo from "../assets/Mission-LiFE-Final Logo.png";
import moefLogo from "../assets/MOEF_logo.png";
import icmgpLogo from "../assets/ICMGP-2026-logo.png";
import nipponLogo from "../assets/nIPPON(1).png";
import lumexLogo from "../assets/lumex logo(1).png";
import nimdLogo from "../assets/NIMD.png";
import tzaLogo from "../assets/tza.png";
import hcvbLogo from "../assets/HCVB.png";
import scesLogo from "../assets/SCES Logo.png";
import homeBackground from "../assets/hyderabad_Background_16_9.png";

export default function Home() {
  return (
    <section className="icmgp-home" aria-label="Welcome to ICMGP 2026">
      <div className="icmgp-home-canvas">
        <img src={homeBackground} alt="" className="icmgp-home-background" />
        <div className="icmgp-home-wash" aria-hidden="true" />
        <div className="icmgp-home-content">
          <div className="icmgp-home-top-brands">
            <img src={lifeLogo} alt="Mission LiFE" className="icmgp-home-life" />
            <img src={moefLogo} alt="Ministry of Environment, Forest and Climate Change" className="icmgp-home-moef" />
          </div>
          <div className="icmgp-home-main-logo">
            <img src={icmgpLogo} alt="ICMGP 2026 Hyderabad India" />
          </div>
          <h1 className="icmgp-home-title">
            The 17<sup>th</sup> International Conference<span className="icmgp-home-desktop-break"> on Mercury</span>
            <span className="icmgp-home-portrait-break"> on Mercury</span> as a Global Pollutant
          </h1>
          <p className="icmgp-home-welcome">Welcome</p>
          <div className="icmgp-home-supporters" aria-label="Supporting organisations">
            <div className="icmgp-home-supporter"><img src={hcvbLogo} alt="Hyderabad Convention Visitors Bureau" /></div>
            <div className="icmgp-home-supporter"><img src={tzaLogo} alt="Telangana Tourism" /></div>
            <div className="icmgp-home-supporter"><img src={scesLogo} alt="Society for Climate, Environment and Sustainability" /></div>
          </div>
          <section className="icmgp-home-gold" aria-label="Gold Sponsors">
            <h2>Gold Sponsors</h2>
            <div className="icmgp-home-sponsors">
              <div className="icmgp-home-sponsor-card"><img src={nipponLogo} alt="NIC - A Rigaku Company" /></div>
              <div className="icmgp-home-sponsor-card"><img src={lumexLogo} alt="LUMEX" /></div>
              <div className="icmgp-home-sponsor-card"><img src={nimdLogo} alt="National Institute for Minamata Disease" /></div>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
