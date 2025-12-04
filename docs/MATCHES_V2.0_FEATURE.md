# 🏸 BadSession v2.0 - Matches Feature Documentation

**Version**: 2.0  
**Release Date**: December 5, 2025  
**Status**: ✅ RELEASED  
**Git Tag**: `v2.0`  
**Branch**: `2.0`

---

## 📋 Overview

Version 2.0 introduces the **Matches Management System**, allowing users to create, track, and manage badminton matches during sessions with flexible player/guest selection and real-time score tracking.

### Key Features
- ✅ Create matches with player vs player or player vs guest combinations
- ✅ Track match scores and status (Pending, In Progress, Completed, Cancelled)
- ✅ Edit match details and scores after creation
- ✅ Delete matches with confirmation
- ✅ Beautiful match cards with visual score display
- ✅ Seamless integration with existing session management

---

## 🗄️ Database Changes

### New Table: `matches`

```sql
CREATE TABLE matches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id INT NOT NULL,
  match_name VARCHAR(255),
  player1_id INT,
  player1_guest_name VARCHAR(255),
  player1_is_guest BOOLEAN DEFAULT FALSE,
  player2_id INT,
  player2_guest_name VARCHAR(255),
  player2_is_guest BOOLEAN DEFAULT FALSE,
  player1_score INT DEFAULT 0,
  player2_score INT DEFAULT 0,
  match_status ENUM('Pending', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Pending',
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (player1_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (player2_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT
);
```

### Schema Details

| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| `id` | INT | PK, AUTO_INCREMENT | Unique match identifier |
| `session_id` | INT | FK → sessions | Links match to session |
| `match_name` | VARCHAR(255) | Optional | Custom match name (e.g., "Final", "Semi-Final") |
| `player1_id` | INT | FK → users | Player 1 user ID (NULL if guest) |
| `player1_guest_name` | VARCHAR(255) | Optional | Guest name if player1 is guest |
| `player1_is_guest` | BOOLEAN | DEFAULT FALSE | Indicates if player1 is guest |
| `player2_id` | INT | FK → users | Player 2 user ID (NULL if guest) |
| `player2_guest_name` | VARCHAR(255) | Optional | Guest name if player2 is guest |
| `player2_is_guest` | BOOLEAN | DEFAULT FALSE | Indicates if player2 is guest |
| `player1_score` | INT | DEFAULT 0 | Player 1 final score |
| `player2_score` | INT | DEFAULT 0 | Player 2 final score |
| `match_status` | ENUM | DEFAULT 'Pending' | Status: Pending, In Progress, Completed, Cancelled |
| `created_by` | INT | FK → users | User who created the match |
| `created_at` | TIMESTAMP | Auto | Record creation timestamp |
| `updated_at` | TIMESTAMP | Auto | Last update timestamp |

---

## 🔌 Backend API Endpoints

### Base URL: `/api/matches`

#### 1. Get All Matches for a Session
```
GET /matches/session/:sessionId
```

**Authentication**: Required (Token)  
**Returns**: Array of match objects

**Example Response**:
```json
[
  {
    "id": 1,
    "session_id": 5,
    "match_name": "Final Match",
    "player1_id": 2,
    "player1_name": "John Doe",
    "player1_is_guest": false,
    "player1_score": 21,
    "player2_id": null,
    "player2_guest_name": "Alice",
    "player2_is_guest": true,
    "player2_score": 18,
    "match_status": "Completed",
    "created_by": 1,
    "created_by_name": "Admin",
    "created_at": "2025-12-05T10:30:00Z"
  }
]
```

#### 2. Get Single Match
```
GET /matches/:matchId
```

**Authentication**: Required (Token)  
**Returns**: Single match object

#### 3. Create Match
```
POST /matches
```

**Authentication**: Required (Token)  
**Request Body**:
```json
{
  "session_id": 5,
  "match_name": "Semi-Final",
  "player1_id": 2,
  "player1_guest_name": null,
  "player1_is_guest": false,
  "player2_id": null,
  "player2_guest_name": "Guest Player",
  "player2_is_guest": true
}
```

**Validation**:
- `session_id` is required
- At least one player/guest on each side
- Guest name required if `is_guest` is true

**Response**:
```json
{
  "message": "Match created successfully",
  "match_id": 1
}
```

#### 4. Update Match
```
PUT /matches/:matchId
```

**Authentication**: Required (Token)  
**Request Body** (all fields optional):
```json
{
  "player1_score": 21,
  "player2_score": 18,
  "match_status": "Completed",
  "match_name": "Updated Match Name"
}
```

**Supported Status Values**:
- `Pending` - Not started
- `In Progress` - Currently being played
- `Completed` - Finished
- `Cancelled` - Not played

**Response**:
```json
{
  "message": "Match updated successfully"
}
```

#### 5. Delete Match
```
DELETE /matches/:matchId
```

**Authentication**: Required (Token)  
**Response**:
```json
{
  "message": "Match deleted successfully"
}
```

---

## 🎨 Frontend Components

### Matches Component (`web/src/components/Matches.jsx`)

