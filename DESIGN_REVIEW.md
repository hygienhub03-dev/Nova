# Nova App — Professional Design Review

## Design Principles Applied (8 Core Principles)

### 1. Contrast
**Problem:** Early Nova had low-contrast user bubbles (rgba(59,130,246,0.3)) that blended into the dark background, making it hard to distinguish user messages from AI responses.

**Fix:** User bubbles now use solid `#3b82f6` with subtle shadow, while AI bubbles use `rgba(255,255,255,0.12)`. Timestamps added at 30% opacity for subtle secondary information. CTAs use `#3b82f6` primary against `#000000` background for maximum clickability.

### 2. Hierarchy
**Problem:** Original HomeScreen had no clear visual hierarchy — greeting text, orb, messages, and input all competed for equal attention.

**Fix:** Three-tier hierarchy established:
- **Tier 1 (Primary):** Nova title + greeting text (#000000 background)
- **Tier 2 (Secondary):** Smart Home widget, proactive suggestion cards (muted backgrounds)
- **Tier 3 (Tertiary):** Chat messages (glass-morphism bubbles)

SettingsScreen sections are ordered: Audio/Tech → Model Selection → Privacy → Danger Zone (least important last).

### 3. Alignment
**Problem:** Inconsistent padding across screens (some used 16px, some 20px, some 24px). Alignment was ad-hoc.

**Fix:** All screens now use `spacing.lg` (16px) as the base horizontal padding. Input fields, cards, and buttons align to the same left/right margins. The top bar uses `paddingHorizontal: 16` consistently. All card padding uses `spacing.lg` (14px → updated to 16px).

### 4. Proximity
**Problem:** Related elements were spread too far apart; unrelated elements were crammed together.

**Fix:**
- Settings rows grouped with 8px vertical padding and subtle border dividers
- Section titles are 16px above their first element (not 24px)
- Action buttons grouped closely together with 12px gap
- Message bubbles have 8px between them (not 12px) for tighter, more readable conversation flow

### 5. Repetition (Consistency)
**Problem:** Inconsistent border radius (some 10px, some 12px, some 18px), inconsistent font sizes, inconsistent colors.

**Fix:** Design tokens system created:
- **Border radius:** `sm(6)`, `md(10)`, `lg(14)`, `xl(18)`, `full(9999)` — used consistently
- **Typography:** System font family, defined size scale (xs→xxxxl)
- **Colors:** Single source of truth via `colors` token — primary `#3b82f6`, accent `#f59e0b`, danger `#ef4444`
- **Spacing:** 9-step scale from `xs(4)` to `xxxxxxxl(64)`
- **Shadows:** Consistent shadow system (sm/md/lg/xl)

### 6. Balance
**Problem:** HomeScreen was top-heavy with the orb taking 150px of vertical space, while the chat area was crammed.

**Fix:** Asymmetrical balance achieved:
- Orb occupies controlled vertical space (shrinking from 200px → 150px → 120px on processing)
- Smart Home widget provides visual weight at the top (below greeting)
- Proactive suggestion cards create horizontal balance
- Chat area expands to fill remaining space naturally

### 7. White Space (Negative Space)
**Problem:** Original Design was cluttered — input field overlapped content, no breathing room between sections, messages were too dense.

**Fix:**
- `spacing.md` (12px) between message bubbles (reduced from 12px→8px for tighter conversation but `spacing.lg` sections for sections)
- Content padding uses `spacing.xl` (20px) on all screens
- Settings sections have 16px internal padding with 32px between sections
- Input area has 30px bottom padding for comfortable typing
- Proactive suggestion cards have 8px vertical padding with 16px horizontal margins

### 8. Unity
**Problem:** Different screens felt like different apps — Settings used blue accent while HomeScreen used no consistent identity.

**Fix:** Theme system created that binds all screens together:
- **Dark theme:** `#000000` base → `#0a1628` → `#1e3a5f` gradient is the only gradient used
- **Accent color:** `#3b82f6` (blue) is the sole interactive accent; `#f59e0b` (amber) is the only secondary accent
- **Typography:** System font throughout, consistent weight system
- **Shape language:** All interactive elements use `borderRadius.md` (10px), cards use `borderRadius.lg` (14px), buttons use `borderRadius.md` (12px)
- **Glass-morphism:** `rgba(255,255,255,0.05)` for cards and inputs — consistent across all screens
- **Icon style:** Emoji-based for quick recognition, text-based for labels

## Design Token System

```
src/theme/design-tokens.ts
├── colors      — 30+ named colors (primary, accent, danger, success, glass, etc.)
├── spacing     — 11-step scale (xs:4 → xxxxxxxl:64)
├── borderRadius — 7 values (sm:6 → full:9999)
├── typography  — font families, sizes (xs:10 → xxxxxl:36), weights (regular→extrabold)
├── shadows     — 4 levels (sm→xl) with iOS elevation values
├── transitions — 4 timing curves (fast→slow, spring)
└── layout      — constants for max-width, padding, heights, border radii
```

## Anti-Patterns Avoided (From the Blog Post)

| V1 (Utilitarian) | V2 (Professional) |
|---|---|
| `rgba(59,130,246,0.3)` user bubble | Solid `#3b82f6` with shadow — clear focal point |
| `rgba(255,255,255,0.1)` AI bubble with faint text | `rgba(255,255,255,0.12)` with readable `#e0e0e0` text |
| No message timestamps | Subtle timestamps for message ordering context |
| Inconsistent border radius across components | Single `borderRadius` token system |
| Hardcoded color values everywhere | All colors from `design-tokens.ts` |
| No visual hierarchy between sections | Three-tier hierarchy per screen |
| No white space discipline | Systematic spacing token usage |
| UI looks like a template | Unified dark theme with consistent language |

## How to Continue Polishing

1. **Audit with the 8 principles** — Run through Contrast, Hierarchy, Alignment, Proximity, Repetition, Balance, White Space, Unity for every new screen
2. **Use design tokens** — Never hardcode a color, spacing value, or border radius in a component
3. **Screenshot compare** — Take screenshots before/after each change and compare against the principles
4. **AI design critique** — Before committing UI changes, screenshot the result and ask:
   - "Does this have enough contrast between primary and secondary elements?"
   - "Is the hierarchy clear? Can I tell what's most important?"
   - "Is the alignment consistent across this screen?"
   - "Are related items grouped with proper proximity?"

## Files Modified
- `src/theme/design-tokens.ts` — New design token system
- `src/theme/ThemeProvider.tsx` — React context for theme access
- `src/components/MessageBubble.tsx` — Contrast, hierarchy, white space improvements
- `src/screens/SettingsScreen.tsx` — Alignment, proximity, token usage
- `src/screens/HomeScreen.tsx` — Hierarchy improvements (Smart Home widget, proactive cards)

## Files Created
- `DESIGN_REVIEW.md` — This document
- `src/theme/design-tokens.ts` — Design tokens
- `src/theme/ThemeProvider.tsx` — Theme context provider