"use client";

import { useState } from "react";
import DialogOverlay from "@/components/DialogOverlay";
import { useDialog } from "@/lib/use-dialog";

const MAX_MESSAGE = 2000;
const MAX_EMAIL = 200;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = "idle" | "loading" | "success" | "error";

export default function ReportError({ slug }: { slug: string }) {
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const { open, openDialog, closeDialog, dialogRef } = useDialog({
    onOpenChange: (next) => {
      if (!next) {
        setStatus("idle");
        setError("");
      }
    },
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) {
      setError("Merci d'indiquer le problème rencontré.");
      setStatus("error");
      return;
    }
    if (trimmed.length > MAX_MESSAGE) {
      setError("Message trop long.");
      setStatus("error");
      return;
    }
    if (email && !EMAIL_PATTERN.test(email.trim())) {
      setError("Adresse email invalide.");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/signaler", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          message: trimmed,
          email: email.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error("request failed");
      setStatus("success");
      setMessage("");
      setEmail("");
    } catch {
      setError("L'envoi a échoué. Merci de réessayer plus tard.");
      setStatus("error");
    }
  };

  const modal =
    open ? (
      <DialogOverlay onClose={closeDialog}>
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label="Signaler une erreur"
          tabIndex={-1}
          className="w-full max-w-md space-y-3 rounded-t-2xl bg-white p-5 shadow-xl outline-none sm:rounded-2xl dark:bg-zinc-900"
        >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  Signaler une erreur
                </h2>
                <button
                  type="button"
                  onClick={closeDialog}
                  aria-label="Fermer"
                  className="-mr-1 -mt-1 rounded-md p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  ✕
                </button>
              </div>

              {status === "success" ? (
                <p
                  aria-live="polite"
                  className="rounded-lg bg-green-50 px-3 py-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200"
                >
                  Merci, votre signalement a bien été envoyé.
                </p>
              ) : (
                <form onSubmit={submit} className="space-y-3" noValidate>
                  <div>
                    <label
                      htmlFor="report-message"
                      className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Que faut-il corriger ?
                    </label>
                    <textarea
                      id="report-message"
                      required
                      maxLength={MAX_MESSAGE}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={4}
                      className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="report-email"
                      className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      Votre email (optionnel)
                    </label>
                    <input
                      id="report-email"
                      type="email"
                      maxLength={MAX_EMAIL}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                    />
                  </div>

                  <p aria-live="assertive" className="min-h-[1.25rem] text-sm text-red-600 dark:text-red-400">
                    {status === "error" ? error : ""}
                  </p>

                  <button
                    type="submit"
                    disabled={status === "loading"}
                    className="w-full rounded-xl bg-fuchsia-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-fuchsia-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 disabled:opacity-50"
                  >
                    {status === "loading" ? "Envoi…" : "Envoyer le signalement"}
                  </button>
                </form>
              )}
        </div>
      </DialogOverlay>
    ) : null;

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        className="text-xs font-medium text-zinc-500 underline underline-offset-2 transition-colors hover:text-zinc-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 dark:text-zinc-500 dark:hover:text-zinc-300"
      >
        Signaler une erreur
      </button>
      {modal}
    </>
  );
}