**File Size**: ~350 lines  
**Purpose**: Complete match management UI

**Features**:
1. **Match List Display**
   - Grid layout with responsive design
   - Visual score display
   - Status badges with color coding
   - Player/guest indicators

2. **Add Match Button**
   - Opens modal for creating new match
   - Pre-populated fields

3. **Match Management**
   - Edit existing matches
   - Delete with confirmation
   - Real-time updates

4. **Match Creation Modal**
   - Player/Guest type selection
   - Dynamic field switching
   - Player dropdown
   - Guest name input
   - Score entry
   - Status selection

**Component Props**:
```jsx
<Matches 
  sessionId={number}           // Session ID (required)
  sessionDetails={object}      // Session with attendance data
  onClose={function}           // Callback when closing
/>
```

**State Management**:
- `matches` - Array of matches
- `loading` - Loading state
- `showModal` - Modal visibility
- `players` - Available players list
- `guests` - Guest list from attendance
- `editingMatch` - Currently editing match
- `formData` - Modal form data

### Integration with Sessions Page

**File**: `web/src/pages/Sessions.jsx`

**Changes**:
1. Import Matches component
2. Add `showMatches` state
3. Toggle button to show/hide matches
4. Pass session details to Matches component
5. Responsive layout with matches section

---

## 🎨 Styling

### Match Card Styles
- **Background**: Linear gradient (light teal to white)
- **Border**: 2px teal with hover effect
- **Hover Effect**: Lift animation with shadow increase
- **Score Display**: Large, bold, teal colored
- **Status Badges**: Color-coded by status

### Modal Styles
- **Overlay**: Semi-transparent dark background
- **Content**: White, rounded, centered
- **Form Fields**: Full-width, bordered, focused states
- **Buttons**: Primary/Secondary with hover effects

### Responsive Design
- Desktop: 3+ columns grid
- Tablet: 2 columns grid
- Mobile: 1 column, full width
- Modal: Adaptive width (90% on desktop, 95% on mobile)

---

## 📱 User Interface

### Match Card Display
```
┌─────────────────────────────────┐
│ Final Match          [Completed]│
├─────────────────────────────────┤
│                                 │
│  John Doe (Player)    21 vs 18  │
│       vs          Alice (Guest) │
│                                 │
├─────────────────────────────────┤
│ Created by: Admin               │
│ [✏️ Edit] [🗑️ Delete]           │
└─────────────────────────────────┘
```

### Create/Edit Match Modal
```
┌─────────────────────────────────┐
│ ➕ Create Match          [✕]     │
├─────────────────────────────────┤
│ Match Name: [_____________]     │
│                                 │
│ Player 1 Type: [Player ▼]       │
│ Select Player: [John Doe ▼]     │
│ Player 1 Score: [0___]          │
│                                 │
│ Player 2 Type: [Guest ▼]        │
│ Guest Name: [Alice______]       │
│ Player 2 Score: [0___]          │
│                                 │
│ Match Status: [Pending ▼]       │
│                                 │
│ [Cancel] [Create Match]         │
└─────────────────────────────────┘
```

---

## 🚀 How to Use

### Creating a Match

1. **Open Session Details**
   - Click on a session from the sessions list
   - Modal opens showing session information

2. **Access Matches Section**
   - Click "🏸 View/Manage Matches" button
   - Matches section expands

3. **Create Match**
   - Click "➕ Add Match" button
   - Modal opens for match creation
   - Fill in:
     - Match Name (optional)
     - Player 1 Type (Player or Guest)
     - Player 1 (select or enter name)
     - Player 1 Score (optional)
     - Player 2 Type (Player or Guest)
     - Player 2 (select or enter name)
     - Player 2 Score (optional)
     - Match Status
   - Click "Create Match"

### Editing a Match

1. Click "✏️ Edit" on a match card
2. Modal opens with pre-filled data
3. Update scores or status
4. Click "Update Match"

### Deleting a Match

1. Click "🗑️ Delete" on a match card
2. Confirm deletion in alert
3. Match is removed from session

### Viewing Matches

1. Open session details
2. Click "🏸 View/Manage Matches"
3. All matches display in card grid
4. Sort and filter easily

---

## 🔄 API Integration Examples

### Create Match Example (Frontend)
```javascript
await apiClient.post('/matches', {
  session_id: 5,
  match_name: 'Final',
  player1_id: 2,
  player1_guest_name: null,
  player1_is_guest: false,
  player2_id: null,
  player2_guest_name: 'Guest Player',
  player2_is_guest: true,
  player1_score: 0,
  player2_score: 0
});
```

### Update Match Scores
```javascript
await apiClient.put(`/matches/${matchId}`, {
  player1_score: 21,
  player2_score: 18,
  match_status: 'Completed'
});
```

### Fetch Matches for Session
```javascript
const res = await apiClient.get(`/matches/session/${sessionId}`);
const matches = res.data;
```

---

## 📊 Data Flow

