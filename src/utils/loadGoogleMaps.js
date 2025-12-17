let isLoading = false;
let isLoaded = false;

export const loadGoogleMaps = () => {
  return new Promise((resolve, reject) => {
    if (isLoaded) {
      resolve();
      return;
    }

    if (isLoading) {
      const checkLoaded = setInterval(() => {
        if (isLoaded) {
          clearInterval(checkLoaded);
          resolve();
        }
      }, 100);
      return;
    }

    isLoading = true;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      isLoaded = true;
      isLoading = false;
      resolve();
    };
    
    script.onerror = () => {
      isLoading = false;
      reject(new Error('Failed to load Google Maps'));
    };

    document.head.appendChild(script);
  });
};
