# PBJ-Lyfe Deployment Guide

## Required Environment Variables

### Vercel/Production Environment

#### OpenAI (Required for Ask Mr. PBJ & AI Nutrition Calculation)
```
OPENAI_API_KEY=sk-...
OPENAI_MODEL_MEALS=gpt-4o-mini (optional, defaults to gpt-4o-mini)
OPENAI_MODEL_COACH=gpt-4o-mini (optional, for future use)
OPENAI_TIMEOUT_MS=30000 (optional, defaults to 30000)
```

#### Email Service (Required for Contact Us)

**Option 1: Resend (Recommended)**
```
RESEND_API_KEY=re_...
```

**Option 2: SMTP (Alternative)**
```
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=password
CONTACT_FROM_EMAIL=noreply@pbjstudios.com
```

#### Supabase (Already configured via VITE_ vars)
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ... (for server-side operations)
```

## Database Requirements

### Required Tables with RLS Policies

All tables must have Row-Level Security (RLS) enabled and policies that scope to `auth.uid()`:

1. **daily_checkins** - Read/Write own records
2. **daily_checkin_answers** - Read/Write own records  
3. **daily_summary** - Read/Write own records
4. **meals** - Read/Write own records
5. **workouts** - Read/Write own records
6. **sleep_sessions** - Read/Write own records
7. **body_metrics** - Read/Write own records
8. **steps** - Read/Write own records
9. **social_logs** - Read/Write own records
10. **hobby_logs** - Read/Write own records
11. **ai_chat_sessions** - Read/Write own records
12. **ai_chat_messages** - Read/Write own records
13. **contact_messages** - Insert-only (no read policy needed)
14. **profiles** - Read/Write own record

### Required SQL View

**v_checkin_answers_flat**
```sql
CREATE OR REPLACE VIEW public.v_checkin_answers_flat AS
SELECT 
  dca.user_id,
  dca.checkin_id,
  dc.for_date,
  dca.section,
  dca.key,
  dca.value_text,
  dca.value_number as raw
FROM daily_checkin_answers dca
JOIN daily_checkins dc ON dc.id = dca.checkin_id;
```

Enable RLS:
```sql
ALTER VIEW v_checkin_answers_flat SET (security_invoker = on);
```

### Example RLS Policy Template

```sql
-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read their own data
CREATE POLICY "Users can read own data"
ON table_name FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy for authenticated users to insert their own data
CREATE POLICY "Users can insert own data"
ON table_name FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy for authenticated users to update their own data
CREATE POLICY "Users can update own data"
ON table_name FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy for authenticated users to delete their own data
CREATE POLICY "Users can delete own data"
ON table_name FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
```

### CRITICAL: Profiles Table RLS Policy

**The profiles table uses `id` as the primary key (NOT `user_id`):**

```sql
-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy for users to read their own profile
CREATE POLICY "Users can read own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy for users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy for users to insert their own profile (during signup)
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
```

**Important:** All code that queries the profiles table MUST use `.eq('id', user.id)` NOT `.eq('user_id', user.id)`

## Timezone Handling

The application uses the user's browser timezone for date calculations. All `for_date` and `summary_date` fields should be stored in YYYY-MM-DD format without timezone information to avoid off-by-one errors.

For server-side date calculations:
- Use the user's `profile.timezone` field when available
- Fall back to server timezone (UTC recommended)
- Always convert to local date string before comparing dates

## API Endpoints

### New Endpoints Added

- `GET /api/streak/current` - Real-time streak calculation with fallback
- `GET /api/analytics/7d` - 7-day aggregated health data
- `GET /api/checkins/recent?limit=7` - Recent check-ins
- `GET /api/checkins/all?limit=&offset=` - Paginated check-ins
- `GET /api/checkins/:date` - Check-in details by date
- `POST /api/coach/analyze` - AI health coach analysis
- `POST /api/meals/ai-calc` - AI-powered nutrition calculation
- `POST /api/contact` - Contact form submission with email

### Authentication

All API routes use the `isAuthenticated` middleware which:
- Validates the user session
- Extracts `userId` from `req.user.claims.sub`
- Returns 401 if not authenticated

## Verification Checklist

Before deploying to production:

- [ ] All environment variables set in Vercel
- [ ] Supabase RLS policies enabled for all tables
- [ ] View `v_checkin_answers_flat` exists and has RLS
- [ ] OpenAI API key is valid and has credits
- [ ] Email service (Resend or SMTP) is configured
- [ ] Test streak calculation with real data
- [ ] Test 7-day charts display correctly
- [ ] Test Ask Mr. PBJ with sample questions
- [ ] Test AI nutrition calculation
- [ ] Test contact form sends email
- [ ] Verify timezone handling for dates

## Monitoring

Monitor these areas after deployment:
- OpenAI API usage and costs
- Email delivery success rate
- API response times (especially AI endpoints)
- Error rates in Vercel logs
- Supabase query performance
