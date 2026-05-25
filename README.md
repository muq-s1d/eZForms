# eZForms

A modern, anonymous voting platform designed for friend groups to create custom "most likely to" polls, secure them with passwords, and see what everyone really thinks with beautiful realtime visualizations.

**Live Demo:** [https://ezforms.vercel.app](https://ezforms.vercel.app) *(Update link once deployed)*

## How It Works

eZForms makes it simple to create and participate in group voting forms while maintaining privacy and enforcing rules.

### For Creators
- **Form Creation:** Create custom forms with multiple questions (e.g., "Who is most likely to survive a zombie apocalypse?"). 
- **Participant Management:** Define the exact list of participants who are eligible to be voted for.
- **Access Control:** Secure every form with a custom password. Only people with the password can join and vote.
- **Results Privacy:** Choose whether the voting results are public (visible to anyone with the form password) or strictly private (visible only to you).
- **Dashboard Management:** Manage your active forms from a central dashboard. You can "Close Voting" to freeze the form and prevent new responses, or permanently delete the form entirely.

### For Participants
- **Password Protected Entry:** Participants can browse the live forms feed, but must enter the correct password to access a specific form.
- **Self-Vote Prevention:** Before answering questions, participants must select their own identity from the participant list. The system automatically removes their name from the answer choices, ensuring no one can vote for themselves.
- **Real-Time Results:** If the creator has made the results public, participants are instantly redirected to the results page after submitting their vote. 
- **Live Visualizations:** Watch the votes roll in instantly via Supabase Realtime subscriptions, toggling between detailed bar charts and animated pie charts.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Database & Auth:** Supabase (with Realtime WebSockets)
- **Data Visualization:** Recharts
- **Styling:** Tailwind CSS & Framer Motion
