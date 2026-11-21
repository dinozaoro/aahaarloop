# 0005 — Leaflet

Status: Proposed

## Context

Pickup locations and donor addresses are stored as latitude and longitude.
Recipients and volunteers need a map to judge travel time, and the matching
formula already uses a travel-minutes input.

## Decision

Use Leaflet for map views when they are implemented, with tiles loaded in the
browser from a configured provider. Keep coordinates in the database as plain
columns and compute distance/travel time in shared logic rather than in the map
component.

## Consequences

- The map library stays out of the matching package and out of mobile UI.
- Tile providers may require attribution and an API key; that configuration is
  not part of this change.
- No map dependency is installed yet, so no live map behaviour is claimed.
- Privacy review is needed before exposing precise donor addresses to all
  recipients.
