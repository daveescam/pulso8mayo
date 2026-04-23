# HR Module Technology Stack

**Project:** Pulso HORECA — HR Modules (Recruitment, Performance Reviews, Training)
**Researched:** 2026-04-23
**Context:** Multi-tenant SaaS platform with existing Next.js 16, React 19, Drizzle ORM, Better Auth

---

## Summary Recommendation

| Category | Recommended | Version | Why |
|----------|-------------|---------|-----|
| Forms | react-hook-form | 7.x | Already in stack — industry standard for complex forms |
| Validation | Zod | 4.x | Already in stack — type-safe schema validation |
| Resolvers | @hookform/resolvers | 5.x | Already in stack — connects Zod to react-hook-form |
| Drag & Drop | @dnd-kit | 10.x | Already in stack — modern maintained replacement for react-beautiful-dnd |
| Video Player | @mux/mux-player-react | 3.x | Top choice for professional video hosting with HLS |
| Rich Text | Tiptap | 3.x | Headless, customizable — better than Quill for modern apps |
| Progress Tracking | Custom Implementation | — | Standard pattern — no library needed |

---

## Forms & Validation

### Core Libraries (Already in Stack)

The existing stack already includes the best tools for complex HR forms:

```bash
pnpm add react-hook-form @hookform/resolvers zod
```

**Existing versions verified:**
- `react-hook-form`: 7.71.1
- `@hookform/resolvers`: 5.2.2
- `zod`: 4.3.6
- `date-fns`: 4.1.0

### Why These Work for HR Modules

| Module | Form Complexity | How Stack Handles It |
|--------|--------------|------------------|
| Recruitment | Multi-step wizard (personal info → experience → interviews) | react-hook-form `useFieldArray` for dynamic entries |
| Performance Reviews | Multi-section forms with ratings, text,Goals | Zod schemas for each section, conditional validation |
| Training | Course enrollments, quiz submissions | Server actions with optimistic updates |

### Recommended Patterns

**1. Multi-Step Wizard Forms:**
```typescript
// Use @stepperize/react (already in stack: ^6.0.0)
import { useStepper } from '@stepperize/react';

// Each step is a form section with partial Zod schema
// Final submit validates all steps together
```

**2. Large Form Optimization:**
```typescript
// Per theFrontKit performance patterns:
// - Lazy load form sections with dynamic imports
// - Validate on blur for immediate feedback
// - Debounce expensive operations (search, autocomplete)
// - Use Server Actions for submission, not API routes
```

**3. Review Cycle Forms:**
```typescript
// Performance review has phases:
// - Self-assessment (employee)
// - Manager review  
// - Calibration (HR only)
// - Delivery meeting
// Use Zod discriminators or conditional schemas per phase
```

---

## Candidate Pipeline (Kanban Board)

### Library (Already in Stack)

The existing stack includes `@dnd-kit` packages:

```bash
# Already installed:
# @dnd-kit/core: 6.3.1
# @dnd-kit/modifiers: 9.0.0
# @dnd-kit/sortable: 10.0.0
# @dnd-kit/utilities: 3.2.2
```

### Why @dnd-kit Over Alternatives

| Library | Status | Why Not |
|---------|--------|---------|
| react-beautiful-dnd | Deprecated | No longer maintained, known bugs with React 18+ |
| react-dnd | Active | HTML5-based, harder API, overkill for simple kanban |
| @dnd-kit | **Active** | Modern, accessible, modular, built for React |

### Implementation Pattern for ATS Pipeline

Based on modern ATS implementations (OpenATS, Hire Gnome, Devlumiq ATS):

```typescript
// 1. Multiple sortable columns (stages)
// 2. DragOverlay for visual feedback  
// 3. Optimistic updates during drag
// 4. Server action on drop for persistence

// Structure per open-source ATS:
// - Columns: Applied → Screening → Interview → Offer → Hired
// - Each card: Candidate info, resume, stage history
// - Actions: Move, schedule, reject from kanban
```

### Typical ATS Pipeline Features

- **Drag-and-drop:** Candidate moves between stages via `@dnd-kit/sortable`
- **Columns:** Customizable stages per tenant (multi-tenant!)
- **Candidate Cards:** Photo, name, position, applied date, score
- **Quick Actions:** Schedule interview, send email, reject
- **Filters:** By position, date, source, score range
- **Search:** Full-text across resumes

---

## Training Content Delivery

### Video Hosting & Streaming

#### Recommended: Mux

```bash
pnpm add @mux/mux-player-react @mux/mux-video-react
```

| Feature | Mux | Cloudflare Stream | Bunny Stream |
|---------|-----|----------------|-------------|
| Upload-to-publish | ~5 seconds | Slower | Slower |
| Analytics | Per-second, real-time | Basic | Basic |
| Pricing | Per-second | Per-minute | Per-GB |
| React SDK | Yes | No (iframe) | No |
| Player customization | CSS variables | Custom build | Custom build |
| Best for | SaaS products | Cloudflare users | Cost-sensitive at scale |

**Why Mux for HORECA HR:**
- JIT encoding (fastest) — important for training content uploads
- Best React integration — consistent with Next.js stack
- Analytics — track completion rates per employee
- Well-documented — used by many production LMS platforms

#### Player Component

```typescript
import MuxPlayer from '@mux/mux-player-react/lazy';

<MuxPlayer
  playbackId={video.playbackId}
  metadata={{
    video_title: video.title,
    player_name: 'training-player',
  }}
  onTimeUpdate={(e) => {
    // Track progress for completion
    // Update database at 25%, 50%, 75%, 100%
  }}
/>
```

