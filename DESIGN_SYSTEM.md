# Food Discovery & Recipe Assistant — UI Design System

**Status:** Approved working visual direction  
**Platform:** Mobile app (React Native + Expo)  
**Last updated:** October 24, 2026  
**Scope:** Visual design, reusable UI patterns, and interaction behavior. This is **not** the backend/system architecture specification.

## 1. Design direction

Build a playful, premium, iOS-inspired Philippine food discovery and recipe experience. Favor **food imagery, clear icons, bold titles, and short labels** over paragraphs. Use colorful editorial cards, generous whitespace, soft rounded shapes, and subtle interactions.

**Core principles**

1. **One primary brand/action color:** Fresh Sprout Green. Supporting accent colors create variety, not competing calls to action.
2. **Show, then reveal:** Cards contain a photo, title, and at most a few useful details. More information appears after tapping.
3. **Food first:** Use high-quality realistic photos of the actual dish. 3D illustrations are selective accents, not substitutes for food photography.
4. **Consistent icons:** Solar Icons, **Bold** style, with recognizable semantics and accessible labels.
5. **iOS-inspired, not iOS-exclusive:** Compact floating bottom navigation, comfortable tap targets, safe-area awareness, smooth but restrained transitions.

## 2. Color tokens

### Approved palette

| Token                     | Hex       | Purpose                                              |
| ------------------------- | --------- | ---------------------------------------------------- |
| `color.brand.primary`     | `#65C35A` | Primary CTA, emphasis, selected controls             |
| `color.brand.deep`        | `#287B36` | Text links, navigation accents, dark-green icon/text |
| `color.accent.periwinkle` | `#9FAAF2` | Editorial featured areas and expressive sections     |
| `color.accent.lime`       | `#B2FA83` | Nutrition and highlight tiles                        |
| `color.accent.peach`      | `#FFBC83` | Secondary highlight and category tiles               |
| `color.text.primary`      | `#202638` | Primary titles/body text (blue charcoal)             |

### Supporting surface colors (working implementation tokens)

These are supporting neutrals/tints rather than additional brand primaries. Adjust gently for legibility in actual device previews.

| Token                          | Value     | Purpose                              |
| ------------------------------ | --------- | ------------------------------------ |
| `color.surface.base`           | `#FFFFFF` | Main screen/card background          |
| `color.surface.soft`           | `#F4F5F8` | Search field, subtle cards           |
| `color.surface.nav`            | `#FAFAFC` | Bottom navigation surface            |
| `color.surface.periwinkleTint` | `#D0CAFC` | Soft featured-card background        |
| `color.surface.limeTint`       | `#E5F8D9` | Soft green secondary cards           |
| `color.surface.peachTint`      | `#FFE2CC` | Soft peach secondary cards           |
| `color.surface.activeTab`      | `#E8E4FC` | Soft-lavender selected tab circle    |
| `color.text.secondary`         | `#626978` | Supporting descriptions and metadata |
| `color.border.subtle`          | `#EBEDF0` | Minimal dividers/borders             |

### Application rules

- **Green is the single primary action color.** Avoid making periwinkle, lime, or peach alternative primary CTAs.
- Use periwinkle prominently for **selected full-card featured sections** with **blue-charcoal text**.
- Prefer text in `#202638` over very light accent backgrounds.
- Use `#287B36`, not fresh green, for smaller text links on white when stronger contrast is needed.
- Favor white/soft neutral space around expressive cards. Not every card needs a different background.
- Do not rely on color alone to convey selection, status, or errors.
- Validate text/icon contrast against WCAG guidance before implementation; adjust semantic foreground tokens rather than changing the approved brand palette.

## 3. Typography

**Font family: Poppins** (approved). Use consistent weights and avoid mixing multiple display families.

