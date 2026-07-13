# AxionRide API

## Purpose

This document defines API planning standards for AxionRide. No production API is currently implemented.

## API Principles

- APIs should be typed at the application boundary.
- Network failures must be expected and handled.
- Client behavior should support offline-first workflows.
- Sensitive data must be protected in transit and at rest.
- External service integrations should be wrapped behind internal service modules.

## Future API Areas

- Authentication
- Garage and motorcycle data
- Ride sync
- Fuel and maintenance records
- Notifications
- Weather
- Maps
- AI assistant
- OBD-II device integrations
- Community and marketplace services

## Contract Guidelines

- Define request and response shapes before implementation.
- Version breaking API changes.
- Keep error responses consistent.
- Include pagination for list endpoints.
- Avoid leaking provider-specific details into feature UI.

## Current External Integrations

- Weather requests are isolated in `WeatherService` and use Open-Meteo current conditions. The normalized contract includes temperature, weather code, wind, precipitation, and relative humidity.
- Nearby place discovery is isolated behind `NearbyServicesService` and the authenticated Supabase `nearby-services` function, which queries OpenStreetMap Overpass.
- In-app driving directions are isolated behind `OsrmRoutingService`, which converts OSRM GeoJSON route coordinates into the app map coordinate format.

## Open Decisions

- Backend platform.
- Authentication provider.
- API transport style.
- Sync protocol.
- Observability and error reporting.
