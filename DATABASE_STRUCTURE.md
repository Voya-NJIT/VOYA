# Database Structure & Relationships

## Overview

The database supports a social travel planning system where:
- **Users are unique** (enforced by name)
- **Users can have multiple friends** (many-to-many relationship)
- **Users can be in multiple travel groups** (many-to-many relationship)
- **Groups can have multiple members** (many-to-many relationship)
- **Groups can have multiple activities** (one-to-many relationship)

## Data Models

### User
```javascript
{
  id: number,           // Unique identifier (timestamp-based)
  name: string,         // Unique name
  address: string,      // Full address
  password: string,     // Password (no restrictions)
  bio: string,          // User biography
  hometown: string,     // User's hometown
  age: number,          // User's age
  profilePicture: string, // URL path to profile picture
  createdAt: string     // ISO timestamp
}
```

**Uniqueness**: Each user must have a unique name (case-insensitive)

**Relationships**:
- Can have multiple friends (via friendships table)
- Can be a member of multiple travel groups
- Can create multiple travel groups

### Friendship
```javascript
{
  id: number,           // Unique identifier
  userId: number,       // First user ID
  friendId: number,     // Second user ID
  createdAt: string     // ISO timestamp
}
```

**Relationship Type**: Many-to-Many (bidirectional)
- A friendship between User A and User B is stored once
- Either userId or friendId can be User A or User B
- Prevents duplicate friendships

**Example**:
```
User 1 (John) ←→ User 2 (Jane)
User 1 (John) ←→ User 3 (Bob)
User 2 (Jane) ←→ User 3 (Bob)
```

### Travel Group
```javascript
{
  id: number,           // Unique identifier (timestamp-based)
  name: string,         // Group name (no limit)
  creatorId: number,    // User who created the group
  members: [            // Array of members
    {
      userId: number,
      addedAt: string   // When they joined
    }
  ],
  activities: [         // User-suggested activities (ideal spots)
    {
      id: number,
      name: string,
      address: string,
      placeId: string,
      rating: number,
      lat: number,
      lng: number,
      addedBy: number,  // User who added it
      votes: [number],  // Array of user IDs who voted
      addedAt: string
    }
  ],
  finalActivities: [    // Activities all users agreed on
    {
      id: number,
      name: string,
      address: string,
      placeId: string,
      rating: number,
      lat: number,
      lng: number,
      addedBy: number,
      votes: [number],
      addedAt: string,
      agreedAt: string  // When it was finalized
    }
  ],
  createdAt: string     // ISO timestamp
}
```

**Relationships**:
- Belongs to one creator (User)
- Has multiple members (Users) - many-to-many
- Has multiple activities - one-to-many

**Example**:
```
Group 1: "Weekend Trip"
  - Creator: User 1 (John)
  - Members: [User 1, User 2, User 3]
  - Activities: [Restaurant A, Park B]

Group 2: "Summer Vacation"
  - Creator: User 2 (Jane)
  - Members: [User 2, User 3]
  - Activities: [Beach C, Hotel D]
```

## Relationship Diagrams

### User ←→ Friends (Many-to-Many)
```
User 1 (John)
  ├─ Friend: User 2 (Jane)
  ├─ Friend: User 3 (Bob)
  └─ Friend: User 4 (Alice)

User 2 (Jane)
  ├─ Friend: User 1 (John)
  └─ Friend: User 3 (Bob)
```

### User ←→ Travel Groups (Many-to-Many)
```
User 1 (John)
  ├─ Member of: Group 1 "Weekend Trip"
  ├─ Member of: Group 2 "Summer Vacation"
  └─ Creator of: Group 1 "Weekend Trip"

Group 1 "Weekend Trip"
  ├─ Member: User 1 (John) [Creator]
  ├─ Member: User 2 (Jane)
  └─ Member: User 3 (Bob)
```

### Group → Activities (One-to-Many)
```
Group 1 "Weekend Trip"
  ├─ Activity: "Central Park" (park)
  ├─ Activity: "Joe's Pizza" (restaurant)
  └─ Activity: "Brooklyn Bowl" (bowling)
```

## Constraints & Rules

### User Constraints
- Name must be unique (case-insensitive)
- Address is required
- Can have unlimited friends
- Can be in unlimited groups

### Friendship Constraints
- No duplicate friendships (A-B is same as B-A)
- Bidirectional (if A is friends with B, then B is friends with A)
- Automatically cleaned up when user is deleted

### Travel Group Constraints
- Creator is automatically added as first member
- No duplicate members in same group
- Members are automatically removed when user is deleted
- Group can exist with 0 members (if all removed)

### Activity Constraints
- Activities belong to one group
- Activities are deleted when group is deleted
- No limit on number of activities per group

## Example Scenarios

### Scenario 1: Creating a Travel Group
```javascript
// 1. Create users
const john = await createUser("John", "123 Main St, NY", "johnpass123");
const jane = await createUser("Jane", "456 Oak Ave, Brooklyn", "janepass456");
const bob = await createUser("Bob", "789 Pine Rd, Queens", "bobpass789");

// 2. Add friendships
await addFriend(john.id, jane.id);
await addFriend(john.id, bob.id);

// 3. Create travel group
const group = await createTravelGroup("Weekend Trip", john.id);
// john is automatically a member

// 4. Add friends to group
await addMemberToGroup(group.id, jane.id);
await addMemberToGroup(group.id, bob.id);

// 5. Add activities
await addActivityToGroup(group.id, {
  name: "Central Park",
  address: "Central Park, NY",
  placeId: "ChIJ...",
  rating: 4.5,
  lat: 40.785091,
  lng: -73.968285
});
```

### Scenario 2: User in Multiple Groups
```javascript
// John creates "Weekend Trip"
const group1 = await createTravelGroup("Weekend Trip", john.id);

// Jane creates "Summer Vacation" and invites John
const group2 = await createTravelGroup("Summer Vacation", jane.id);
await addMemberToGroup(group2.id, john.id);

// John is now in 2 groups
const johnsGroups = await getUserGroups(john.id);
// Returns: ["Weekend Trip", "Summer Vacation"]
```

### Scenario 3: Deleting a User
```javascript
// When a user is deleted:
await deleteUser(john.id);

// Automatically:
// - Removed from all friendships
// - Removed from all group memberships
// - Groups they created still exist (but they're no longer a member)
```

### Post
```javascript
{
  id: number,           // Unique identifier (timestamp-based)
  userId: number,       // User who created the post
  caption: string,      // Post caption/description
  imageUrl: string,     // Path to uploaded image
  likes: [number],      // Array of user IDs who liked the post
  createdAt: string     // ISO timestamp
}
```

**Relationships**:
- Belongs to one user (creator)
- Can be liked by multiple users (many-to-many)

**Example**:
```
Post 1:
  - Creator: User 1 (John)
  - Image: "/uploads/1234567890-abc.jpg"
  - Caption: "Amazing trip to Central Park!"
  - Likes: [User 2, User 3, User 5]
```

## Database File

The database is stored in `database.json`:
```json
{
  "users": [...],
  "travelGroups": [...],
  "friendships": [...],
  "posts": [...]
}
```

- Auto-saves on every change
- Loads on server start
- Human-readable JSON format

## File Uploads

Images are stored in the `uploads/` directory:
- Maximum file size: 10MB
- Allowed formats: JPEG, JPG, PNG, GIF, WEBP
- Files are named with timestamp + random suffix
- Served statically at `/uploads/filename`
