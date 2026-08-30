# Supabase Setup Guide for pwnlab

## Prerequisites
- A Supabase account (free tier works great)
- Node.js 18+ installed

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Choose an organization and enter project details:
   - **Name**: pwnlab
   - **Database Password**: (save this securely)
   - **Region**: Choose closest to your users
4. Wait for the project to be created (~2 minutes)

## Step 2: Get Your API Keys

1. In your Supabase project, go to **Settings → API**
2. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

## Step 3: Run the Database Migration

1. In Supabase, go to **SQL Editor**
2. Click "New query"
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL editor and click **Run**
5. You should see "Success. No rows returned"

## Step 4: Configure Environment Variables

Create a `.env.local` file in your project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Discord Bot (optional)
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_GUILD_ID=your_guild_id
```

**Important**: The `SUPABASE_SERVICE_ROLE_KEY` is a secret key. Never expose it to the browser. It should only be used in server-side code (API routes, Discord bot).

## Step 5: Install Dependencies

```bash
npm install
```

## Step 6: Enable Email Auth

1. In Supabase, go to **Authentication → Providers**
2. Ensure **Email** is enabled
3. Configure email templates if desired (Signup, Magic Link, etc.)

## Step 7: Test the Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Visit `http://localhost:3000`
3. Try signing up with a test account
4. Check Supabase **Authentication → Users** to see if the user was created

## Step 8: Deploy to Production

### Option A: Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add the environment variables in Vercel's dashboard
4. Deploy

### Option B: Supabase Hosting

1. Install Supabase CLI: `npm install -g supabase`
2. Link your project: `supabase link --project-ref your-project-ref`
3. Deploy: `supabase functions deploy`

## Free Tier Limits

Be aware of Supabase free tier limits:
- **Database**: 500MB
- **Storage**: 1GB
- **Bandwidth**: 2GB/month
- **MAUs**: 50,000
- **Edge Functions**: 500K invocations/month

## Upgrading Later

When you're ready to upgrade:
1. Go to Supabase dashboard
2. Click "Upgrade" and choose a plan
3. Your data and configuration will remain intact

## Troubleshooting

### "Invalid API key" error
- Double-check your `.env.local` values
- Ensure you're using the correct keys (anon vs service_role)

### "Row Level Security policy violation"
- Check that your RLS policies are correctly configured
- Ensure the user is authenticated when accessing protected data

### "Relation does not exist"
- Make sure you ran the migration SQL in the Supabase SQL Editor
- Check that table names match exactly (case-sensitive)

## Next Steps

After setup is complete, consider:
1. Setting up email templates for user onboarding
2. Configuring a custom domain (paid feature)
3. Enabling 2FA for admin accounts
4. Setting up monitoring and alerts
5. Creating a backup strategy