| Token               | Suggested size | Weight  | Usage                           |
| ------------------- | -------------: | ------- | ------------------------------- |
| `type.screenTitle`  |       28–32 sp | 700–800 | Explore Recipes, Quick & Easy   |
| `type.featureTitle` |       24–28 sp | 700     | Featured recipe headline        |
| `type.cardTitle`    |       18–20 sp | 700     | Standard recipe title           |
| `type.sectionTitle` |       18–20 sp | 700     | Popular Recipes, Categories     |
| `type.label`        |       14–16 sp | 600     | Buttons, category labels        |
| `type.body`         |          16 sp | 400     | Recipe detail body/instructions |
| `type.meta`         |       12–14 sp | 500–600 | Time, difficulty, category      |

**Text rules**

- Recipe-list cards: **title + short metadata only**. Keep title to roughly two lines; handle overflow gracefully.
- Avoid descriptive paragraphs on small recipe cards.
- Longer introductions, ingredient lists, and cooking instructions belong on detail screens or after tapping an action.
- Respect device font scaling; do not truncate critical directions or controls at larger accessibility text sizes.

## 4. Icons and imagery

### Icon library

- **Approved source:** [Solar Icons](https://solar-icons.dev/icons?style=bold), **Bold** style.
- Keep icon size consistent: typically **20–24 dp** for navigation/action icons; smaller metadata icons only when still readable.
- Keep strokes/shapes visually consistent with the selected Solar family; do not mix unrelated icon libraries in finished screens.
- Active/selected icons may use a filled visual state. For unselected states, use the closest consistent Solar equivalent and a neutral tone.
- For icon-only buttons, provide an accessibility label and sufficient touch target.
- Exact icon identifiers depend on the selected Solar package: verify names during implementation rather than assuming that generic preview icon names match the library.

### Image treatment

- **Recipes:** Realistic, appetizing, dish-accurate photographs. Maintain consistent crops/ratios in repeated card sets.
- **Onboarding / empty states:** A small number of playful 3D food or chef illustrations.
- **Categories:** Small food images/illustrations or icons with concise labels.
- Use smooth rounded image corners and readable overlays. Avoid text over visually noisy images without a scrim/pill.
- If a photo is missing, provide a deliberate neutral placeholder; do not display an unrelated food photo as though it were the recipe.

## 5. Layout and spacing

**Approved direction:** Editorial stacked layout; one expressive featured card, then cleaner supporting cards.

### Proposed scale (implementation defaults)

| Token            |    Value | Example                              |
| ---------------- | -------: | ------------------------------------ |
| `space.1`        |     4 dp | Icon/text micro gap                  |
| `space.2`        |     8 dp | Metadata gap                         |
| `space.3`        |    12 dp | Small card padding                   |
| `space.4`        |    16 dp | Standard card padding / screen inset |
| `space.5`        |    20 dp | Between card groups                  |
| `space.6`        |    24 dp | Section spacing                      |
| `radius.pill`    |   999 dp | Navigation, badge, category chip     |
| `radius.image`   |    16 dp | Food images                          |
| `radius.card`    |    24 dp | Standard cards                       |
| `radius.feature` | 28–32 dp | Hero feature cards                   |

Use a compact vertical rhythm without crowding. Two-column cards are appropriate for browse lists on typical phones; allow a single column on narrow layouts/large font settings.

## 6. Reusable components

### 6.1 `RecipeImage` — important approved placement rule

For **every standard recipe image**:

- Image fills a rounded image container.
- **Favorite heart:** circular control **absolutely positioned at the top-right corner INSIDE the image**.
- **Cooking time:** small readable pill such as `15 min`, **absolutely positioned at the bottom-right corner INSIDE the image**.
- Overlays must have padding from the image edge (suggested **8–12 dp**).
- Time pill: dark blue-charcoal, semi-opaque background with a clock icon and white text.
- Heart button: light/white circular surface, with distinguishable saved and unsaved states.
- Overlay controls must remain usable and readable over every photograph.
- Tapping the **heart** toggles saved state **without opening** the recipe; tapping the **rest of the card** opens details.
- Do **not** put the cooking-time label under the image when it is already displayed on the photo.

**Placement schematic:**

```text
┌────────────────────────────────┐
│                         (♡)    │  ← top-right, on image
│                                │
│          FOOD PHOTO            │
│                                │
│                    [◷ 15 min]  │  ← bottom-right, on image
└────────────────────────────────┘
Chicken Inasal                         ← title below image
```

Use relative positioning on the image wrapper with absolutely positioned controls in React Native; keep each overlay above the image layer and within its rounded bounds.

### 6.2 `FeaturedRecipeCard`

- Editorial full-card periwinkle or approved soft accent surface.
- Large food image, prominent Poppins title, short metadata, optional primary green CTA.
- Heart top-right **of the recipe image**, and time badge bottom-right **of the recipe image**. For collaged artwork, define a clear image region so overlays never float ambiguously over the card background.
- Very limited copy; no full recipe descriptions.

### 6.3 `StandardRecipeCard`

- Food image, heart/time overlays as above, bold title underneath.
- Optional one compact category/attribute line such as `Easy` or `Healthy`.
- White/neutral or lightly tinted background, generous image prominence.
- Reuse in horizontal carousels, browse grids, and saved/history lists.

### 6.4 `CategoryItem`

- Small circular visual or icon, color-tinted surface, one short label.
- Selection is visibly marked beyond color alone when feasible.
- Avoid text-heavy category descriptions.

### 6.5 `StatTile`

- Use in recipe detail, not everywhere on the home feed.
- One icon, key number/value, and short label: e.g. `570 kcal` / `Calories`, or `10` / `Ingredients`.
- Use lime and periwinkle selectively for contrast and visual interest.
- Values are illustrative until sourced from actual recipe data.

### 6.6 `SearchField` and `PrimaryButton`

- Search field: soft neutral pill with leading search icon and concise placeholder.
- Primary action: Fresh Sprout background with a readable foreground color confirmed by contrast testing; full-height comfortable touch target.
- Secondary actions should use outlined/neutral treatments, not a second saturated primary color.

## 7. Compact iOS-inspired bottom navigation

**Approved reference behavior:** five **icon-only** tabs in a **compact white floating rounded bar**, resembling the supplied iOS navigation inspiration.

### Visual specification

- **Five evenly spaced icons**, no permanent text labels in the visual UI.
- White / `#FAFAFC` softly elevated rounded container; restrained shadow and subtle border.
- **Active icon inside a small soft-lavender circular highlight** (`#E8E4FC`).
- Active icon may use Deep Sprout (`#287B36`); inactive icons are neutral gray.
- Do **not** use the earlier green expanding tab/pill treatment.
- The bar floats just above the phone's bottom safe area; **do not draw a duplicate iOS home indicator**.
- Use Solar Bold icons (verify appropriate variants/names when coding).
- Aim for at least **44 × 44 dp** touch targets even when the visual icon/circle is smaller.

### Working tab labels and routes

These names are for product/engineering clarity; user-facing tabs remain icon-only:

| Order | Tab      | Intent                                |
| ----: | -------- | ------------------------------------- |
|     1 | Home     | Main recipe feed and featured content |
|     2 | Search   | Search recipes and filters            |
|     3 | Discover | Explore categories / collections      |
|     4 | History  | Recently viewed recipes               |
|     5 | Profile  | Personal cooking space and settings   |

**Note:** This is the current visual prototype's tab structure. Align actual route names and final tab responsibilities with the product requirements before coding; do not invent missing product features.

### Screen behavior

- On a detail screen, use an obvious back action. Decide during implementation whether the floating bar stays visible or is hidden for focused reading/cooking mode; avoid covering instructions or a primary CTA.
- Preserve active-tab state when navigating within a tab's stack.
- Avoid translucent effects that reduce icon contrast; a convincing flat/frosted approximation is preferable to heavy blur.

## 8. Motion and feedback

**Approved intensity: subtle.** Motion supports recognition and continuity, not decoration.

| Interaction       | Proposed behavior                                          |
| ----------------- | ---------------------------------------------------------- |
| Tab switch        | Smooth selected-circle / color transition, ~180–220 ms     |
| Heart save        | Quick fill/color transition with restrained scale feedback |
| Card tap          | Light press feedback, then navigate to details             |
| Screen transition | Native-feeling short push/fade depending on navigator      |
| Image loading     | Quiet skeleton/placeholder; no excessive shimmer           |

- Avoid large bounces, dramatic zooms, excessive parallax, or animation on every card.
- Honor OS **Reduce Motion** settings and provide near-instant transitions when requested.
- Use native driver / performant animation strategy where possible.

## 9. Page composition

### Home

1. Compact greeting / title and optional utility action.
2. Search entry point.
3. Small visual categories.
4. **One expressive featured recipe card**.
5. Supporting list or two-column cards (`Quick & Easy`, `Popular Recipes`, etc.).
6. Floating five-icon navigation.

### Search / browse

- Minimal title, search/filter controls, visual two-column recipe grid.
- Each card uses the **same heart-top-right/time-bottom-right image overlays**.
- Empty and loading states stay concise and visually consistent.

### Recipe detail

- Large hero image with heart top-right and cooking-time pill bottom-right **inside image**.
- Recipe title, compact rating/attributes if actually available.
- One row of colored stat tiles (as appropriate to the recipe data).
- Ingredient list and cooking instructions **after opening the recipe**; support clear scrolling and legible text.
- Keep navigation and key actions accessible without covering the content.

### Saved / history / profile

- Reuse standard recipe cards and established surface styles.
- Use selective 3D illustrations for empty states; use minimal guidance and a clear action to discover recipes.

## 10. Accessibility, localization, and edge cases

- Make all icon-only controls accessible by name (e.g. `Home`, `Search`, `Save Chicken Inasal`, `Back`).
- Maintain touch targets of approximately **44 × 44 dp or larger**; provide sufficient separation.
- Support Android as well as iOS, including platform back behavior and safe areas.
- Respect device text scaling and long recipe names; avoid overlapping heart/time overlays.
- Prefer concise readable metadata and avoid duplicating the same information on an image and underneath.
- Support loading, empty, error, long-text, and offline/error-image states as product functionality requires.
- Use accurate dish names and appropriate Filipino food imagery; avoid placeholder values being mistaken for verified nutritional information or cooking estimates.

## 11. Component / token implementation guidance

When implementation begins:

- Centralize tokens (colors, typography, spacing, radii, shadows, motion durations) rather than hardcoding in every screen.
- Build `RecipeImage` first; reuse it within `FeaturedRecipeCard`, `StandardRecipeCard`, and the recipe-detail hero to guarantee overlay consistency.
- Keep navigation styles in a shared theme/component.
- Install/configure Poppins fonts and the chosen Solar icon distribution compatible with the React Native project; verify actual icon names and licenses.
- Test layouts on small Android phones and modern iPhones, light mode, enlarged text, and Reduce Motion.
- This document does not choose state management, backend APIs, data models, caching, or deployment; those belong to a separate engineering architecture document. Backend for the project is **Kotlin Ktor**.

## 12. Approved decisions and remaining boundaries

### Approved

- Fresh Sprout Green `#65C35A` as **the single primary color**.
- Deep Sprout `#287B36` for navigation/link emphasis.
- Bright Periwinkle `#9FAAF2`, Soft Lime `#B2FA83`, Soft Peach `#FFBC83` as expressive supporting colors.
- Blue Charcoal `#202638` primary text.
- Poppins typography; bold headings and compact titles.
- Solar **Bold** icon library, with clear selected states.
- Realistic food photography + selective 3D illustrations.
- Editorial rounded cards, image-led and low-text; details revealed after tapping.
- Compact iOS-inspired **five-icon-only floating bottom navigation**, soft-lavender active-circle treatment.
- **Subtle** motion.
- **Time pill bottom-right inside food image; heart top-right inside food image.**

### Not yet fixed by these approvals

- Pixel-perfect screen artwork, every route and destination, final image library, typography line-height, exact shadow/blur implementation, responsive breakpoints, API/data wiring, dark-mode palette, and complete engineering architecture.
- All example dishes, durations, nutrition facts, ratings, and sample profile content in design previews are **mock content** unless separately confirmed by product data.

**Design review discipline:** Limit a design topic to five rounds of brainstorming/refinement; proceed after approval rather than reopening settled decisions. Continue using visual previews and concise explanations for feedback.
