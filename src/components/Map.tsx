"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import MapGL, {
  Source,
  Layer,
  Popup,
  NavigationControl,
  type MapRef,
  type MapLayerMouseEvent,
  type LayerProps,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Festival } from "@/lib/types";
import { formatDateRange, formatPrice, genreLabel } from "@/lib/festivals";

const MAP_STYLE =
  process.env.NEXT_PUBLIC_MAP_STYLE ??
  "https://tiles.openfreemap.org/styles/positron";

// Centered on metropolitan France.
const INITIAL_VIEW = { longitude: 2.5, latitude: 46.6, zoom: 4.7 };

const SOURCE_ID = "festivals";

// Individual (non-clustered) points, rendered on the GL canvas for performance.
// Overlapping pins at low zoom resolve by zooming in.
const pointLayer: LayerProps = {
  id: "festival-points",
  type: "circle",
  source: SOURCE_ID,
  paint: {
    "circle-color": "#a855f7",
    "circle-radius": 7,
    "circle-stroke-width": 2,
    "circle-stroke-color": "#ffffff",
  },
};

interface MapProps {
  festivals: Festival[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

export default function Map({ festivals, selectedId, onSelect }: MapProps) {
  const mapRef = useRef<MapRef>(null);
  const [cursor, setCursor] = useState<string>("");
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  // Close shortly after the cursor leaves a pin — enough time to move onto the
  // popup itself (which cancels the close so the "Voir la fiche" link stays
  // reachable).
  const scheduleClose = () => {
    if (closeTimer.current) return;
    closeTimer.current = setTimeout(() => {
      closeTimer.current = null;
      onSelect(null);
    }, 220);
  };

  useEffect(
    () => () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  const selected = useMemo(
    () => festivals.find((f) => f.id === selectedId) ?? null,
    [festivals, selectedId],
  );

  const geojson = useMemo(
    () => ({
      type: "FeatureCollection" as const,
      features: festivals.map((f) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [f.lng, f.lat] },
        properties: { id: f.id },
      })),
    }),
    [festivals],
  );

  // Highlight the selected point on top.
  const selectedLayer: LayerProps = {
    id: "selected-point",
    type: "circle",
    source: SOURCE_ID,
    filter: ["==", ["get", "id"], selectedId ?? "__none__"],
    paint: {
      "circle-color": "#db2777",
      "circle-radius": 9,
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
    },
  };

  // Only move the map when the selected festival is OUTSIDE the current view
  // (e.g. selected from the list). Clicking a visible pin never shifts the
  // screen — the popup just anchors itself to the side with the most room.
  useEffect(() => {
    if (!selected) return;
    const map = mapRef.current;
    if (!map) return;
    const point: [number, number] = [selected.lng, selected.lat];
    if (!map.getBounds().contains(point)) {
      map.easeTo({ center: point, duration: 400 });
    }
  }, [selected]);

  // Hover a pin to reveal its card; the popup then stays (so you can reach the
  // "Voir la fiche" link) until you hover another pin or click an empty area.
  function handleMouseMove(e: MapLayerMouseEvent) {
    const feature = e.features?.[0];
    if (feature) {
      cancelClose();
      setCursor("pointer");
      const id = feature.properties?.id as string;
      if (id && id !== selectedId) onSelect(id);
    } else {
      setCursor("");
      scheduleClose();
    }
  }

  function handleClick(e: MapLayerMouseEvent) {
    const feature = e.features?.[0];
    // Tap support (mobile, no hover); clicking empty space dismisses.
    cancelClose();
    onSelect(feature ? (feature.properties?.id as string) : null);
  }

  return (
    <MapGL
      ref={mapRef}
      initialViewState={INITIAL_VIEW}
      mapStyle={MAP_STYLE}
      style={{ width: "100%", height: "100%" }}
      interactiveLayerIds={["festival-points", "selected-point"]}
      cursor={cursor}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        setCursor("");
        scheduleClose();
      }}
      attributionControl={{ compact: true }}
    >
      <NavigationControl position="top-right" showCompass={false} />

      <Source id={SOURCE_ID} type="geojson" data={geojson}>
        <Layer {...pointLayer} />
        <Layer {...selectedLayer} />
      </Source>

      {selected && (
        <Popup
          longitude={selected.lng}
          latitude={selected.lat}
          // No fixed anchor: MapLibre picks the side (top / right / bottom-left…)
          // that keeps the popup within the viewport without moving the map.
          offset={14}
          onClose={() => onSelect(null)}
          closeButton
          closeOnClick={false}
          maxWidth="280px"
        >
          <div
            className="space-y-1.5 p-1"
            onMouseEnter={cancelClose}
            onMouseLeave={() => onSelect(null)}
          >
            <h3 className="text-sm font-semibold text-zinc-900">
              {selected.name}
            </h3>
            <p className="text-xs text-zinc-600">
              {selected.city} ·{" "}
              {formatDateRange(selected.startDate, selected.endDate)}
            </p>
            <ul className="flex flex-wrap gap-1" aria-label="Genres">
              {selected.genres.map((g) => (
                <li
                  key={g}
                  className="rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-800"
                >
                  {genreLabel(g)}
                </li>
              ))}
            </ul>
            <p className="text-xs text-zinc-700">
              Jour&nbsp;: <strong>{formatPrice(selected.priceDay)}</strong> ·
              Pass&nbsp;: <strong>{formatPrice(selected.priceFull)}</strong>
            </p>
            <Link
              href={`/festivals/${selected.slug}`}
              className="inline-block text-xs font-semibold text-fuchsia-700 underline underline-offset-2 hover:text-fuchsia-900"
            >
              Voir la fiche →
            </Link>
          </div>
        </Popup>
      )}
    </MapGL>
  );
}
