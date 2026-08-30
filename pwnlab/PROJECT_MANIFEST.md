# pwnlab Platform - Complete Project Manifest

## Project Overview

pwnlab is a professional, full-stack cybersecurity training and CTF platform built with Next.js, PostgreSQL, and Discord integration.

**Tech Stack:**
- Frontend: Next.js 14, React 18
- Backend: Node.js, Next.js API routes
- Database: PostgreSQL 12+
- Bot: Discord.js
- Auth: JWT + HTTP-only cookies
- Styling: CSS Modules with CSS Variables

**Core Features:**
- User authentication via Discord bot + PIN
- Challenge browser with filtering
- Flag submission with point rewards
- Global leaderboard
- User dashboard with statistics
- Responsive design (desktop, tablet, mobile)
- Professional monochrome aesthetic

---

## File Structure & Descriptions

### Root Configuration Files

```
package.json
├─ Project metadata, scripts, dependencies
└─ Scripts: dev, build, start, db:setup, db:seed, discord-bot

.env.local
└─ Environment variables (secrets, database URL, tokens)

next.config.js
└─ Next.js configuration, security headers, optimization

.gitignore
└─ Git exclusions (node_modules, .env, .next, etc.)

README.md
└─ Complete documentation, setup, architecture, deployment

QUICKSTART.md
└─ 5-minute setup guide for development

PROJECT_MANIFEST.md
└─ This file - comprehensive project overview
```

### Backend (lib/)

```
lib/db.js
├─ PostgreSQL connection pool using pg module
├─ Exports: query(), getClient()
└─ Used by: All API routes for database access

lib/auth.js
├─ Authentication utilities
├─ Functions:
│  ├─ hashPin() - bcryptjs PIN hashing
│  ├─ comparePin() - PIN validation
│  ├─ generateRandomPin() - Random PIN generation
│  ├─ createToken() - JWT token creation
│  ├─ verifyToken() - JWT token verification
│  ├─ createSession() - Store session in DB
│  ├─ validateSession() - Check session validity
│  ├─ authenticateUser() - Login logic
│  ├─ getCurrentUser() - Get user from token
│  ├─ createUser() - Create new user account
│  └─ linkDiscordAccount() - Connect Discord ID to account
└─ Used by: API routes, Discord bot
```

### Scripts (scripts/)

```
scripts/db-setup.js
├─ Creates PostgreSQL schema and tables
├─ Creates 13 challenge categories
├─ Run: npm run db:setup
└─ Executed once during initial setup

scripts/db-seed.js
├─ Populates database with demo data
├─ Creates 5 test users with known PINs
├─ Creates 12 seed challenges
├─ Creates 3 demo teams
├─ Creates sample completions and activity
├─ Run: npm run db:seed
└─ Safe to run multiple times (uses ON CONFLICT)

scripts/discord-bot.js
├─ Discord bot for /xlogin command
├─ Commands: /xlogin, /xprofile, /xstats, /xleaderboard
├─ Creates accounts and sends secure DMs
├─ Registers slash commands
├─ Run: npm run discord-bot
└─ Requires DISCORD_TOKEN, DISCORD_CLIENT_ID
```

### API Routes (pages/api/)

```
pages/api/auth/
├─ login.js
│  ├─ POST /api/auth/login
│  ├─ Body: { username, pin }
│  ├─ Returns: { success, userId, username }
│  └─ Sets: HTTP-only cookie with JWT
├─ logout.js
│  ├─ POST /api/auth/logout
│  ├─ Clears session cookie
│  └─ Returns: { success }
└─ me.js
   ├─ GET /api/auth/me
   ├─ Checks authentication
   └─ Returns: { user: { id, username, created_at } }

pages/api/challenges/
├─ index.js
│  ├─ GET /api/challenges
│  ├─ Query params: category, difficulty, status, search, page
│  ├─ Returns: { challenges[], pagination }
│  └─ Requires authentication
├─ [id].js
│  ├─ GET /api/challenges/[id]
│  ├─ Returns: { challenge: { ...details, objectives, hints } }
│  └─ Requires authentication
└─ submit-flag.js
   ├─ POST /api/challenges/submit-flag
   ├─ Body: { challengeId, flag }
   ├─ Returns: { success, correct, pointsEarned, message }
   └─ Creates completion record on success

pages/api/users/
└─ stats.js
   ├─ GET /api/users/stats
   ├─ Returns: { stats: { challengesCompleted, ctfPoints, ... }, byCategory[], recentChallenges[] }
   └─ Requires authentication

pages/api/leaderboard.js
├─ GET /api/leaderboard
├─ Query param: type (global, friends, team, etc.)
├─ Returns: { leaderboard: [ { rank, username, total_points, challenges_completed } ], type }
└─ Requires authentication
```

