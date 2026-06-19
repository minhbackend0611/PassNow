---
name: PassNow Core
colors:
  surface: '#f4fcf0'
  surface-dim: '#d5dcd1'
  surface-bright: '#f4fcf0'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff6ea'
  surface-container: '#e9f0e5'
  surface-container-high: '#e3eadf'
  surface-container-highest: '#dde5d9'
  on-surface: '#171d16'
  on-surface-variant: '#3e4a3d'
  inverse-surface: '#2b322b'
  inverse-on-surface: '#ecf3e7'
  outline: '#6e7b6c'
  outline-variant: '#bdcaba'
  surface-tint: '#006e2d'
  primary: '#006b2c'
  on-primary: '#ffffff'
  primary-container: '#00873a'
  on-primary-container: '#f7fff2'
  inverse-primary: '#62df7d'
  secondary: '#855300'
  on-secondary: '#ffffff'
  secondary-container: '#fea619'
  on-secondary-container: '#684000'
  tertiary: '#a72d51'
  on-tertiary: '#ffffff'
  tertiary-container: '#c74668'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#7ffc97'
  primary-fixed-dim: '#62df7d'
  on-primary-fixed: '#002109'
  on-primary-fixed-variant: '#005320'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#ffd9de'
  tertiary-fixed-dim: '#ffb2bf'
  on-tertiary-fixed: '#3f0016'
  on-tertiary-fixed-variant: '#8a143c'
  background: '#f4fcf0'
  on-background: '#171d16'
  surface-variant: '#dde5d9'
typography:
  headline-xl:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.01em
  headline-lg:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 1.5rem
  margin-mobile: 1rem
  stack-xs: 0.25rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 2rem
---

## Brand & Style
The design system is built on the pillars of **sustainability, community trust, and academic vitality**. It targets university students who value environmental consciousness as much as fiscal practicality. The visual direction follows a **Corporate-Modern** aesthetic with a **Tactile** edge—utilizing generous whitespace and soft depth to create an approachable, high-integrity marketplace environment.

The UI should feel "fresh" and "light," avoiding the cluttered feel of traditional classified sites. By using crisp edges and organic roundedness, the system evokes a sense of reliability and modern efficiency, encouraging students to participate in a circular campus economy.

## Colors
The palette is anchored by **Sustainability Green** (#16A34A), used for primary actions and trust-building elements. **Amber Gold** (#F59E0B) serves as the accent for energetic calls-to-action (CTAs) like "Post an Item" or "Buy Now," ensuring they stand out against the clean background.

The neutral scale relies on a cool **Gray-50** for surfaces to maintain a breathable layout, while **Gray-900** provides high-contrast legibility for body text. All semantic colors (Success, Error, Warning) follow standard accessible contrasts to ensure the marketplace is usable by all students.

## Typography
This design system utilizes **Inter** across all levels to maintain a systematic, utilitarian, and modern feel. The hierarchy is strictly enforced through weight variations rather than excessive size changes to keep the interface compact for data-heavy listing screens.

- **Headlines:** Use Semi-Bold (600) and Bold (700) with slight negative letter-spacing for a premium, editorial feel.
- **Body:** Regular (400) for long-form descriptions to ensure maximum readability.
- **Labels:** Medium (500) or Semi-Bold (600) for tags (location, condition) and metadata to differentiate from interactive text.

## Layout & Spacing
The layout employs a **Fluid Grid** system that transitions from a 4-column grid on mobile to a 12-column grid on desktop. 

- **Grid System:** 24px (1.5rem) gutters facilitate clear separation between product cards.
- **Rhythm:** An 8px base unit drives all spacing. Elements within a card use `stack-sm`, while the gap between sections uses `stack-lg`.
- **Responsive Behavior:** On mobile, side margins shrink to 16px to maximize the real estate for product imagery. Product lists reflow from a 2-column grid on mobile to 4 or 5 columns on large desktop displays.

## Elevation & Depth
The design system uses **Tonal Layers** combined with **Ambient Shadows** to define hierarchy. 

1.  **Level 0 (Background):** Gray-50.
2.  **Level 1 (Cards/Surfaces):** Pure White (#FFFFFF) with a very soft, diffused shadow (Y: 2px, Blur: 4px, Opacity: 4% Black) and a 1px neutral border (#E5E7EB).
3.  **Level 2 (Hover/Active):** Slightly deeper shadow (Y: 10px, Blur: 15px, Opacity: 8% Black) to indicate interactivity.
4.  **Level 3 (Modals/Popovers):** High-diffusion shadows with a subtle backdrop blur (8px) to maintain context without visual noise.

## Shapes
To evoke a "friendly and student-oriented" feel, the system uses a **Rounded** shape language. 

- **Cards & Containers:** Utilize `rounded-2xl` (1rem / 16px) for a soft, modern container.
- **Buttons & Inputs:** Utilize `rounded-lg` (0.5rem / 8px) to maintain a professional, structured look for interactive elements.
- **Badges:** Use a full pill-shape (999px) to distinguish metadata (like item condition) from functional buttons.

## Components
Consistent styling across the marketplace is achieved via Radix-based primitives:

- **Product Cards:** The primary component. Features a top-aligned image, `rounded-2xl` corners, and a white surface. Metadata (Price and Condition) should be clearly separated.
- **Buttons:**
    - *Primary:* Sustainability Green, white text, `rounded-lg`.
    - *Action:* Amber-500 for "Add to Cart" or "Buy".
    - *Secondary:* Ghost style with Gray-900 text and subtle border.
- **Condition Badges:** Small, pill-shaped tags. "New" (Green tint), "Like New" (Blue tint), "Used" (Gray tint).
- **Location Tags:** Small text with a pin icon, utilizing `label-sm` typography and `neutral-muted` color.
- **Input Fields:** Minimalist design with a 1px border that shifts to Primary Green on focus. 
- **Skeleton Loaders:** Used for item cards and user profiles. Use a subtle pulse animation on a Gray-200 background to reduce perceived latency during API calls.
- **Empty States:** Clean illustrations with primary-colored buttons to encourage users to list their first item.