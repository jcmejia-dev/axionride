# AxionRide Database

## Purpose

This document records the intended database direction for AxionRide. No database implementation has been selected yet.

## Data Philosophy

AxionRide should be designed as an offline-first application. Rider and motorcycle data must remain available when network coverage is poor or unavailable.

## Future Data Domains

- Users and authentication profiles
- Garages
- Motorcycles
- Ride sessions and route points
- Fuel logs
- Maintenance logs
- Service history
- Notification preferences
- Sync metadata
- OBD-II readings
- Marketplace and community records

## Modeling Guidelines

- Use stable identifiers for all syncable records.
- Track created and updated timestamps consistently.
- Track deletion state when records need to sync across devices.
- Avoid storing derived data unless it improves performance or preserves history.
- Treat location, vehicle, and account data as sensitive.

## Open Decisions

- Local persistence technology.
- Cloud database provider.
- Conflict resolution strategy.
- Backup and restore strategy.
- Data retention and export policy.

