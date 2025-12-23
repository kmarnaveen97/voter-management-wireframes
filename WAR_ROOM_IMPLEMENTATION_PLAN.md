# War Room Implementation Plan
## Critical Features Missing for Real Campaign Operations

### Current State Assessment
The existing War Room has:
- ✅ Visual village map with hexagonal wards
- ✅ House-level sentiment tagging (support/oppose/swing)
- ✅ Basic sentiment overview stats
- ✅ Ward-level filtering and search
- ✅ Keyboard shortcuts for tagging

**What's Missing:**
- ❌ No contact/activity tracking
- ❌ No temporal intelligence (when, how often)
- ❌ No task management for ground teams
- ❌ No communication integration
- ❌ No turnout prediction
- ❌ No resource allocation
- ❌ No agent performance tracking

---

## Phase 1: Activity Tracking (CRITICAL)
**Priority: URGENT**

### 1.1 Contact History Component
**File:** `components/war-room/contact-history-panel.tsx`

```typescript
// Show last 5 contacts for a house/voter
interface ContactActivity {
  timestamp: string;
  type: "phone_call" | "door_knock" | "whatsapp" | "rally";
  outcome: "contacted" | "not_available" | "refused" | "converted";
  agent_name: string;
  notes: string;
  sentiment_before?: SentimentType;
  sentiment_after?: SentimentType;
}
```

**Add to:**
- `HouseDetailsDialog` - Show contact timeline
- Voter detail pages - Full contact history

### 1.2 Log Contact Modal
**File:** `components/war-room/log-contact-dialog.tsx`

Quick form to log:
- Contact type (dropdown)
- Outcome (dropdown)
- Updated sentiment (optional)
- Notes (textarea)
- Duration (for calls)

**Trigger from:**
- House dialog footer
- Voter detail page
- Batch operations (after rally/meeting)

### 1.3 Real-Time Activity Feed
**File:** `components/war-room/activity-feed.tsx`

**Position:** Floating panel, right side of War Room

Show last 50 activities:
```
5 min ago - Ramesh Kumar (Ward 3, H-47) tagged as Support by Priya
12 min ago - Door knock at Ward 2, H-23 - Not available
18 min ago - Phone call to Sunita Devi - Converted from Swing to Support
```

**Filters:**
- Time range (last hour, 6h, 24h, 7d)
- Activity type
- Ward
- Agent

---

## Phase 2: Task Management
**Priority: HIGH**

### 2.1 Task Assignment Interface
**File:** `app/voters-management/war-room/tasks/page.tsx`

**Create tasks:**
- Contact 50 swing voters in Ward 5
- Deploy 3 agents to PS-001, Booth-01
- Survey all houses in Ward 2 by tomorrow 6pm
- Booth agent duty roster for election day

**Task card shows:**
- Priority (urgent/high/medium/low)
- Assigned agent
- Target (voters, houses, booths)
- Progress bar (10/50 completed)
- Deadline countdown
- Quick actions: Mark complete, Reassign, View details

### 2.2 Agent Dashboard
**File:** `app/voters-management/war-room/agents/page.tsx`

**Show per agent:**
- Name, phone, role (booth agent, phone banker, field surveyor)
- Active tasks (3 pending, 1 in progress)
- Today's performance:
  - Contacts made: 47
  - Conversions: 12 (25.5%)
  - Average call duration: 3m 45s
- Assigned area (Ward 3-5, PS-002)

**Actions:**
- Assign new task
- View contact history
- Send WhatsApp message
- Call directly (click-to-call)

---

## Phase 3: Intelligence & Analytics
**Priority: MEDIUM**

### 3.1 Turnout Prediction Panel
**File:** `components/war-room/turnout-tracker.tsx`

**Show:**
- Predicted turnout: 68.5% (up from 61% in 2019)
- By booth: Color-coded map showing high/low turnout areas
- High propensity voters: List of 200 voters likely to vote (target for transport)
- Low propensity voters: 350 supporters who might not vote (call reminders)

**Data needed:**
- Historical turnout data (2019, 2014)
- Age correlation (young = lower turnout)
- Contact frequency (contacted 3+ times = higher turnout)

### 3.2 Swing Voter Conversion Tracker
**File:** `components/war-room/conversion-tracker.tsx`

**Show:**
- 147 swing voters in list
- 23 converted to support (15.6% conversion rate)
- 8 converted to oppose (5.4%)
- 116 still swing (78%)

**Prioritize:**
- Swing voters in battleground booths
- Swing voters in large families (influence multiplier)
- Recently contacted swings (follow-up reminder)

### 3.3 Resource Allocation Dashboard
**File:** `app/voters-management/war-room/resources/page.tsx`

**Track:**
- Budget spent: ₹2,45,000 / ₹5,00,000 (49%)
- Active agents: 23 (12 phone, 11 field)
- Vehicles: 5 cars, 8 bikes
- Materials: 5000 pamphlets, 200 posters

**By ward:**
- Ward 3: ₹45K, 4 agents, 2 vehicles
- Ward 5: ₹38K, 3 agents, 1 vehicle

---

## Phase 4: Communication Integration
**Priority: LOW (but impactful)