### Pages (pages/)

```
pages/index.js (Landing Page)
├─ Public page with ASCII branding
├─ Sections: Hero, Features (6 boxes), CTA
├─ Buttons: "Enter pwnlab", "View Challenges"
├─ Styling: Home.module.css
└─ Status: ✓ Complete

pages/login.js (Login)
├─ Public page with login form
├─ Fields: Username, PIN (6 digits)
├─ Error handling with message display
├─ Styling: Login.module.css
└─ Status: ✓ Complete

pages/dashboard.js (User Dashboard)
├─ Protected page (requireAuth=true)
├─ Sections:
│  ├─ Header with breadcrumb
│  ├─ Stats grid (challenges, points, success rate, rank)
│  ├─ Challenges by category with progress bars
│  ├─ Recent completions table
│  ├─ Quick links sidebar
│  └─ Stats summary
├─ Fetches: /api/users/stats
├─ Styling: Dashboard.module.css
└─ Status: ✓ Complete

pages/challenges.js (Challenge Browser)
├─ Protected page with challenge listing
├─ Features:
│  ├─ Filters: Difficulty, Category, Status, Search
│  ├─ Grid display of challenges (3 columns)
│  ├─ Pagination
│  ├─ Sort options
│  └─ Card shows: Name, Category, Points, Difficulty, Est. Time, Solves
├─ Fetches: /api/challenges (with filters)
├─ Styling: Challenges.module.css
└─ Status: ✓ Complete

pages/challenge/[id].js (Challenge Detail)
├─ Protected page for individual challenge
├─ Displays:
│  ├─ Challenge metadata (category, difficulty, points, solves)
│  ├─ Description
│  ├─ Objectives checklist
│  ├─ Flag submission form
│  ├─ Hints sidebar (collapsible, with penalties)
│  └─ Status badge
├─ Features:
│  ├─ Real-time flag validation
│  ├─ Success/error messages
│  ├─ Points display on completion
│  └─ Disabled form after first success
├─ Fetches: /api/challenges/[id], POST /api/challenges/submit-flag
├─ Styling: ChallengeDetail.module.css
└─ Status: ✓ Complete

pages/leaderboard.js (Global Leaderboard)
├─ Protected page showing rankings
├─ Table columns: Rank, User, Points, Challenges
├─ Features:
│  ├─ Top 3 ranking highlighted
│  ├─ Hover effects
│  ├─ Responsive design
│  └─ Tabs for global/friends/team (structure ready)
├─ Fetches: /api/leaderboard
├─ Styling: Leaderboard.module.css
└─ Status: ✓ Complete

pages/404.js (Not Found)
├─ Custom 404 error page
├─ Shows: 404 code, message, link to home
├─ Styling: Error.module.css
└─ Status: ✓ Complete
```

### Components (components/)

```
components/Layout.js
├─ Main layout wrapper for all pages
├─ Features:
│  ├─ Navigation bar with logo
│  ├─ User info display
│  ├─ Logout button
│  ├─ Auth checking (requireAuth prop)
│  ├─ Footer with copyright
│  └─ Responsive menu
├─ Props: { children, requireAuth }
├─ Styling: Layout.module.css
└─ Status: ✓ Complete
```

### Styles (styles/)

```
styles/globals.css
├─ Global styles and CSS variables
├─ Color palette: Black, white, grayscale only
├─ Typography: Sans-serif + Monospace fonts
├─ Utilities: Spacing, borders, text styles
├─ Form styling
├─ Button styling
├─ Table styling
├─ Responsive breakpoints (768px, 1024px)
└─ Length: ~500 lines

styles/Home.module.css
├─ Landing page styles
├─ Sections: Hero, Info grid, CTA
└─ Responsive design

styles/Login.module.css
├─ Login page styles
├─ Centered login box
└─ Error message styling

styles/Dashboard.module.css
├─ Dashboard layout with grid
├─ Stats boxes
├─ Category progress bars
├─ Table styling
└─ Sidebar styling

styles/Challenges.module.css
├─ Challenge browser layout
├─ Filter panel (sticky)
├─ Challenge card grid
├─ Pagination controls
└─ Responsive 2-column → 1-column

styles/ChallengeDetail.module.css
├─ Challenge detail page
├─ Meta info grid
├─ Form styling
├─ Hint collapsible sections
├─ 2-column → 1-column layout

styles/Leaderboard.module.css
├─ Leaderboard table styling
├─ Top rank highlighting
└─ Responsive table

styles/Error.module.css
├─ 404 page styling
└─ Centered error display
```

