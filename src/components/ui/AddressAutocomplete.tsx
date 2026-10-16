import { useEffect, useRef } from "react";
import { loadGoogleMaps } from "../../lib/googleMaps";

export interface ParsedAddress {
  addressLine1: string;
  city: string;
  state: string;
  zip: string;
  /** From Google, for the map and route planning */
  latitude: number | null;
  longitude: number | null;
  googlePlaceId: string | null;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect: (address: ParsedAddress) => void;
  placeholder?: string;
  className?: string;
  required?: boolean;
}

function parseAddressComponents(
  components: google.maps.GeocoderAddressComponent[],
): Omit<ParsedAddress, "latitude" | "longitude" | "googlePlaceId"> {
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
    loadGoogleMaps().then(() => {
      if (!inputRef.current || autocompleteRef.current) return;

      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          componentRestrictions: { country: "us" },
          fields: ["address_components", "geometry", "place_id"],
        },
      );

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.address_components) return;
        const parsed: ParsedAddress = {
          ...parseAddressComponents(place.address_components),
          latitude: place.geometry?.location?.lat() ?? null,
          longitude: place.geometry?.location?.lng() ?? null,
          googlePlaceId: place.place_id ?? null,
        };
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
