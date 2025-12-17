import { useState, useEffect } from 'react';
import axios from 'axios';
import Map from './Map';
import Modal from './Modal';

function GroupDetailPage({ user, group, onBack }) {
  const [members, setMembers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [finalActivities, setFinalActivities] = useState([]);
  const [activeTab, setActiveTab] = useState('activities');
  const [showMidpointFinder, setShowMidpointFinder] = useState(false);
  const [midpoint, setMidpoint] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activityType, setActivityType] = useState('restaurant');
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null });

  useEffect(() => {
    fetchMembers();
    fetchActivities();
    fetchFinalActivities();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await axios.get(`/api/groups/${group.id}/members`);
      setMembers(res.data);
    } catch (err) {
      console.error('Error fetching members:', err);
    }
  };

  const fetchActivities = async () => {
    try {
      const res = await axios.get(`/api/groups/${group.id}/activities`);
      setActivities(res.data);
    } catch (err) {
      console.error('Error fetching activities:', err);
    }
  };

  const fetchFinalActivities = async () => {
    try {
      const res = await axios.get(`/api/groups/${group.id}/final-activities`);
      setFinalActivities(res.data);
    } catch (err) {
      console.error('Error fetching final activities:', err);
    }
  };

  const handleVote = async (activityId) => {
    try {
      const res = await axios.post(`/api/groups/${group.id}/activities/${activityId}/vote`, {
        userId: user.id
      });
      
      fetchActivities();
      
      // Check if activity was auto-finalized
      if (res.data.finalized) {
        fetchFinalActivities();
        showModal('Success', 'Activity has been finalized! Enough members voted for it.');
      }
    } catch (err) {
      showModal('Error', 'Failed to vote. Please try again.');
    }
  };

  const handleFinalize = async (activityId) => {
    try {
      await axios.post(`/api/groups/${group.id}/activities/${activityId}/finalize`);
      fetchActivities();
      fetchFinalActivities();
      showModal('Success', 'Activity moved to final list!');
    } catch (err) {
      showModal('Error', 'Failed to finalize activity. Please try again.');
    }
  };

  const showModal = (title, message, type = 'info', onConfirm = null) => {
    setModal({ isOpen: true, title, message, type, onConfirm });
  };

  const closeModal = () => {
    setModal({ isOpen: false, title: '', message: '', type: 'info', onConfirm: null });
  };

  const handleRemoveActivity = async (activityId) => {
    showModal(
      'Remove Activity',
      'Are you sure you want to remove this activity suggestion?',
      'confirm',
      async () => {
        try {
          await axios.delete(`/api/groups/${group.id}/activities/${activityId}`);
          fetchActivities();
          showModal('Success', 'Activity removed successfully');
        } catch (err) {
          showModal('Error', 'Failed to remove activity');
        }
      }
    );
  };

  const handleRemoveFinalActivity = async (activityId) => {
    showModal(
      'Remove Final Activity',
      'Are you sure you want to remove this from final activities?',
      'confirm',
      async () => {
        try {
          await axios.delete(`/api/groups/${group.id}/final-activities/${activityId}`);
          fetchFinalActivities();
          showModal('Success', 'Activity removed from final list');
        } catch (err) {
          showModal('Error', 'Failed to remove activity');
        }
      }
    );
  };

  const findMidpoint = async () => {
    setLoading(true);
    try {
      const addresses = members.map(m => m.address);
      const midpointRes = await axios.post('/api/midpoint', { addresses });
      const { lat, lng } = midpointRes.data;
      setMidpoint({ lat, lng });

      const placesRes = await axios.post('/api/places', { lat, lng, type: activityType });
      setPlaces(placesRes.data);
    } catch (error) {
      console.error('Error:', error);
      showModal('Error', 'Failed to find midpoint. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const addToSuggested = async (place) => {
    try {
      await axios.post(`/api/groups/${group.id}/activities`, {
        activity: place,
        userId: user.id
      });
      showModal('Success', 'Activity added to suggestions!');
      fetchActivities();
    } catch (err) {
      showModal('Error', 'Failed to add activity. Please try again.');
    }
  };

  return (
    <div className="group-detail-page">
      <Modal
        isOpen={modal.isOpen}
        onClose={closeModal}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={modal.onConfirm}
      />
      <div className="page-header">
        <button onClick={onBack} className="btn btn-secondary">
          ← Back to Groups
        </button>
        <h1>{group.name}</h1>
      </div>

      <div className="create-group-content">
        {/* Members Section */}
        <div className="section">
          <h3>Members ({members.length})</h3>
          <div className="friends-grid">
            {members.map(member => (
              <div key={member.id} className="friend-card">
                <div>
                  <h4>{member.name}</h4>
                  <p style={{ fontSize: '12px', color: '#666' }}>{member.address}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs for Activities */}
        <div className="sub-tabs">
          <button
            className={`sub-tab ${activeTab === 'activities' ? 'active' : ''}`}
            onClick={() => setActiveTab('activities')}
          >
            Suggested Activities ({activities.length})
          </button>
          <button
            className={`sub-tab ${activeTab === 'final' ? 'active' : ''}`}
            onClick={() => setActiveTab('final')}
          >
            Final Activities ({finalActivities.length})
          </button>
        </div>

        {/* Activities Tab */}
        {activeTab === 'activities' && (
          <div className="section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div>
                <h3 style={{ margin: 0 }}>Suggested Activities</h3>
                <p style={{ fontSize: '14px', color: '#666', margin: '5px 0 0 0' }}>
                  Vote for activities you like. {members.length === 2 ? 'Both members must vote' : 'Majority vote'} to auto-finalize, or manually finalize anytime.
                </p>
              </div>
              <button
                onClick={() => setShowMidpointFinder(!showMidpointFinder)}
                className="btn btn-primary"
              >
                {showMidpointFinder ? 'Hide' : '+ Find Activities'}
              </button>
            </div>

            {/* Midpoint Finder */}
            {showMidpointFinder && (
              <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px', border: '2px solid #3498db' }}>
                <h4 style={{ marginTop: 0 }}>Find Meeting Spot</h4>
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
                      <Map midpoint={midpoint} friends={members} places={places} />
                    </div>

                    <h4 style={{ marginTop: '20px', marginBottom: '10px' }}>Recommended Places</h4>
                    {places.length > 0 ? (
                      <div className="places-grid">
                        {places.map((place, index) => (
                          <div key={index} className="place-card" style={{ cursor: 'default' }}>
                            <h3>{place.name}</h3>
                            <p>{place.address}</p>
                            {place.rating && <p className="rating">⭐ {place.rating}</p>}
                            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                              <a
                                href={`https://www.google.com/maps/place/?q=place_id:${place.placeId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-secondary btn-small"
                                style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}
                              >
                                View Map
                              </a>
                              <button
                                onClick={() => addToSuggested(place)}
                                className="btn btn-primary btn-small"
                                style={{ flex: 1 }}
                              >
                                Add to List
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>No places found nearby</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {activities.length > 0 ? (
              <div className="activities-list">
                {activities.map(activity => {
                  const hasVoted = activity.votes.includes(user.id);
                  const addedByUser = members.find(m => m.id === activity.addedBy);
                  const totalMembers = members.length;
                  const votesNeeded = totalMembers === 2 ? 2 : Math.ceil(totalMembers / 2);
                  const votesRemaining = votesNeeded - activity.votes.length;
                  
                  return (
                    <div key={activity.id} className="activity-card">
                      <div style={{ flex: 1 }}>
                        <h4>{activity.name}</h4>
                        <p style={{ fontSize: '14px', color: '#666' }}>{activity.address}</p>
                        {activity.rating && (
                          <p className="rating">⭐ {activity.rating}</p>
                        )}
                        <p style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                          Suggested by {addedByUser?.name || 'Unknown'} • {activity.votes.length}/{votesNeeded} votes
                          {votesRemaining > 0 && (
                            <span style={{ color: '#f39c12' }}> ({votesRemaining} more needed)</span>
                          )}
                        </p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button
                          onClick={() => handleVote(activity.id)}
                          className={`btn btn-small ${hasVoted ? 'btn-primary' : 'btn-secondary'}`}
                        >
                          {hasVoted ? 'Voted' : 'Vote'}
                        </button>
                        <button
                          onClick={() => handleFinalize(activity.id)}
                          className="btn btn-primary btn-small"
                        >
                          Finalize Now
                        </button>
                        <a
                          href={`https://www.google.com/maps/place/?q=place_id:${activity.placeId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary btn-small"
                          style={{ textAlign: 'center', textDecoration: 'none' }}
                        >
                          View Map
                        </a>
                        {activity.addedBy === user.id && (
                          <button
                            onClick={() => handleRemoveActivity(activity.id)}
                            className="btn btn-danger btn-small"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="placeholder-box">
                <p>No activities suggested yet</p>
                <p style={{ fontSize: '14px', color: '#666' }}>
                  Add activities from the midpoint finder
                </p>
              </div>
            )}
          </div>
        )}

        {/* Final Activities Tab */}
        {activeTab === 'final' && (
          <div className="section">
            <h3>Final Activities</h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
              These are the places everyone agreed to visit!
            </p>

            {finalActivities.length > 0 ? (
              <div className="activities-list">
                {finalActivities.map(activity => {
                  const addedByUser = members.find(m => m.id === activity.addedBy);
                  
                  return (
                    <div key={activity.id} className="activity-card final">
                      <div style={{ flex: 1 }}>
                        <h4>{activity.name}</h4>
                        <p style={{ fontSize: '14px', color: '#666' }}>{activity.address}</p>
                        {activity.rating && (
                          <p className="rating">⭐ {activity.rating}</p>
                        )}
                        <p style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                          Suggested by {addedByUser?.name || 'Unknown'} • Agreed on {new Date(activity.agreedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <a
                          href={`https://www.google.com/maps/place/?q=place_id:${activity.placeId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-small"
                          style={{ textAlign: 'center', textDecoration: 'none' }}
                        >
                          View Map
                        </a>
                        <button
                          onClick={() => handleRemoveFinalActivity(activity.id)}
                          className="btn btn-danger btn-small"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="placeholder-box">
                <p>No final activities yet</p>
                <p style={{ fontSize: '14px', color: '#666' }}>
                  Finalize activities from the suggestions to add them here
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default GroupDetailPage;
