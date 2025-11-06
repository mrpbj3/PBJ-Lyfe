# PBJ Health

## Overview

PBJ Health is a comprehensive health tracking application designed to help users achieve sustainable fat loss through daily logging of sleep, nutrition, weight, exercise, and mental health metrics. The application follows a "one simple daily flow" philosophy, making it effortless to track multiple health dimensions while building streaks and maintaining consistency.

The platform combines fitness tracking (inspired by Apple Health and Strava) with gamification elements (inspired by Duolingo) to encourage long-term adherence. Core features include trend weight calculation using EWMA (Exponential Weighted Moving Average), daily analytics, and lifestyle tracking beyond just physical health.

**Primary Goal**: Achieve 4-week trend weight decrease while maintaining ≥80% adherence to health goals.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, using Vite as the build tool and bundler.

**UI Library**: shadcn/ui components built on Radix UI primitives, providing accessible, customizable components following the "New York" style variant. The design system emphasizes:
- Card-based layouts for scannable information hierarchy
- Clean, health-focused data presentation
- Gamification through streak badges and visual rewards
- Dark-first UI with PBJ Studios brand colors (Purple #AB13E6, Gold #C38452)

**Styling**: Tailwind CSS with custom design tokens and an 8pt spacing grid. The system supports both light and dark themes with CSS custom properties for dynamic theming.

**State Management**: 
- **Zustand** for client-side global state (planned slices for user, goals, diary, steps, workouts, mental health, lifestyle)
- **React Query (@tanstack/react-query)** for server state management, caching, and data synchronization

**Routing**: wouter for lightweight client-side routing with dedicated pages for each tracking category (Today dashboard, Sleep, Weight, Meals, Workouts, Mental Health, Meditation, Dreams, Work, Social, Hobbies, Recovery).

**Design System**: Typography uses Inter for UI elements and JetBrains Mono for numeric data. Border radius defaults to 20px for cards, 12px for buttons. Component hierarchy emphasizes clarity over decoration with hero numbers (48px), card headers (20px), and body text (16px).

### Backend Architecture

**Runtime**: Node.js with Express.js server handling API routes and serving the React SPA.

**Language**: TypeScript throughout the stack with strict type checking enabled.

**API Design**: RESTful endpoints organized by domain:
- `/api/auth/*` - Authentication and user management
- `/api/sleep` - Sleep session tracking
- `/api/weight` - Body weight logging
- `/api/meals` - Nutrition and calorie tracking
- `/api/workouts` - Exercise session logging
- `/api/mental` - Mental health ratings
- `/api/meditation` - Meditation session tracking
- `/api/dreams` - Dream journal entries
- `/api/work` - Work stress logging
- `/api/social` - Social activity tracking
- `/api/analytics/daily` - Daily aggregated metrics

**Authentication**: Replit Auth integration using OpenID Connect (OIDC) with Passport.js strategy. Session management via express-session with PostgreSQL session store (connect-pg-simple). Sessions persist for 7 days with httpOnly, secure cookies.

**Session Storage**: PostgreSQL-backed sessions table ensuring sessions survive server restarts and support horizontal scaling.

### Data Storage

**Database**: PostgreSQL accessed via Neon serverless driver (@neondatabase/serverless) with WebSocket support for serverless environments.

**ORM**: Drizzle ORM for type-safe database queries and schema management. Schema defined in TypeScript with automatic type inference.

**Schema Design**:
- **users**: Core user profile (id, email, name, profile image)
- **sessions**: Session persistence for authentication
- **sleepSessions**: Sleep tracking with start/end timestamps
- **bodyMetrics**: Weight and body measurements by date
- **meals**: Calorie and protein intake logs
- **workouts**: Exercise sessions with duration
- **mentalLogs**: Daily mental health ratings (great/ok/bad) with notes
- **meditationSessions**: Meditation practice tracking
- **dreamEntries**: Dream journal with narrative text
- **workLogs**: Work stress levels (low/medium/high)
- **socialLogs**: Social activity tracking
- **hobbies**: User-defined hobby tracking
- **hobbySessions**: Time spent on hobbies
- **drugProfiles**: Substance tracking for recovery
- **drugUseLogs**: Usage logs for recovery monitoring
- **goals**: User fitness goals (target weight, calorie targets, step goals)
- **analyticsDaily**: Daily aggregated metrics and streaks

All tables use user ID foreign keys with appropriate indexes for query performance.

### External Dependencies

**UI Components**: 
- Radix UI (@radix-ui/*) - Headless accessible component primitives for dialogs, popovers, dropdowns, accordions, etc.
- Lucide React (lucide-react) - Icon library
- cmdk - Command palette component

**Utilities**:
- clsx & tailwind-merge - Conditional className handling
- class-variance-authority - Type-safe component variants
- Luxon - Date/time manipulation with timezone support
- date-fns - Additional date utilities
- nanoid - Unique ID generation

**Forms & Validation**:
- React Hook Form - Form state management
- Zod - Schema validation
- @hookform/resolvers - Zod integration with React Hook Form

**Authentication**:
- openid-client - OpenID Connect client
- passport - Authentication middleware
- express-session - Session management
- connect-pg-simple - PostgreSQL session store

**Build & Development**:
- Vite - Frontend build tool and dev server
- esbuild - Backend bundling for production
- tsx - TypeScript execution for development
- @replit/* plugins - Replit-specific development tooling

**Database**:
- @neondatabase/serverless - Neon PostgreSQL driver
- drizzle-orm - TypeScript ORM
- drizzle-kit - Schema migrations and push
- ws - WebSocket support for Neon

**Planned Integrations** (referenced in documentation):
- iOS HealthKit / Android Health Connect - Native health data bridges
- expo-notifications - Push and local notifications (React Native)
- Supabase Edge Functions - Background jobs and analytics (future migration from current PostgreSQL setup)

**Note**: The codebase references React Native (Expo) in documentation files, but the current implementation is a web application using React. The Native implementation appears to be a planned future phase.