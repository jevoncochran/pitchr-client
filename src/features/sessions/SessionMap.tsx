import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "../../lib/googleMaps";
import type { SessionItem } from "./types";

// Advanced markers need a Map ID (Google Cloud > Map Management); Google's demo ID works for development
const MAP_ID = import.meta.env.VITE_GOOGLE_MAP_ID || "DEMO_MAP_ID";
const TAMPA = { lat: 27.9506, lng: -82.4572 };
const GREEN = "#16a34a";

export interface MapStart {
  latitude: number;
  longitude: number;
  label: string | null;
}

/**
 * The session's stops as numbered pins in list order (done and skipped ones
 * greyed), the start, and the optimized route's line. Tapping a pin selects
 * its stop.
 */
export const SessionMap = ({
  items,
  start,
  polyline,
  selectedId,
  onSelect,
  className = "",
  bottomPadding = 48,
}: {
  items: SessionItem[];
  start: MapStart | null;
  polyline: string | null;
  selectedId: string | null;
  onSelect: (itemId: string) => void;
  className?: string;
  /** Room to leave at the bottom on phones, e.g. for a sheet over the map */
  bottomPadding?: number;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  // How to take each pin and line off the map before redrawing
  const removersRef = useRef<(() => void)[]>([]);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  // What the map was last fitted to, so a new selection doesn't re-zoom it
  const fittedRef = useRef("");

  // Create the map once
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        mapRef.current = new maps.Map(containerRef.current, {
          center: TAMPA,
          zoom: 10,
          mapId: MAP_ID,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          gestureHandling: "greedy",
        });
        setReady(true);
      })
      .catch((error) => {
        console.error("The session map couldn't load", error);
        setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Redraw pins and the route when the list, the start or the route changes
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    removersRef.current.forEach((remove) => remove());
    removersRef.current = [];
    const bounds = new google.maps.LatLngBounds();

    items.forEach((item, index) => {
      const loc = item.lead.primaryLocation;
      if (loc?.latitude == null || loc.longitude == null) return;
      const position = { lat: loc.latitude, lng: loc.longitude };
      const selected = item.id === selectedId;
      const done = item.status !== "PLANNED";
      const pin = new google.maps.marker.PinElement({
        glyph: String(index + 1),
        glyphColor: "#ffffff",
        background: done ? "#9ca3af" : selected ? "#111827" : GREEN,
        borderColor: done ? "#6b7280" : selected ? "#000000" : "#15803d",
        scale: selected ? 1.25 : 1,
      });
      const marker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position,
        content: pin.element,
        title: `${index + 1}. ${item.lead.business}`,
        zIndex: selected ? 1000 : done ? 1 : 10,
      });
      marker.addListener("click", () => onSelect(item.id));
      removersRef.current.push(() => (marker.map = null));
      bounds.extend(position);
    });

    if (start) {
      const dot = document.createElement("div");
      dot.className = "h-4 w-4 rounded-full border-[3px] border-white bg-blue-600 shadow";
      const startMarker = new google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: start.latitude, lng: start.longitude },
        content: dot,
        title: start.label ? `Start: ${start.label}` : "Start",
      });
      removersRef.current.push(() => (startMarker.map = null));
      bounds.extend({ lat: start.latitude, lng: start.longitude });
    }

    if (polyline) {
      const line = new google.maps.Polyline({
        map,
        path: google.maps.geometry.encoding.decodePath(polyline),
        strokeColor: GREEN,
        strokeOpacity: 0.85,
        strokeWeight: 4,
      });
      removersRef.current.push(() => line.setMap(null));
    }

    const fitKey = JSON.stringify([items.map((i) => i.id), start?.latitude, start?.longitude, polyline]);
    if (!bounds.isEmpty() && fitKey !== fittedRef.current) {
      // On phones the list sheet covers the bottom of the map; keep pins above it
      const phone = window.innerWidth < 768;
      map.fitBounds(bounds, { top: 48, left: 32, right: 32, bottom: phone ? bottomPadding : 48 });
      fittedRef.current = fitKey;
    }
    // onSelect is a fresh function each render; the pins only need redrawing when the data does
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, items, start?.latitude, start?.longitude, polyline, selectedId]);

  // Re-color pins when the selection changes, and bring the selected one into view
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map || !selectedId) return;
    const loc = items.find((i) => i.id === selectedId)?.lead.primaryLocation;
    if (loc?.latitude != null && loc.longitude != null) {
      map.panTo({ lat: loc.latitude, lng: loc.longitude });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return (
    <div className={`relative bg-gray-100 ${className}`}>
      <div ref={containerRef} className="absolute inset-0" aria-label="Map of stops" />
      {failed && (
        <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-gray-500">
          The map couldn't load. The list and Navigate buttons still work.
        </p>
      )}
    </div>
  );
};
