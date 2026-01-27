# Phase 10: Website Content - Research

**Researched:** 2026-01-27
**Domain:** Website content refactoring - minimal, product-focused marketing
**Confidence:** HIGH

## Summary

This phase focuses on transforming the existing website from a traditional marketing-heavy approach to a Linear/Raycast-style minimal, product-focused design. The current website has well-structured React components with good CSS architecture, but contains excessive marketing copy, redundant sections, and complex layouts that need simplification.

The existing codebase already has dark-first theming with orange accents implemented (per prior phases). The refactoring involves content reduction rather than technology changes - stripping away marketing fluff, emphasizing product screenshots, implementing bento grid for features, and streamlining the overall page flow.

**Primary recommendation:** Systematically reduce each section to its essential elements - hero becomes screenshot + tagline, features become visual bento cards, download becomes single CTA, footer becomes minimal links.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already Installed - No Changes)

| Library       | Version | Purpose              | Why Standard       |
| ------------- | ------- | -------------------- | ------------------ |
| React         | 18.x    | Component framework  | Already in use     |
| TypeScript    | 5.x     | Type safety          | Already in use     |
| react-i18next | latest  | Internationalization | Already in use     |
| Tailwind CSS  | v4      | Utility classes      | Already configured |
| CSS Modules   | native  | Component styling    | Current pattern    |

### Supporting

| Library             | Version | Purpose | When to Use                                |
| ------------------- | ------- | ------- | ------------------------------------------ |
| No new dependencies | -       | -       | Phase is content-focused, not tech-focused |

### Alternatives Considered

| Instead of     | Could Use               | Tradeoff                                               |
| -------------- | ----------------------- | ------------------------------------------------------ |
| Video embed    | Static screenshot       | Video adds loading overhead; static is simpler for MVP |
| Animated demo  | Carousel of screenshots | Complex animation vs simple image rotation             |
| CSS Grid bento | Flexbox                 | Grid is more appropriate for asymmetric bento layouts  |

**Installation:**

```bash
# No new packages needed - this is a content refactor
```

## Architecture Patterns

### Current Page Structure (to be simplified)

```
App.tsx
├── TopBar (keep)
├── Hero (simplify - product focus)
├── Features (convert to bento grid)
├── Pricing (REMOVE - per requirements)
├── Screenshots (MERGE into Hero)
├── Download (streamline)
└── Footer (minimize)
```

### Recommended Simplified Structure

```
App.tsx
├── TopBar (minimal - logo + download button)
├── Hero (screenshot-first with minimal copy)
├── Features (3-6 bento cards, visual)
├── Demo (video/animation if available, else screenshot carousel)
├── Download (single prominent CTA)
└── Footer (essential links only)
```

### Pattern 1: Screenshot-First Hero

**What:** Hero section dominated by product screenshot with minimal text
**When to use:** Product-focused landing pages (Linear, Raycast, Arc pattern)
**Example:**

```tsx
// Minimal hero structure
function Hero() {
  return (
    <section className="hero">
      {/* Minimal text - one headline, one line description */}
      <h1>SQL Pro</h1>
      <p>A modern database manager for developers</p>
      <div className="hero-cta">
        <a href="#download">Download</a>
        <a href="https://github.com/...">GitHub</a>
      </div>

      {/* Product screenshot takes 60-70% of hero visual weight */}
      <div className="hero-screenshot">
        <img src="/screenshots/app-preview.png" alt="SQL Pro interface" />
      </div>
    </section>
  );
}
```

### Pattern 2: Bento Grid Features

**What:** Asymmetrical grid with varied card sizes showcasing features
**When to use:** Feature showcases that need visual hierarchy
**Example:**

```css
/* Bento grid with varied sizes */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-auto-rows: 180px;
  gap: 16px;
}

.bento-item {
  grid-column: span 1;
}
.bento-item.wide {
  grid-column: span 2;
}
.bento-item.tall {
  grid-row: span 2;
}
.bento-item.large {
  grid-column: span 2;
  grid-row: span 2;
}
```

