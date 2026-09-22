"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import DialogOverlay from "@/components/DialogOverlay";
import { useDialog } from "@/lib/use-dialog";
import {
  isSnoozed,
  SNOOZE_KEY,
  storeForUserAgent,
  type StoreLink,
} from "@/lib/app-store-prompt";

const STORE_URLS = {
  play: process.env.NEXT_PUBLIC_PLAY_STORE_URL,
  appStore: process.env.NEXT_PUBLIC_APP_STORE_URL,
};
const OPEN_DELAY_MS = 2500;

function readSnoozedAt(): string | null {
  try {
    return localStorage.getItem(SNOOZE_KEY);
  } catch {
    return null;
  }
}

function snooze() {
  try {
    localStorage.setItem(SNOOZE_KEY, String(Date.now()));
  } catch {}
}

function runsAsInstalledApp() {
  return window.matchMedia("(display-mode: standalone)").matches;
}

export default function AppStorePrompt() {
  const [store, setStore] = useState<StoreLink | null>(null);
  const shownRef = useRef(false);
  const onOpenChange = useCallback((next: boolean) => {
    if (next) shownRef.current = true;
    else if (shownRef.current) snooze();
  }, []);
  const { open, openDialog, closeDialog, dialogRef } = useDialog({ onOpenChange });

  useEffect(() => {
    const link = storeForUserAgent(navigator.userAgent, STORE_URLS);
    if (!link || runsAsInstalledApp() || isSnoozed(readSnoozedAt(), Date.now())) return;
    const timer = window.setTimeout(() => {
      setStore(link);
      openDialog();
    }, OPEN_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [openDialog]);

  if (!open || !store) return null;

  return (
    <DialogOverlay onClose={closeDialog}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-prompt-title"
        aria-describedby="app-prompt-text"
        tabIndex={-1}
        className="w-full max-w-md rounded-t-2xl bg-white p-6 shadow-xl outline-none sm:rounded-2xl dark:bg-zinc-900"
      >
        <div className="flex items-start gap-4">
          <Image
            src="/icon-192.png"
            alt=""
            width={56}
            height={56}
            className="h-14 w-14 shrink-0 rounded-xl"
          />
          <div className="min-w-0">
            <h2 id="app-prompt-title" className="text-lg font-bold leading-tight">
              BPMap dans votre poche
            </h2>
            <p id="app-prompt-text" className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              La carte, les filtres et les alertes des nouveaux événements, en
              application. Disponible sur {store.label}.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={closeDialog}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Plus tard
          </button>
          <a
            href={store.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeDialog}
            className="rounded-lg bg-fuchsia-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-fuchsia-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 focus-visible:ring-offset-2"
          >
            Télécharger l&apos;application
          </a>
        </div>
      </div>
    </DialogOverlay>
  );
}
