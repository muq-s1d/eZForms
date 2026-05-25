# eZForms

A modern, anonymous voting platform for friend groups. Create custom "most likely to" polls, secure them with passwords, and instantly see what everyone really thinks with beautiful realtime visualizations.

**Live Demo:** [https://ezforms.vercel.app](https://ezforms.vercel.app) *(Update link once deployed)*

## Features

- **Anonymous Voting System:** Participants select an identity to vote, ensuring they cannot vote for themselves.
- **Real-Time Results:** Watch the votes roll in instantly with Supabase Realtime subscriptions.
- **Advanced Visualizations:** Toggle between clean bar charts and beautiful animated pie charts.
- **Privacy Controls:** Form creators can securely gate their live forms with a password, and lock results to be private or public.
- **Creator Dashboard:** Manage your active forms, shut down voting, or permanently delete forms from the database.
- **Aesthetic Minimalism:** A sleek, deep black corporate UI design engineered for speed and clarity.

## Tech Stack

- **Framework:** [Next.js 16 (App Router)](https://nextjs.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + Custom Minimalist Theme
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **Database & Auth:** [Supabase](https://supabase.com/)
- **Data Visualization:** [Recharts](https://recharts.org/)
- **Deployment:** [Vercel](https://vercel.com/)

## Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/muq-s1d/eZForms.git
   cd eZForms
   ```

2. Create a `.env.local` file and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. Install dependencies and start the server:
   ```bash
   npm install
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema (Supabase)

Make sure your Supabase project contains the following tables:
- `forms` (id, creator_id, title, description, password, is_active, is_public_results, created_at)
- `participants` (id, form_id, name)
- `questions` (id, form_id, question_text, sort_order)
- `responses` (id, form_id, responder_name)
- `answers` (id, response_id, question_id, selected_participant_id)

Enable **Realtime** for the `responses` and `answers` tables in the Supabase Dashboard for live results to work.
