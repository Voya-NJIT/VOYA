import { useState, useEffect } from 'react';
import axios from 'axios';
import Map from './Map';

function GroupView({ group, onBack, friends }) {
  const [members, setMembers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [showAddMember, setShowAddMember] = useState(false);
  const [midpoint, setMidpoint] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activityType, setActivityType] = useState('restaurant');

  useEffect(() => {
    fetchMembers();
    fetchActivities();
  }, [group.id]);

  const fetchMembers = async () => {
    const res = await axios.get(`/api/groups/${group.id}/members`);
    setMembers(res.data);
  };

  const fetchActivities = async () => {
    const res = await axios.get(`/api/groups/${group.id}/activities`);
    setActivities(res.data);
  };

  const addMember = async (friendId) => {
    await axios.post(`/api/groups/${group.id}/members`, { userId: friendId });
    fetchMembers();
    setShowAddMember(false);
  };

  const findMidpoint = async () => {
    if (members.length < 2) {
      alert('Need at least 2 members to find midpoint');
      return;
    }

    setLoading(true);
    try {
      const addresses = members.map(m => m.home_address);
      const midpointRes = await axios.post('/api/midpoint', { addresses });
      const { lat, lng } = midpointRes.data;
      setMidpoint({ lat, lng });

      const placesRes = await axios.post('/api/places', { lat, lng, type: activityType });
      setPlaces(placesRes.data);
    } catch (error) {
      alert('Failed to find midpoint');
    } finally {
      setLoading(false);
    }
  };

  const addActivity = async (place) => {
    try {
      await axios.post(`/api/groups/${group.id}/activities`, place);
      alert('Activity added!');
      fetchActivities();
    } catch (error) {
      alert('Failed to add activity');
    }
  };

  const availableFriends = friends.filter(f => !members.find(m => m.id === f.id));

  return (
    <div className="group-view">
      <button onClick={onBack} className="btn btn-secondary" style={{ marginBottom: '20px' }}>
        ← Back to Groups
      </button>

      <h1>{group.name}</h1>

      <div className="group-sections">
        <div className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3>Members ({members.length})</h3>
            <button onClick={() => setShowAddMember(!showAddMember)} className="btn-icon">+</button>
          </div>

          {showAddMember && availableFriends.length > 0 && (
            <div style={{ marginBottom: '15px', background: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
              {availableFriends.map(friend => (
                <div key={friend.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', marginBottom: '5px' }}>
                  <span>{friend.username}</span>
                  <button onClick={() => addMember(friend.id)} className="btn-small">Add</button>
                </div>
              ))}
            </div>
          )}

          <div className="members-list">
            {members.map(member => (
              <div key={member.id} className="member-item">
                <strong>{member.username}</strong>
                <p style={{ fontSize: '12px', color: '#666' }}>{member.home_address}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <h3>Find Meeting Spot</h3>
          <div className="form-group">
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
            onClick={findMidpoint}
            disabled={loading || members.length < 2}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '10px' }}
          >
            {loading ? 'Finding...' : 'Find Midpoint'}
          </button>
        </div>
      </div>

      {midpoint && (
        <div className="results" style={{ marginTop: '30px' }}>
          <h2>Midpoint & Recommendations</h2>
          <div className="map-info">
            <p>Midpoint: {midpoint.lat.toFixed(6)}, {midpoint.lng.toFixed(6)}</p>
          </div>
          <div className="map-container">
            <Map midpoint={midpoint} friends={members} places={places} />
          </div>

          <h3>Recommended Places</h3>
          {places.length > 0 ? (
            <div className="places-grid">
              {places.map((place, index) => (
                <div key={index} className="place-card-group">
                  <h3>{place.name}</h3>
                  <p>{place.address}</p>
                  {place.rating && <p className="rating">⭐ {place.rating}</p>}
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    <a
                      href={`https://www.google.com/maps/place/?q=place_id:${place.placeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-small"
                      style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}
                    >
                      View
                    </a>
                    <button
                      onClick={() => addActivity(place)}
                      className="btn-small btn-primary-small"
                      style={{ flex: 1 }}
                    >
                      Add to List
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No places found</p>
          )}
        </div>
      )}

      <div className="section" style={{ marginTop: '30px' }}>
        <h3>Activity List ({activities.length})</h3>
        {activities.length > 0 ? (
          <div className="activities-list">
            {activities.map(activity => (
              <div key={activity.id} className="activity-item">
                <div>
                  <h4>{activity.place_name}</h4>
                  <p style={{ fontSize: '14px', color: '#666' }}>{activity.place_address}</p>
                  {activity.rating && <p className="rating">⭐ {activity.rating}</p>}
                  <p style={{ fontSize: '12px', color: '#999' }}>
                    Added by {activity.added_by_username} on {new Date(activity.added_at).toLocaleDateString()}
                  </p>
                </div>
                <a
                  href={`https://www.google.com/maps/place/?q=place_id:${activity.place_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-small"
                >
                  View
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#666' }}>No activities added yet</p>
        )}
      </div>
    </div>
  );
}

export default GroupView;
