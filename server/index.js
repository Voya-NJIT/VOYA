import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from '@googlemaps/google-maps-services-js';
import * as db from './database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const client = new Client({});
const PORT = process.env.PORT || 3001;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Address autocomplete
app.get('/api/address/autocomplete', async (req, res) => {
  console.log('=== AUTOCOMPLETE REQUEST ===');
  console.log('Input:', req.query.input);
  
  try {
    const { input } = req.query;
    
    if (!input || input.length < 3) {
      return res.json([]);
    }

    if (!process.env.GOOGLE_MAPS_API_KEY) {
      console.error('GOOGLE_MAPS_API_KEY not set!');
      return res.status(500).json({ error: 'Server missing API key' });
    }

    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&types=address&key=${process.env.GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    console.log('Google API status:', data.status);
    console.log('Results:', data.predictions?.length || 0);

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google API error:', data.status, data.error_message);
      return res.status(500).json({ error: data.error_message || 'API error' });
    }

    const suggestions = (data.predictions || []).map(prediction => ({
      place_id: prediction.place_id,
      description: prediction.description,
      main_text: prediction.structured_formatting?.main_text || prediction.description,
      secondary_text: prediction.structured_formatting?.secondary_text || ''
    }));

    console.log('Returning', suggestions.length, 'suggestions');
    res.json(suggestions);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

// Calculate midpoint from multiple addresses
app.post('/api/midpoint', async (req, res) => {
  try {
    const { addresses } = req.body;
    
    if (!addresses || addresses.length < 2) {
      return res.status(400).json({ error: 'At least 2 addresses required' });
    }

    const geocodePromises = addresses.map(address =>
      client.geocode({
        params: {
          address,
          key: process.env.GOOGLE_MAPS_API_KEY
        }
      })
    );

    const results = await Promise.all(geocodePromises);
    const locations = results.map(r => r.data.results[0].geometry.location);

    const avgLat = locations.reduce((sum, loc) => sum + loc.lat, 0) / locations.length;
    const avgLng = locations.reduce((sum, loc) => sum + loc.lng, 0) / locations.length;

    res.json({ lat: avgLat, lng: avgLng });
  } catch (error) {
    console.error('Midpoint error:', error);
    res.status(500).json({ error: 'Failed to calculate midpoint' });
  }
});

// Geocode single address
app.post('/api/geocode', async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({ error: 'Address required' });
    }

    const response = await client.geocode({
      params: {
        address,
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.results.length === 0) {
      return res.status(404).json({ error: 'Address not found' });
    }

    const location = response.data.results[0].geometry.location;
    res.json({ lat: location.lat, lng: location.lng, address: response.data.results[0].formatted_address });
  } catch (error) {
    console.error('Geocode error:', error);
    res.status(500).json({ error: 'Failed to geocode address' });
  }
});

// Get place recommendations near midpoint
app.post('/api/places', async (req, res) => {
  try {
    const { lat, lng, type = 'restaurant' } = req.body;

    const response = await client.placesNearby({
      params: {
        location: { lat, lng },
        radius: 5000,
        type,
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    const places = response.data.results.slice(0, 10).map(place => ({
      name: place.name,
      address: place.vicinity,
      rating: place.rating,
      types: place.types,
      placeId: place.place_id,
      lat: place.geometry.location.lat,
      lng: place.geometry.location.lng
    }));

    res.json(places);
  } catch (error) {
    console.error('Places error:', error);
    res.status(500).json({ error: 'Failed to fetch places' });
  }
});

// ============= USER ENDPOINTS =============

app.post('/api/users', (req, res) => {
  const { name, address, password } = req.body;
  if (!name || !address || !password) {
    return res.status(400).json({ error: 'Name, address, and password required' });
  }
  const result = db.createUser(name, address, password);
  if (result.error) {
    return res.status(400).json({ error: result.error, existingUser: result.existingUser });
  }
  res.json(result);
});

app.get('/api/users', (req, res) => {
  const users = db.getAllUsers();
  res.json(users);
});

app.get('/api/users/:id', (req, res) => {
  const user = db.getUser(parseInt(req.params.id));
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

app.put('/api/users/:id/address', (req, res) => {
  const { address } = req.body;
  const user = db.updateUserAddress(parseInt(req.params.id), address);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

app.put('/api/users/:id/password', (req, res) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Password required' });
  }
  const user = db.updateUserPassword(parseInt(req.params.id), password);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

app.put('/api/users/:id/profile', (req, res) => {
  const { bio, hometown, age } = req.body;
  const user = db.updateUserProfile(parseInt(req.params.id), { bio, hometown, age });
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
});

app.delete('/api/users/:id', (req, res) => {
  const success = db.deleteUser(parseInt(req.params.id));
  if (!success) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ success: true });
});

app.get('/api/users/search', (req, res) => {
  const { q } = req.query;
  const users = db.searchUsers(q || '');
  res.json(users);
});

// ============= FRIENDSHIP ENDPOINTS =============

app.post('/api/users/:id/friends', (req, res) => {
  const { friendName } = req.body;
  
  // Find friend by name
  const friend = db.getAllUsers().find(u => u.name.toLowerCase() === friendName.toLowerCase());
  if (!friend) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  if (friend.id === parseInt(req.params.id)) {
    return res.status(400).json({ error: 'Cannot add yourself as a friend' });
  }
  
  const result = db.addFriend(parseInt(req.params.id), friend.id);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }
  res.json(result.friendship);
});

app.get('/api/users/:id/friends', (req, res) => {
  const friends = db.getFriends(parseInt(req.params.id));
  res.json(friends);
});

app.get('/api/users/:id/friends/sent', (req, res) => {
  const requests = db.getSentRequests(parseInt(req.params.id));
  res.json(requests);
});

app.get('/api/users/:id/friends/received', (req, res) => {
  const requests = db.getReceivedRequests(parseInt(req.params.id));
  res.json(requests);
});

app.post('/api/friends/:friendshipId/accept', (req, res) => {
  const result = db.acceptFriendRequest(parseInt(req.params.friendshipId));
  if (!result.success) {
    return res.status(404).json({ error: result.message });
  }
  res.json(result.friendship);
});

app.post('/api/friends/:friendshipId/reject', (req, res) => {
  const result = db.rejectFriendRequest(parseInt(req.params.friendshipId));
  if (!result.success) {
    return res.status(404).json({ error: result.message });
  }
  res.json({ success: true });
});

app.delete('/api/users/:id/friends/:friendId', (req, res) => {
  const success = db.removeFriend(parseInt(req.params.id), parseInt(req.params.friendId));
  if (!success) {
    return res.status(404).json({ error: 'Friendship not found' });
  }
  res.json({ success: true });
});

// ============= TRAVEL GROUP ENDPOINTS =============

app.post('/api/groups', (req, res) => {
  const { name, creatorId } = req.body;
  if (!name || !creatorId) {
    return res.status(400).json({ error: 'Name and creatorId required' });
  }
  const group = db.createTravelGroup(name, creatorId);
  res.json(group);
});

app.get('/api/groups', (req, res) => {
  const { userId } = req.query;
  if (userId) {
    const groups = db.getUserGroups(parseInt(userId));
    return res.json(groups);
  }
  const groups = db.getAllGroups();
  res.json(groups);
});

app.get('/api/groups/:id', (req, res) => {
  const group = db.getTravelGroup(parseInt(req.params.id));
  if (!group) {
    return res.status(404).json({ error: 'Group not found' });
  }
  res.json(group);
});

app.post('/api/groups/:id/members', (req, res) => {
  const { userId } = req.body;
  const result = db.addMemberToGroup(parseInt(req.params.id), userId);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }
  res.json(result.group);
});

app.get('/api/groups/:id/members', (req, res) => {
  const members = db.getGroupMembers(parseInt(req.params.id));
  res.json(members);
});

app.delete('/api/groups/:id/members/:userId', (req, res) => {
  const success = db.removeMemberFromGroup(parseInt(req.params.id), parseInt(req.params.userId));
  if (!success) {
    return res.status(404).json({ error: 'Member not found' });
  }
  res.json({ success: true });
});

// Activity endpoints
app.post('/api/groups/:id/activities', (req, res) => {
  const { activity, userId } = req.body;
  const result = db.addActivityToGroup(parseInt(req.params.id), activity, userId);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }
  res.json(result.activity);
});

app.get('/api/groups/:id/activities', (req, res) => {
  const activities = db.getGroupActivities(parseInt(req.params.id));
  res.json(activities);
});

app.post('/api/groups/:groupId/activities/:activityId/vote', (req, res) => {
  const { userId } = req.body;
  const groupId = parseInt(req.params.groupId);
  const activityId = parseInt(req.params.activityId);
  
  const result = db.voteForActivity(groupId, activityId, userId);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }
  
  // Auto-finalize if enough votes
  if (result.autoFinalized) {
    const finalizeResult = db.moveToFinalActivities(groupId, activityId);
    if (finalizeResult.success) {
      return res.json({ ...result, finalized: true });
    }
  }
  
  res.json(result);
});

app.post('/api/groups/:groupId/activities/:activityId/finalize', (req, res) => {
  const result = db.moveToFinalActivities(
    parseInt(req.params.groupId),
    parseInt(req.params.activityId)
  );
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }
  res.json({ success: true });
});

app.delete('/api/groups/:groupId/activities/:activityId', (req, res) => {
  const result = db.removeActivityFromGroup(
    parseInt(req.params.groupId),
    parseInt(req.params.activityId)
  );
  if (!result.success) {
    return res.status(404).json({ error: result.message });
  }
  res.json({ success: true });
});

// Final activities endpoints
app.get('/api/groups/:id/final-activities', (req, res) => {
  const activities = db.getFinalActivities(parseInt(req.params.id));
  res.json(activities);
});

app.delete('/api/groups/:groupId/final-activities/:activityId', (req, res) => {
  const result = db.removeFinalActivity(
    parseInt(req.params.groupId),
    parseInt(req.params.activityId)
  );
  if (!result.success) {
    return res.status(404).json({ error: result.message });
  }
  res.json({ success: true });
});

app.delete('/api/groups/:id', (req, res) => {
  const success = db.deleteGroup(parseInt(req.params.id));
  if (!success) {
    return res.status(404).json({ error: 'Group not found' });
  }
  res.json({ success: true });
});

// ============= AUTH ENDPOINT =============

app.post('/api/auth/login', (req, res) => {
  const { name, password } = req.body;
  if (!name || !password) {
    return res.status(400).json({ error: 'Name and password required' });
  }
  const user = db.verifyUserPassword(name, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid name or password' });
  }
  res.json(user);
});

// ============= UPLOAD ENDPOINT =============

app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

// ============= POST ENDPOINTS =============

app.post('/api/posts', (req, res) => {
  const { userId, caption, imageUrl } = req.body;
  
  if (!userId || !imageUrl) {
    return res.status(400).json({ error: 'userId and imageUrl are required' });
  }
  
  const post = db.createPost(userId, caption || '', imageUrl);
  res.json(post);
});

app.get('/api/posts', (req, res) => {
  const posts = db.getAllPosts();
  res.json(posts);
});

app.get('/api/posts/user/:userId', (req, res) => {
  const posts = db.getUserPosts(parseInt(req.params.userId));
  res.json(posts);
});

app.post('/api/posts/:postId/like', (req, res) => {
  const { userId } = req.body;
  const postId = parseInt(req.params.postId);
  
  const result = db.likePost(postId, userId);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }
  
  res.json(result);
});

app.delete('/api/posts/:postId', (req, res) => {
  const { userId } = req.body;
  const postId = parseInt(req.params.postId);
  
  const result = db.deletePost(postId, userId);
  if (!result.success) {
    return res.status(400).json({ error: result.message });
  }
  
  res.json(result);
});

// ============= STATS ENDPOINT =============

app.get('/api/stats', (req, res) => {
  const stats = db.getStats();
  res.json(stats);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database stats:`, db.getStats());
});
