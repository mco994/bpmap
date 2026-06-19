"use client";

import { useRef, useState } from "react";
import type { Festival } from "@bpmap/shared";
import {
  openDirections,
  suggestAddresses,
  type AddressSuggestion,
} from "@/lib/geo";
import DialogOverlay from "@/components/DialogOverlay";
import { useDialog } from "@/lib/use-dialog";

function NavigateIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <polygon points="3 11 22 2 13 21 11 13 3 11" />
    </svg>
  );
}

export default function ItineraryButton({
  festival,
  variant = "button",
  onInteractingChange,
}: {
  festival: Festival;
  variant?: "button" | "link";
  onInteractingChange?: (interacting: boolean) => void;
}) {
  const [address, setAddress] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [picked, setPicked] = useState<AddressSuggestion | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { open, openDialog, closeDialog, dialogRef } = useDialog({
    onOpenChange: (next) => {
      onInteractingChange?.(next);
      if (!next) setSuggestions([]);
    },
  });

  const go = (origin?: string | { lat: number; lng: number }) => {
    closeDialog();
    void openDirections(festival, origin);
  };

  const onChangeAddress = (text: string) => {
    setAddress(text);
    setPicked(null);
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setSuggestions(await suggestAddresses(text));
    }, 300);
  };

  const pick = (s: AddressSuggestion) => {
    setAddress(s.label);
    setPicked(s);
    setSuggestions([]);
  };

  const goFromAddress = () => {
    if (picked) go({ lat: picked.lat, lng: picked.lng });
    else if (address.trim()) go(address);
  };

  const trigger =
    variant === "link" ? (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          openDialog();
        }}
        className="inline-flex items-center gap-1 text-xs font-semibold text-fuchsia-700 hover:text-fuchsia-900"
      >
        <NavigateIcon className="h-3.5 w-3.5" />
        Itinéraire
      </button>
    ) : (
      <button
        type="button"
        onClick={openDialog}
        className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-6 py-3 font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        <NavigateIcon className="h-4 w-4 text-fuchsia-600" />
        Itinéraire
      </button>
    );

  const modal =
    open ? (
      <DialogOverlay onClose={closeDialog}>
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Itinéraire vers ${festival.name}`}
          tabIndex={-1}
          className="w-full max-w-md space-y-3 rounded-t-2xl bg-white p-5 shadow-xl outline-none sm:rounded-2xl dark:bg-zinc-900"
        >
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                Itinéraire vers {festival.name}
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

            <button
              type="button"
              onClick={() => go()}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-fuchsia-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-fuchsia-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500"
            >
              <NavigateIcon className="h-4 w-4" />
              Depuis ma position
            </button>

            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
              ou depuis une adresse
            </p>

            <div className="relative">
              <input
                type="text"
                value={address}
                onChange={(e) => onChangeAddress(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") goFromAddress();
                }}
                placeholder="Adresse de départ"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-fuchsia-500 focus:ring-1 focus:ring-fuchsia-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              />
              {suggestions.length > 0 && (
                <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                  {suggestions.map((s) => (
                    <li key={s.label}>
                      <button
                        type="button"
                        onClick={() => pick(s)}
                        className="block w-full px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-700"
                      >
                        {s.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="button"
              disabled={!address.trim()}
              onClick={goFromAddress}
              className="w-full rounded-xl bg-fuchsia-100 px-4 py-3 font-semibold text-fuchsia-700 transition-colors hover:bg-fuchsia-200 disabled:opacity-40 dark:bg-fuchsia-950 dark:text-fuchsia-200"
            >
              Y aller depuis cette adresse
            </button>
        </div>
      </DialogOverlay>
    ) : null;

  return (
    <>
      {trigger}
      {modal}
    </>
  );
}