### Pattern 3: Minimal Copy

**What:** Concise, benefit-focused text (no marketing fluff)
**When to use:** Every section heading and description
**Example:**

```tsx
// BEFORE (marketing heavy)
{
  title: "Everything you need for database management",
  description: "SQL Pro provides a complete SQLite database management solution with powerful features designed for professional developers"
}

// AFTER (minimal, direct)
{
  title: "Database management, simplified",
  description: "Connect, query, visualize."
}
```

### Anti-Patterns to Avoid

- **Feature dumps:** Listing every capability - instead, show 3-6 key differentiators
- **Marketing superlatives:** "Revolutionary", "Game-changing" - instead, state facts
- **Redundant sections:** Screenshots + Features + Hero preview - consolidate
- **Deep link columns:** 4-column footer with placeholder links - use minimal footer
- **CTA overload:** Multiple "Get Started" buttons - single clear action per section

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem             | Don't Build        | Use Instead                                 | Why                     |
| ------------------- | ------------------ | ------------------------------------------- | ----------------------- |
| Bento grid          | Manual positioning | CSS Grid with span classes                  | Complex responsive math |
| Video player        | Custom controls    | HTML5 video or embedded YouTube/Loom        | Accessibility, loading  |
| Platform detection  | Complex UA parsing | Existing `detectPlatform()` in Download.tsx | Already implemented     |
| Theme switching     | New implementation | Existing ThemeSwitcher component            | Already works           |
| Screenshot carousel | New carousel       | Simplify existing Screenshots component     | Already has a11y        |

**Key insight:** This phase is about content removal and reorganization, not building new features. The existing component architecture is solid.

## Common Pitfalls

### Pitfall 1: Over-Engineering Bento Grid

**What goes wrong:** Creating overly complex responsive breakpoints for bento grid
**Why it happens:** Trying to maintain exact asymmetric layout at all screen sizes
**How to avoid:** Collapse to simple 1-2 column grid on mobile, only use bento pattern on desktop
**Warning signs:** More than 3 media queries for the grid

### Pitfall 2: Placeholder Content

**What goes wrong:** Footer and sections with "#" links that go nowhere
**Why it happens:** Keeping structure without content
**How to avoid:** Only include links that have real destinations (GitHub, download, docs)
**Warning signs:** Current footer has ~20 links, many are "#"

### Pitfall 3: Screenshot Without Context

**What goes wrong:** Large screenshot with no visual cues about what user is seeing
**Why it happens:** Assuming image speaks for itself
**How to avoid:** Include subtle labels or highlight key UI areas
**Warning signs:** User confusion about what the app does from screenshot alone

### Pitfall 4: Inconsistent Removal

**What goes wrong:** Removing Pricing section but leaving pricing references elsewhere
**Why it happens:** Partial refactoring
**How to avoid:** Grep for all pricing-related strings, remove translation keys
**Warning signs:** Dead links to #pricing, translation key errors

### Pitfall 5: Breaking Translation Keys

**What goes wrong:** Removing/renaming translation keys without updating all locales
**Why it happens:** Only updating en.json, forgetting zh.json
**How to avoid:** Update both locale files simultaneously, test language switch
**Warning signs:** Visible translation key strings in UI like "hero.description"

## Code Examples

Verified patterns from the current codebase:

### Current Hero Structure (to simplify)

```tsx
// Source: apps/website/src/components/Hero.tsx (lines 7-225)
// Current structure has:
// - Badge + version tag
// - Large multi-line title
// - Description from translation
// - Two CTA buttons
// - Complex preview card mimicking app UI
// - Feature tags

// Target: Remove preview card, simplify to screenshot
```

### Current Features Grid (to convert to bento)

```tsx
// Source: apps/website/src/components/Features.tsx
// Currently 3-column equal grid:
const features = [
  { key: 'multi', icon: 'database', title: '...', description: '...' },
  { key: 'ai', icon: 'sparkles', title: '...', description: '...' },
  { key: 'secure', icon: 'lock', title: '...', description: '...' },
];

// Convert to bento layout with visual previews in cards
```

