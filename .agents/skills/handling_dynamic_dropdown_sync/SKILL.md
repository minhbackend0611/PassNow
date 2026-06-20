---
name: handling-dynamic-dropdown-sync
description: |
  Synchronizes dynamic select/dropdown fields in React forms (e.g., provinces and districts) to prevent React/browser value resetting race conditions during asynchronous API fetches. Use when implementing chained dropdown selects, loading dependent option lists based on a parent field, or fixing select values that revert to default/first option on mount.
  Do NOT use for static dropdowns or single select elements with static option arrays.
version: 1.0.0
license: MIT
---

# Handling Dynamic Dropdown Sync

## When to use
- Chained select inputs in a form (e.g., Country -> State -> City, or Province -> District).
- Asynchronous option loading where the options list changes dynamically based on other form field selections.
- Restoring saved user selections in a dropdown list that loads asynchronously (where the value gets reset to the first option due to race conditions).

## When NOT to use
- Single static select dropdowns (e.g., select condition 'New' | 'Used').
- Fully controlled custom select components that don't bind to a native `<select>` element ref in `react-hook-form`.

## The Race Condition Problem
When options are fetched asynchronously:
1. `setOptions(list)` updates React state. This is batched and asynchronous.
2. If `setValue('fieldName', savedValue)` is called immediately in the same handler, the native DOM element does *not* have the new option tags rendered yet.
3. The browser fails to match `savedValue` with any option, resetting the selection to the first available index (or empty).
4. The options are subsequently rendered, but the selected value is already lost.

## Workflow / Best Practice Solution
To resolve the race condition, decouple the list-fetching state update from the value assignment by using a dedicated `useEffect` hook that waits for the options list to change and render in the DOM:

1. **Perform the asynchronous fetch and populate options**:
   ```typescript
   useEffect(() => {
     if (parentId) {
       fetch(`/api/options/${parentId}`)
         .then(res => res.json())
         .then(data => {
           setChildOptions(data || []);
         });
     } else {
       setChildOptions([]);
     }
   }, [parentId]);
   ```

2. **Wait for options to render, then sync the select value**:
   ```typescript
   useEffect(() => {
     if (childOptions.length > 0) {
       const currentParent = watch('parentField');
       const currentChild = watch('childField');
       
       // Case A: Restoring initial saved/profile value
       if (currentParent === savedProfile?.parentValue && savedProfile?.childValue) {
         if (childOptions.some(opt => opt.name === savedProfile.childValue)) {
           setValue('childField', savedProfile.childValue, { shouldDirty: false });
         }
       // Case B: Keeping current selected value if still valid
       } else if (currentChild && childOptions.some(opt => opt.name === currentChild)) {
         setValue('childField', currentChild);
       }
     }
   }, [childOptions, savedProfile, setValue, watch]);
   ```

3. **Remove `value={watch('childField')}` overrides**:
   Do not pass `value={watch('childField')}` to select elements registered via `{...register('childField')}`. This creates controlled/uncontrolled warnings in React and conflicts with `react-hook-form` internal state management.
