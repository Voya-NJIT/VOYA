import { useState, useEffect } from 'react';
import axios from 'axios';
import CreateGroupPage from './CreateGroupPage';
import GroupDetailPage from './GroupDetailPage';
import SocialFeed from './SocialFeed';
import ProfilePage from './ProfilePage';
import FriendsMap from './FriendsMap';

function FriendsTab({ user }) {
  const [subTab, setSubTab] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [receivedRequests, setReceivedRequests] = useState([]);
  const [friendName, setFriendName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFriend, setSelectedFriend] = useState(null);

  useEffect(() => {
    fetchFriends();
    fetchSentRequests();
    fetchReceivedRequests();
  }, []);

  const fetchFriends = async () => {
    try {
      const res = await axios.get(`/api/users/${user.id}/friends`);
      setFriends(res.data);
    } catch (err) {
      console.error('Error fetching friends:', err);
    }
  };

  const fetchSentRequests = async () => {
    try {
      const res = await axios.get(`/api/users/${user.id}/friends/sent`);
      setSentRequests(res.data);
    } catch (err) {
      console.error('Error fetching sent requests:', err);
    }
  };

  const fetchReceivedRequests = async () => {
    try {
      const res = await axios.get(`/api/users/${user.id}/friends/received`);
      setReceivedRequests(res.data);
    } catch (err) {
      console.error('Error fetching received requests:', err);
    }
  };

  const sendFriendRequest = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post(`/api/users/${user.id}/friends`, { friendName });
      setFriendName('');
      fetchSentRequests();
      alert('Friend request sent!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (friendshipId) => {
    try {
      await axios.post(`/api/friends/${friendshipId}/accept`);
      fetchFriends();
      fetchReceivedRequests();
    } catch (err) {
      alert('Failed to accept request');
    }
  };

  const rejectRequest = async (friendshipId) => {
    try {
      await axios.post(`/api/friends/${friendshipId}/reject`);
      fetchReceivedRequests();
    } catch (err) {
      alert('Failed to reject request');
    }
  };

  return (
    <div className="friends-tab">
      <h2>Friends</h2>
      
      {/* Add Friend Form */}
      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginBottom: '15px' }}>Add Friend</h3>
        <form onSubmit={sendFriendRequest} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              value={friendName}
              onChange={(e) => setFriendName(e.target.value)}
              placeholder="Enter friend's username"
              required
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' }}
            />
            {error && <p style={{ color: '#e74c3c', fontSize: '12px', marginTop: '5px' }}>{error}</p>}
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Sending...' : 'Send Request'}
          </button>
        </form>
      </div>

      {/* Sub Tabs */}
      <div className="sub-tabs">
        <button
          className={`sub-tab ${subTab === 'friends' ? 'active' : ''}`}
          onClick={() => setSubTab('friends')}
        >
          Friends ({friends.length})
        </button>
        <button
          className={`sub-tab ${subTab === 'sent' ? 'active' : ''}`}
          onClick={() => setSubTab('sent')}
        >
          Requests Sent ({sentRequests.length})
        </button>
        <button
          className={`sub-tab ${subTab === 'received' ? 'active' : ''}`}
          onClick={() => setSubTab('received')}
        >
          Follow Requests ({receivedRequests.length})
        </button>
      </div>

      {/* Sub Tab Content */}
      <div className="sub-tab-content">
        {subTab === 'friends' && (
          <div>
            {friends.length > 0 ? (
              <div className="friends-list">
                {friends.map(friend => (
                  <div key={friend.id} className="friend-card">
                    <div>
                      <h4>{friend.name}</h4>
                      <p style={{ fontSize: '14px', color: '#666' }}>{friend.address}</p>
                    </div>
                    <button 
                      className="btn btn-secondary btn-small"
                      onClick={() => setSelectedFriend(friend)}
                    >
                      View Profile
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="placeholder-box">
                <p>No friends yet</p>
                <p style={{ fontSize: '14px', color: '#666' }}>Send a friend request to get started!</p>
              </div>
            )}

            {/* Friend Profile Modal */}
            {selectedFriend && (
              <div className="modal-overlay" onClick={() => setSelectedFriend(null)}>
                <div className="friend-profile-modal" onClick={(e) => e.stopPropagation()}>
                  <button 
                    className="modal-close-btn"
                    onClick={() => setSelectedFriend(null)}
                  >
                    ×
                  </button>
                  
                  {selectedFriend.profilePicture ? (
                    <img 
                      src={selectedFriend.profilePicture} 
                      alt={selectedFriend.name}
                      className="profile-picture-large"
                    />
                  ) : (
                    <div className="profile-avatar-large">
                      {selectedFriend.name[0].toUpperCase()}
                    </div>
                  )}
                  
                  <h2>{selectedFriend.name}</h2>
                  
                  <div className="friend-profile-details">
                    <div className="profile-detail-item">
                      <label>Address</label>
                      <p>{selectedFriend.address}</p>
                    </div>
                    
                    {selectedFriend.hometown && (
                      <div className="profile-detail-item">
                        <label>Hometown</label>
                        <p>{selectedFriend.hometown}</p>
                      </div>
                    )}
                    
                    {selectedFriend.age && (
                      <div className="profile-detail-item">
                        <label>Age</label>
                        <p>{selectedFriend.age}</p>
                      </div>
                    )}
                    
                    {selectedFriend.bio && (
                      <div className="profile-detail-item">
                        <label>Bio</label>
                        <p className="profile-bio">{selectedFriend.bio}</p>
                      </div>
                    )}
                    
                    {!selectedFriend.hometown && !selectedFriend.age && !selectedFriend.bio && (
                      <p style={{ textAlign: 'center', color: '#999', marginTop: '20px' }}>
                        This user hasn't completed their profile yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {subTab === 'sent' && (
          <div>
            {sentRequests.length > 0 ? (
              <div className="friends-list">
                {sentRequests.map(request => (
                  <div key={request.id} className="friend-card">
                    <div>
                      <h4>{request.friend.name}</h4>
                      <p style={{ fontSize: '12px', color: '#999' }}>Sent {new Date(request.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span style={{ color: '#f39c12', fontSize: '14px' }}>⏳ Pending</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="placeholder-box">
                <p>No pending requests</p>
              </div>
            )}
          </div>
        )}

        {subTab === 'received' && (
          <div>
            {receivedRequests.length > 0 ? (
              <div className="friends-list">
                {receivedRequests.map(request => (
                  <div key={request.id} className="friend-card">
                    <div>
                      <h4>{request.friend.name}</h4>
                      <p style={{ fontSize: '12px', color: '#999' }}>Received {new Date(request.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => acceptRequest(request.id)}
                        className="btn btn-primary btn-small"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => rejectRequest(request.id)}
                        className="btn btn-danger btn-small"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="placeholder-box">
                <p>No friend requests</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function GroupsTab({ user }) {
  const [groups, setGroups] = useState([]);
  const [showCreatePage, setShowCreatePage] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await axios.get(`/api/groups?userId=${user.id}`);
      setGroups(res.data);
    } catch (err) {
      console.error('Error fetching groups:', err);
    }
  };

  const handleGroupCreated = () => {
    setShowCreatePage(false);
    fetchGroups();
  };

  if (showCreatePage) {
    return (
      <CreateGroupPage
        user={user}
        onBack={() => setShowCreatePage(false)}
        onGroupCreated={handleGroupCreated}
      />
    );
  }

  if (selectedGroup) {
    return (
      <GroupDetailPage
        user={user}
        group={selectedGroup}
        onBack={() => setSelectedGroup(null)}
      />
    );
  }

  return (
    <div className="groups-tab">
      <h2>Travel Groups</h2>
      <p>Your travel groups and adventures</p>

      <button
        onClick={() => setShowCreatePage(true)}
        className="btn btn-primary"
        style={{ marginBottom: '20px' }}
      >
        + Create New Group
      </button>

      {groups.length > 0 ? (
        <div className="groups-grid">
          {groups.map(group => (
            <div key={group.id} className="group-card">
              <h3>{group.name}</h3>
              <p style={{ fontSize: '14px', color: '#666' }}>
                Created by {group.creator}
              </p>
              <p style={{ fontSize: '12px', color: '#999' }}>
                {new Date(group.createdAt).toLocaleDateString()}
              </p>
              <button 
                onClick={() => setSelectedGroup(group)}
                className="btn btn-secondary btn-small" 
                style={{ marginTop: '10px' }}
              >
                View Group
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="placeholder-box">
          <p>No travel groups yet</p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Create a group to plan trips with friends
          </p>
        </div>
      )}
    </div>
  );
}

function HomePage({ user, onLogout, onUserUpdate }) {
  const [activeTab, setActiveTab] = useState('friends');

  return (
    <div className="home-page">
      {/* Header */}
      <div className="home-header">
        <div>
          <h1>Voya</h1>
          <p>Welcome, {user.name}!</p>
        </div>
        <button onClick={onLogout} className="btn btn-secondary">
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          Friends
        </button>
        <button
          className={`tab ${activeTab === 'groups' ? 'active' : ''}`}
          onClick={() => setActiveTab('groups')}
        >
          Travel Groups
        </button>
        <button
          className={`tab ${activeTab === 'social' ? 'active' : ''}`}
          onClick={() => setActiveTab('social')}
        >
          Social
        </button>
        <button
          className={`tab ${activeTab === 'map' ? 'active' : ''}`}
          onClick={() => setActiveTab('map')}
        >
          Map
        </button>
        <button
          className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'friends' && (
          <FriendsTab user={user} />
        )}

        {activeTab === 'groups' && (
          <GroupsTab user={user} />
        )}

        {activeTab === 'social' && (
          <SocialFeed currentUser={user} />
        )}

        {activeTab === 'map' && (
          <FriendsMap currentUser={user} />
        )}

        {activeTab === 'profile' && (
          <ProfilePage currentUser={user} onUserUpdate={onUserUpdate} />
        )}
      </div>
    </div>
  );
}

export default HomePage;
