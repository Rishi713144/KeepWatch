"use client";

import { FormEvent, useEffect, useState } from "react";
import styles from "./page.module.css";

export default function Dashboard() {
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("betteruptime_jwt")) {
      window.location.href = "/signin";
    }
  }, []);

  async function addWebsite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const token = localStorage.getItem("betteruptime_jwt");
      const response = await fetch("http://localhost:3001/website", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ url }),
      });
      if (!response.ok) throw new Error("Could not add the website.");
      setMessage("Website added successfully.");
      setUrl("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not add the website.");
    } finally {
      setBusy(false);
    }
  }

  function signOut() {
    localStorage.removeItem("betteruptime_jwt");
    window.location.href = "/";
  }

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <a className={styles.brand} href="/"><span className={styles.brandMark} />Better Uptime</a>
        <button className={styles.signout} onClick={signOut}>Sign out</button>
      </nav>
      <main className={styles.main}>
        <header className={styles.header}>
          <div><h1>Monitors</h1><p>Add a website to begin monitoring.</p></div>
          <form className={styles.form} onSubmit={addWebsite}>
            <input value={url} onChange={(event) => setUrl(event.target.value)} type="url" placeholder="https://example.com" required />
            <button disabled={busy}>{busy ? "Adding..." : "Add website"}</button>
          </form>
        </header>
        <div className={styles.message}>{message}</div>
        <section className={styles.grid}>
          <article className={styles.card}><span>MONITORS</span><strong>0</strong><p>No websites added yet</p></article>
          <article className={styles.card}><span>UPTIME</span><strong>—</strong><p>Waiting for the first check</p></article>
          <article className={styles.card}><span>INCIDENTS</span><strong>0</strong><p>All clear</p></article>
        </section>
      </main>
    </div>
  );
}
