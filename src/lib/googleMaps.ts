/**
 * Loads Google's Maps JavaScript library once, for the address search and the
 * session map. Uses the browser key (VITE_GOOGLE_MAPS_API_KEY).
 */
const SCRIPT_ID = "google-maps-script";
// Google calls this global once the library is ready (the script's load event comes too early)
const READY_CALLBACK = "__pitchrGoogleMapsReady";

let loading: Promise<typeof google.maps> | null = null;

const isReady = () => typeof window.google?.maps?.importLibrary === "function";

export function loadGoogleMaps(): Promise<typeof google.maps> {
  if (loading) return loading;

  loading = new Promise<void>((resolve, reject) => {
    if (isReady()) return resolve();

    if (document.getElementById(SCRIPT_ID)) {
      // Added before this module was (re)loaded, e.g. by a hot reload in development
      const started = Date.now();
      const timer = setInterval(() => {
        if (isReady()) {
          clearInterval(timer);
          resolve();
        } else if (Date.now() - started > 15_000) {
          clearInterval(timer);
          reject(new Error("Google Maps took too long to load"));
        }
      }, 100);
      return;
    }

    (window as unknown as Record<string, () => void>)[READY_CALLBACK] = () => resolve();
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${
      import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    }&libraries=places,marker,geometry&loading=async&v=weekly&callback=${READY_CALLBACK}`;
    script.async = true;
    script.onerror = () => {
      script.remove(); // so a retry adds a fresh one
      reject(new Error("Failed to load Google Maps"));
    };
    document.head.appendChild(script);
  })
    .then(() =>
      Promise.all(
        ["maps", "places", "marker", "geometry"].map((lib) => google.maps.importLibrary(lib)),
      ),
    )
    .then(() => google.maps)
    .catch((error) => {
      loading = null; // allow a retry, e.g. after going back online
      throw error;
    });

  return loading;
}