### Database Schema

```
USERS
├─ id (PK)
├─ username (UNIQUE)
├─ pin_hash (bcrypt)
├─ created_at
└─ updated_at

DISCORD_ACCOUNTS
├─ id (PK)
├─ user_id (FK, UNIQUE)
├─ discord_id (UNIQUE)
├─ username
└─ created_at

SESSIONS
├─ id (PK)
├─ user_id (FK)
├─ token
├─ expires_at
└─ created_at

PROFILES
├─ id (PK)
├─ user_id (FK, UNIQUE)
├─ bio
├─ created_at
└─ updated_at

CHALLENGE_CATEGORIES
├─ id (PK)
├─ name (UNIQUE)
└─ created_at

CHALLENGES
├─ id (PK)
├─ name
├─ description
├─ category_id (FK)
├─ difficulty (EASY/MEDIUM/HARD/INSANE)
├─ points
├─ estimated_time
├─ flag
├─ creator_id (FK)
├─ visibility (DRAFT/PRIVATE/TEAM ONLY/PUBLIC)
├─ created_at
└─ updated_at

CHALLENGE_OBJECTIVES
├─ id (PK)
├─ challenge_id (FK)
├─ objective
├─ order_num
└─ created_at

CHALLENGE_HINTS
├─ id (PK)
├─ challenge_id (FK)
├─ hint_text
├─ point_penalty
├─ order_num
└─ created_at

CHALLENGE_SUBMISSIONS
├─ id (PK)
├─ user_id (FK)
├─ challenge_id (FK)
├─ flag_submitted
├─ is_correct
├─ submitted_at
└─ UNIQUE(user_id, challenge_id)

CHALLENGE_COMPLETIONS
├─ id (PK)
├─ user_id (FK)
├─ challenge_id (FK)
├─ points_earned
├─ completed_at
└─ UNIQUE(user_id, challenge_id)

MACHINES
├─ id (PK)
├─ challenge_id (FK)
├─ name
├─ target_ip
├─ ports
├─ status
└─ created_at

MACHINE_INSTANCES
├─ id (PK)
├─ machine_id (FK)
├─ user_id (FK)
├─ instance_id (UNIQUE)
├─ status
├─ started_at
├─ expires_at
└─ target_ip

TEAMS
├─ id (PK)
├─ name (UNIQUE)
├─ owner_id (FK)
├─ created_at
└─ updated_at

TEAM_MEMBERS
├─ id (PK)
├─ team_id (FK)
├─ user_id (FK)
├─ role
├─ joined_at
└─ UNIQUE(team_id, user_id)

COMPETITIONS
├─ id (PK)
├─ name
├─ creator_id (FK)
├─ description
├─ mode (TEAM/INDIVIDUAL)
├─ start_time
├─ end_time
├─ status (SCHEDULED/ACTIVE/COMPLETED)
└─ created_at

COMPETITION_PARTICIPANTS
├─ id (PK)
├─ competition_id (FK)
├─ team_id (FK, nullable)
├─ user_id (FK, nullable)
├─ points_earned
└─ joined_at

USER_NOTES
├─ id (PK)
├─ user_id (FK)
├─ challenge_id (FK)
├─ content
├─ created_at
└─ updated_at

ACTIVITY_LOG
├─ id (PK)
├─ user_id (FK)
├─ action
├─ details
└─ created_at

AUDIT_LOG
├─ id (PK)
├─ user_id (FK, nullable)
├─ action
├─ resource_type
├─ resource_id
├─ details
└─ created_at
```

---

## Feature Completion Status

### Authentication & Authorization
- ✓ Discord bot account creation (/xlogin)
- ✓ PIN-based login
- ✓ JWT token generation
- ✓ HTTP-only secure cookies
- ✓ Session validation
- ✓ Protected routes
- ✓ Session expiration (24 hours)

### Challenges
- ✓ Challenge listing with pagination
- ✓ Challenge filtering (difficulty, category, status)
- ✓ Challenge search
- ✓ Challenge details page
- ✓ Flag submission
- ✓ Correct/incorrect feedback
- ✓ Objectives display
- ✓ Hints with point penalties
- ✓ 12 seed challenges

