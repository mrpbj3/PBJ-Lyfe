# PBJ Lyfe - Next.js Migration

This is the Next.js App Router migration of the PBJ Lyfe application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env.local` file:
```bash
cp .env.local.example .env.local
```

3. Add your Supabase credentials to `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
OPENAI_API_KEY=your_openai_api_key
```

## Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build

Build the application for production:
```bash
npm run build
```

## Start Production

Run the production server:
```bash
npm start
```

## Project Structure

```
next/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── analytics/
│   │   ├── streak/
│   │   ├── profile/
│   │   └── checkins/
│   ├── today/             # Main dashboard page
│   ├── profile-detailed/  # Detailed profile page
│   └── ...                # Other pages
├── components/            # React components
├── lib/                   # Utilities and helpers
│   ├── supabase/         # Supabase client/server setup
│   └── ...
└── public/               # Static assets
```

## Key Features

- ✅ Next.js 14 App Router
- ✅ React Query for data fetching
- ✅ Supabase Auth Helpers
- ✅ TypeScript
- ✅ Tailwind CSS
- ✅ API Routes for analytics, streak, profile, checkins
- ✅ Server-side rendering
- ✅ Client-side navigation

## Migration Status

### Completed
- [x] Next.js project structure
- [x] API routes (analytics, streak, profile, checkins, health)
- [x] Today page
- [x] Profile-detailed page
- [x] React Query setup
- [x] Supabase auth integration
- [x] Basic pages (sleep, weight, nutrition, etc.)

### To Do
- [ ] Full component migration
- [ ] Authentication flow
- [ ] Form handling
- [ ] Charts and visualizations
- [ ] Advanced features
- [ ] Testing
- [ ] Documentation

## Notes

- This is a parallel implementation alongside the existing Vite app
- The original Vite app remains untouched in the parent directory
- Once tested and validated, this can replace the original implementation
