import type { Festival } from "@/lib/types";
import generated from "./festivals.json";

// Source of truth for the MVP UI. `festivals.json` is GENERATED from
// `festivals.source.json` by `npm run geocode` (which adds coordinates via the
// French BAN). Edit the source file, not the JSON. The same data is loaded into
// Neon by `npm run db:load`.
export const FESTIVALS = generated as unknown as Festival[];
