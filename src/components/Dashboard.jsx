import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import GroupView from './GroupView';

function Dashboard() {
  const { user, logout } = useAuth();
  const [groups, setGroups] = useState([]);
  const [friends, setFriends] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    fetchGroups();
    fetchFriends();
  }, []);

  const fetchGroups = async () => {
    const res = await axios.get('/api/groups');
    setGroups(res.data);
  };

  const fetchFriends = async () => {
    const res = await axios.get('/api/friends');
    setFriends(res.data);
  };

  const createGroup = async (e) => {
    e.preventDefault();
    await axios.post('/api/groups', { name: newGroupName });
    setNewGroupName('');
    setShowCreateGroup(false);
    fetchGroups();
  };

  const searchUsers = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    const res = await axios.get(`/api/users/search?q=${query}`);
    setSearchResults(res.data);
  };

  const sendFriendRequest = async (friendId) => {
    await axios.post('/api/friends/request', { friendId });
    alert('Friend request sent!');
    setSearchResults([]);
    setSearchQuery('');
  };

  if (selectedGroup) {
    return <GroupView group={selectedGroup} onBack={() => setSelectedGroup(null)} friends={friends} />;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Welcome, {user?.username}!</h1>
          <p style={{ color: '#666' }}>{user?.home_address}</p>
        </div>
        <button onClick={logout} className="btn btn-secondary">Logout</button>
      </div>

      <div className="dashboard-content">
        <div className="sidebar">
          <div className="section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3>Friends ({friends.length})</h3>
              <button onClick={() => setShowAddFriend(!showAddFriend)} className="btn-icon">+</button>
            </div>

            {showAddFriend && (
              <div style={{ marginBottom: '15px' }}>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    searchUsers(e.target.value);
                  }}
                  style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
                />
                {searchResults.map(u => (
                  <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: '#f8f9fa', marginBottom: '5px', borderRadius: '4px' }}>
                    <span>{u.username}</span>
                    <button onClick={() => sendFriendRequest(u.id)} className="btn-small">Add</button>
                  </div>
                ))}
              </div>
            )}

            <div className="friend-list-sidebar">
              {friends.map(friend => (
                <div key={friend.id} className="friend-item-sidebar">
                  <strong>{friend.username}</strong>
                  <p style={{ fontSize: '12px', color: '#666' }}>{friend.home_address}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="main-content">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Travel Groups</h2>
            <button onClick={() => setShowCreateGroup(!showCreateGroup)} className="btn btn-primary">
              Create Group
            </button>
          </div>

          {showCreateGroup && (
            <form onSubmit={createGroup} style={{ marginBottom: '20px', background: 'white', padding: '20px', borderRadius: '8px' }}>
              <div className="form-group">
                <label>Group Name</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Weekend Trip"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary">Create</button>
            </form>
          )}

          <div className="groups-grid">
            {groups.map(group => (
              <div key={group.id} className="group-card" onClick={() => setSelectedGroup(group)}>
                <h3>{group.name}</h3>
                <p style={{ fontSize: '14px', color: '#666' }}>Created by {group.creator}</p>
                <p style={{ fontSize: '12px', color: '#999' }}>{new Date(group.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
