# Feature Landscape: Linear/Raycast Design System

**Domain:** Database Management Desktop App + Marketing Website
**Researched:** 2026-01-26
**Overall Confidence:** HIGH (based on direct analysis of Linear.app, Raycast.com, and cmdk library)

---

## Executive Summary

Linear/Raycast style represents the pinnacle of developer-focused UI design: dark-mode-first, keyboard-centric, minimal visual hierarchy, and obsessively refined micro-interactions. This aesthetic prioritizes speed, focus, and professionalism over warmth and approachability.

The transition from "Warm Modern" (orange accents, warm whites, large rounded corners) to Linear/Raycast style requires fundamental shifts in color philosophy, interaction patterns, and visual density.

---

## Table Stakes

Features users **expect** in a Linear/Raycast-style interface. Missing = product feels out of place.

| Feature                             | Why Expected                                                               | Complexity | Notes                                                               |
| ----------------------------------- | -------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------- |
| **Dark mode as default**            | The defining characteristic; Linear defaults to dark, Raycast is dark-only | Low        | Not just "supported" but designed dark-first, light as afterthought |
| **Command palette (Cmd+K)**         | Signature interaction pattern; instant access to all actions               | Medium     | Use cmdk library; must be fast, fuzzy-searchable                    |
| **Keyboard shortcuts visible**      | Shortcuts displayed inline with menu items                                 | Low        | Badge/kbd elements showing shortcuts next to every action           |
| **Minimal chrome/decoration**       | Reduced visual noise; content > decoration                                 | Low        | No ornamental elements, shadows used sparingly                      |
| **Subtle borders (near-invisible)** | Borders at 5-10% opacity, not solid lines                                  | Low        | Use `oklch(1 0 0 / 6%)` style transparent borders                   |
| **Deep, neutral backgrounds**       | Near-black backgrounds (#0F172A, #121212, not pure #000)                   | Low        | Slate 900 or similar; never pure black                              |
| **High-contrast text hierarchy**    | Clear Primary/Secondary/Muted text levels                                  | Low        | Primary near-white, secondary ~70% opacity, muted ~50%              |
| **System font or Inter**            | Clean, neutral sans-serif                                                  | Low        | Inter or Inter Variable is the de-facto standard                    |
| **Monospace for code/technical**    | JetBrains Mono or similar for code elements                                | Low        | Used for SQL, shortcuts, technical labels                           |
| **Consistent spacing system**       | 4px or 8px grid-based spacing                                              | Low        | Tight, consistent padding throughout                                |
| **Smooth 150-200ms transitions**    | Subtle, professional transition timing                                     | Low        | ease-out curve, never jarring                                       |
| **Focus rings keyboard-only**       | `:focus-visible` not `:focus`                                              | Low        | No focus rings on mouse click                                       |
| **Reduced motion support**          | Respect `prefers-reduced-motion`                                           | Low        | Accessibility requirement                                           |
| **Skip navigation link**            | Keyboard accessibility                                                     | Low        | "Skip to content" for screen readers                                |

### Design Tokens (Table Stakes)

```css
/* Background hierarchy (dark mode) */
--bg-base: oklch(0.13 0.02 265); /* ~#0F172A - Slate 900 */
--bg-elevated: oklch(0.18 0.02 265); /* ~#1E293B - Slate 800 */
--bg-overlay: oklch(0.23 0.02 265); /* ~#334155 - Slate 700 */

/* Text hierarchy */
--text-primary: oklch(0.97 0.002 250); /* Near white */
--text-secondary: oklch(0.7 0.01 250); /* 70% - for descriptions */
--text-muted: oklch(0.55 0.015 250); /* 55% - for placeholders */

/* Borders */
--border-subtle: oklch(1 0 0 / 6%);
--border-default: oklch(1 0 0 / 10%);
--border-strong: oklch(1 0 0 / 15%);

/* Accent (single, muted) */
--accent: oklch(0.65 0.15 145); /* Muted green or blue */
```

---

## Differentiators

Features that **elevate** the product beyond basic Linear/Raycast aesthetic. Not expected, but valued.

| Feature                           | Value Proposition                            | Complexity | Notes                                             |
| --------------------------------- | -------------------------------------------- | ---------- | ------------------------------------------------- |
| **Gradient text for headlines**   | Premium, modern feel; Linear signature       | Low        | `background-clip: text` with subtle gradient      |
| **Glass/blur effects**            | Depth and sophistication (Raycast signature) | Medium     | `backdrop-filter: blur()` on overlays, popovers   |
| **Animated list heights**         | Polished command palette feel                | Medium     | cmdk's `--cmdk-list-height` with CSS transition   |
| **Performance-aware animations**  | Enhanced animations on capable hardware      | Medium     | Check `navigator.hardwareConcurrency > 4`         |
| **Contextual command palette**    | Commands change based on current view        | High       | Different commands for table view vs query editor |
| **Vim-style navigation**          | j/k for up/down, g+g for top                 | Medium     | Power-user appeal, matches Linear                 |
| **Staggered fade-in animations**  | Sections reveal sequentially                 | Low        | `animation-delay` with stagger classes            |
| **Noise texture overlay**         | Subtle grain for depth                       | Low        | SVG noise filter at 3-5% opacity                  |
| **Spotlight/radial gradients**    | Hero sections with glow effects              | Low        | Radial gradient backgrounds                       |
| **Custom scrollbar styling**      | Minimal, auto-hiding scrollbars              | Low        | macOS-style thin scrollbars                       |
| **Real-time search highlighting** | Characters highlighted in results            | Medium     | cmdk supports this pattern                        |
| **Breadcrumb navigation**         | Hierarchical context display                 | Low        | Shows current location in app                     |
| **Shortcut learning prompts**     | "Tip: Press Cmd+K" tooltips                  | Low        | Onboarding for keyboard-first                     |
| **Command history/recents**       | Recently used commands at top                | Medium     | Local storage for command history                 |
| **Theme variants**                | Dark, Light, System, "Glass"                 | Medium     | Linear offers glass variant                       |

### Animation Specifications (Differentiators)

```css
/* Fade-up entrance */
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Scale-in for dialogs */
@keyframes scale-in {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Timing */
--duration-fast: 100ms;
--duration-normal: 150ms;
--duration-slow: 200ms;
--ease-out: cubic-bezier(0.33, 1, 0.68, 1);
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
```

---

## Anti-Features

Features to **explicitly NOT build**. These break the Linear/Raycast aesthetic.

| Anti-Feature                       | Why Avoid                                      | What to Do Instead                                |
| ---------------------------------- | ---------------------------------------------- | ------------------------------------------------- |
| **Warm color palette**             | Orange, amber, warm whites feel casual/playful | Use cool slate/gray neutrals, muted accent colors |
| **Large rounded corners (20px+)**  | Feels soft, consumer-app-like                  | Use 8-12px border-radius max; Linear uses ~12px   |
| **Colored backgrounds**            | Distracts from content                         | Deep neutrals only; color for accents only        |
| **Heavy shadows**                  | Dated, heavy visual weight                     | Subtle or no shadows; use borders for separation  |
| **Gradient buttons**               | Consumer/marketing aesthetic                   | Solid accent color buttons, minimal styling       |
| **Animated hover glow/pulse**      | Distracting, unprofessional                    | Subtle opacity/background changes only            |
| **Warm-tinted shadows**            | Part of "Warm Modern" identity                 | Cool gray or pure black shadows if any            |
| **Decorative elements**            | Hexagons, patterns, flourishes                 | Clean, minimal; content is the decoration         |
| **Emoji in UI**                    | Too casual for professional tools              | Text or icons only                                |
| **Floating dock navigation**       | Mobile-first pattern                           | Linear uses fixed sidebar or command palette      |
| **Art deco/geometric decorations** | Current "Warm Modern" uses these               | Remove entirely                                   |
| **Welcome/splash screens**         | Slows down power users                         | Instant app start; settings accessible via Cmd+K  |
| **Multiple accent colors**         | Visual chaos                                   | Single accent color (green, blue, or purple)      |
| **Busy loading states**            | Complex spinners, animations                   | Minimal skeleton or simple spinner                |
| **Card hover lift effects**        | translateY on hover is overused                | Subtle border/background color change instead     |

---

## Feature Dependencies

```
Command Palette (Cmd+K)
├── requires: Keyboard event handling
├── requires: Fuzzy search implementation (cmdk library)
├── enables: All other keyboard shortcuts
└── enables: Contextual actions

Dark Mode First
├── requires: CSS custom properties for theming
├── requires: System theme detection
└── enables: Glass/blur effects (better in dark mode)

Minimal Visual Hierarchy
├── requires: Refined typography scale
├── requires: Consistent spacing system
└── conflicts with: Warm Modern decorations
```

---

## Component Patterns

### Command Palette Structure

```tsx
// Using cmdk library
<Command.Dialog open={open} onOpenChange={setOpen}>
  <Command.Input placeholder="Type a command or search..." />
  <Command.List>
    <Command.Empty>No results found.</Command.Empty>

    <Command.Group heading="Navigation">
      <Command.Item onSelect={() => navigate('/tables')}>
        <TableIcon />
        <span>Tables</span>
        <kbd>G T</kbd>
      </Command.Item>
    </Command.Group>

    <Command.Group heading="Actions">
      <Command.Item>
        <PlusIcon />
        <span>New Query</span>
        <kbd>Cmd+N</kbd>
      </Command.Item>
    </Command.Group>
  </Command.List>
</Command.Dialog>
```

### Item States (Linear-style)

```css
/* Default */
[cmdk-item] {
  padding: 8px 12px;
  border-radius: 8px;
  color: var(--text-secondary);
  transition: all 100ms ease;
}

/* Hover */
[cmdk-item]:hover {
  background: oklch(1 0 0 / 5%);
}

/* Selected (keyboard focus) */
[cmdk-item][data-selected='true'] {
  background: oklch(1 0 0 / 8%);
  color: var(--text-primary);
}

/* No glow, no lift, no shadows */
```

---

## MVP Recommendation

For MVP migration from "Warm Modern" to Linear/Raycast style:

### Phase 1: Foundation (Must Have)

1. **Dark mode as default** - Flip the theme, update all color tokens
2. **Color palette migration** - Cool slate instead of warm stone
3. **Border radius reduction** - 20px+ down to 8-12px
4. **Remove decorative elements** - Gradients, glows, Art Deco borders
5. **Typography cleanup** - Ensure Inter/system font, proper hierarchy

### Phase 2: Interaction (Should Have)

1. **Command palette (Cmd+K)** - Install and integrate cmdk
2. **Keyboard shortcut system** - Display shortcuts, handle key events
3. **Transition timing** - Audit all transitions, standardize to 150ms

### Phase 3: Polish (Nice to Have)

1. **Glass effects** - Backdrop blur on dialogs, popovers
2. **Contextual commands** - View-specific command palette items
3. **Vim navigation** - j/k navigation in lists

### Defer to Post-MVP

- Light mode refinement (focus on dark first)
- Performance-aware animation enhancement
- Theme variants (glass, etc.)
- Command history/recents

---

## Website-Specific Considerations

The marketing website requires slightly different treatment:

| Website Element  | Linear/Raycast Approach                                                 |
| ---------------- | ----------------------------------------------------------------------- |
| Hero section     | Dark background, minimal text, product screenshot prominently displayed |
| Typography       | Larger display text with gradient on key words                          |
| CTA buttons      | Single accent color, no gradient, subtle hover                          |
| Feature sections | Bento grid with screenshots, minimal descriptions                       |
| Navigation       | Fixed header, sparse links, command palette trigger                     |
| Footer           | Simple link columns, no decorations                                     |
| Animations       | Fade-up on scroll, staggered reveals                                    |
| Product demos    | Embedded app screenshots or video loops                                 |

### Remove from Current Website

- Warm background gradients
- Orange accent color
- Testimonials section (optional for dev tools)
- Heavy card hover effects
- Decorative grid patterns
- Art deco border elements

---

## Sources

- **Linear.app** - Direct analysis of homepage and features page (HIGH confidence)
- **Raycast.com** - Direct analysis of homepage design (HIGH confidence)
- **cmdk library** (pacocoursey/cmdk) - Official documentation via Context7 (HIGH confidence)
- **WebSearch** - Command palette patterns, dark mode best practices (MEDIUM confidence)

---

## Confidence Assessment

| Area               | Level  | Reason                                           |
| ------------------ | ------ | ------------------------------------------------ |
| Table Stakes       | HIGH   | Based on direct Linear/Raycast analysis          |
| Differentiators    | HIGH   | Based on actual implementation patterns observed |
| Anti-Features      | HIGH   | Clear contrast with current "Warm Modern" design |
| Component Patterns | HIGH   | cmdk documentation is comprehensive              |
| MVP Phases         | MEDIUM | Prioritization is opinion-based                  |

---

---

# Feature Research: SQL Pro v2.0 New Features

**Domain:** Database Client (Desktop Application)
**Researched:** 2026-01-29
**Confidence:** MEDIUM
**Focus:** SSH Tunnels, Table Tags, Saved Queries, AI Natural Language Query

## Executive Summary

This research covers four features that SQL Pro is missing compared to competitors like DB Pro and TablePlus. Each feature has established UX patterns in the database client ecosystem. SSH Tunnels and Saved Queries are table stakes for professional users. Table Tags is a moderate differentiator for organization. AI Natural Language Query is an emerging differentiator with significant complexity and security considerations.

---

## Feature 1: SSH Tunnels

### Table Stakes (Users Expect These)

| Feature                                           | Why Expected                                                                 | Complexity | Notes                                             |
| ------------------------------------------------- | ---------------------------------------------------------------------------- | ---------- | ------------------------------------------------- |
| Integrated SSH configuration in connection dialog | Users expect to configure SSH alongside database credentials, not separately | MEDIUM     | Single form with SSH tab/toggle                   |
| SSH toggle/checkbox activation                    | Clear "Use SSH Tunnel" or "Over SSH" option                                  | LOW        | Prominent placement in connection UI              |
| Password authentication                           | Basic SSH auth method everyone supports                                      | LOW        | Store in keychain like DB password                |
| Private key authentication                        | Power users expect key-based auth                                            | MEDIUM     | File picker + passphrase support                  |
| Automatic tunnel lifecycle management             | Tunnel starts/stops with connection                                          | MEDIUM     | No manual tunnel management required              |
| Test tunnel configuration                         | Verify SSH settings before full connection                                   | LOW        | "Test SSH" button separate from "Test Connection" |
| Localhost redirection                             | When tunnel active, DB connects to localhost:localPort                       | LOW        | Auto-configure or clearly document                |

### Differentiators (Competitive Advantage)

| Feature                               | Value Proposition                             | Complexity | Notes                                |
| ------------------------------------- | --------------------------------------------- | ---------- | ------------------------------------ |
| Jump server / bastion host support    | Enterprise users with multi-hop SSH needs     | HIGH       | DBeaver has this, TablePlus does not |
| SSH tunnel sharing across connections | Multiple DBs on same server share one tunnel  | MEDIUM     | DBeaver does this for efficiency     |
| SSH agent authentication              | Use system SSH agent for keys                 | MEDIUM     | Convenience for users with ssh-agent |
| Connection templates with SSH presets | Save SSH configs separately, reuse across DBs | MEDIUM     | Reduces repetitive configuration     |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature                              | Why Requested                | Why Problematic                  | Alternative                                      |
| ------------------------------------ | ---------------------------- | -------------------------------- | ------------------------------------------------ |
| Manual port forwarding configuration | Power users want control     | Confuses most users, error-prone | Auto-assign local ports, show in connection info |
| Persistent background tunnels        | "Keep tunnel alive" requests | Resource leak, security concern  | Tunnel lives only while connection active        |
| SSH config file import               | "Use my ~/.ssh/config"       | Complex parsing, edge cases      | Manual entry with clear UI                       |

### Implementation Notes

**Expected UX Flow:**

1. User opens connection dialog
2. Toggles "Use SSH Tunnel" checkbox/tab
3. Enters SSH host, port (default 22), username
4. Chooses auth method: Password or Private Key
5. If Private Key: file picker + optional passphrase
6. "Test SSH" button validates tunnel independently
7. Database host field accepts remote host (the tunnel handles forwarding)

**Technical Considerations:**

- Electron: Use `ssh2` npm package for SSH connections
- Store SSH passwords/passphrases in system keychain (already have password-storage.ts)
- Tunnel must be established before database connection attempt
- Handle tunnel failures gracefully with clear error messages

**Dependencies on Existing Features:**

- Connection profiles (already exists) - extend schema
- Password storage (already exists) - reuse for SSH credentials
- Connection dialog UI (already exists) - add SSH section

---

## Feature 2: Table Tags

### Table Stakes (Users Expect These)

| Feature                           | Why Expected                    | Complexity | Notes                              |
| --------------------------------- | ------------------------------- | ---------- | ---------------------------------- |
| Assign tags to tables             | Core functionality              | LOW        | Right-click menu or inline UI      |
| Multiple tags per table           | Flexible categorization         | LOW        | Tag picker with multi-select       |
| Filter sidebar by tag             | Find tagged tables quickly      | LOW        | Dropdown or chip filter in sidebar |
| Predefined color palette for tags | Visual distinction              | LOW        | 8-12 preset colors                 |
| Tag persistence across sessions   | Tags should survive app restart | LOW        | Store in local profile/settings    |

### Differentiators (Competitive Advantage)

| Feature                          | Value Proposition                           | Complexity | Notes                                       |
| -------------------------------- | ------------------------------------------- | ---------- | ------------------------------------------- |
| Smart tag suggestions            | Suggest tags based on table name patterns   | MEDIUM     | "users\_\*" tables auto-suggest "Users" tag |
| Tag-based grouping in sidebar    | Group tables by tag instead of alphabetical | MEDIUM     | Toggle between views                        |
| Tag search in command palette    | Cmd+K to find tables by tag                 | LOW        | Integrate with existing command palette     |
| Export/import tag configurations | Share organization across team              | LOW        | JSON export/import                          |
| Connection-scoped vs global tags | Some tags apply to all connections          | MEDIUM     | Tag scope selector                          |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature                             | Why Requested            | Why Problematic                            | Alternative                       |
| ----------------------------------- | ------------------------ | ------------------------------------------ | --------------------------------- |
| Hierarchical tag trees              | "I want folders of tags" | Over-engineering, complex UI               | Flat tags with search are simpler |
| Auto-sync tags to database comments | "Store in DB metadata"   | Requires write access, cross-DB complexity | Keep tags local to client         |
| Tag sharing via cloud sync          | "Team sees my tags"      | Requires cloud infrastructure, privacy     | Export/import JSON files          |

### Implementation Notes

**Expected UX Flow:**

1. Right-click table in sidebar -> "Add Tag"
2. Tag picker shows existing tags + "Create new tag" option
3. New tag: enter name, pick color
4. Tagged tables show colored dot/badge in sidebar
5. Filter dropdown at top of sidebar to show only tagged tables

**Data Model:**

```typescript
interface TableTag {
  id: string;
  name: string;
  color: string; // hex color
  connectionId?: string; // null = global tag
}

interface TableTagAssignment {
  tableId: string; // "schema.tablename"
  tagId: string;
  connectionId: string;
}
```

**Dependencies on Existing Features:**

- Sidebar table list (already exists) - add tag badges
- Local storage/store (already exists) - persist tags
- Command palette (already exists) - add tag search

---

## Feature 3: Saved Queries

### Table Stakes (Users Expect These)

| Feature                                 | Why Expected                               | Complexity | Notes                          |
| --------------------------------------- | ------------------------------------------ | ---------- | ------------------------------ |
| Save query from editor                  | Right-click or Cmd+S to save current query | LOW        | Name + optional description    |
| Favorites/saved queries list in sidebar | Dedicated section for saved queries        | LOW        | Collapsible sidebar section    |
| Run saved query                         | Execute directly from list                 | LOW        | Double-click or context menu   |
| Insert saved query into editor          | Copy into current editor tab               | LOW        | Context menu option            |
| Edit saved query                        | Modify name, content                       | LOW        | Opens in editor or inline edit |
| Delete saved query                      | Remove from list                           | LOW        | Context menu with confirmation |
| Query naming                            | Descriptive names for findability          | LOW        | Required field on save         |

### Differentiators (Competitive Advantage)

| Feature                       | Value Proposition                      | Complexity | Notes                                  |
| ----------------------------- | -------------------------------------- | ---------- | -------------------------------------- |
| Keyword binding (snippets)    | Type keyword + Enter to insert query   | MEDIUM     | TablePlus has this, very popular       |
| Query parameters/placeholders | `{{user_id}}` prompts for value on run | MEDIUM     | Enables reusable parameterized queries |
| Organize into folders         | Group related queries                  | LOW        | Simple folder structure                |
| Tag saved queries             | Consistent with table tags feature     | LOW        | Reuse tag system                       |
| Search saved queries          | Find by name or content                | LOW        | Filter input in sidebar                |
| Export as .sql file           | Save to filesystem                     | LOW        | Standard file export                   |
| Import .sql files             | Load external queries                  | LOW        | File picker                            |
| Query sharing URL             | Share query via link                   | HIGH       | Requires cloud infrastructure          |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature                         | Why Requested                   | Why Problematic           | Alternative                                |
| ------------------------------- | ------------------------------- | ------------------------- | ------------------------------------------ |
| Auto-save all executed queries  | "Save everything automatically" | Clutter, storage bloat    | Query history is separate (already exists) |
| Version history per saved query | "Track changes over time"       | Complex, storage overhead | Git-based workflow for teams               |
| Collaborative real-time editing | "Edit together"                 | Massive complexity        | Export/import for sharing                  |

### Implementation Notes

**Expected UX Flow:**

1. Write query in editor
2. Cmd+S or right-click -> "Save to Favorites"
3. Dialog: Enter name, optional description, optional keyword binding
4. Query appears in "Saved Queries" sidebar section
5. Double-click to run, or right-click for options

**Data Model:**

```typescript
interface SavedQuery {
  id: string;
  name: string;
  description?: string;
  sql: string;
  keyword?: string; // for snippet expansion
  folderId?: string;
  tags?: string[];
  connectionId?: string; // null = available in all connections
  createdAt: Date;
  updatedAt: Date;
}
```

**Dependencies on Existing Features:**

- Query editor (already exists) - add save action
- Query history (already exists) - "Save to Favorites" from history
- Sidebar (already exists) - add Saved Queries section
- Command palette (already exists) - search saved queries

---

## Feature 4: AI Natural Language Query

### Table Stakes (Users Expect These)

| Feature                      | Why Expected                               | Complexity | Notes                           |
| ---------------------------- | ------------------------------------------ | ---------- | ------------------------------- |
| Natural language input field | Text box to type question                  | LOW        | Separate from SQL editor        |
| Schema-aware SQL generation  | AI knows table/column names                | MEDIUM     | Send schema metadata to LLM     |
| Generated SQL preview        | Show SQL before execution                  | LOW        | Critical for trust and learning |
| Edit generated SQL           | User can modify before running             | LOW        | Insert into editor for tweaking |
| Explain what query does      | Plain English explanation of generated SQL | MEDIUM     | Helps users learn SQL           |

### Differentiators (Competitive Advantage)

| Feature                            | Value Proposition                                  | Complexity | Notes                                   |
| ---------------------------------- | -------------------------------------------------- | ---------- | --------------------------------------- |
| Query suggestions based on schema  | "Try asking: How many users signed up last month?" | MEDIUM     | Contextual prompts                      |
| Conversation history               | Follow-up questions refine query                   | MEDIUM     | "Now filter by active users only"       |
| Learn from corrections             | User edits improve future generations              | HIGH       | Requires feedback loop                  |
| Semantic layer / business glossary | Define "active user" = users.last_login > 30 days  | HIGH       | Enterprise feature                      |
| Offline/local LLM option           | Privacy-conscious users                            | HIGH       | Run local model, significant complexity |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature                                       | Why Requested                | Why Problematic                                  | Alternative                                     |
| --------------------------------------------- | ---------------------------- | ------------------------------------------------ | ----------------------------------------------- |
| Auto-execute generated SQL                    | "Just run it"                | Security risk, incorrect queries can damage data | Always require user confirmation                |
| Send actual data to LLM                       | "Analyze my data with AI"    | Privacy violation, data leak risk                | Only send schema, never row data                |
| AI-generated DDL/DML (CREATE, UPDATE, DELETE) | "AI should manage my schema" | Extremely dangerous, data loss risk              | Read-only SELECT queries only                   |
| Unlimited query complexity                    | "AI can write any query"     | LLMs produce incorrect SQL 20%+ of the time      | Warn on complex queries, suggest simplification |

### Implementation Notes

**Security Requirements (CRITICAL):**

1. **Never send actual data to LLM** - only schema metadata
2. **SELECT only** - do not generate INSERT, UPDATE, DELETE, DROP
3. **User must confirm** - always show generated SQL before execution
4. **Read-only mode recommended** - suggest read-only connection for AI queries
5. **Query validation** - parse and validate SQL before allowing execution
6. **Timeout limits** - prevent runaway queries

**Expected UX Flow:**

1. User clicks "Ask AI" button or opens AI panel
2. Types natural language question: "How many orders were placed last week?"
3. App sends schema (table names, column names, types) + question to LLM API
4. LLM returns SQL query
5. App displays: Generated SQL + Plain English explanation
6. User clicks "Run" to execute, or "Edit" to modify first
7. Results display in normal results panel

**LLM API Options:**

- OpenAI API (GPT-4)
- Anthropic API (Claude)
- Local models via Ollama (privacy-focused option)

**Data sent to LLM:**

```typescript
interface SchemaContext {
  tables: {
    name: string;
    columns: { name: string; type: string; nullable: boolean }[];
  }[];
  // NO actual row data
}
```

**Dependencies on Existing Features:**

- Schema introspection (already exists) - extract table/column metadata
- Query editor (already exists) - insert generated SQL
- Query execution (already exists) - run the result
- Settings (already exists) - API key configuration

**Complexity Assessment:** HIGH

- Requires LLM API integration
- Security considerations are significant
- Error handling for incorrect SQL
- User trust/transparency is critical

---

## Feature Dependencies

```
[SSH Tunnels]
    └──extends──> [Connection Profiles] (existing)
    └──uses──> [Password Storage] (existing)

[Table Tags]
    └──enhances──> [Sidebar Table List] (existing)
    └──integrates──> [Command Palette] (existing)

[Saved Queries]
    └──extends──> [Query Editor] (existing)
    └──similar-to──> [Query History] (existing)
    └──integrates──> [Command Palette] (existing)
    └──can-use──> [Table Tags] (new - if built first)

[AI Natural Language Query]
    └──requires──> [Schema Introspection] (existing)
    └──uses──> [Query Editor] (existing)
    └──uses──> [Query Execution] (existing)
    └──optional──> [Saved Queries] (new - save AI-generated queries)
```

### Dependency Notes

- **SSH Tunnels** is independent, can be built anytime
- **Table Tags** is independent, foundational for organization
- **Saved Queries** benefits from Table Tags (can tag queries)
- **AI NLQ** should be built last (benefits from saved queries for storing good generations)

---

## Feature Prioritization Matrix

| Feature                   | User Value | Implementation Cost | Risk   | Priority |
| ------------------------- | ---------- | ------------------- | ------ | -------- |
| SSH Tunnels               | HIGH       | MEDIUM              | LOW    | P1       |
| Saved Queries             | HIGH       | LOW                 | LOW    | P1       |
| Table Tags                | MEDIUM     | LOW                 | LOW    | P2       |
| AI Natural Language Query | HIGH       | HIGH                | MEDIUM | P2       |

**Priority Rationale:**

- **P1 - SSH Tunnels:** Table stakes for enterprise/professional users. Many databases are behind SSH. Missing this blocks adoption.
- **P1 - Saved Queries:** Table stakes feature. TablePlus, DBeaver, every competitor has this. Relatively simple to implement.
- **P2 - Table Tags:** Nice organization feature but not blocking. Lower urgency than connectivity and query management.
- **P2 - AI NLQ:** High user value and differentiator, but high complexity and security considerations. Build after core features are solid.

---

## Competitor Feature Analysis

| Feature       | TablePlus                        | DBeaver                                  | DB Pro     | Our Approach                                                |
| ------------- | -------------------------------- | ---------------------------------------- | ---------- | ----------------------------------------------------------- |
| SSH Tunnels   | Integrated, auto-managed         | Integrated, tunnel sharing, jump servers | Integrated | Integrated with test button, start with password + key auth |
| Saved Queries | "Favorites" with keyword binding | Projects + Scripts, Query Manager        | Favorites  | Favorites with folders, keyword snippets, tags              |
| Table Tags    | Not native (requested feature)   | Bookmarks for objects                    | Tags       | Full tagging with colors, filtering, grouping               |
| AI NLQ        | Not available                    | Not native                               | Available  | Schema-aware, SELECT-only, always preview                   |

---

## v2.0 MVP Definition

### v2.0 Launch With

- [x] **SSH Tunnels** - Password + Private Key auth, integrated in connection dialog
- [x] **Saved Queries** - Save, name, organize, run from sidebar
- [x] **Table Tags** - Assign tags, filter sidebar, colored badges

### v2.1 Add After Validation

- [ ] **AI Natural Language Query** - Basic implementation with OpenAI
- [ ] **SSH Jump Servers** - Based on user demand
- [ ] **Query Parameters/Placeholders** - `{{variable}}` syntax

### Future Consideration (v2.x+)

- [ ] **AI Conversation History** - Multi-turn query refinement
- [ ] **Local LLM Support** - Ollama integration for privacy
- [ ] **Tag Cloud Sync** - Team tag sharing

---

## Sources

### SSH Tunnels

- [TablePlus SSH Documentation](https://tableplus.com) - Integrated SSH configuration patterns
- [DBeaver SSH Tunnel Guide](https://dbeaver.com) - Tunnel sharing, jump server support
- [Stack Overflow SSH Tunnel Discussions](https://stackoverflow.com) - Community patterns

### Saved Queries

- [TablePlus Favorites Feature](https://tableplus.com) - Keyword binding, favorites management
- [DBeaver Query Manager](https://dbeaver.com) - Query history, projects, bookmarks
- [Sherloq Data Best Practices](https://sherloqdata.io) - Saved queries implementation patterns

### AI Natural Language Query

- [Amazon Bedrock Knowledge Bases](https://amazon.com) - NL to SQL for Redshift
- [Querio AI](https://querio.ai) - Conversational analytics platform
- [arXiv Security Research](https://arxiv.org) - Text-to-SQL security vulnerabilities
- [AI Multiple LLM Risks](https://aimultiple.com) - Prompt injection, data privacy

### Table Tags / Organization

- [Eleken UX Patterns](https://eleken.co) - Data table tagging UX
- [UX Design CC](https://uxdesign.cc) - Table organization patterns
- [UX StackExchange](https://stackexchange.com) - Tag UI discussions

---

_Feature research for: SQL Pro v2.0_
_Researched: 2026-01-29_
_Confidence: MEDIUM - Based on WebSearch findings verified against multiple sources_
