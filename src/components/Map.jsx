import { useEffect, useRef, useState } from 'react';
import { loadGoogleMaps } from '../utils/loadGoogleMaps';

function Map({ midpoint, friends, places }) {
  const mapRef = useRef(null);
  const googleMapRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    loadGoogleMaps()
      .then(() => setIsMapReady(true))
      .catch(err => console.error('Error loading Google Maps:', err));
  }, []);

  useEffect(() => {
    if (!midpoint || !isMapReady || !window.google) return;

    // Initialize map centered on midpoint
    const map = new window.google.maps.Map(mapRef.current, {
      center: { lat: midpoint.lat, lng: midpoint.lng },
      zoom: 12,
    });

    googleMapRef.current = map;

    // Add midpoint marker
    new window.google.maps.Marker({
      position: { lat: midpoint.lat, lng: midpoint.lng },
      map,
      title: 'Midpoint',
      icon: {
        url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png'
      }
    });

    // Add friend markers
    friends.forEach((friend, index) => {
      // You'd need to geocode these addresses first or pass lat/lng
      // For now, this is a placeholder
    });

    // Add place markers
    places.forEach((place) => {
      const marker = new window.google.maps.Marker({
        position: { lat: place.lat, lng: place.lng },
        map,
        title: place.name,
        icon: {
          url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
        }
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div><strong>${place.name}</strong><br/>${place.address}</div>`
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
    });

  }, [midpoint, friends, places, isMapReady]);

  if (!isMapReady) {
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f0f0' }}>
        <p>Loading map...</p>
      </div>
    );
  }

  return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
}

export default Map;
