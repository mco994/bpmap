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
import {
  bestQueryMatch,
  formatDateRange,
  formatFromPrice,
  franceBorderGeoJSON,
  franceEnclavesGeoJSON,
  franceMaskGeoJSON,
  isCountryLabelLayer,
  maskedCountryLabelFilter,
  type Festival,
} from "@bpmap/shared";
import GenreChips from "@/components/GenreChips";

const MAP_STYLE =
  process.env.NEXT_PUBLIC_MAP_STYLE ??
  "https://tiles.openfreemap.org/styles/positron";

const INITIAL_VIEW = { longitude: 2.5, latitude: 46.6, zoom: 4.7 };

const SOURCE_ID = "festivals";

const FRANCE_MASK = franceMaskGeoJSON();
const FRANCE_ENCLAVES = franceEnclavesGeoJSON();
const FRANCE_BORDER = franceBorderGeoJSON();

const maskLayer: LayerProps = {
  id: "france-mask",
  type: "fill",
  source: "france-mask",
  paint: {
    "fill-color": "#f6f0f7",
    "fill-opacity": 0.93,
  },
};

const enclavesLayer: LayerProps = {
  id: "france-enclaves",
  type: "fill",
  source: "france-enclaves",
  paint: {
    "fill-color": "#f6f0f7",
    "fill-opacity": 0.93,
  },
};

const borderLayer: LayerProps = {
  id: "france-border",
  type: "line",
  source: "france-border",
  paint: {
    "line-color": "#c026d3",
    "line-opacity": 0.35,
    "line-width": 1.2,
  },
};

const pointLayer: LayerProps = {
  id: "festival-points",
  type: "circle",
  source: SOURCE_ID,
  paint: {
    "circle-color": "#db2777",
    "circle-radius": 7,
    "circle-stroke-width": 2,
    "circle-stroke-color": "#ffffff",
  },
};

const hitLayer: LayerProps = {
  id: "festival-hit",
  type: "circle",
  source: SOURCE_ID,
  paint: {
    "circle-radius": 18,
    "circle-color": "#000000",
    "circle-opacity": 0,
  },
};

interface MapProps {
  festivals: Festival[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  query?: string;
  focus?: { id: string; nonce: number } | null;
}

export default function Map({
  festivals,
  selectedId,
  onSelect,
  query = "",
  focus = null,
}: MapProps) {
  const mapRef = useRef<MapRef>(null);
  const [cursor, setCursor] = useState<string>("");
  const [popupExpanded, setPopupExpanded] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pinnedUntil = useRef(0);

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };
  const scheduleClose = () => {
    if (Date.now() < pinnedUntil.current) return;
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

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setPopupExpanded(false), [selectedId]);

  const selected = useMemo(
    () => festivals.find((f) => f.id === selectedId) ?? null,
    [festivals, selectedId],
  );
  const selectedMatch = selected ? bestQueryMatch(selected, query) : null;

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

  const selectedLayer: LayerProps = {
    id: "selected-point",
    type: "circle",
    source: SOURCE_ID,
    filter: ["==", ["get", "id"], selectedId ?? "__none__"],
    paint: {
      "circle-color": "#9d174d",
      "circle-radius": 9,
      "circle-stroke-width": 2,
      "circle-stroke-color": "#ffffff",
    },
  };

  useEffect(() => {
    if (!selected) return;
    const map = mapRef.current;
    if (!map) return;
    const point: [number, number] = [selected.lng, selected.lat];
    if (!map.getBounds().contains(point)) {
      map.easeTo({ center: point, duration: 400 });
    }
  }, [selected]);

  useEffect(() => {
    if (!focus) return;
    const map = mapRef.current;
    if (!map) return;
    const festival = festivals.find((f) => f.id === focus.id);
    if (!festival) return;
    cancelClose();
    pinnedUntil.current = Date.now() + 1500;
    map.flyTo({ center: [festival.lng, festival.lat], zoom: 8, duration: 900 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus]);

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
    cancelClose();
    onSelect(feature ? (feature.properties?.id as string) : null);
  }

  return (
    <MapGL
      ref={mapRef}
      initialViewState={INITIAL_VIEW}
      mapStyle={MAP_STYLE}
      onLoad={(e) => {
        const map = e.target;
        for (const layer of map.getStyle().layers ?? []) {
          if (isCountryLabelLayer(layer)) {
            map.setFilter(
              layer.id,
              maskedCountryLabelFilter(
                map.getFilter(layer.id),
              ) as Parameters<typeof map.setFilter>[1],
            );
          }
        }
      }}
      style={{ width: "100%", height: "100%" }}
      interactiveLayerIds={["festival-hit", "festival-points", "selected-point"]}
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

      <Source id="france-mask" type="geojson" data={FRANCE_MASK}>
        <Layer {...maskLayer} />
      </Source>
      <Source id="france-enclaves" type="geojson" data={FRANCE_ENCLAVES}>
        <Layer {...enclavesLayer} />
      </Source>
      <Source id="france-border" type="geojson" data={FRANCE_BORDER}>
        <Layer {...borderLayer} />
      </Source>

      <Source id={SOURCE_ID} type="geojson" data={geojson}>
        <Layer {...hitLayer} />
        <Layer {...pointLayer} />
        <Layer {...selectedLayer} />
      </Source>

      {selected && (
        <Popup
          longitude={selected.lng}
          latitude={selected.lat}
          offset={14}
          onClose={() => onSelect(null)}
          closeButton
          closeOnClick={false}
          maxWidth="300px"
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

            <GenreChips
              genres={selected.genres}
              highlight={
                selectedMatch?.field === "genre" ? selectedMatch.genreSlug : undefined
              }
            />

            {popupExpanded && (
              <>
                <p className="text-xs font-medium text-zinc-700">
                  {formatFromPrice(selected)}
                </p>
                {selected.lineup && selected.lineup.length > 0 && (
                  <p className="text-xs text-zinc-600">
                    <span className="text-zinc-500">Line-up&nbsp;: </span>
                    {selected.lineup.slice(0, 5).join(", ")}
                    {selected.lineup.length > 5 ? "…" : ""}
                  </p>
                )}
                {(selected.ticketUrl || selected.officialUrl) && (
                  <p className="flex flex-wrap gap-x-3 text-xs">
                    {selected.ticketUrl && (
                      <a
                        href={selected.ticketUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-fuchsia-700 hover:underline"
                      >
                        Billetterie ↗
                      </a>
                    )}
                    {selected.officialUrl && (
                      <a
                        href={selected.officialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-fuchsia-700 hover:underline"
                      >
                        Site officiel ↗
                      </a>
                    )}
                  </p>
                )}
              </>
            )}

            <div className="flex items-center justify-between gap-2 pt-0.5">
              <button
                type="button"
                onClick={() => setPopupExpanded((v) => !v)}
                aria-expanded={popupExpanded}
                className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
              >
                {popupExpanded ? "Voir moins" : "Voir plus"}
              </button>
              <Link
                href={`/festivals/${selected.slug}`}
                className="text-xs font-semibold text-fuchsia-700 underline underline-offset-2 hover:text-fuchsia-900"
              >
                {popupExpanded ? "Fiche complète →" : "Voir la fiche →"}
              </Link>
            </div>
          </div>
        </Popup>
      )}
    </MapGL>
  );
}
