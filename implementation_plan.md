# ChatSphere UI Redesign — Match Original Mockups

## Goal

Redesign the ChatSphere frontend to match the provided design references exactly:
- **Image 1:** Chat view — narrow icon rail on left, sidebar chat list, main chat area, right members panel
- **Image 2:** Settings view — sidebar with 7 settings sections, rich profile/preferences main panel
- **Image 3:** Privacy & Security settings — section headers, dropdowns, toggles, E2E encryption card
- **Image 4:** Contacts/Friends view — recent calls, alphabetical contact list, active-now right panel

## Layout Architecture

```
┌──────┬──────────┬──────────────────────────┬──────────┐
│ Rail │ Sidebar  │   Main Content Area       │ Right    │
│ 70px │ 280px    │   (flex-1)                │ Panel    │
│      │          │                           │ (opt.)   │
└──────┴──────────┴──────────────────────────┴──────────┘
```

## Proposed Changes

---

### [1] Design System — style.css & index.css

The existing `style.css` has a complete design system but the React components use Tailwind classes that don't match it. We will:

- Make `index.css` import `style.css` via `@import`
- Ensure Tailwind config color tokens match the CSS variables exactly
- Ensure the `light` theme override class works app-wide

---

### [2] `MainApp.jsx` — Top-level layout

#### [MODIFY] [MainApp.jsx](file:///c:/Users/hp/.gemini/antigravity/scratch/chatsphere/frontend/src/components/MainApp.jsx)

- Add a narrow **Icon Rail** (70px) on the far left with:
  - ChatSphere logo at top
  - Navigation icons: Messages, Contacts, Calls, Map
  - Settings gear and user avatar at bottom
- The sidebar renders to the right of the rail
- Main content fills remaining space
- Right panel shown only in chat view when a chat is active (member list for groups, user info for DMs)

---

### [3] `Sidebar.jsx` — Navigation panel

#### [MODIFY] [Sidebar.jsx](file:///c:/Users/hp/.gemini/antigravity/scratch/chatsphere/frontend/src/components/Sidebar.jsx)

Redesign to match design reference:
- Header: "ChatSphere" title + plus button
- Search bar
- Filter chips (All, Unread, Favorites, Groups)
- Chat list using `list-item` design system classes
- User profile footer with mic/headphones/settings icons
- When `tab === 'settings'`: render settings nav menu (Profile, Account, Privacy, etc.)

---

### [4] `ChatView.jsx` — Main chat panel

#### [MODIFY] [ChatView.jsx](file:///c:/Users/hp/.gemini/antigravity/scratch/chatsphere/frontend/src/components/ChatView.jsx)

- Redesign header with:
  - Avatar + name + online status
  - Action icons: voice call, video call, pin, add user, search, help
- Redesign message area using `message-bubble`, `bubble-content` classes from design system
- Message input bar with attachment, emoji, formatting icons
- Date dividers between messages from different days
- Typing indicator matching the "●●● Jordan is typing..." style

---

### [5] `SettingsView.jsx` — Settings content pane

#### [MODIFY] [SettingsView.jsx](file:///c:/Users/hp/.gemini/antigravity/scratch/chatsphere/frontend/src/components/SettingsView.jsx)

Full redesign to exactly match the mockup:
- **Profile:** Large avatar + name header, editable fields below, system preferences section
- **Account:** Password change, delete account with confirmation modal  
- **Privacy:** WHO CAN SEE MY INFO section with dropdowns, SECURITY & MODES with Ghost Mode & 2FA toggles, E2E Encryption card
- **Notifications:** Toggle rows
- **Storage & Data:** Usage bar + clear cache
- **Appearance:** Light/Dark radio cards
- **Help:** Version info + E2E encrypted badge

---

### [6] `ContactsView.jsx` — Contacts + Recent Calls

#### [MODIFY] [ContactsView.jsx](file:///c:/Users/hp/.gemini/antigravity/scratch/chatsphere/frontend/src/components/ContactsView.jsx)

Redesign to match design reference image 4:
- "RECENT CALLS" section at top with call-back phone/video icons per row
- "CONTACTS" section below, alphabetically grouped
- Right panel showing "Active Now" with currently online users

---

### [7] `CallsView.jsx`

Merge into ContactsView (the design shows them together).

---

### [8] Modal Overlays

#### [NEW] `CallModal.jsx`

- Full-screen overlay showing:
  - User avatar (large, pulsing ring)
  - "Calling..." status
  - Control buttons: Mute, Camera, End Call (red circle)

---

### [9] `AuthPage.jsx`

#### [MODIFY] [AuthPage.jsx](file:///c:/Users/hp/.gemini/antigravity/scratch/chatsphere/frontend/src/components/AuthPage.jsx)

Restyle to use the design system's `auth-container`, `auth-card`, `auth-logo` CSS classes from `style.css`.

## Verification Plan

### Automated Tests
- `npm run build` — ensure no compile errors

### Manual Verification
- Chat view matches mockup image 1
- Settings matches mockup images 2 & 3
- Contacts matches mockup image 4
- Light/dark theme toggle works
- All sidebar tabs navigate correctly
