# FlowRaze - Code Audit & Technical Debt

This document outlines the current technical debt, missing development configurations, and areas for codebase improvement.

## 1. Testing Infrastructure
- **Frontend Tests Missing**: There is no test runner (e.g., Vitest, Jest) or testing library (e.g., React Testing Library) configured in `apps/web/package.json`. No `test` script exists, meaning the frontend relies solely on manual testing and TypeScript/ESLint for correctness.
- **Backend Tests Missing**: Similarly, the Express API (`apps/api/package.json`) lacks a testing framework. There are no unit or integration tests for the routes, middleware, or services.

## 2. Architectural Limitations
- **Search Implementation**: The header search component (`apps/web/src/components/layout/index.tsx`) is currently hardwired to lead search (`/leads?search=...`). Implementing cross-entity search will require a dedicated global search API and UI workflow.
- **Authentication Token Management**: While MVP auth uses `bcryptjs` and `jsonwebtoken`, there is a planned migration to `betterauth` in the future for a more robust identity management solution.

## 3. Dependency Optimization
- Both projects heavily rely on `tsx` for development. Ensure that production builds properly compile via `tsc` and that no dev dependencies leak into the production bundle.
- The monorepo currently does not use tools like Turborepo for optimized build caching, relying on basic `npm workspaces`.

## 4. Pending Refactors
- **Pagination Syncing**: While the API returns pagination metadata, the frontend table components need a unified refactor to consistently expose API-backed pagination controls and handle loading states smoothly.
- **Error Handling Consistency**: Ensure that all frontend components correctly utilize the inline validation and API error feedback patterns established during the dashboard/form refactors.
