import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';

const db = new Database('meetup.db');

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    home_address TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS friendships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    friend_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (friend_id) REFERENCES users(id),
    UNIQUE(user_id, friend_id)
  );

  CREATE TABLE IF NOT EXISTS travel_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    creator_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS group_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES travel_groups(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(group_id, user_id)
  );

  CREATE TABLE IF NOT EXISTS group_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER NOT NULL,
    place_name TEXT NOT NULL,
    place_address TEXT NOT NULL,
    place_id TEXT NOT NULL,
    rating REAL,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    added_by INTEGER NOT NULL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES travel_groups(id),
    FOREIGN KEY (added_by) REFERENCES users(id)
  );
`);

// User operations
export const createUser = (username, password, homeAddress) => {
  const hashedPassword = bcrypt.hashSync(password, 10);
  const stmt = db.prepare('INSERT INTO users (username, password, home_address) VALUES (?, ?, ?)');
  return stmt.run(username, hashedPassword, homeAddress);
};

export const getUserByUsername = (username) => {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
};

export const getUserById = (id) => {
  return db.prepare('SELECT id, username, home_address FROM users WHERE id = ?').get(id);
};

export const verifyPassword = (password, hashedPassword) => {
  return bcrypt.compareSync(password, hashedPassword);
};

// Friend operations
export const sendFriendRequest = (userId, friendId) => {
  const stmt = db.prepare('INSERT INTO friendships (user_id, friend_id, status) VALUES (?, ?, ?)');
  return stmt.run(userId, friendId, 'pending');
};

export const acceptFriendRequest = (userId, friendId) => {
  const stmt = db.prepare('UPDATE friendships SET status = ? WHERE user_id = ? AND friend_id = ?');
  return stmt.run('accepted', friendId, userId);
};

export const getFriends = (userId) => {
  return db.prepare(`
    SELECT u.id, u.username, u.home_address 
    FROM users u
    INNER JOIN friendships f ON (f.friend_id = u.id AND f.user_id = ?)
    WHERE f.status = 'accepted'
    UNION
    SELECT u.id, u.username, u.home_address 
    FROM users u
    INNER JOIN friendships f ON (f.user_id = u.id AND f.friend_id = ?)
    WHERE f.status = 'accepted'
  `).all(userId, userId);
};

export const searchUsers = (query, currentUserId) => {
  return db.prepare(`
    SELECT id, username FROM users 
    WHERE username LIKE ? AND id != ?
    LIMIT 10
  `).all(`%${query}%`, currentUserId);
};

// Travel group operations
export const createTravelGroup = (name, creatorId) => {
  const stmt = db.prepare('INSERT INTO travel_groups (name, creator_id) VALUES (?, ?)');
  const result = stmt.run(name, creatorId);
  // Auto-add creator as member
  db.prepare('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)').run(result.lastInsertRowid, creatorId);
  return result;
};

export const addGroupMember = (groupId, userId) => {
  const stmt = db.prepare('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)');
  return stmt.run(groupId, userId);
};

export const getGroupMembers = (groupId) => {
  return db.prepare(`
    SELECT u.id, u.username, u.home_address
    FROM users u
    INNER JOIN group_members gm ON gm.user_id = u.id
    WHERE gm.group_id = ?
  `).all(groupId);
};

export const getUserGroups = (userId) => {
  return db.prepare(`
    SELECT tg.id, tg.name, tg.created_at, u.username as creator
    FROM travel_groups tg
    INNER JOIN group_members gm ON gm.group_id = tg.id
    INNER JOIN users u ON u.id = tg.creator_id
    WHERE gm.user_id = ?
    ORDER BY tg.created_at DESC
  `).all(userId);
};

export const getGroupById = (groupId) => {
  return db.prepare('SELECT * FROM travel_groups WHERE id = ?').get(groupId);
};

// Activity operations
export const addGroupActivity = (groupId, placeData, userId) => {
  const stmt = db.prepare(`
    INSERT INTO group_activities (group_id, place_name, place_address, place_id, rating, lat, lng, added_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  return stmt.run(
    groupId,
    placeData.name,
    placeData.address,
    placeData.placeId,
    placeData.rating,
    placeData.lat,
    placeData.lng,
    userId
  );
};

export const getGroupActivities = (groupId) => {
  return db.prepare(`
    SELECT ga.*, u.username as added_by_username
    FROM group_activities ga
    INNER JOIN users u ON u.id = ga.added_by
    WHERE ga.group_id = ?
    ORDER BY ga.added_at DESC
  `).all(groupId);
};

export default db;
