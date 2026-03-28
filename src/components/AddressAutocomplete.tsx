import { useEffect, useRef, useState } from "react";

export interface ParsedAddress {
  addressLine1: string;
  city: string;
  state: string;
  zip: string;
}

interface Props {
  onSelect: (address: ParsedAddress) => void;
  placeholder?: string;
  className?: string;
}

const GOOGLE_MAPS_SCRIPT_ID = "google-maps-script";

function loadGoogleMapsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.maps?.places?.PlaceAutocompleteElement) {
      resolve();
      return;
    }

    if (document.getElementById(GOOGLE_MAPS_SCRIPT_ID)) {
      const interval = setInterval(() => {
        if (window.google?.maps?.places?.PlaceAutocompleteElement) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${
      import.meta.env.VITE_GOOGLE_PLACES_API_KEY
    }&libraries=places&loading=async&v=weekly`;
    script.async = true;
    script.onload = () => {
      // Give the API a moment to initialize
      const interval = setInterval(() => {
        if (window.google?.maps?.places?.PlaceAutocompleteElement) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    };
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
}

function parseAddressComponents(
  components: google.maps.places.AddressComponent[]
): ParsedAddress {
  const get = (type: string) =>
    components.find((c) => c.types.includes(type))?.longText ?? "";
  const getShort = (type: string) =>
    components.find((c) => c.types.includes(type))?.shortText ?? "";

  const streetNumber = get("street_number");
  const route = get("route");

  return {
    addressLine1: [streetNumber, route].filter(Boolean).join(" "),
    city:
      get("locality") ||
      get("sublocality") ||
      get("neighborhood") ||
      get("administrative_area_level_2"),
    state: getShort("administrative_area_level_1"),
    zip: get("postal_code"),
  };
}

const AddressAutocomplete = ({
  onSelect,
  placeholder = "Search address...",
  className = "",
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const elementRef = useRef<HTMLElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => setLoaded(true))
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    if (!loaded || !containerRef.current) return;

    // Remove any previously mounted element
    if (elementRef.current) {
      elementRef.current.remove();
    }

    // Create the new PlaceAutocompleteElement
    const autocomplete = new window.google.maps.places.PlaceAutocompleteElement(
      {
        types: ["address"],
        componentRestrictions: { country: "us" },
      }
    );

    // Style it to match the app
    autocomplete.style.width = "100%";
    autocomplete.style.fontSize = "0.875rem";

    elementRef.current = autocomplete;
    containerRef.current.appendChild(autocomplete);

    const handleSelect = async (event: Event) => {
      const e = event as CustomEvent & {
        placePrediction: google.maps.places.PlacePrediction;
      };
      try {
        const place = e.placePrediction.toPlace();
        await place.fetchFields({ fields: ["addressComponents"] });
        const components = place.addressComponents;
        if (!components) return;
        onSelect(parseAddressComponents(components));
      } catch (err) {
        console.error("Error fetching place details:", err);
      }
    };

    autocomplete.addEventListener("gmp-select", handleSelect);

    return () => {
      autocomplete.removeEventListener("gmp-select", handleSelect);
      autocomplete.remove();
    };
  }, [loaded, onSelect]);

  if (error) {
    return (
      <input
        type="text"
        placeholder="Address search unavailable"
        disabled
        className={`w-full px-3 py-2 bg-gray-100 border rounded-lg text-gray-400 ${className}`}
      />
    );
  }

  if (!loaded) {
    return (
      <input
        type="text"
        placeholder="Loading..."
        disabled
        className={`w-full px-3 py-2 bg-gray-50 border rounded-lg text-gray-400 ${className}`}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className={`w-full ${className}`}
    />
  );
};

export default AddressAutocomplete;
