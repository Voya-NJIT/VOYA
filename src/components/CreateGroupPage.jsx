import { useState, useEffect } from 'react';
import axios from 'axios';
import Map from './Map';

function CreateGroupPage({ user, onBack, onGroupCreated }) {
  const [groupName, setGroupName] = useState('');
  const [friends, setFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [midpoint, setMidpoint] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activityType, setActivityType] = useState('restaurant');

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async () => {
    try {
      const res = await axios.get(`/api/users/${user.id}/friends`);
      setFriends(res.data);
    } catch (err) {
      console.error('Error fetching friends:', err);
    }
  };

  const toggleFriend = (friendId) => {
    if (selectedFriends.includes(friendId)) {
      setSelectedFriends(selectedFriends.filter(id => id !== friendId));
    } else {
      setSelectedFriends([...selectedFriends, friendId]);
    }
  };

  const findMidpoint = async () => {
    if (selectedFriends.length === 0) {
      alert('Select at least one friend to find a midpoint');
      return;
    }

    setLoading(true);
    try {
      // Get addresses of selected friends + current user
      const selectedFriendData = friends.filter(f => selectedFriends.includes(f.id));
      const addresses = [user.address, ...selectedFriendData.map(f => f.address)];

      const midpointRes = await axios.post('/api/midpoint', { addresses });
      const { lat, lng } = midpointRes.data;
      setMidpoint({ lat, lng });

      const placesRes = await axios.post('/api/places', { lat, lng, type: activityType });
      setPlaces(placesRes.data);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to find midpoint');
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async () => {
    if (!groupName) {
      alert('Please enter a group name');
      return;
    }

    try {
      // Create the group
      const groupRes = await axios.post('/api/groups', {
        name: groupName,
        creatorId: user.id
      });

      // Add selected friends as members
      for (const friendId of selectedFriends) {
        await axios.post(`/api/groups/${groupRes.data.id}/members`, { userId: friendId });
      }

      alert('Travel group created!');
      onGroupCreated();
    } catch (error) {
      console.error('Error creating group:', error);
      alert('Failed to create group');
    }
  };

  return (
    <div className="create-group-page">
      <div className="page-header">
        <button onClick={onBack} className="btn btn-secondary">
          ← Back to Groups
        </button>
        <h1>Create Travel Group</h1>
      </div>

      <div className="create-group-content">
        {/* Group Name */}
        <div className="section">
          <h3>Group Name</h3>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Weekend Trip, Summer Vacation, etc."
            style={{ width: '100%', padding: '12px', fontSize: '16px', border: '1px solid #ddd', borderRadius: '4px' }}
          />
        </div>

        {/* Select Friends */}
        <div className="section">
          <h3>Select Friends ({selectedFriends.length} selected)</h3>
          {friends.length > 0 ? (
            <div className="friends-grid">
              {friends.map(friend => (
                <div
                  key={friend.id}
                  className={`friend-select-card ${selectedFriends.includes(friend.id) ? 'selected' : ''}`}
                  onClick={() => toggleFriend(friend.id)}
                >
                  <div>
                    <h4>{friend.name}</h4>
                    <p style={{ fontSize: '12px', color: '#666' }}>{friend.address}</p>
                  </div>
                  {selectedFriends.includes(friend.id) && (
                    <span style={{ fontSize: '24px' }}>✓</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#666' }}>Add friends first to create a group</p>
          )}
        </div>

        {/* Find Midpoint */}
        {selectedFriends.length > 0 && (
          <div className="section">
            <h3>Find Meeting Spot</h3>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px' }}>
              <select
                value={activityType}
                onChange={(e) => setActivityType(e.target.value)}
                style={{ flex: 1, padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
              >
                <option value="restaurant">Restaurants</option>
                <option value="cafe">Cafes</option>
                <option value="bar">Bars</option>
                <option value="park">Parks</option>
                <option value="movie_theater">Movie Theaters</option>
                <option value="bowling_alley">Bowling</option>
              </select>
              <button
                onClick={findMidpoint}
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? 'Finding...' : 'Find Midpoint'}
              </button>
            </div>

            {midpoint && (
              <div>
                <div className="map-info">
                  <p>Midpoint: {midpoint.lat.toFixed(6)}, {midpoint.lng.toFixed(6)}</p>
                </div>
                <div className="map-container">
                  <Map midpoint={midpoint} friends={friends.filter(f => selectedFriends.includes(f.id))} places={places} />
                </div>

                <h4 style={{ marginTop: '20px', marginBottom: '10px' }}>Recommended Places</h4>
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
                        {place.rating && <p className="rating">⭐ {place.rating}</p>}
                      </a>
                    ))}
                  </div>
                ) : (
                  <p>No places found nearby</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Create Button */}
        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button
            onClick={createGroup}
            className="btn btn-primary"
            style={{ padding: '15px 40px', fontSize: '18px' }}
            disabled={!groupName || selectedFriends.length === 0}
          >
            Create Travel Group
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateGroupPage;
