import fs from 'fs/promises';

const DB_FILE = 'database.json';

// Default database structure
const defaultDB = {
  users: [],
  travelGroups: [],
  friendships: [],
  posts: []
};

// Initialize database
let db = { ...defaultDB };

// Load database from file
async function loadDB() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf-8');
    db = JSON.parse(data);
    console.log('Database loaded');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('Creating new database file');
      await saveDB();
    } else {
      console.error('Error loading database:', error);
    }
  }
}

// Save database to file
async function saveDB() {
  try {
    await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2));
  } catch (error) {
    console.error('Error saving database:', error);
  }
}

// Initialize on import
await loadDB();

// ============= USER OPERATIONS =============

export function createUser(name, address, password) {
  // Check if user with same name already exists (enforce uniqueness)
  const existingUser = db.users.find(u => u.name.toLowerCase() === name.toLowerCase());
  if (existingUser) {
    return { error: 'User with this name already exists', existingUser };
  }

  const user = {
    id: Date.now(),
    name,
    address,
    password,
    bio: '',
    hometown: '',
    age: null,
    profilePicture: null,
    createdAt: new Date().toISOString()
  };
  db.users.push(user);
  saveDB();
  return user;
}

export function getUser(userId) {
  return db.users.find(u => u.id === userId);
}

export function getAllUsers() {
  return db.users;
}

export function updateUserAddress(userId, newAddress) {
  const user = db.users.find(u => u.id === userId);
  if (user) {
    user.address = newAddress;
    saveDB();
    return user;
  }
  return null;
}

export function updateUserPassword(userId, newPassword) {
  const user = db.users.find(u => u.id === userId);
  if (user) {
    user.password = newPassword;
    saveDB();
    return user;
  }
  return null;
}

export function updateUserProfile(userId, profileData) {
  const user = db.users.find(u => u.id === userId);
  if (user) {
    if (profileData.bio !== undefined) user.bio = profileData.bio;
    if (profileData.hometown !== undefined) user.hometown = profileData.hometown;
    if (profileData.age !== undefined) user.age = profileData.age;
    if (profileData.profilePicture !== undefined) user.profilePicture = profileData.profilePicture;
    saveDB();
    return user;
  }
  return null;
}

export function verifyUserPassword(name, password) {
  const user = db.users.find(u => u.name.toLowerCase() === name.toLowerCase());
  if (user && user.password === password) {
    return user;
  }
  return null;
}

export function deleteUser(userId) {
  const index = db.users.findIndex(u => u.id === userId);
  if (index !== -1) {
    db.users.splice(index, 1);
    // Also remove from friendships and groups
    db.friendships = db.friendships.filter(f => f.userId !== userId && f.friendId !== userId);
    db.travelGroups.forEach(group => {
      group.members = group.members.filter(m => m.userId !== userId);
    });
    saveDB();
    return true;
  }
  return false;
}

// ============= FRIENDSHIP OPERATIONS =============