### Rich Text Editor (Course Content, Job Descriptions)

#### Recommended: Tiptap

```bash
pnpm add @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder
```

| Editor | Pros | Cons |
|--------|------|------|
| Quill | Simple, stable | Old, limited customization |
| Slate | Powerful, flexible | Complex API, high boilerplate |
| Tiptap | **Headless, modern, extensible** | Requires setup |

**Why Tiptap:**
- Headless — you control the UI completely
- Built on ProseMirror — well-maintained
- Extensions for: images, tables, code blocks
- Works with react-hook-form (stores as JSON)
- Used by production LMS platforms

**Alternative for Simpler Needs:**
```bash
# If you don't need full rich text:
pnpm add react-quill
# Much simpler, faster to implement
# Good for: job descriptions, course summaries
```

### Progress Tracking

**No library needed** — standard pattern from LMS research:

```typescript
// Database schema (Drizzle):
// - userProgress: userId, chapterId, isCompleted, completedAt
// - courseProgress: userId, courseId, percentComplete, lastLessonId

// Tracking pattern:
// 1. Video onTimeUpdate → track percentage
// 2. Quiz submit → mark lesson complete
// 3. Calculate: completedLessons / totalLessons * 100

// Key features needed:
// - Resume where left off (lastLessonId)
// - Completion certificates (100% trigger)
// - Team leaderboards (optional gamification)
```

### Quiz System

**Custom implementation** with existing stack:

```typescript
// Use react-hook-form for quiz state:
// - Multiple choice (RadioGroup)
// - True/false (Switch)
// - Fill in blank (Input)
// - Multi-select (CheckboxGroup)

// Quiz schema in Zod:
// - questions: array of { id, type, options, correctAnswer }
// - answers: user responses
// - score: calculated from correct answers
// - passed: score >= passing threshold
```

---

## Quizz and Assessment Patterns

### Multiple Choice Questions

```typescript
import { RadioGroup, RadioGroupItem } from '@radix-ui/react-radio-group';

<RadioGroup {...register(`questions.${index}.answer`)}>
  {question.options.map((option) => (
    <div key={option.value}>
      <RadioGroupItem value={option.value} />
      <Label>{option.label}</Label>
    </div>
  ))}
</RadioGroup>
```

### Rating Scales (Performance Reviews)

```typescript
// Use React Hook Form with custom rating component:
// - 1-5 star ratings for competencies
// - 1-10 numeric scales for goals
// - Dropdown for rating levels

// Star rating exists via lucide-react:
// import { Star } from 'lucide-react';
// Render filled/unfilled based on value
```

---

## Integration with Existing Stack

### Multi-Tenant Considerations

All HR data is already scoped via `tenantId`:

```typescript
// Existing pattern from lib/tenant-context.ts
const { tenantId } = useTenant();

// All queries filter by tenantId:
// const candidates = await db.query.candidates.findMany({
//   where: eq(candidates.tenantId, tenantId),
// })
```

### Authentication & Permissions

```typescript
// Use existing better-auth + lib/permissions.ts
// HR modules need:
// - recruitment:read, recruitment:write
// - reviews:read, reviews:write  
// - training:read, training:write

// Role-based access per tenant is standard
```

### Database

```typescript
// Existing Drizzle schema pattern
// Add tables to lib/db/schema.ts:
// - candidates, jobs, applications
// - reviewCycles, reviews, goals
// - courses, chapters, lessons
// - progress, enrollments
```

---

## What NOT to Use

| Library | Why Avoid | Use Instead |
|---------|-----------|-----------|
| react-beautiful-dnd | Deprecated, React 18 bugs, unmaintained | @dnd-kit (already in stack) |
| Formik | Legacy, verbose API | react-hook-form (in stack) |
| Redux Form | Heavy, unnecessary | react-hook-form |
| react-quill (if you need customization) | Old, limited styling | Tiptap |
| Prisma | Already using Drizzle | Drizzle ORM |
| Clerk | Already using better-auth | better-auth |
| Firebase/Supabase | Already using Neon | Neon + Upstash |

---

## Installation Summary

```bash
# Core (already in stack)
pnpm add react-hook-form @hookform/resolvers zod @dnd-kit/core @dnd-kit/sortable @dnd-kit/modifiers @dnd-kit/utilities @stepperize/react

# For training modules
pnpm add @mux/mux-player-react @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder
```

---

## Sources

### ATS / Recruitment Patterns
- OpenATS (GitHub 2026) — Next.js 16, Drizzle, shadcn/ui
- Hire Gnome (GitHub 2026) — Next.js 16, Prisma, MySQL
- Devlumiq ATS (Codester 2025) — Next.js 15, Prisma, FullCalendar, dnd-kit

### LMS / Training Patterns
- nextjs-math-course (GitHub 2025) — Next.js 16, Mux, BetterAuth, Redis
- LMS Boilerplate (GitHub 2026) — Next.js 16, Tailwind v4, shadcn/ui
- TheFrontKit HR Template (2026) — 37 screens pattern library

### Performance Review Patterns
- TheFrontKit HR Dashboard Guide (2026) — Form-heavy review cycles
- Rippling Evaluation Templates (2025) — Best practices

### Video & Player
- Croct Blog: React Video Libraries (2026)
- Mux vs Cloudflare Stream (2026)

---

*Stack analysis: 2026-04-23*