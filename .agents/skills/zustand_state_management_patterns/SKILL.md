---
name: zustand-state-management-patterns
description: |
  Guidelines for structuring, implementing, and debugging Zustand state stores in a React application. Use this when the user asks to manage global state, handle complex asynchronous data fetching outside of components, or fix reactivity/re-rendering bugs related to Zustand.
  Do NOT use for prop drilling or local component state (`useState`).
version: 1.0.0
license: MIT
---

# Zustand State Management Patterns

## When to use
- Designing global state management for cross-component communication (e.g. Authentication State, Global UI Modals).
- Extracting complex asynchronous logic (Firebase calls) out of React components.
- Fixing performance issues caused by unnecessary re-renders in Zustand selectors.

## When NOT to use
- Form state management (Use `react-hook-form` instead).
- Ephemeral UI state (e.g., whether a specific dropdown is open) which should stay in `useState`.

## Workflow
1. **Define the Interface**:
   - Explicitly type your store's state and actions using TypeScript.
   - Separate state values from actions in the interface definition.

2. **Create the Store**:
   - Use `create<YourStateInterface>()((set, get) => ({ ... }))`.
   - Keep stores atomic. Instead of one massive global store, create slice-specific stores (e.g., `useAuthStore`, `useTransactionStore`).

3. **Handle Async Actions**:
   - Async functions inside Zustand should use `try/catch` blocks.
   - Always update loading states (`isLoading`, `error`) before and after the async operation.
   - Use `get()` to read current state within actions if necessary.

4. **Consume the Store**:
   - Use atomic selectors in components to prevent unnecessary re-renders.
   - **Correct**: `const user = useAuthStore(state => state.user);`
   - **Incorrect**: `const { user } = useAuthStore();` (This subscribes to the entire store, causing re-renders on ANY store update).

## Critical Guidelines
- **No Side Effects in Selectors**: Selectors should be pure functions.
- **Middleware**: Use `devtools` and `persist` middleware carefully. Only persist non-sensitive data.
