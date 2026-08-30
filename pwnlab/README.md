# pwnlab - Cybersecurity Training Environment

A professional, private cybersecurity CTF platform built for small groups of friends to create, host, and solve realistic cybersecurity challenges in isolated environments.

## Features

- **Professional Dashboard**: Real-time statistics, challenge tracking, and progress visualization
- **Challenge Browser**: Filter and search 13+ seed challenges across multiple difficulty levels
- **Flag Submission**: Immediate feedback on challenge solutions with point rewards
- **CTF Points System**: Earn points on challenge completion; track on leaderboards
- **Teams**: Create or join a team, view team rosters and combined point totals
- **Profiles**: Public per-user stat pages with specialties, team, and rank
- **Private Notes**: Autosaving markdown scratch notes attached to each challenge
- **Activity Feed**: Textual, non-gamified log of platform-wide events
- **Discord Integration**: Create accounts via `/xlogin` command with secure PIN authentication
- **HTTP-only Sessions**: Secure session management with automatic expiration
- **Responsive Design**: Fully functional on desktop, tablet, and mobile devices
- **Monochrome UI**: Professional, technical aesthetic with zero gamification

## Architecture

```
pwnlab/
├── pages/                    # Next.js pages and API routes
│   ├── api/                  # RESTful API endpoints
│   ├── index.js             # Landing page
│   ├── login.js             # Login page
│   ├── dashboard.js         # User dashboard
│   ├── challenges.js        # Challenge browser
│   ├── challenge/[id].js    # Challenge detail (flag + notes)
│   ├── leaderboard.js       # Global leaderboard
│   ├── teams.js             # Team listing / creation
│   ├── team/[id].js         # Team roster
│   ├── profile.js           # User profile
│   ├── notes.js             # All private notes
│   └── activity.js          # Platform activity feed
├── components/              # Reusable React components
│   └── Layout.js            # Main layout wrapper
├── lib/                     # Utility functions
│   ├── db.js               # PostgreSQL connection pool
│   └── auth.js             # Authentication utilities
├── scripts/                # Setup and bot scripts
│   ├── db-setup.js         # Database schema creation
│   ├── db-seed.js          # Seed demo data
│   └── discord-bot.js      # Discord bot for /xlogin
├── styles/                 # CSS modules
└── public/                 # Static assets

Database: PostgreSQL
Frontend: Next.js 14 + React 18
Backend: Node.js + Express (Next.js API)
Auth: PIN-based + JWT
Bot: Discord.js
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL 12+
- Discord bot token (create one at [Discord Developer Portal](https://discord.com/developers))
- Git

### 1. Install Dependencies

```bash
cd pwnlab
npm install
```

### 2. Configure Environment

Copy `.env.local` and update with your values:

```bash
# .env.local
DATABASE_URL=postgres://user:password@localhost:5432/pwnlab
JWT_SECRET=your_secret_key_change_in_production
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_GUILD_ID=your_discord_server_guild_id
NEXT_PUBLIC_APP_URL=http://localhost:3000
SESSION_SECRET=your_session_secret
PIN_HASH_ROUNDS=10
PIN_LENGTH=6
```

### 3. Set Up Database

```bash
# Create database
createdb pwnlab

# Run schema setup
npm run db:setup

# Seed demo data (optional)
npm run db:seed
```

### 4. Set Up Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to "Bot" section and create a bot
4. Copy the bot token to `DISCORD_TOKEN` in `.env.local`
5. Copy Client ID to `DISCORD_CLIENT_ID`
6. Go to OAuth2 > URL Generator, select `bot` scope and `applications.commands` permission
7. Copy the generated URL and invite the bot to your Discord server
8. Get your server's Guild ID and add to `DISCORD_GUILD_ID`

### 5. Run Development Server

In separate terminals:

```bash
# Terminal 1: Next.js app
npm run dev
# App runs at http://localhost:3000

