# LinkedIn Burner

AI-powered roasts and polished rewrites for your LinkedIn feed. Paste your post or upload a screenshot, and get a witty roast alongside a genuinely improved rewrite, powered by real AI vision and text analysis.

Live demo: https://ld-burner.netlify.app
Repo: https://github.com/tanya2314/linkedin-burner

## What it does

- Paste LinkedIn post text OR upload a screenshot of a profile/post
- Choose between Roast Mode (witty, shareable critique) or Constructive Critique (honest, encouraging feedback)
- Get an AI-generated roast and a rewritten, improved version side by side
- Full auth system: sign up, log in, and your roast history is saved and private to you
- History log of all past roasts, tied to your account

## Tech stack

Frontend: React + Vite, TypeScript, Tailwind CSS
Auth and Database: Supabase (Postgres + Row Level Security)
AI: Google Gemini API (vision + text), called via a Supabase Edge Function to keep the API key secure server-side
Deployment: Netlify (frontend), Supabase (backend/edge functions)

## How it works

1. User submits text or an image through the React frontend
2. The request goes to a Supabase Edge Function (get-roast), which never exposes the AI API key to the browser
3. The edge function sends the content to Gemini's API, using vision capabilities for screenshots or text analysis for pasted content
4. Gemini returns a roast and rewrite pair, which gets saved to a linkedin_roasts table protected by Row Level Security so users only ever see their own data
5. Results render in the UI with copy-to-clipboard and a persistent history log

## Notable engineering details

Security-first API design: the AI API key lives only in Supabase secrets, never in frontend code
Row Level Security: every database policy is scoped to auth.uid(), so user data is isolated at the database layer, not just the UI
CORS-safe edge function: handles preflight requests properly for cross-origin calls from the deployed frontend
Dual input handling: the same AI pipeline handles both plain text and base64-encoded images through Gemini's multimodal API

## Running locally

git clone https://github.com/tanya2314/linkedin-burner.git
cd linkedin-burner
npm install

Create a .env file with:
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_key

npm run dev

You'll also need a Supabase project with the linkedin_roasts table set up (see the supabase folder for the edge function) and a Gemini API key set as a Supabase secret.

## Why I built this

I wanted a portfolio project that went beyond another to-do list or chatbot clone, something with a bit of personality that also demonstrates real full-stack skills: authentication, secure API design, database security policies, and working with multimodal AI. Built as part of my journey learning AI-assisted app development.