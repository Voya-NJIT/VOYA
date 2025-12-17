import { useState, useEffect } from 'react';
import axios from 'axios';

export default function FriendsMap({ currentUser }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [geocodedLocations, setGeocodedLocations] = useState([]);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const res = await axios.get(`/api/users/${currentUser.id}/friends`);
      setFriends(res.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching friends:', err);
      setError('Failed to load friends');
      setLoading(false);
    }
  };

  useEffect(() => {
    if (friends.length === 0 || loading) return;
    createMapWithMarkers();
  }, [friends, loading, currentUser]);

  const createMapWithMarkers = async () => {
    try {
      // Create map with all friend locations
      const allLocations = [
        { name: currentUser.name, address: currentUser.address, isCurrentUser: true },
        ...friends.map(f => ({ name: f.name, address: f.address, isCurrentUser: false }))
      ];

      // Geocode all addresses
      const locations = await Promise.all(
        allLocations.map(async (loc) => {
          const response = await axios.post('/api/geocode', { address: loc.address });
          return {
            ...loc,
            lat: response.data.lat,
            lng: response.data.lng
          };
        })
      );

      setGeocodedLocations(locations);

      // Calculate center point
      const avgLat = locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length;
      const avgLng = locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length;

      // Load Google Maps JavaScript API
      if (!window.google) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`;
        script.async = true;
        script.defer = true;
        script.onload = () => initMap(locations, avgLat, avgLng);
        document.head.appendChild(script);
      } else {
        initMap(locations, avgLat, avgLng);
      }
    } catch (err) {
      console.error('Error geocoding addresses:', err);
      setError('Failed to load map');
    }
  };

  const initMap = (locations, centerLat, centerLng) => {
    const mapContainer = document.getElementById('google-map');
    if (!mapContainer) return;

    // Create map
    const map = new window.google.maps.Map(mapContainer, {
      center: { lat: centerLat, lng: centerLng },
      zoom: 10,
      mapTypeId: 'roadmap'
    });

    // Add markers for each location
    locations.forEach((location) => {
      const marker = new window.google.maps.Marker({
        position: { lat: location.lat, lng: location.lng },
        map: map,
        title: location.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: location.isCurrentUser ? '#4285F4' : '#EA4335',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        }
      });

      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `<div style="padding: 8px;">
          <strong>${location.name}${location.isCurrentUser ? ' (You)' : ''}</strong><br/>
          <span style="font-size: 12px; color: #666;">${location.address}</span>
        </div>`
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
      });
    });
  };

  if (loading) {
    return (
      <div className="friends-map-container">
        <div className="loading-message">Loading map...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="friends-map-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (friends.length === 0) {
    return (
      <div className="friends-map-container">
        <div className="empty-state">
          <h3>No Friends Yet</h3>
          <p>Add friends to see their locations on the map!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="friends-map-container">
      <div className="map-header">
        <h2>Friends Map</h2>
        <p>Your location and {friends.length} friend{friends.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-marker you"></div>
          <span>You ({currentUser.name})</span>
        </div>
        <div className="legend-item">
          <div className="legend-marker friend"></div>
          <span>Friends</span>
        </div>
      </div>

      <div className="map-wrapper">
        <div 
          id="google-map" 
          style={{ 
            width: '100%', 
            height: '600px', 
            borderRadius: '12px',
            background: '#f0f0f0'
          }}
        ></div>
      </div>

      <div className="friends-list-sidebar">
        <h3>Locations</h3>
        <div className="location-item current-user">
          <div className="location-marker you"></div>
          <div style={{ flex: 1 }}>
            <strong>{currentUser.name} (You)</strong>
            <p>{currentUser.address}</p>
          </div>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentUser.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="view-on-map-btn"
          >
            View
          </a>
        </div>
        {friends.map(friend => (
          <div key={friend.id} className="location-item">
            <div className="location-marker friend"></div>
            <div style={{ flex: 1 }}>
              <strong>{friend.name}</strong>
              <p>{friend.address}</p>
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(friend.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="view-on-map-btn"
            >
              View
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
