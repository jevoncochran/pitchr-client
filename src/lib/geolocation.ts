/** The phone's current position, or a plain-language reason it isn't available. */
export const currentPosition = () =>
  new Promise<{ latitude: number; longitude: number; label: string }>((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("This browser can't share your location. Type an address instead."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, label: "My location" }),
      (err) =>
        reject(
          new Error(
            err.code === err.PERMISSION_DENIED
              ? "Location access is off for Pitchr. Allow it in your browser, or type an address instead."
              : "Couldn't find your location. Try again, or type an address instead.",
          ),
        ),
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  });