# Terminal 2: Discord bot
npm run discord-bot
# Bot connects and registers /xlogin command
```

## Usage

### User Workflow

1. **Create Account**: Use `/xlogin` command in Discord
   - Bot creates account with random PIN
   - PIN sent via private DM (secure, never public)

2. **Login**: Visit http://localhost:3000/login
   - Enter username and PIN
   - Session token stored in secure HTTP-only cookie

3. **Dashboard**: View stats, recent completions, and quick links

4. **Explore Challenges**: Browse, filter, and search challenges

5. **Solve Challenge**: 
   - Read description and objectives
   - Submit flag with `CTF{...}` format
   - Earn points on correct submission
   - View leaderboard rankings

### Admin/Creator Features

Extend with:
- Challenge creator interface
- Team management
- CTF event scheduling
- Analytics dashboard

## API Endpoints

### Authentication

```
POST /api/auth/login              # Username + PIN login
POST /api/auth/logout             # Clear session
GET  /api/auth/me                 # Get current user
```

### Challenges

```
GET  /api/challenges              # List challenges (with filters)
GET  /api/challenges/[id]         # Get challenge details
POST /api/challenges/submit-flag   # Submit flag
```

### Users

```
GET  /api/users/stats             # Get user statistics
GET  /api/users/profile           # Get profile (own or ?username=)
GET  /api/leaderboard             # Get global leaderboard
```

### Teams

```
GET  /api/teams                   # List teams (+ your team id)
POST /api/teams                   # Create a team { name }
GET  /api/teams/[id]              # Team detail with roster
POST /api/teams/join              # Join a team { teamId }
```

### Notes

```
GET  /api/notes                   # List all your notes
POST /api/notes                   # Upsert a note { challengeId, content }
GET  /api/notes/[challengeId]     # Get note for one challenge
```

### Activity

```
GET  /api/activity                # Global activity feed (latest 50)
```

## Database Schema

### Core Tables

- `users`: User accounts with PIN hashes
- `profiles`: User profile information
- `sessions`: Active authentication sessions
- `discord_accounts`: Discord/pwnlab account linking

### Challenge Tables

- `challenges`: Challenge metadata
- `challenge_categories`: Difficulty/category taxonomy
- `challenge_objectives`: Challenge goals/steps
- `challenge_hints`: Optional hints with point penalties
- `challenge_submissions`: All flag submissions
- `challenge_completions`: Successful solutions with points

### Social Tables

- `teams`: Team/group management
- `team_members`: Team membership and roles
- `competitions`: CTF event definitions
- `competition_participants`: Event participants and scores

### Logging

- `activity_log`: User action history
- `audit_log`: System changes and admin actions

## Security

### Authentication
- Secure PIN hashing with bcryptjs (10 rounds)
- JWT tokens with 24-hour expiration
- HTTP-only cookies (no JavaScript access)
- Automatic session expiration
- Rate limiting on login (implement in production)

### Authorization
- Server-side session validation
- Role-based access control (RBAC)
- Challenge visibility filtering
- No credentials in logs

### Protection

- CSRF tokens for state-changing requests
- XSS prevention via React escaping
- SQL injection prevention via parameterized queries
- Secure headers (X-Frame-Options, CSP, etc.)
- No sensitive data in frontend code
- Secrets in environment variables only

### Infrastructure

- Database user with minimal permissions
- Challenge isolation (containers/VMs in production)
- No challenge flags accessible via queries
- Audit logging of sensitive actions
- Regular security updates

## Seed Content

The platform includes 13 original challenges:

| Name | Category | Difficulty | Points |
|------|----------|-----------|--------|
| LOST CREDENTIALS | WEB | EASY | 50 |
| HIDDEN HEADER | WEB | EASY | 50 |
| TERMINAL ROOKIE | LINUX | EASY | 50 |
| CAESAR'S REVENGE | CRYPTO | EASY | 50 |
| BROKEN LOGIN | WEB | MEDIUM | 150 |
| PACKET TRAIL | FORENSICS | MEDIUM | 150 |
| SUSPICIOUS UPLOAD | WEB | MEDIUM | 150 |
| FORGOTTEN SERVICE | LINUX | MEDIUM | 150 |
| DARK NETWORK | NETWORKING | HARD | 250 |
| BINARY SHADOWS | REVERSE ENG | HARD | 250 |
| ROOTED | PRIV ESC | HARD | 250 |
| SHADOW DATABASE | WEB | HARD | 250 |

## Deployment

### Production Checklist

- [ ] Use environment variables for all secrets
- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS only (SSL/TLS certificates)
- [ ] Enable secure cookies
- [ ] Set strong JWT_SECRET and SESSION_SECRET
- [ ] Use managed PostgreSQL (AWS RDS, Heroku Postgres)
- [ ] Enable database backups
- [ ] Set up monitoring and alerting
- [ ] Implement rate limiting
- [ ] Enable CORS properly
- [ ] Use CDN for static assets
- [ ] Set up logging aggregation
- [ ] Regular security audits
- [ ] Implement audit logging

### Heroku Deployment (Example)

```bash
# Create Heroku app
heroku create your-app-name

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Set environment variables
heroku config:set JWT_SECRET=your_secret
heroku config:set DISCORD_TOKEN=your_token
# ... set all other vars

# Deploy
git push heroku main

# Run migrations
heroku run npm run db:setup
```

### Docker (Example)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## Development Notes

### Adding New Challenges

1. Insert into `challenges` table
2. Add objectives via `challenge_objectives`
3. Add hints via `challenge_hints`
4. Set flag string (will be compared directly)

### Customizing Scoring

Modify `points` in challenge creation. Points awarded on first correct submission only.

### Extending for Teams

- Create team via `teams` table
- Add members via `team_members`
- Update leaderboard to group by team

### Adding CTF Events

- Create competition via `competitions` table
- Add participants via `competition_participants`
- Filter challenges by event
- Track scores separately

## Troubleshooting

### Database Connection Error

```
Check DATABASE_URL format:
postgres://username:password@localhost:5432/dbname
```

### Discord Bot Not Responding

```
- Check DISCORD_TOKEN is valid
- Verify bot has /command permissions
- Check DISCORD_GUILD_ID matches your server
- Restart bot: npm run discord-bot
```

### Login Failed

```
- Verify PIN is exactly 6 digits
- Check username exists in database
- Clear cookies and try again
- Check server logs for errors
```

### Challenge Flag Not Submitting

```
- Ensure flag format matches exactly (CTF{...})
- Check challenge exists in database
- Verify user is authenticated
- Check browser console for errors
```

## Testing

```bash
# Run with test data
npm run db:seed

# Test accounts (created by seed script)
Username: ShadowFox
PIN: 583921
```

## Future Enhancements

- [ ] Machine provisioning and lifecycle management
- [ ] Browser-based terminal for machine access
- [ ] Challenge writeups and walkthroughs
- [ ] User notes on challenges
- [ ] Team collaboration features
- [ ] API documentation (OpenAPI/Swagger)
- [ ] Admin dashboard for moderation
- [ ] Challenge templates and generators
- [ ] Automated challenge testing
- [ ] Real-time notifications
- [ ] Export statistics and reports

## License

Private. Proprietary. Not for public distribution.

## Support

For issues or questions:
1. Check troubleshooting section
2. Review database schema
3. Check server logs
4. Inspect browser console
5. Verify environment variables

---

**pwnlab v1.0** — Professional Cybersecurity Training Platform
