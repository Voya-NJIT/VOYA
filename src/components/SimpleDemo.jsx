import { useState } from 'react';
import axios from 'axios';
import Map from './Map';
import AddressAutocomplete from './AddressAutocomplete';

function SimpleDemo() {
  const [friends, setFriends] = useState([]);
  const [friendName, setFriendName] = useState('');
  const [friendAddress, setFriendAddress] = useState('');
  const [midpoint, setMidpoint] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activityType, setActivityType] = useState('restaurant');

  const addFriend = () => {
    if (friendName && friendAddress) {
      setFriends([...friends, { name: friendName, address: friendAddress }]);
      setFriendName('');
      setFriendAddress('');
    }
  };

  const removeFriend = (index) => {
    setFriends(friends.filter((_, i) => i !== index));
  };

  const findMidpoint = async () => {
    if (friends.length < 2) {
      alert('Add at least 2 friends to find a midpoint');
      return;
    }

    setLoading(true);
    try {
      const addresses = friends.map(f => f.address);
      
      // Call without auth for demo
      const midpointRes = await axios.post('/api/demo/midpoint', { addresses });
      const { lat, lng } = midpointRes.data;
      setMidpoint({ lat, lng });

      const placesRes = await axios.post('/api/demo/places', { lat, lng, type: activityType });
      setPlaces(placesRes.data);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to find midpoint. Check your API key and addresses.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Meetup Midpoint - Demo</h1>
        <p>Find the perfect meeting spot for your group</p>
      </div>

      <div className="group-form">
        <div className="form-group">
          <label>Friend's Name</label>
          <input
            type="text"
            value={friendName}
            onChange={(e) => setFriendName(e.target.value)}
            placeholder="John Doe"
          />
        </div>

        <div className="form-group">
          <label>Friend's Address</label>
          <AddressAutocomplete
            value={friendAddress}
            onChange={setFriendAddress}
            placeholder="Start typing an address..."
          />
        </div>

        <button className="btn btn-secondary" onClick={addFriend}>
          Add Friend
        </button>

        {friends.length > 0 && (
          <div className="friend-list">
            <h3>Friends in Group ({friends.length})</h3>
            {friends.map((friend, index) => (
              <div key={index} className="friend-item">
                <div>
                  <strong>{friend.name}</strong>
                  <p style={{ fontSize: '14px', color: '#666' }}>{friend.address}</p>
                </div>
                <button className="btn btn-danger" onClick={() => removeFriend(index)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="form-group" style={{ marginTop: '20px' }}>
          <label>Activity Type</label>
          <select
            value={activityType}
            onChange={(e) => setActivityType(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="restaurant">Restaurants</option>
            <option value="cafe">Cafes</option>
            <option value="bar">Bars</option>
            <option value="park">Parks</option>
            <option value="movie_theater">Movie Theaters</option>
            <option value="bowling_alley">Bowling</option>
          </select>
        </div>

        <button
          className="btn btn-primary"
          onClick={findMidpoint}
          disabled={loading || friends.length < 2}
          style={{ marginTop: '20px', width: '100%' }}
        >
          {loading ? 'Finding Midpoint...' : 'Find Midpoint & Activities'}
        </button>
      </div>

      {midpoint && (
        <div className="results">
          <h2>Results</h2>
          <div className="map-info">
            <p>Midpoint: {midpoint.lat.toFixed(6)}, {midpoint.lng.toFixed(6)}</p>
          </div>
          <div className="map-container">
            <Map midpoint={midpoint} friends={friends} places={places} />
          </div>

          <h3>Recommended Activities</h3>
          {places.length > 0 ? (
            <div className="places-grid">
              {places.map((place, index) => (
                <a
                  key={index}
                  href={`https://www.google.com/maps/place/?q=place_id:${place.placeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="place-card"
                >
                  <h3>{place.name}</h3>
                  <p>{place.address}</p>
                  {place.rating && (
                    <p className="rating">⭐ {place.rating}</p>
                  )}
                </a>
              ))}
            </div>
          ) : (
            <p>No places found nearby</p>
          )}
        </div>
      )}
    </div>
  );
}

export default SimpleDemo;
