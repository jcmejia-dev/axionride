# AxionRide Design System v2

Design System v2 establishes the premium black-and-orange motorcycle UI foundation for future screen migration. This branch adds tokens and reusable components only; production screens should be migrated separately.

## Principles

- Premium motorcycle companion: realistic, technical, and confident.
- Deep black first: use `#070A0F` as the primary app backdrop.
- Orange is the main action signal, not decoration everywhere.
- Glass and metallic surfaces should separate content without visual clutter.
- Typography should be bold, readable, and scan-friendly.
- Touch targets should be large enough for mobile riding contexts.
- Motion should be subtle and use React Native `Animated`.

## Tokens

Use `src/theme` exports:

- `premiumColors`: v2 color palette.
- `spacing`: shared spacing scale.
- `radius`: rounded surface scale.
- `typography`: text styles.
- `elevation`: soft, raised, orange glow, and metallic depth.
- `opacity`: disabled, pressed, glass, overlay values.
- `motion`: durations and pressed scale values.
- `touchSizes` and `iconSizes`: control and icon sizing.

Correct:

```tsx
import { premiumColors, spacing, typography } from '@/src/theme';
```

Incorrect:

```tsx
const orange = '#ff6600';
```

## Component Inventory

Import new primitives from `@/src/components/premium`.

- `PremiumScreen`: safe-area screen wrapper with dark backdrop.
- `PremiumHeader`: page header with eyebrow, title, subtitle, and slots.
- `GlassCard`: translucent premium surface.
- `ElevatedCard`: stronger metallic surface.
- `SectionHeader`: section title with optional action.
- `PremiumButton`: primary, secondary, and ghost actions.
- `IconButton`: circular icon-only touch target.
- `StatCard`: dashboard-style metric tile.
- `MetricChip`: compact inline metric row.
- `StatusBadge`: state label with optional dot.
- `MotorcycleHeroCard`: reusable motorcycle summary surface.
- `EmptyStateCard`: no-data state.
- `ActionRow` and `SettingsRow`: large list rows.
- `PremiumBanner` and `AdPlaceholderCard`: promotional or support surfaces.
- `Divider`: subtle separator.
- `SkeletonBlock`: animated loading placeholder.
- `LoadingOverlay`: blocking progress overlay.

## Usage Rules

- Do not import services, repositories, SQLite, maps, notifications, or GPS from shared UI components.
- Keep screen-specific data in screens or feature modules.
- Prefer component slots for icons, actions, and trailing controls.
- Use `PremiumButton` for clear commands and `IconButton` for icon-only actions.
- Use `StatusBadge` for lifecycle states such as ready, warning, due, or offline.
- Avoid stacking cards inside cards unless the inner card is a repeated item.
- Avoid excessive glow; one primary glow per viewport is usually enough.

## Accessibility

- Icon-only controls must have `accessibilityLabel`.
- Pressable components must expose disabled and busy state where applicable.
- Keep minimum touch targets at or above `touchSizes.default`.
- Do not rely on orange alone to communicate critical state; pair color with text.
- Preserve readable contrast on glass surfaces.

## Migration Strategy

1. Migrate shared tokens first and remove screen-level hardcoded colors where safe.
2. Migrate tab bar and app shell surfaces.
3. Migrate Dashboard because it defines the visual density and card language.
4. Migrate Garage and Maintenance next because they share motorcycle hero/status patterns.
5. Migrate Rides after chart and map surfaces are stabilized.
6. Migrate Profile and auth screens last, keeping backup/settings functionality unchanged.

Existing components remain exported from `@/src/components` for compatibility. New screens should prefer `@/src/components/premium` for v2 primitives.
