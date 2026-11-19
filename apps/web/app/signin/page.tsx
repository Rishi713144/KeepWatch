"use client";

import { FormEvent, useState } from "react";
import styles from "../auth.module.css";

export default function SignIn() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("http://localhost:3001/user/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: String(form.get("username")),
          password: String(form.get("password")),
        }),
      });
      if (!response.ok) throw new Error("Invalid username or password.");
      const data = await response.json();
      localStorage.setItem("betteruptime_jwt", data.jwt);
      window.location.href = "/dashboard";
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <a className={styles.brand} href="/"><span className={styles.brandMark} />Better Uptime</a>
        <h1>Welcome back</h1>
        <p className={styles.subtitle}>Sign in to manage your monitors.</p>
        <form className={styles.form} onSubmit={submit}>
          <label className={styles.field}>Username
            <input name="username" autoComplete="username" required />
          </label>
          <label className={styles.field}>Password
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
          <div className={styles.message}>{message}</div>
          <button className={styles.submit} disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
        </form>
        <p className={styles.footer}>New here? <a href="/signup">Create an account</a></p>
      </section>
    </main>
  );
}
