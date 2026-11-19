import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <a className={styles.brand} href="#" aria-label="Better Uptime home">
          <span className={styles.brandMark} />
          Better Uptime
        </a>
        <div className={styles.navLinks}>
          <a href="#features">Features</a>
          <a href="#status">Status</a>
          <a href="#pricing">Pricing</a>
        </div>
        <div className={styles.navActions}>
          <a className={styles.signIn} href="/signin">Sign in</a>
          <a className={styles.navCta} href="/signup">Get started</a>
        </div>
      </nav>

      <main>
        <section className={styles.hero}>
          <div className={styles.heroContent}>
            <div className={styles.eyebrow}>
              <span className={styles.liveDot} />
              Monitoring status
              <span className={styles.eyebrowDivider} />
              All systems operational
            </div>
            <h1>Know when your<br />website goes down.</h1>
            <p className={styles.heroText}>
              Monitor uptime, response times, and incidents from multiple regions.
              Catch problems before your customers do.
            </p>
            <div className={styles.heroActions} id="get-started">
              <a className={styles.primaryCta} href="/signup">
                Start monitoring
                <span aria-hidden="true">→</span>
              </a>
              <a className={styles.secondaryCta} href="#features">Explore features</a>
            </div>
          </div>

          <div className={styles.dashboard} id="status">
            <div className={styles.dashboardHeader}>
              <div>
                <span className={styles.dashboardLabel}>LIVE STATUS</span>
                <h2>Service overview</h2>
              </div>
              <span className={styles.liveBadge}><span />Live</span>
            </div>

            <div className={styles.metrics}>
              <div className={styles.metric}>
                <span>Uptime</span>
                <strong>99.99%</strong>
                <small>Last 30 days</small>
              </div>
              <div className={styles.metric}>
                <span>Avg. response</span>
                <strong>142 <em>ms</em></strong>
                <small>Across regions</small>
              </div>
              <div className={styles.metric}>
                <span>Incidents</span>
                <strong>0</strong>
                <small>This month</small>
              </div>
            </div>

            <div className={styles.monitorList}>
              {[
                ["Production website", "betteruptime.app"],
                ["API service", "api.betteruptime.app"],
              ].map(([name, domain]) => (
                <div className={styles.monitorRow} key={name}>
                  <span className={styles.statusIcon}>✓</span>
                  <div className={styles.monitorName}>
                    <strong>{name}</strong>
                    <span>{domain}</span>
                  </div>
                  <div className={styles.pulseBars} aria-label="Healthy response history">
                    {[8,12,9,14,11,8,10,13,7,11,9,14,10,12,8,11,9,13,10,8,12,9,14,10].map((height, index) => (
                      <i key={index} style={{ height }} />
                    ))}
                  </div>
                  <span className={styles.operational}>Operational</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.featureStrip} id="features">
          <div><strong>Global monitoring</strong><span>Check from multiple regions</span></div>
          <div><strong>Instant alerts</strong><span>Know the moment things break</span></div>
          <div><strong>Clear incidents</strong><span>Track status and response history</span></div>
        </section>
        <section className={styles.pricingAnchor} id="pricing" aria-label="Pricing" />
      </main>
    </div>
  );
}