### Current Footer Links (to minimize)

```tsx
// Source: apps/website/src/components/Footer.tsx
// Currently has 4 link columns + CTA banner + social + legal
// Many links are placeholder "#"

// Essential links to keep:
const essentialLinks = [
  { label: 'GitHub', href: 'https://github.com/...' },
  { label: 'Download', href: '#download' },
  { label: 'Changelog', href: 'https://github.com/.../releases' },
];
```

### Existing Screenshot Assets

```
// Source: apps/website/public/screenshots/
// Available dark-mode screenshots (use these):
- welcome-dark.png
- database-dark.png
- table-dark.png
- query-dark.png
- orders-dark.png (data view)
- products-dark.png (data view)
```

### Bento Grid CSS Pattern

```css
/* Source: apps/website/src/index.css (existing .card-bento class) */
.card-bento {
  background: oklch(1 0 0 / 4%);
  border: 1px solid var(--border-subtle);
  border-radius: var(--border-radius-xl);
  overflow: hidden;
  transition: all var(--duration-normal) var(--ease-out);
}

/* Extend for actual bento layout: */
.bento-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

/* Feature-specific sizes */
.bento-feature-main {
  grid-column: span 2;
  grid-row: span 2;
}
.bento-feature-wide {
  grid-column: span 2;
}
.bento-feature-default {
  grid-column: span 1;
}
```

## Section-by-Section Analysis

### WEB-01: Hero Section Simplification

**Current State:**

- Multi-line title with gradient accent
- Description paragraph
- Two CTA buttons (Download, GitHub)
- Complex app preview card (simulated UI)
- Three feature tags

**Target State:**

- Single-line headline or app name
- One short tagline (8-12 words max)
- Two CTA buttons (keep)
- ACTUAL product screenshot (not simulated preview)
- Remove feature tags (redundant with Features section)

**Technical Approach:**

1. Replace `.hero-preview` div with `<img>` of actual screenshot
2. Simplify `.hero-header` content
3. Remove `.hero-tags` section
4. Keep button styling, adjust spacing

### WEB-02: Concise Marketing Copy

**Current Copy Issues (from en.json):**

- Hero description: Long explanatory text
- Feature descriptions: Full sentences for each
- Download subtitle: "Free download, cross-platform support" - redundant

**Target Copy Pattern:**
| Section | Current | Target |
|---------|---------|--------|
| Hero description | "SQLCipher encryption support, visual diff preview..." | "The database manager developers love" |
| Feature cards | Full paragraph per feature | 3-6 word benefit statement |
| Download | "Free download, cross-platform support" | "Download for free" |

### WEB-03: Product Demo Embedding

**Current State:**

- Screenshots component exists with carousel
- No video/animation capability

**Options (in order of simplicity):**

1. **Static screenshot carousel** - Already implemented, just needs integration
2. **Animated GIF** - Simple, no player needed
3. **Video embed** - HTML5 video or YouTube/Loom

**Recommendation:** Use existing screenshot carousel, potentially move it into hero or as standalone Demo section. Add actual product screenshots (already in `/public/screenshots/`).

### WEB-04: Bento Grid Features

**Current State:**

- 3-column equal grid
- 3 feature cards (multi-db, AI, security)
- Card has icon + title + description

**Target State:**

- Asymmetric bento layout
- 4-6 features with varied visual weight
- Primary feature gets large card (2x2)
- Visual previews inside cards where applicable

**Implementation:**

```tsx
// New bento layout
<div className="bento-grid">
  <div className="bento-item large">  // Multi-DB - hero feature
  <div className="bento-item wide">   // Query editor
  <div className="bento-item">        // Encryption
  <div className="bento-item tall">   // Cross-platform
  <div className="bento-item">        // AI assistant
</div>
```

### WEB-06: Download Section Streamlining

**Current State:**

- Label badge
- Title with gradient
- Subtitle
- Platform-detected main download button
- Other platforms nav
- Build from source note
- Three trust badges

**Target State:**

