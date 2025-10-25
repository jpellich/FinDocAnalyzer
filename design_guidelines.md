# Design Guidelines: Financial Document Analysis Platform

## Design Approach

**Selected Approach:** Design System Foundation with Fintech Refinement

Drawing from professional financial platforms like Stripe Dashboard and Linear, combined with enterprise data visualization best practices. This approach prioritizes trust, clarity, and efficient data processing workflows while maintaining a modern, sophisticated aesthetic.

**Core Principles:**
- Data transparency and accuracy visualization
- Professional credibility through clean, structured layouts
- Efficient workflows with minimal friction
- Clear visual hierarchy for complex financial information

## Typography System

**Font Families:**
- Primary: Inter (via Google Fonts) - body text, labels, data tables
- Headings: Inter - consistent, professional hierarchy
- Monospace: JetBrains Mono - financial figures, calculations

**Type Scale:**
- Hero/Page Title: text-4xl md:text-5xl font-bold tracking-tight
- Section Headers: text-2xl md:text-3xl font-semibold
- Subsections: text-xl font-semibold
- Body Text: text-base leading-relaxed
- Data Labels: text-sm font-medium uppercase tracking-wide
- Financial Figures: text-lg md:text-xl font-mono font-semibold
- Helper Text: text-sm
- Captions: text-xs

## Layout System

**Spacing Primitives:**
Use Tailwind units: 2, 4, 6, 8, 12, 16, 20, 24 for consistent rhythm
- Micro spacing (UI elements): p-2, gap-4
- Component spacing: p-6, p-8
- Section padding: py-12, py-16, py-20
- Large breaks: py-24

**Grid Structure:**
- Main container: max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
- Dashboard cards: grid grid-cols-1 lg:grid-cols-3 gap-6
- Data tables: Full width within container with horizontal scroll
- Two-column layouts: grid grid-cols-1 lg:grid-cols-2 gap-8

**Viewport Management:**
- Application uses natural height flow
- Dashboard sections stack vertically with consistent py-12 to py-20 spacing
- No forced 100vh constraints except upload modal overlay

## Component Library

### Navigation & Structure

**Header:**
- Fixed top navigation: h-16 with border-b
- Logo left (h-8), navigation center, user actions right
- Responsive: Hamburger menu on mobile (< lg)
- Contains: Dashboard, Upload, History, Help links

**Sidebar (Dashboard View):**
- w-64 fixed left on desktop, collapsible drawer on mobile
- Contains: Quick actions, recent analyses, filters
- Sticky positioning with overflow-y-auto

### Upload Interface

**File Upload Zone:**
- Large dropzone: min-h-[400px] border-2 border-dashed rounded-xl
- Center-aligned content with upload icon (Heroicons: ArrowUpTrayIcon)
- Drag-over state with transform scale-105 transition
- File type badge: "Accepts .xlsx, .xls files"
- Max file size indicator: text-sm below primary CTA

**Upload Flow:**
1. Empty state with icon and instructions
2. Drag-over highlight state
3. File selected preview (filename, size, remove button)
4. Processing state with progress bar
5. Success state with preview of parsed data

### Data Display Components

**Financial Metrics Cards:**
- Card container: rounded-lg border p-6 shadow-sm
- Structure: Label (top), Large value (center), Change indicator (bottom)
- Grid layout: grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
- Change indicators: Inline with arrow icons (↑/↓) and percentage

**Coefficient Tables:**
- Responsive table with horizontal scroll wrapper
- Header: bg-muted sticky top-0
- Row structure: py-4 px-6 border-b
- Alternating row backgrounds for readability
- Status indicators: Inline badges for "Good", "Warning", "Critical" ranges
- Columns: Coefficient Name | Value | Industry Standard | Status | Trend

**Data Preview Table (Post-Upload):**
- Compact design: text-sm
- Max-height: max-h-96 with overflow-y-auto
- First 10 rows visible with "View all" expansion
- Column headers with sort indicators

### Analysis & Results

