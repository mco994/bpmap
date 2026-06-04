import type { Metadata } from "next";
import SuivisList from "@/components/SuivisList";

export const metadata: Metadata = {
  title: "Mes événements suivis",
  description: "Votre liste d'événements suivis sur BPMap, stockée sur votre appareil.",
  robots: { index: false },
};

export default function SuivisPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight">Mes suivis</h1>
      <SuivisList />
    </div>
  );
}