- Single prominent download button with platform detection
- Small links for other platforms
- Remove trust badges (not needed for open source)
- Remove "build from source" note (put in docs)

### WEB-07: Minimal Footer

**Current State (Footer.tsx):**

- CTA banner ("Ready to transform...")
- 5-column grid (brand + 4 link columns)
- ~15+ links including many placeholders
- Social icons (3)
- Legal links (3)
- Copyright

**Target State:**

- NO CTA banner (redundant)
- Single row or minimal 2-column layout
- Essential links only: GitHub, Download, Changelog, Docs
- One or two social links (GitHub at minimum)
- Copyright only (remove placeholder legal links)

## Content Inventory

### To Remove

1. **Pricing section** - entire component and App.tsx import
2. **Footer CTA banner** - redundant with Download section
3. **Footer link columns** (Product, Resources, Company, Support) - consolidate
4. **Hero preview card** - replace with real screenshot
5. **Hero feature tags** - redundant with Features section
6. **Download trust badges** - not needed for open source
7. **Download build guide text** - move to documentation

### To Simplify

1. **Hero copy** - reduce to tagline
2. **Feature descriptions** - reduce to benefit statements
3. **Download section** - single CTA focus
4. **Footer** - essential links only

### To Keep/Enhance

1. **Product screenshots** - use existing assets prominently
2. **Download button** - platform detection logic
3. **Dark/light theme** - already implemented
4. **Accessibility** - maintain aria labels, skip links
5. **i18n structure** - keep but simplify content

## Translation Key Updates Required

### Keys to Remove (both en.json and zh.json)

```
pricing.* (entire pricing object)
footer.techStack
footer.docs (if not linking to real docs)
```

### Keys to Simplify

```
hero.description -> shorter tagline
features.subtitle -> minimal
download.subtitle -> minimal
```

## State of the Art

| Old Approach              | Current Approach           | When Changed | Impact            |
| ------------------------- | -------------------------- | ------------ | ----------------- |
| Feature lists             | Visual bento grids         | 2023-2024    | Layout change     |
| Marketing-heavy copy      | Product-focused minimal    | 2023-2024    | Content reduction |
| Multiple CTAs per section | Single clear action        | 2024         | UX clarity        |
| Carousel for screenshots  | Integrated hero screenshot | 2024-2025    | Simpler UX        |

**Deprecated/outdated:**

- 4-column footer grids with many links - minimal footers preferred
- "Transform your workflow" CTA copy - direct benefit statements preferred
- Simulated UI previews - actual screenshots more authentic

## Open Questions

1. **Product Demo Format**
   - What we know: Screenshot assets exist, carousel component exists
   - What's unclear: Should there be video/animation? Is static sufficient?
   - Recommendation: Start with static screenshots, add video later if available

2. **Feature Selection**
   - What we know: Current 3 features (Multi-DB, AI, Security)
   - What's unclear: Which features deserve bento "hero" position?
   - Recommendation: Multi-DB as primary (differentiator), expand to 4-6 total

3. **Pricing Future**
   - What we know: Remove Pricing section now
   - What's unclear: Will pricing return later?
   - Recommendation: Clean removal, can re-add later if needed

## Sources

### Primary (HIGH confidence)

- Current codebase analysis - Hero.tsx, Features.tsx, Download.tsx, Footer.tsx, App.tsx
- Current CSS architecture - index.css, component CSS files
- Current translation files - en.json, zh.json
- Existing screenshot assets - /public/screenshots/

### Secondary (MEDIUM confidence)

- Prior phase decisions (dark-first, orange accent) - per phase context
- Linear/Raycast design patterns - known design philosophy

### Tertiary (LOW confidence)

- Bento grid best practices - general CSS Grid knowledge (not from current research)

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH - no new dependencies, existing React/TS/CSS
- Architecture: HIGH - refactoring existing components, not rebuilding
- Content patterns: HIGH - analyzed all current copy and structure
- Pitfalls: HIGH - based on current codebase analysis

**Research date:** 2026-01-27
**Valid until:** 60 days (content refactoring is stable work)
