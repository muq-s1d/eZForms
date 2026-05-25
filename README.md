# eZForms MVP 2.0

An anonymous voting web application for friend groups built with Next.js, React, Tailwind CSS, and Supabase.

## Features
- **Anonymous Voting:** Real-time voting with self-vote prevention.
- **Minimalist Corporate Theme:** Deep black aesthetic mode (like Instagram/Twitter).
- **Password Protection:** Secure your forms with a password.
- **Results Privacy:** Creator controls whether results are public or private.
- **Pie Charts:** Advanced visualization using Recharts.
- **Dashboard:** Manage, close, or delete your forms.

## Running Locally

1. Create a `.env.local` file with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) with your browser.