### Creation Flow
```
User Input (Modal)
    ↓
Validation (Frontend)
    ↓
API POST /matches
    ↓
Validation (Backend)
    ↓
Insert to Database
    ↓
Return match_id
    ↓
Refresh Matches List
    ↓
Display on UI
```

### Update Flow
```
User Clicks Edit
    ↓
Load Match Data
    ↓
Show Modal (Pre-filled)
    ↓
User Updates Fields
    ↓
API PUT /matches/:id
    ↓
Update Database
    ↓
Refresh Matches List
    ↓
Update UI
```

---

## 🐛 Error Handling

### Frontend Validation
- Required field checks
- Type validation
- User feedback via alerts

### Backend Validation
- Session existence check
- Player/guest data consistency
- Score numeric validation
- Status enum validation

### Error Messages
- Missing session ID
- Missing player/guest on either side
- Missing guest name when is_guest = true
- Invalid match status
- Database errors

---

## 🧪 Testing Scenarios

### Test Case 1: Create Player vs Player Match
1. Open session
2. Create match with 2 registered players
3. Enter scores
4. Verify match appears in list

### Test Case 2: Create Player vs Guest Match
1. Open session
2. Select player type for player1
3. Select guest type for player2
4. Enter guest name
5. Create and verify

### Test Case 3: Edit Match Scores
1. Create match
2. Click Edit
3. Change scores
4. Update and verify display

### Test Case 4: Delete Match
1. Create match
2. Click Delete
3. Confirm in alert
4. Verify removal

### Test Case 5: Status Transitions
1. Create match (Pending)
2. Edit to "In Progress"
3. Edit to "Completed"
4. Verify status changes reflected

---

## 📁 Files Changed/Added

### New Files
1. `server/routes/matches.js` - Backend API routes (~350 lines)
2. `web/src/components/Matches.jsx` - Frontend component (~350 lines)

### Modified Files
1. `server/schema.sql` - Added matches table
2. `server/index.js` - Added matches route import and registration
3. `web/src/pages/Sessions.jsx` - Added Matches component integration
4. `web/src/styles.css` - Added matches styling (~200 lines)

### Documentation
1. `docs/MATCHES_V2.0_FEATURE.md` - This file
2. `docs/V2.0_RELEASE_NOTES.md` - Release notes

---

## 📈 Statistics

### Code Additions
- Backend Routes: ~350 lines
- Frontend Component: ~350 lines
- Styling: ~200 lines
- Documentation: ~500 lines
- **Total**: ~1,400 lines

### Database
- New table: 1
- New columns: 12
- Relationships: 3 foreign keys

### UI Elements
- New component: 1 (Matches.jsx)
- New modal: 1 (Create/Edit)
- New styles: ~40 CSS rules
- New buttons: 3+ (Add, Edit, Delete)

---

## 🔄 Git Information

**Commit**: `77c6dc3`  
**Tag**: `v2.0`  
**Branch**: `2.0`  
**Date**: December 5, 2025

**Commit Message**:
```
feat: implement matches feature (v2.0) - create, edit, delete matches 
with player/guest selection and scoring
```

---

## 🎯 Future Enhancements (v2.1+)

### Potential Features
1. **Match Statistics**
   - Win/loss records per player
   - Match history
   - Performance analytics

2. **Advanced Scoring**
   - Best of 3/5 matches
   - Tie-break logic
   - Ranking system

3. **Notifications**
   - Match alerts
   - Score updates
   - Match completion notifications

4. **Export**
   - Match results export
   - PDF reports
   - Statistics summaries

5. **Scheduling**
   - Pre-schedule matches
   - Automatic assignments
   - Tournament brackets

6. **Leaderboard**
   - Session rankings
   - Overall player stats
   - Achievement badges

---

## ✅ Verification Checklist

- ✅ Database schema created and migrated
- ✅ Backend API endpoints functional
- ✅ Frontend components integrated
- ✅ Styling complete and responsive
- ✅ Error handling implemented
- ✅ Form validation working
- ✅ Modal dialogs functional
- ✅ CRUD operations tested
- ✅ Player/guest selection working
- ✅ Score tracking functional
- ✅ Status management working
- ✅ All files committed to git
- ✅ v2.0 tag created
- ✅ Changes pushed to remote
- ✅ Documentation complete

---

## 🚀 Deployment

### Requirements
- MySQL database updated with schema
- Backend restarted to load new routes
- Frontend assets rebuilt
- Node packages updated (if any new packages added)

### Steps
1. Pull latest code from `main` or `2.0` branch
2. Run database migrations: `mysql -u user -p database < schema.sql`
3. Install dependencies: `npm install`
4. Start backend server
5. Start frontend dev/build server
6. Test on localhost

---

## 📞 Support

For issues or questions about v2.0 features:
1. Check this documentation
2. Review code comments in `Matches.jsx` and `matches.js`
3. Check API responses for errors
4. Verify database schema is properly created

---

**Version**: 2.0  
**Status**: ✅ RELEASED  
**Last Updated**: December 5, 2025  
**Created By**: Development Team  
**Git Tag**: `v2.0`  
**Branch**: `2.0`