**AI Analysis Section:**
- Prominent card: rounded-xl border-2 p-8
- Icon header with OpenAI badge/indicator
- Analysis text: prose max-w-none leading-relaxed
- Subsections with h3 headings for each category
- Bullet points for key findings
- Loading state: Animated skeleton with pulsing elements

**Visualization Charts:**
- Chart containers: aspect-w-16 aspect-h-9 rounded-lg border p-6
- Use Chart.js via CDN for bar, line, and radar charts
- Legend positioned bottom or right
- Responsive sizing with min-h-[300px]
- Grid lines: subtle, not distracting

**Recommendations Panel:**
- Callout style: border-l-4 pl-6 py-4 mb-6
- Numbered list with font-medium headings
- Icon indicators for priority (Heroicons: ExclamationTriangleIcon, CheckCircleIcon)

### Action Components

**Primary CTA Buttons:**
- Large size: px-8 py-3 rounded-lg font-semibold
- Upload button: Full width on mobile, auto on desktop
- Download report: Inline with icon (Heroicons: ArrowDownTrayIcon)

**Secondary Actions:**
- Ghost/outline style: border px-6 py-2 rounded-md
- Icon + text combination
- Examples: "Clear data", "Upload new file", "View raw data"

**Loading States:**
- Spinner: Heroicons: ArrowPathIcon with animate-spin
- Progress bar: h-2 rounded-full with animated width transition
- Skeleton screens: animate-pulse with rounded placeholders

### Modal Overlays

**Processing Modal:**
- Centered overlay: fixed inset-0 backdrop-blur-sm
- Modal card: max-w-md mx-auto mt-20 rounded-xl shadow-2xl p-8
- Progress indicator with percentage
- Current step description: "Parsing Excel data...", "Calculating ratios...", "Generating AI insights..."

**Export Options Modal:**
- Radio group for format selection (PDF, Excel, CSV)
- Checkboxes for content inclusion
- Preview thumbnail of report layout

### Footer

**Application Footer:**
- border-t py-12
- Three-column layout: About, Resources, Contact
- Links: text-sm hover:underline
- Bottom row: Copyright, Privacy Policy, Terms
- Social links if applicable (LinkedIn, Twitter)

## Animations

**Minimal, Purposeful Motion:**
- Hover transitions: transition-all duration-200
- Card hover: subtle transform translate-y-[-2px] shadow-lg
- Button states: Standard hover/focus rings, no custom animations
- Data load: Fade-in with opacity transition over 300ms
- Chart animations: Chart.js default animations (appropriate for data visualization)
- Upload dropzone: Scale on drag-over (scale-105)

**No Scroll Animations:** Keep focus on data, avoid distracting scroll triggers

## Accessibility

- All form inputs with labels and aria-labels
- Upload zone with keyboard navigation support
- Focus indicators: ring-2 ring-offset-2
- Sufficient contrast ratios for all text
- Screen reader announcements for processing states
- Table headers properly marked with scope attributes
- ARIA live regions for dynamic AI analysis updates

## Icons

**Primary Library:** Heroicons (via CDN)

**Key Icons:**
- Upload: ArrowUpTrayIcon
- Download: ArrowDownTrayIcon
- Processing: ArrowPathIcon (animated)
- Success: CheckCircleIcon
- Warning: ExclamationTriangleIcon
- Info: InformationCircleIcon
- Chart: ChartBarIcon
- Document: DocumentTextIcon
- Menu: Bars3Icon (mobile)

## Images

**Hero Section:** No traditional hero image. Lead with functionality.

**Dashboard/Application Images:**
- Abstract financial graphics: Subtle background pattern or illustration in empty states
- OpenAI integration badge: Small logo in AI analysis section header
- Success/completion illustrations: Simple line illustrations for successful analysis

**Icon Strategy:** Prefer icon fonts over custom graphics for consistency and performance

---

**Implementation Notes:**
- This is a utility-first application - prioritize clarity and functionality over decorative elements
- Maintain consistent spacing throughout with the defined primitives
- Trust and professionalism are paramount - avoid playful or casual design treatments
- Every component should support the user's goal: quickly understand financial health from uploaded documents