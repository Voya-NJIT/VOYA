# Database API Documentation

## Database Structure

The database stores:
- **Users**: People with names and addresses
- **Friendships**: Connections between users
- **Travel Groups**: Groups with members and activities

## User Endpoints

### Create User
```
POST /api/users
Body: { name: string, address: string, password: string }
Returns: User object
```

### Get All Users
```
GET /api/users
Returns: Array of users
```

### Get User by ID
```
GET /api/users/:id
Returns: User object
```

### Update User Address
```
PUT /api/users/:id/address
Body: { address: string }
Returns: Updated user
```

### Update User Password
```
PUT /api/users/:id/password
Body: { password: string }
Returns: Updated user
```

### Update User Profile
```
PUT /api/users/:id/profile
Body: { bio: string, hometown: string, age: number, profilePicture: string }
Returns: Updated user
Note: profilePicture should be a URL path (e.g., "/uploads/filename.jpg")
```

### Delete User
```
DELETE /api/users/:id
Returns: { success: true }
```

### Search Users
```
GET /api/users/search?q=query
Returns: Array of matching users
```

## Friendship Endpoints

### Add Friend
```
POST /api/users/:id/friends
Body: { friendId: number }
Returns: Friendship object
```

### Get User's Friends
```
GET /api/users/:id/friends
Returns: Array of friend users
```

### Remove Friend
```
DELETE /api/users/:id/friends/:friendId
Returns: { success: true }
```

## Travel Group Endpoints

### Create Group
```
POST /api/groups
Body: { name: string, creatorId: number }
Returns: Group object
```

### Get All Groups (or User's Groups)
```
GET /api/groups
GET /api/groups?userId=123
Returns: Array of groups
```

### Get Group by ID
```
GET /api/groups/:id
Returns: Group object with members and activities
```

### Add Member to Group
```
POST /api/groups/:id/members
Body: { userId: number }
Returns: Updated group
```

### Get Group Members
```
GET /api/groups/:id/members
Returns: Array of member users with addedAt timestamps
```

### Remove Member from Group
```
DELETE /api/groups/:id/members/:userId
Returns: { success: true }
```

### Add Activity to Group (Suggested)
```
POST /api/groups/:id/activities
Body: { 
  activity: { name, address, placeId, rating, lat, lng },
  userId: number 
}
Returns: Activity object with votes array
```

### Get Group Activities (Suggested)
```
GET /api/groups/:id/activities
Returns: Array of suggested activities with votes
```

### Vote for Activity
```
POST /api/groups/:groupId/activities/:activityId/vote
Body: { userId: number }
Returns: { success: true, activity, votes: number }
```

### Move Activity to Final (Agree on it)
```
POST /api/groups/:groupId/activities/:activityId/finalize
Returns: { success: true }
```

### Remove Activity from Suggestions
```
DELETE /api/groups/:groupId/activities/:activityId
Returns: { success: true }
```

### Get Final Activities (Agreed Upon)
```
GET /api/groups/:id/final-activities
Returns: Array of finalized activities
```

### Remove Final Activity
```
DELETE /api/groups/:groupId/final-activities/:activityId
Returns: { success: true }
```

### Delete Group
```
DELETE /api/groups/:id
Returns: { success: true }
```

## Auth Endpoint

### Login
```
POST /api/auth/login
Body: { name: string, password: string }
Returns: User object (if credentials are valid)
```

## Post Endpoints

### Create Post
```
POST /api/posts
Body: { userId: number, caption: string, imageUrl: string }
Returns: Post object
```

### Get All Posts
```
GET /api/posts
Returns: Array of posts (sorted by newest first, includes user info)
```

### Get User's Posts
```
GET /api/posts/user/:userId
Returns: Array of posts by specific user
```

### Like/Unlike Post
```
POST /api/posts/:postId/like
Body: { userId: number }
Returns: { success: true, post, liked: boolean }
```

### Delete Post
```
DELETE /api/posts/:postId
Body: { userId: number }
Returns: { success: true }
Note: Only the post creator can delete it
```

## Stats Endpoint

### Get Database Stats
```
GET /api/stats
Returns: { totalUsers: number, totalGroups: number, totalFriendships: number }
```

## Example Usage

```javascript
// Create a user
const user = await axios.post('/api/users', {
  name: 'John Doe',
  address: '123 Main St, New York, NY',
  password: 'mypassword123'
});

// Create another user
const friend = await axios.post('/api/users', {
  name: 'Jane Smith',
  address: '456 Oak Ave, Brooklyn, NY',
  password: 'janepass456'
});

// Login
const loggedInUser = await axios.post('/api/auth/login', {
  name: 'John Doe',
  password: 'mypassword123'
});

// Add as friends
await axios.post(`/api/users/${user.data.id}/friends`, {
  friendId: friend.data.id
});

// Create a travel group
const group = await axios.post('/api/groups', {
  name: 'Weekend Trip',
  creatorId: user.data.id
});

// Add friend to group
await axios.post(`/api/groups/${group.data.id}/members`, {
  userId: friend.data.id
});

// Get group members
const members = await axios.get(`/api/groups/${group.data.id}/members`);
```