### Scoring & Progress
- ✓ CTF points on challenge completion
- ✓ Challenge completion tracking
- ✓ User statistics dashboard
- ✓ Progress by category
- ✓ Success rate calculation
- ✓ Rank calculation

### Leaderboards
- ✓ Global leaderboard
- ✓ Rank calculation with ties
- ✓ Point aggregation
- ✓ Challenge count

### User Experience
- ✓ Responsive design (mobile, tablet, desktop)
- ✓ Monochrome aesthetic
- ✓ Professional typography
- ✓ ASCII branding
- ✓ Error handling and messages
- ✓ Loading states

### Backend
- ✓ RESTful API structure
- ✓ Parameterized queries (SQL injection protection)
- ✓ Input validation
- ✓ Error handling
- ✓ Database connection pooling
- ✓ Secure PIN hashing

### Not Yet Implemented (Future)
- ⊘ Team management UI
- ⊘ CTF event creation/management
- ⊘ Machine provisioning
- ⊘ Browser-based terminal
- ⊘ Challenge writeups
- ⊘ Admin dashboard
- ⊘ User notes/scratch area
- ⊘ API documentation

---

## Development Commands

```bash
# Setup
npm install                    # Install dependencies
npm run db:setup              # Create database schema
npm run db:seed               # Populate with demo data

# Development
npm run dev                   # Start dev server (localhost:3000)
npm run discord-bot           # Start Discord bot

# Production
npm run build                 # Build for production
npm start                     # Run production server

# Database
psql pwnlab                     # Connect to database
\dt                          # List tables
SELECT * FROM users;         # Query data
```

---

## Security Implementation

### Authentication
- Bcryptjs PIN hashing (10 rounds)
- JWT tokens with 24-hour expiration
- HTTP-only cookies (XSS protection)
- Automatic session invalidation

### Authorization
- Server-side session validation
- Database-backed sessions
- User-to-data isolation
- No credential exposure in logs

### Protection
- Parameterized queries (SQLi prevention)
- React escaping (XSS prevention)
- Secure headers (CSP, X-Frame-Options, etc.)
- No secrets in frontend code
- Environment-based configuration

---

## Deployment Checklist

- [ ] Change JWT_SECRET
- [ ] Change SESSION_SECRET
- [ ] Set NODE_ENV=production
- [ ] Use HTTPS/TLS
- [ ] Enable secure cookies
- [ ] Set up PostgreSQL backup
- [ ] Configure rate limiting
- [ ] Set up monitoring
- [ ] Enable CORS properly
- [ ] Configure logging
- [ ] Security audit
- [ ] Load testing

---

## Git Repository Structure

```
pwnlab/
├── .env.local                     # Not committed (in .gitignore)
├── .git/                          # Git history
├── .gitignore                     # Git exclusions
├── .next/                         # Build output (ignored)
├── node_modules/                 # Dependencies (ignored)
├── README.md                      # Full documentation
├── QUICKSTART.md                  # Quick start guide
├── PROJECT_MANIFEST.md            # This file
├── package.json                   # Dependencies and scripts
├── next.config.js                 # Next.js config
├── components/                    # React components
├── lib/                          # Utility functions
├── pages/                        # Next.js pages & API
├── public/                       # Static assets
├── scripts/                      # Setup scripts
└── styles/                       # CSS modules
```

---

## Performance Notes

### Database
- Connection pooling (pg module)
- Parameterized queries
- Index on user.username
- Index on challenge.id
- Pagination (20 items per page)

### Frontend
- Next.js automatic code splitting
- CSS Modules (no global conflicts)
- Image optimization (Next.js built-in)
- Server-side session validation
- No unnecessary re-renders

### Caching
- Browser caching via headers
- HTTP-only cookies (automatic)
- No client-side storage of sensitive data

---

## File Statistics

- **Total Lines of Code**: ~3,500+
- **API Routes**: 7 endpoints
- **Pages**: 7 public/protected pages
- **Components**: 1 layout component
- **Database Tables**: 18 tables
- **CSS**: ~2,000 lines (variables-based)
- **Seed Data**: 5 users, 12 challenges, 3 teams

---

## Support & Maintenance

For issues:
1. Check QUICKSTART.md
2. Review README.md troubleshooting
3. Inspect database with `psql`
4. Check server logs
5. Verify environment variables
6. Test API endpoints manually

---

**pwnlab v1.0** — Professional Cybersecurity Training Platform
Created for small groups of security researchers and enthusiasts.
