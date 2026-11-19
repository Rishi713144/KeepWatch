"use client";

import { FormEvent, useState } from "react";
import styles from "../auth.module.css";

export default function SignUp() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const username = String(form.get("username"));
    const password = String(form.get("password"));

    try {
      const response = await fetch("http://localhost:3001/user/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) throw new Error("This username may already exist.");
      window.location.href = "/signin";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign up failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <a className={styles.brand} href="/"><span className={styles.brandMark} />Better Uptime</a>
        <h1>Create your account</h1>
        <p className={styles.subtitle}>Start monitoring your websites.</p>
        <form className={styles.form} onSubmit={submit}>
          <label className={styles.field}>Username
            <input name="username" autoComplete="username" required />
          </label>
          <label className={styles.field}>Password
            <input name="password" type="password" autoComplete="new-password" required />
          </label>
          <div className={styles.message}>{message}</div>
          <button className={styles.submit} disabled={busy}>{busy ? "Creating..." : "Create account"}</button>
        </form>
        <p className={styles.footer}>Already have an account? <a href="/signin">Sign in</a></p>
      </section>
    </main>
  );
}
