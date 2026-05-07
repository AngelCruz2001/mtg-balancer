# Architecture

## Purpose

This document defines the architectural intent of `mtg-deck-balancer`.

It serves three audiences:

- project maintainers who need a clear mental model of the system
- future contributors who need to know where new work belongs
- AI/codegen agents who need boundaries before making changes

This file is not the phase tracker. A future `roadmap.md` should own sequencing and milestones. This file owns structure, responsibilities, and extension rules.

## Product Summary

MTG Deck Balancer is a web application that:

- accepts raw Magic: The Gathering decklists for 2 to 4 players
- resolves card data from Scryfall
- renders a shared match/table view
- sends the loaded decks to Anthropic for a balance analysis
- returns a structured report with per-player power scores and a written explanation

The current repository is a functional phase-1 prototype. It is intentionally small and favors speed of iteration over infrastructure depth.

## Current Scope

The current scope is:

- single browser session
- client-managed match state
- server-side Anthropic analysis through one API route
- direct card resolution from Scryfall
- no database
- no auth or accounts
- no multiplayer synchronization
- no background jobs

`persistence`, `auth`, and `accounts` are not missing by accident. They are explicitly out of scope for the current phase and belong to future phases.

## Architectural Principles

The project should evolve under these rules:

1. Keep the architecture small until a real product constraint forces a new layer.
2. Keep external integrations behind typed modules or server handlers, not scattered across UI components.
3. Keep route handlers thin. They may orchestrate work, but they should not become dumping grounds for parsing, prompts, and business rules.
4. Keep shared domain contracts in `src/types` so the UI, store, and server speak the same language.
5. Treat the current Zustand store as a client session cache, not a permanent system of record.
6. Keep Anthropic as a concrete first provider. Do not introduce a provider abstraction until a second provider or offline analysis path is an actual requirement.
7. Avoid premature persistence and auth scaffolding. Add those only when the roadmap phase requires them.

## Current Runtime Architecture

The application is split into three runtime areas:

- client UI and local session state
- server route for LLM analysis
- third-party services

### Client

The client lives under `src/app`, `src/components`, and `src/store`.

Current user flow:

1. The home page (`src/app/page.tsx`) renders `DeckLoaderPanel`.
2. Each `PlayerSlot` accepts a player name and raw decklist text.
3. `useAppStore.loadDeck()` parses the pasted lines and resolves cards through `fetchDeck()`.
4. Loaded players are stored in the client Zustand store.
5. The match page (`src/app/match/page.tsx`) reads ready players from the store and renders the table plus analyzer panel.
6. `AnalyzerPanel` posts the loaded player payload to `/api/analyze`.
7. The returned report is rendered in the client and also cached in the store.

### Server

The current server logic is intentionally minimal:

- `src/app/api/analyze/route.ts` receives `{ players }`
- it constructs an Anthropic prompt from the loaded deck data
- it calls Anthropic using `ANTHROPIC_API_KEY`
- it parses the model response as JSON
- it returns the structured report to the client

The server currently has no persistence, queue, or session ownership. It is a computation boundary, not a state authority.

### External Services

The application currently depends on two external systems:

- Scryfall for card metadata and images
- Anthropic for deck balance analysis

Scryfall is accessed from `src/lib/scryfall.ts`.
Anthropic is currently called directly inside `src/app/api/analyze/route.ts`.

## Repository Map

The current codebase is organized by responsibility:

- `src/app/`
  - route entry points
  - page composition
  - API route handlers
- `src/components/deck-loader/`
  - setup flow for players and deck import
- `src/components/table/`
  - table presentation, player zones, and card display
- `src/components/analyzer/`
  - analysis trigger and report rendering
- `src/components/ui/`
  - reusable Shadcn UI primitives
- `src/store/`
  - client-side match session state
- `src/lib/`
  - integration code and low-level helpers
- `src/types/`
  - shared TypeScript contracts
- `docs/tickets/`
  - implementation tickets grouped by phase and area

This shape is correct for the current phase and should be preserved unless a future phase creates enough backend complexity to justify a clearer server-side module boundary.

## Current Domain Model

The current shared model is small:

- `ScryfallCard`
  - the external card payload used by the UI and analysis flow
- `DeckCard`
  - `{ quantity, card }`
- `Player`
  - seat, name, raw deck text, resolved cards, loading state, and error state
- `MatchSession`
  - current players plus the cached balance report

Important limitation:

- the balance report is not yet modeled as a first-class shared type
- it is currently stored in Zustand as a serialized JSON string
- `AnalyzerPanel` still uses loose typing for the returned report

That is acceptable for the prototype, but it should be one of the first cleanup steps before the analysis feature grows.

## Module Boundaries

Future contributors and agents should follow these boundaries.

### `src/app`

Use `src/app` for routing concerns only:

- page composition
- route guards
- metadata
- API handlers

Do not move reusable business logic into page files. If a page needs non-trivial logic, move that logic into a feature component, store action, or server-side helper.

### `src/components`

Feature components should own interaction and presentation for a specific area of the product:

- deck loading
- match visualization
- analysis UI

Generic UI primitives belong in `src/components/ui`.
Do not place product-specific logic into Shadcn wrapper components.

### `src/store`