### 4.1 WhatsApp Integration
**Button in house dialog:** "Send WhatsApp"
- Quick templates:
  - "नमस्ते, मैं [candidate] के समर्थक हूं..."
  - Rally invitation
  - Voting reminder

**Bulk messaging:**
- Send to all support voters in Ward 3
- Send to swing voters contacted in last 7 days

### 4.2 Call Center Integration (if applicable)
**Click-to-call from voter card:**
- Initiate call through Exotel/Twilio
- Auto-log call duration
- Prompt for outcome and notes after call

---

## Phase 5: UI/UX Improvements
**Priority: MEDIUM**

### 5.1 Make List View Primary
**Current:** SVG map dominates, list view buried in collapsible sections
**Change:** 
- Tab system: "Map View" | "List View" | "Activity Feed" | "Tasks"
- Default to List View (most useful for daily operations)
- Map View = strategic overview only

### 5.2 Compact Map
**Reduce SVG code from 1800 lines to 300:**
- Simple ward boundaries
- Cluster houses as circles (not individual dots)
- Click ward → Opens List View filtered to that ward
- Remove decorative animations

### 5.3 Keyboard Shortcuts Enhancement
**Add:**
- `N` - Jump to Next Uncontacted House
- `T` - Open Task Assignment Modal
- `L` - Log Contact for Current House
- `A` - Open Activity Feed
- `/` - Focus Search

---

## Backend API Requirements

### Must implement these endpoints:

#### Activity Tracking
```
POST /api/activity/contact
GET  /api/voters/{voter_id}/contacts
GET  /api/activity/ward/{ward_no}
GET  /api/activity/feed
```

#### Task Management
```
POST /api/tasks/assign
GET  /api/tasks
PATCH /api/tasks/{task_id}/status
GET  /api/agents
GET  /api/agents/{agent_id}/performance
```

#### Analytics
```
GET  /api/analytics/turnout
GET  /api/analytics/conversions
GET  /api/analytics/resources
```

---

## Database Schema Additions

### `contact_activities`
```sql
CREATE TABLE contact_activities (
  activity_id SERIAL PRIMARY KEY,
  voter_id INT NOT NULL,
  list_id INT NOT NULL,
  contact_type VARCHAR(50), -- phone_call, door_knock, whatsapp, rally
  outcome VARCHAR(50), -- contacted, not_available, refused, converted
  sentiment_before VARCHAR(20),
  sentiment_after VARCHAR(20),
  notes TEXT,
  duration_seconds INT,
  contacted_by VARCHAR(100),
  contacted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (voter_id) REFERENCES voters(voter_id)
);

CREATE INDEX idx_contact_voter ON contact_activities(voter_id);
CREATE INDEX idx_contact_list ON contact_activities(list_id);
CREATE INDEX idx_contact_time ON contact_activities(contacted_at);
```

### `tasks`
```sql
CREATE TABLE tasks (
  task_id SERIAL PRIMARY KEY,
  list_id INT NOT NULL,
  agent_id INT,
  agent_name VARCHAR(100),
  task_type VARCHAR(50), -- contact_voters, booth_management, rally, survey
  ward_no VARCHAR(10),
  priority VARCHAR(20), -- urgent, high, medium, low
  status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed
  target_count INT,
  completed_count INT DEFAULT 0,
  deadline TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### `agents`
```sql
CREATE TABLE agents (
  agent_id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  phone VARCHAR(15),
  role VARCHAR(50), -- booth_agent, phone_banker, field_surveyor
  assigned_wards TEXT[], -- Array of ward numbers
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Implementation Priority

### Week 1 (MUST HAVE)
1. ✅ Contact history tracking (DB + API)
2. ✅ Log contact dialog UI
3. ✅ Activity feed component
4. ✅ Show contact history in house dialog

### Week 2 (CRITICAL)
5. Task assignment system (DB + API)
6. Agent management interface
7. Task dashboard
8. Make list view primary navigation

### Week 3 (IMPORTANT)
9. Turnout prediction logic
10. Conversion tracking
11. Swing voter prioritization
12. Contact reminders (last contacted > 7 days ago)

### Week 4 (POLISH)
13. WhatsApp templates
14. Resource allocation tracker
15. Export reports (PDF/Excel)
16. Mobile-optimized task view for field agents

---

## Success Metrics

**A functional War Room should track:**
- **Contact Coverage:** % of voters contacted in last 7 days
- **Conversion Rate:** Swing → Support conversions
- **Agent Productivity:** Avg contacts per agent per day
- **Response Time:** Time to follow up on swing voters
- **Turnout Readiness:** % of supporters confirmed to vote
- **Task Completion:** % of assigned tasks finished on time

---

## Conclusion

The current War Room is 80% visual polish, 20% functionality.

**Real campaigns need:**
- Temporal intelligence (when, how often, by whom)
- Actionable tasks (who needs to do what)
- Communication tools (contact voters now)
- Performance tracking (which agents are effective)

**The SVG map is a nice-to-have. The activity feed and task manager are must-haves.**

Make the list view primary. Add activity tracking. Add task management. Then you have a war room.
