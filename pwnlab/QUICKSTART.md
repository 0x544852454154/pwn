# pwnlab - Quick Start Guide

Get pwnlab running locally in 5 minutes.

## Prerequisites

- Node.js 18+
- PostgreSQL running locally
- Discord bot token (optional, but recommended for full setup)

## Step 1: Clone & Install

```bash
cd pwnlab
npm install
```

## Step 2: Set Up Database

```bash
# Create the database
createdb pwnlab

# Create schema and tables
npm run db:setup

# Seed with demo data
npm run db:seed
```

## Step 3: Configure Environment

Create `.env.local`:

```
DATABASE_URL=postgres://localhost/pwnlab
JWT_SECRET=pwnlab_dev_secret_change_in_production
DISCORD_TOKEN=your_discord_bot_token_here
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_GUILD_ID=your_discord_guild_id_here
NEXT_PUBLIC_APP_URL=http://localhost:3000
SESSION_SECRET=pwnlab_session_secret_change_in_production
```

**For development without Discord bot:**
Just set dummy values for DISCORD_* vars. Manual testing works fine.

## Step 4: Run the App

```bash
npm run dev
```

App starts at **http://localhost:3000**

## Step 5: Test Login

Use demo credentials from seed data:

```
Username: ShadowFox
PIN: 583921
```

Or create more test users:

```javascript
// In scripts/db-seed.js, modify seedData.users array
seedData.users = [
  { username: 'YourName', pin: '123456' },
  // ...
];
```

Then run `npm run db:seed` again.

## What Works Now

✓ Landing page with ASCII branding
✓ Discord integration (/xlogin command)
✓ Login with PIN authentication
✓ Dashboard with user stats
✓ Challenge browser with filtering
✓ Challenge details and flag submission
✓ Point tracking and leaderboard
✓ Secure HTTP-only sessions
✓ Responsive design

## What You Can Customize

### Add More Challenges

Edit `scripts/db-seed.js` and add to `seedData.challenges`:

```javascript
{
  name: 'YOUR CHALLENGE',
  category: 'WEB',
  difficulty: 'MEDIUM',
  points: 150,
  description: 'Challenge description here.',
  flag: 'CTF{your_flag_here}',
  estimated_time: 30,
  objectives: ['Objective 1', 'Objective 2'],
}
```

Then `npm run db:seed`.

### Change Colors/Styling

All colors are in `styles/globals.css`:

```css
:root {
  --color-black: #000000;
  --color-white: #ffffff;
  --color-gray: #777777;
  /* ... */
}
```

Stick with the monochrome palette per spec.

### Add Teams/Competitions

Database schema supports teams and competitions. Create a new page and API endpoint to manage them.

## Useful Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Run production build locally
npm start

# Setup database
npm run db:setup

# Seed data
npm run db:seed

# Run Discord bot
npm run discord-bot
```

## File Structure Reference

```
pages/
  api/                 ← API routes (add new endpoints here)
  index.js            ← Landing page
  login.js            ← Login page
  dashboard.js        ← User dashboard
  challenges.js       ← Challenge browser
  challenge/[id].js   ← Challenge detail
  leaderboard.js      ← Leaderboard

components/
  Layout.js           ← Main layout (used on all pages)

lib/
  db.js              ← Database connection pool
  auth.js            ← Authentication logic

styles/
  globals.css        ← Global styles (colors, fonts, utilities)
  *.module.css       ← Component-specific styles

scripts/
  db-setup.js        ← Create database schema
  db-seed.js         ← Populate demo data
  discord-bot.js     ← Discord bot for /xlogin
```

## Common Tasks

### Add a New Page

1. Create `pages/newpage.js`
2. Import `Layout` component
3. Wrap content in `<Layout requireAuth={true}>`
4. Add navigation link to `Layout.js`

### Add an API Endpoint

1. Create `pages/api/resource.js`
2. Use `fetch('/api/resource')` from frontend
3. Validate input, check auth, query database
4. Return JSON response

### Change Database Schema

1. Edit `scripts/db-setup.js`
2. Run `npm run db:setup` (drops and recreates)
3. Run `npm run db:seed` to repopulate demo data

### Debug Issues

Check:
1. `.env.local` - all variables set?
2. Database running? `psql -l` lists databases
3. Server logs in terminal
4. Browser console (F12) for frontend errors
5. Database: `psql pwnlab` → `\dt` shows tables

## Next Steps

1. **Add More Challenges**: Update `db-seed.js` with your challenges
2. **Customize Branding**: Modify ASCII art, colors, and text
3. **Enable Discord Bot**: Add your bot token and test `/xlogin`
4. **Deploy**: Follow deployment section in README.md
5. **Extend Features**: Add teams, competitions, writeups, notes, etc.

## Security Notes (For Production)

- Change `JWT_SECRET` and `SESSION_SECRET`
- Use HTTPS only
- Set `NODE_ENV=production`
- Enable secure cookies in production
- Set up database backups
- Use managed PostgreSQL service
- Add rate limiting
- Regular security audits

## Need Help?

- Check README.md for full documentation
- Review troubleshooting section
- Check database: `psql pwnlab` → `SELECT * FROM users;`
- Review server logs in terminal
- Inspect network tab in DevTools (F12 → Network)

---

**You're all set!** Start building challenges and invite your friends.

Happy hacking.
