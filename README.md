# eZForms

A modern, anonymous voting platform designed for friend groups to create custom "most likely to" polls, secure them with passwords, and see what everyone really thinks with beautiful realtime visualizations.

**Live Demo:** [https://ezforms-gamma.vercel.app](https://ezforms-gamma.vercel.app)

## How It Works

eZForms makes it simple to create and participate in group voting forms while maintaining privacy and enforcing rules.

### For Creators
- **Form Creation:** Create custom forms with multiple questions (e.g., "Who is most likely to survive a zombie apocalypse?").
- **Participant Management:** Define the exact list of participants who are eligible to be voted for.
- **Access Control:** Secure every form with a custom password. Only people with the password can join and vote.
- **Results Visibility:** Choose whether results are public or private right at creation time — no need to change it from the dashboard afterward. Can also be toggled at any time from the dashboard.
- **Dashboard Management:** Manage all your active forms from a central dashboard. Close voting to freeze a form, toggle result visibility, or permanently delete the form entirely.
- **Account Deletion:** Delete your own account and all associated forms and data directly from the dashboard — no admin intervention required.

### For Participants
- **Password Protected Entry:** Participants can browse the live forms feed but must enter the correct password to access a specific form.
- **Identity Selection & Lockout:** Before answering questions, participants select their own identity from the roster. Once a vote has been cast under a name, that identity is permanently locked (shown greyed out with a padlock icon), preventing anyone from impersonating someone who has already voted.
- **Self-Vote Prevention:** The system automatically removes the voter's own name from the answer choices, ensuring no one can vote for themselves.
- **Real-Time Results:** If the creator has made results public, participants are instantly redirected to the results page after submitting.
- **Live Visualizations:** Watch votes roll in instantly via Supabase Realtime. Toggle between bar charts (with percentage-accurate widths and a color-coded winner badge) and a custom donut chart where the majority winner's slice is permanently highlighted by popping out of the ring.

### Authentication
- **Email & Password:** Standard signup and login with optional form password protection.
- **Google OAuth:** Sign in or sign up instantly with a Google account — profile generation is handled automatically.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database & Auth:** Supabase (PostgreSQL, Auth, Realtime WebSockets)
- **Data Visualization:** Custom SVG charts + Recharts (bar charts)
- **Styling:** Tailwind CSS & Framer Motion
