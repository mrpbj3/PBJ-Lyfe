# PBJ Health - Design Guidelines

## Design Approach

**Selected Approach**: Design System with Gamification Elements

Drawing inspiration from established health and productivity apps:
- **Primary Reference**: Apple Health for clean data presentation and card layouts
- **Gamification**: Duolingo for streak visualization and achievement patterns
- **Fitness Tracking**: Strava for workout displays and progress charts
- **Organization**: Notion for card-based information architecture

**Core Principles**:
1. Clarity over decoration - health data must be instantly readable
2. Encouraging progression - visual rewards for consistency
3. Effortless input - minimize friction for daily logging
4. Scannable hierarchy - users track multiple metrics simultaneously

---

## Typography

**Font Stack**: System fonts via Google Fonts
- **Primary**: Inter (headings, UI elements, data displays)
- **Monospace**: JetBrains Mono (numeric data, time stamps, calories)

**Type Scale**:
- **Hero Numbers**: 48px/56px bold (trend weight, streak counts)
- **Card Headers**: 20px/24px semibold (section titles)
- **Body Text**: 16px/24px regular (descriptions, form labels)
- **Data Labels**: 14px/20px medium (metric labels, timestamps)
- **Chips/Badges**: 12px/16px semibold (status indicators, streak badges)

**Weight Distribution**:
- Regular (400): body text, descriptions
- Medium (500): labels, secondary headings
- Semibold (600): card titles, CTAs
- Bold (700): hero numbers, streak counts

---

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, and 8
- **Micro spacing**: p-2, gap-2 (chip internal padding, icon spacing)
- **Standard spacing**: p-4, gap-4 (card padding, form field gaps)
- **Section spacing**: p-6, gap-6 (between card sections)
- **Major separation**: p-8, gap-8 (page margins, dashboard card gaps)

**Container Strategy**:
- **Dashboard**: max-w-6xl centered with px-4 for mobile breathing room
- **Forms**: max-w-2xl for optimal input efficiency
- **Charts/Reports**: max-w-7xl for data visualization

**Grid Patterns**:
- **Dashboard Cards**: Single column on mobile, 2-column grid (md:grid-cols-2) on tablet+
- **Metric Chips**: Flex wrap for dynamic badge rows
- **Workout Exercises**: Single column list with expandable details

---

## Component Library

### Dashboard Cards
**Structure**: Rounded corners (rounded-xl), shadow (shadow-md), internal padding (p-6)
- **Header**: Title + action button/link in flex justify-between
- **Content**: Metric display or status chips
- **Footer**: Timestamp or navigation link (text-sm)

### Streak Badges
**Visual System**:
- **Green (3/3)**: Solid fill, white text, check icon
- **Yellow (2/3)**: Solid fill, dark text, caution icon
- **Red (0-1/3)**: Solid fill, white text, x icon
- **Format**: Circular badges (h-12 w-12) with centered icons, inline labels

### Status Chips
**Calorie Chip**: `2000/1700 OV +300`
- Monospace font, inline badge with status indicator (OV/UN/GOAL)
- Compact (px-3 py-1 rounded-full)

**Sleep Chip**: `6h45m ✅`
- Monospace time + emoji indicator
- Same compact styling

**Gym Chip**: `✅ 1h12m (6:10–7:22)`
- Duration prominent, timestamps smaller (text-sm)

### Form Elements
**Input Fields**:
- Large touch targets (min-h-12)
- Clear labels (mb-2 font-medium)
- Inline validation feedback below inputs
- Number inputs with +/- steppers for quick adjustments

**Quick Add Patterns**:
- Favorite items as tappable pills (rounded-full px-4 py-2)
- Recent entries dropdown for meal/exercise reuse
- Swipe gestures for deleting log entries

### Charts (Victory Native)
**Style Consistency**:
- Line charts for trends (weight, sleep, calories over time)
- Bar charts for daily comparisons (workout volume, step counts)
- Minimal gridlines, emphasized data points
- Contextual annotations (goals, averages as dashed lines)

### Navigation
**Tab Bar**: Fixed bottom navigation with 5 primary tabs
- Icons above labels, active state with accent indicator
- Tab labels: Today, Trends, Log, Lyfe, Profile

**Stack Navigation**: Simple header with back arrow, centered title, optional action

### Modal Patterns
**Morning Prompts**: Full-screen sequential flow
- One question per screen with large response buttons
- Progress indicator (dots or step counter)
- Skip option always visible

**Lyfe Reports**: Modal overlay with close X
- Report type selector (Day/7/30/90) as segmented control
- Scrollable content with section dividers

---

## Images

**Dashboard Today Screen**: 
- Hero spot at top (before cards) showing motivational image relevant to user's primary goal (fitness, weight loss, wellness)
- Size: Full width, 200px height on mobile, 280px on desktop
- Treatment: Subtle gradient overlay for text readability

**Empty States**:
- Illustration for "No workouts logged yet" - friendly character doing exercise
- Illustration for "No dreams recorded" - peaceful sleeping figure
- Illustration for "Start your streak" - path/journey visual

**Achievement Celebrations**:
- Milestone images for streak milestones (7, 30, 90 days)
- Recovery clean-day celebrations with encouraging imagery

**Workout Library**:
- Exercise demonstration images (optional, use placeholders if not available)
- Small thumbnails (80x80) in exercise picker

---

## Animations

**Minimal Approach** - only where providing valuable feedback:
- **Streak Badge Updates**: Brief scale bounce (0.95→1.05→1) on daily check completion
- **Chart Data Entry**: Smooth line drawing for trend weight updates
- **Form Validation**: Shake animation for errors (translate-x-2 keyframes)
- **NO**: Page transitions, hover effects, decorative motions

---

## Accessibility & Interaction

**Touch Targets**: Minimum 44px height for all interactive elements
**Focus States**: 2px outline offset for keyboard navigation
**Labels**: All inputs have visible labels, not just placeholders
**Contrast**: WCAG AA minimum for all text (4.5:1 normal, 3:1 large)
**Status Indicators**: Never rely on visual treatment alone - always include text/icon

---

## Dark/Light Mode Strategy

Implementation uses CSS variables for seamless switching:
- Cards maintain elevation through border treatments in dark mode
- Charts use mode-appropriate palettes (muted in dark, vibrant in light)
- Streak badges maintain their semantic meaning (green stays encouraging, red stays warning)