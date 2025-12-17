import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import bcrypt from 'bcryptjs';

// Initialize database
const adapter = new JSONFile('db.json');
const defaultData = { users: [], friendships: [], groups: [], groupMembers: [], activities: [] };
const db = new Low(adapter, defaultData);

await db.read();
db.data = db.data || defaultData;
await db.write();

let userId = (db.data.users && db.data.users.length > 0) ? Math.max(...db.data.users.map(u => u.id)) + 1 : 1;
let friendshipId = (db.data.friendships && db.data.friendships.length > 0) ? Math.max(...db.data.friendships.map(f => f.id)) + 1 : 1;
let groupId = (db.data.groups && db.data.groups.length > 0) ? Math.max(...db.data.groups.map(g => g.id)) + 1 : 1;
let activityId = (db.data.activities && db.data.activities.length > 0) ? Math.max(...db.data.activities.map(a => a.id)) + 1 : 1;

// User operations
export const createUser = (username, password, homeAddress) => {
  const hashedPassword = bcrypt.hashSync(password, 10);
  const user = {
    id: userId++,
    username,
    password: hashedPassword,
    home_address: homeAddress,
    created_at: new Date().toISOString()
  };
  db.data.users.push(user);
  db.write();
  return { lastInsertRowid: user.id };
};

export const getUserByUsername = (username) => {
  return db.data.users.find(u => u.username === username);
};

export const getUserById = (id) => {
  const user = db.data.users.find(u => u.id === id);
  if (!user) return null;
  return { id: user.id, username: user.username, home_address: user.home_address };
};

export const verifyPassword = (password, hashedPassword) => {
  return bcrypt.compareSync(password, hashedPassword);
};

// Friend operations
export const sendFriendRequest = (userId, friendId) => {
  const friendship = {
    id: friendshipId++,
    user_id: userId,
    friend_id: friendId,
    status: 'pending',
    created_at: new Date().toISOString()
  };
  db.data.friendships.push(friendship);
  db.write();
  return { lastInsertRowid: friendship.id };
};

export const acceptFriendRequest = (userId, friendId) => {
  const friendship = db.data.friendships.find(
    f => f.user_id === friendId && f.friend_id === userId
  );
  if (friendship) {
    friendship.status = 'accepted';
    db.write();
  }
  return { changes: 1 };
};

export const getFriends = (userId) => {
  const friendIds = new Set();
  
  db.data.friendships.forEach(f => {
    if (f.status === 'accepted') {
      if (f.user_id === userId) friendIds.add(f.friend_id);
      if (f.friend_id === userId) friendIds.add(f.user_id);
    }
  });
  
  return db.data.users
    .filter(u => friendIds.has(u.id))
    .map(u => ({ id: u.id, username: u.username, home_address: u.home_address }));
};

export const searchUsers = (query, currentUserId) => {
  return db.data.users
    .filter(u => u.username.toLowerCase().includes(query.toLowerCase()) && u.id !== currentUserId)
    .slice(0, 10)
    .map(u => ({ id: u.id, username: u.username }));
};

// Travel group operations
export const createTravelGroup = (name, creatorId) => {
  const group = {
    id: groupId++,
    name,
    creator_id: creatorId,
    created_at: new Date().toISOString()
  };
  db.data.groups.push(group);
  
  // Auto-add creator as member
  db.data.groupMembers.push({
    group_id: group.id,
    user_id: creatorId,
    joined_at: new Date().toISOString()
  });
  
  db.write();
  return { lastInsertRowid: group.id };
};

export const addGroupMember = (groupId, userId) => {
  db.data.groupMembers.push({
    group_id: groupId,
    user_id: userId,
    joined_at: new Date().toISOString()
  });
  db.write();
  return { changes: 1 };
};

export const getGroupMembers = (groupId) => {
  const memberIds = db.data.groupMembers
    .filter(gm => gm.group_id === groupId)
    .map(gm => gm.user_id);
  
  return db.data.users
    .filter(u => memberIds.includes(u.id))
    .map(u => ({ id: u.id, username: u.username, home_address: u.home_address }));
};

export const getUserGroups = (userId) => {
  const userGroupIds = db.data.groupMembers
    .filter(gm => gm.user_id === userId)
    .map(gm => gm.group_id);
  
  return db.data.groups
    .filter(g => userGroupIds.includes(g.id))
    .map(g => {
      const creator = db.data.users.find(u => u.id === g.creator_id);
      return {
        id: g.id,
        name: g.name,
        created_at: g.created_at,
        creator: creator?.username || 'Unknown'
      };
    });
};

export const getGroupById = (groupId) => {
  return db.data.groups.find(g => g.id === groupId);
};

// Activity operations
export const addGroupActivity = (groupId, placeData, userId) => {
  const activity = {
    id: activityId++,
    group_id: groupId,
    place_name: placeData.name,
    place_address: placeData.address,
    place_id: placeData.placeId,
    rating: placeData.rating,
    lat: placeData.lat,
    lng: placeData.lng,
    added_by: userId,
    added_at: new Date().toISOString()
  };
  db.data.activities.push(activity);
  db.write();
  return { lastInsertRowid: activity.id };
};

export const getGroupActivities = (groupId) => {
  return db.data.activities
    .filter(a => a.group_id === groupId)
    .map(a => {
      const user = db.data.users.find(u => u.id === a.added_by);
      return {
        ...a,
        added_by_username: user?.username || 'Unknown'
      };
    });
};

export default db;