export function addFriend(userId, friendId) {
  // Check if friendship already exists (accepted or pending)
  const exists = db.friendships.find(
    f => (f.userId === userId && f.friendId === friendId) ||
         (f.userId === friendId && f.friendId === userId)
  );
  
  if (exists) {
    return { success: false, message: 'Friend request already exists' };
  }

  const friendship = {
    id: Date.now(),
    userId,
    friendId,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  db.friendships.push(friendship);
  saveDB();
  return { success: true, friendship };
}

export function getFriends(userId) {
  const friendIds = new Set();
  
  db.friendships.forEach(f => {
    if (f.status === 'accepted') {
      if (f.userId === userId) friendIds.add(f.friendId);
      if (f.friendId === userId) friendIds.add(f.userId);
    }
  });
  
  return db.users.filter(u => friendIds.has(u.id));
}

export function getSentRequests(userId) {
  return db.friendships
    .filter(f => f.userId === userId && f.status === 'pending')
    .map(f => {
      const friend = db.users.find(u => u.id === f.friendId);
      return {
        ...f,
        friend
      };
    });
}

export function getReceivedRequests(userId) {
  return db.friendships
    .filter(f => f.friendId === userId && f.status === 'pending')
    .map(f => {
      const friend = db.users.find(u => u.id === f.userId);
      return {
        ...f,
        friend
      };
    });
}

export function acceptFriendRequest(friendshipId) {
  const friendship = db.friendships.find(f => f.id === friendshipId);
  if (friendship) {
    friendship.status = 'accepted';
    saveDB();
    return { success: true, friendship };
  }
  return { success: false, message: 'Friend request not found' };
}

export function rejectFriendRequest(friendshipId) {
  const index = db.friendships.findIndex(f => f.id === friendshipId);
  if (index !== -1) {
    db.friendships.splice(index, 1);
    saveDB();
    return { success: true };
  }
  return { success: false, message: 'Friend request not found' };
}

export function removeFriend(userId, friendId) {
  const index = db.friendships.findIndex(
    f => (f.userId === userId && f.friendId === friendId) ||
         (f.userId === friendId && f.friendId === userId)
  );
  
  if (index !== -1) {
    db.friendships.splice(index, 1);
    saveDB();
    return true;
  }
  return false;
}

// ============= TRAVEL GROUP OPERATIONS =============

export function createTravelGroup(name, creatorId) {
  const group = {
    id: Date.now(), // Unique ID for the group
    name, // Travel group name (no limit)
    creatorId,
    members: [{ userId: creatorId, addedAt: new Date().toISOString() }],
    activities: [], // User-suggested activities (ideal spots)
    finalActivities: [], // Activities all users agreed on
    createdAt: new Date().toISOString()
  };
  
  db.travelGroups.push(group);
  saveDB();
  return group;
}

export function getTravelGroup(groupId) {
  return db.travelGroups.find(g => g.id === groupId);
}

export function getUserGroups(userId) {
  return db.travelGroups.filter(g => 
    g.members.some(m => m.userId === userId)
  );
}

export function getAllGroups() {
  return db.travelGroups;
}

export function addMemberToGroup(groupId, userId) {
  const group = db.travelGroups.find(g => g.id === groupId);
  if (!group) return { success: false, message: 'Group not found' };
  
  // Check if already a member
  if (group.members.some(m => m.userId === userId)) {
    return { success: false, message: 'User already in group' };
  }
  
  group.members.push({
    userId,
    addedAt: new Date().toISOString()
  });
  
  saveDB();
  return { success: true, group };
}

export function removeMemberFromGroup(groupId, userId) {
  const group = db.travelGroups.find(g => g.id === groupId);
  if (!group) return false;
  
  group.members = group.members.filter(m => m.userId !== userId);
  saveDB();
  return true;
}

export function getGroupMembers(groupId) {
  const group = db.travelGroups.find(g => g.id === groupId);
  if (!group) return [];
  
  return group.members.map(m => {
    const user = db.users.find(u => u.id === m.userId);
    return {
      ...user,
      addedAt: m.addedAt
    };
  });
}

export function addActivityToGroup(groupId, activity, userId) {
  const group = db.travelGroups.find(g => g.id === groupId);
  if (!group) return { success: false, message: 'Group not found' };
  
  const newActivity = {
    id: Date.now(),
    ...activity,
    addedBy: userId,
    votes: [], // Array of user IDs who voted for this activity
    addedAt: new Date().toISOString()
  };
  
  group.activities.push(newActivity);
  saveDB();
  return { success: true, activity: newActivity };
}

export function getGroupActivities(groupId) {
  const group = db.travelGroups.find(g => g.id === groupId);
  return group ? group.activities : [];
}

export function voteForActivity(groupId, activityId, userId) {
  const group = db.travelGroups.find(g => g.id === groupId);
  if (!group) return { success: false, message: 'Group not found' };
  
  const activity = group.activities.find(a => a.id === activityId);
  if (!activity) return { success: false, message: 'Activity not found' };
  
  // Toggle vote
  if (activity.votes.includes(userId)) {
    activity.votes = activity.votes.filter(id => id !== userId);
  } else {
    activity.votes.push(userId);
  }
  
  // Check if activity should be auto-finalized
  const totalMembers = group.members.length;
  const votesNeeded = totalMembers === 2 ? 2 : Math.ceil(totalMembers / 2);
  const shouldFinalize = activity.votes.length >= votesNeeded;
  
  saveDB();
  return { 
    success: true, 
    activity, 
    votes: activity.votes.length,
    autoFinalized: shouldFinalize,
    votesNeeded
  };
}

export function moveToFinalActivities(groupId, activityId) {
  const group = db.travelGroups.find(g => g.id === groupId);
  if (!group) return { success: false, message: 'Group not found' };
  
  const activityIndex = group.activities.findIndex(a => a.id === activityId);
  if (activityIndex === -1) return { success: false, message: 'Activity not found' };
  
  const activity = group.activities[activityIndex];
  
  // Initialize finalActivities if it doesn't exist (for older groups)
  if (!group.finalActivities) {
    group.finalActivities = [];
  }
  
  // Move to final activities
  group.finalActivities.push({
    ...activity,
    agreedAt: new Date().toISOString()
  });
  
  // Remove from activities
  group.activities.splice(activityIndex, 1);
  
  saveDB();
  return { success: true };
}

export function getFinalActivities(groupId) {
  const group = db.travelGroups.find(g => g.id === groupId);
  if (!group) return [];
  
  // Initialize finalActivities if it doesn't exist (for older groups)
  if (!group.finalActivities) {
    group.finalActivities = [];
  }
  
  return group.finalActivities;
}

export function removeActivityFromGroup(groupId, activityId) {
  const group = db.travelGroups.find(g => g.id === groupId);
  if (!group) return { success: false, message: 'Group not found' };
  
  const activityIndex = group.activities.findIndex(a => a.id === activityId);
  if (activityIndex === -1) return { success: false, message: 'Activity not found' };
  
  group.activities.splice(activityIndex, 1);
  saveDB();
  return { success: true };
}

export function removeFinalActivity(groupId, activityId) {
  const group = db.travelGroups.find(g => g.id === groupId);
  if (!group) return { success: false, message: 'Group not found' };
  
  // Initialize finalActivities if it doesn't exist (for older groups)
  if (!group.finalActivities) {
    group.finalActivities = [];
  }
  
  const activityIndex = group.finalActivities.findIndex(a => a.id === activityId);
  if (activityIndex === -1) return { success: false, message: 'Activity not found' };
  
  group.finalActivities.splice(activityIndex, 1);
  saveDB();
  return { success: true };
}

export function deleteGroup(groupId) {
  const index = db.travelGroups.findIndex(g => g.id === groupId);
  if (index !== -1) {
    db.travelGroups.splice(index, 1);
    saveDB();
    return true;
  }
  return false;
}

// ============= POST OPERATIONS =============

export function createPost(userId, caption, imageUrl) {
  const post = {
    id: Date.now(),
    userId,
    caption,
    imageUrl,
    likes: [], // Array of user IDs who liked this post
    createdAt: new Date().toISOString()
  };
  
  if (!db.posts) {
    db.posts = [];
  }
  
  db.posts.push(post);
  saveDB();
  return post;
}

export function getAllPosts() {
  if (!db.posts) {
    db.posts = [];
  }
  
  // Return posts sorted by newest first with user info
  return db.posts
    .map(post => {
      const user = db.users.find(u => u.id === post.userId);
      return {
        ...post,
        user: user ? { id: user.id, name: user.name, profilePicture: user.profilePicture } : null
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getUserPosts(userId) {
  if (!db.posts) {
    db.posts = [];
  }
  
  return db.posts
    .filter(p => p.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getPost(postId) {
  if (!db.posts) {
    db.posts = [];
  }
  
  return db.posts.find(p => p.id === postId);
}

export function likePost(postId, userId) {
  if (!db.posts) {
    db.posts = [];
  }
  
  const post = db.posts.find(p => p.id === postId);
  if (!post) return { success: false, message: 'Post not found' };
  
  if (!post.likes) {
    post.likes = [];
  }
  
  // Toggle like
  if (post.likes.includes(userId)) {
    post.likes = post.likes.filter(id => id !== userId);
  } else {
    post.likes.push(userId);
  }
  
  saveDB();
  return { success: true, post, liked: post.likes.includes(userId) };
}

export function deletePost(postId, userId) {
  if (!db.posts) {
    db.posts = [];
  }
  
  const post = db.posts.find(p => p.id === postId);
  if (!post) return { success: false, message: 'Post not found' };
  
  // Only the post creator can delete it
  if (post.userId !== userId) {
    return { success: false, message: 'Unauthorized' };
  }
  
  const index = db.posts.findIndex(p => p.id === postId);
  db.posts.splice(index, 1);
  saveDB();
  return { success: true };
}

// ============= UTILITY FUNCTIONS =============

export function searchUsers(query) {
  const lowerQuery = query.toLowerCase();
  return db.users.filter(u => 
    u.name.toLowerCase().includes(lowerQuery) ||
    u.address.toLowerCase().includes(lowerQuery)
  );
}

export function getStats() {
  return {
    totalUsers: db.users.length,
    totalGroups: db.travelGroups.length,
    totalFriendships: db.friendships.length
  };
}

// Export the database for direct access if needed
export function getDatabase() {
  return db;
}