The store currently owns client session state:

- player setup
- deck loading state
- cached analysis output for the current browser session

The store should not become a hidden backend. In future phases with persistence or shared sessions:

- the server should become the source of truth
- Zustand should hold client cache, view state, and optimistic UI state

Do not add direct Anthropic calls or database access to the store.

### `src/lib`

`src/lib` should hold:

- pure helpers
- parsing utilities
- external service clients
- service-specific formatting logic

Today that includes `scryfall.ts`.
In the next round of cleanup, Anthropic prompt construction and response parsing should move into a dedicated analysis module instead of staying inline in the route handler.

### `src/types`

Shared contracts belong in `src/types`.

When a feature crosses UI, store, and server boundaries, define or update the shared type first. This is the easiest way to keep future agent edits coherent.

## Current Data Flow

The primary data flow is intentionally simple:

1. User enters decklist text.
2. The client parses each line into `{ quantity, name }`.
3. The Scryfall client resolves each card name into a `ScryfallCard`.
4. The client stores the resolved deck in Zustand.
5. The match page renders card images and a simple mana curve from that local state.
6. The client submits the ready players to the analysis route.
7. The server builds an Anthropic prompt from the resolved cards.
8. Anthropic returns JSON-like text.
9. The route parses the JSON and returns it to the client.
10. The client renders and caches the report.

This flow keeps the prototype fast to build, but it has known tradeoffs:

- a browser refresh loses the entire session
- invalid cards are silently dropped during deck resolution
- request and response payloads are not schema-validated
- analysis is synchronous and tied to one HTTP request

## Known Technical Debt

The following debt is acceptable right now, but future agents should see it clearly instead of normalizing it:

- `src/app/api/analyze/route.ts` mixes prompt building, provider invocation, response extraction, and parsing
- the Anthropic model is hardcoded in the route
- the analysis response lacks a shared `AnalysisReport` type
- the report is stored as a serialized string instead of a typed object
- `fetchDeck()` hides failed card lookups instead of returning structured validation output
- there is no request validation layer on `/api/analyze`
- there are no tests around parsing, store behavior, or analysis response handling

None of these require immediate abstraction. They do indicate where the first refactors should happen once the feature set expands.

## Intended Evolution Across Future Phases

The roadmap should decide exactly when each step happens. Architecture only defines the target direction.

### Phase 1: Local Prototype

This is the current state:

- local session state
- direct Scryfall card lookup
- Anthropic-first server analysis
- no persistence
- no auth

### Phase 2: Contract Hardening and Feature Cleanup

The next architectural improvements should focus on reliability, not scale:

- introduce a shared `AnalysisReport` type
- validate analysis input and output with a schema layer
- extract Anthropic prompt construction and parsing into a dedicated analysis module
- return structured deck validation results instead of silently dropping invalid cards
- add tests for deck parsing, store actions, and report rendering
- separate view logic from service logic more aggressively where needed

The goal of this phase is to make the current product easier to extend without changing the overall deployment model.

### Phase 3: Persistent Sessions and Server Ownership

When the product needs continuity across refreshes or devices, the architecture should change in a deliberate way:

- introduce persistent match/session storage
- move from client-only session authority to server-owned session records
- add server-side identifiers for sessions, decks, and analysis results
- introduce repository or service boundaries before wiring in a database directly

Important constraint:

- do not push database calls straight into route handlers or React components

Persistence should arrive together with clearer domain modeling, not as scattered ad hoc writes.

### Phase 4: Shared Use, Accounts, and Operational Depth

Only when collaboration or long-lived user state becomes a product requirement should the architecture absorb:

- auth and user accounts
- shared sessions
- role or access rules
- auditability for saved analyses
- operational tooling such as rate limiting, retries, analytics, and observability

Auth should be introduced because the product needs identity, not because identity feels like a normal next step.

### Phase 5: Advanced Analysis Pipeline

If analysis complexity or cost grows, the current synchronous request model should evolve toward:

- queued or background analysis work
- saved analysis artifacts
- better prompt/version tracking
- model selection controls
- optional provider abstraction if multiple real providers exist

Anthropic remains the default assumption until the product proves a need for multiple providers.

## Guidance for Future Agents

If you are an agent changing this repository, follow these rules:

1. Preserve the current feature-oriented folder structure unless the change introduces a real new backend boundary.
2. Add or update shared types before wiring a feature across UI, store, and server layers.
3. Keep Anthropic calls server-side.
4. Do not introduce auth, accounts, or persistence unless the task explicitly belongs to a future phase that requires them.
5. If analysis logic grows, extract it from `route.ts` into a dedicated module before adding more complexity.
6. If session persistence is introduced, treat Zustand as client state and make the server authoritative.
7. Prefer small refactors that clarify boundaries over broad rewrites.
8. Keep `docs/tickets/` aligned with the implementation so future work remains phase-oriented and discoverable.

## Practical Next Steps

The most useful near-term architectural improvements are:

- add `src/types/analysis.ts`
- validate `/api/analyze` payloads and responses
- extract Anthropic integration into a dedicated analysis service module
- improve deck parsing error reporting
- add a minimal test layer around parsing and the analysis contract

These changes strengthen the prototype without dragging it into premature platform work.
