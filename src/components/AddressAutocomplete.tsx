import { useEffect, useRef } from "react";

export interface ParsedAddress {
  addressLine1: string;
  city: string;
  state: string;
  zip: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect: (address: ParsedAddress) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

const GOOGLE_MAPS_SCRIPT_ID = "google-maps-script";

function loadGoogleMapsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.maps?.places?.Autocomplete) {
      resolve();
      return;
    }
    if (document.getElementById(GOOGLE_MAPS_SCRIPT_ID)) {
      const interval = setInterval(() => {
        if (window.google?.maps?.places?.Autocomplete) {
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
      const interval = setInterval(() => {
        if (window.google?.maps?.places?.Autocomplete) {
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
  components: google.maps.GeocoderAddressComponent[],
): ParsedAddress {
  const get = (type: string) =>
    components.find((c) => c.types.includes(type))?.long_name ?? "";
  const getShort = (type: string) =>
    components.find((c) => c.types.includes(type))?.short_name ?? "";

  return {
    addressLine1: [get("street_number"), get("route")].filter(Boolean).join(" "),
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
  value,
  onChange,
  onSelect,
  placeholder = "Start typing an address...",
  className = "",
  required = false,
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    loadGoogleMapsScript().then(() => {
      if (!inputRef.current || autocompleteRef.current) return;

      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          componentRestrictions: { country: "us" },
          fields: ["address_components"],
        },
      );

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.address_components) return;
        const parsed = parseAddressComponents(place.address_components);
        onSelect(parsed);
        // Sync the input value to addressLine1
        if (inputRef.current) {
          onChange(parsed.addressLine1);
          inputRef.current.value = parsed.addressLine1;
        }
      });

      autocompleteRef.current = autocomplete;
    });
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <input
      ref={inputRef}
      type="text"
      required={required}
      defaultValue={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 bg-white border border-gray-100 rounded-xl shadow-[0_4px_16px_rgba(15,23,42,0.10)] focus:outline-none ${className}`}
    />
  );
};

export default AddressAutocomplete;
