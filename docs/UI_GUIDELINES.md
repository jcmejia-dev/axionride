# AxionRide UI Guidelines

## Product Feel

AxionRide should feel modern, dependable, and focused. The interface should support riders who may be checking information quickly, reviewing maintenance history, or preparing for a ride.

## Design Principles

- Prioritize readability and quick scanning.
- Keep interaction patterns predictable.
- Avoid visual noise in operational views.
- Make safety-critical states clear and unambiguous.
- Support light and dark appearances.
- Design for one-handed mobile use where practical.

## Component Guidance

- Reusable UI should live in `src/components` when introduced.
- Feature-specific UI should stay inside the relevant feature module.
- Shared colors, spacing, typography, and motion values should live in `src/theme`.
- Components should expose typed props and avoid hidden side effects.

## Accessibility

- Text should meet contrast requirements.
- Touch targets should be comfortable on mobile devices.
- Interactive controls should have accessible labels.
- Motion should be purposeful and avoid interfering with use while riding.

## Future Design System Topics

- Color tokens
- Typography scale
- Spacing scale
- Icon usage
- Form patterns
- Empty states
- Error states
- Offline and sync states

