---
name: mocking-auth-and-store-testing
description: |
  Mocks Firebase Authentication functions and global Zustand stores in Vitest and React Testing Library (RTL) unit tests without violating typescript-eslint type-safety guidelines (no raw 'any' type casting). Use when writing or debugging unit tests for pages that depend on Firebase Auth state, fetching store values, or fixing linter 'no-explicit-any' errors in test files.
  Do NOT use for functional implementations or component files.
version: 1.0.0
license: MIT
---

# Mocking Auth and Store in Testing

## When to use
- Mocking Firebase Auth listeners/functions (like `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `sendEmailVerification`, `updateProfile`) inside `.test.tsx` or `.test.ts` files.
- Mocking Zustand hook store outputs (like `useAuthStore`) in a component under test.
- Fixing ESLint errors such as `@typescript-eslint/no-explicit-any` inside test files.

## When NOT to use
- Writing production app code or Firebase services.
- Mocking non-global hooks or component internal state.

## Best Practice Patterns

### 1. Mocking Zustand Store Hooks without `any`
In Vitest, when you mock a Zustand store hook (e.g. `vi.mock('../../../store/useAuthStore')`), the exported hook function becomes a mock function. Use `vi.mocked` to assert and configure return values type-safely:

```typescript
import { useAuthStore } from '../../../store/useAuthStore';

vi.mock('../../../store/useAuthStore');

beforeEach(() => {
  vi.clearAllMocks();
  // Mock the complete store interface to satisfy typescript typing
  vi.mocked(useAuthStore).mockReturnValue({
    user: {
      uid: 'user123',
      email: 'test@example.com',
      displayName: 'Test User',
      isProfileComplete: true,
      emailVerified: true,
      school: 'Test Uni',
      province: 'Hanoi',
      district: 'Dong Da',
    },
    isLoading: false,
    setUser: vi.fn(),
    setLoading: vi.fn(),
    initializeAuthListener: vi.fn(),
  });
});
```

### 2. Type-Safe Firebase Auth Mocking
When mocking Firebase Auth functions (like `createUserWithEmailAndPassword`), type-assert resolved mock values through native types (like `UserCredential`) combined with `as unknown` type assertions, rather than `as any`:

```typescript
import { createUserWithEmailAndPassword, sendEmailVerification, UserCredential } from 'firebase/auth';

vi.mock('firebase/auth', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/auth')>();
  return {
    ...actual,
    createUserWithEmailAndPassword: vi.fn(),
    sendEmailVerification: vi.fn(),
  };
});

it('should register successfully', async () => {
  // Use 'as unknown as UserCredential' to mock return values cleanly
  vi.mocked(createUserWithEmailAndPassword).mockResolvedValueOnce({
    user: { email: 'test@example.com' }
  } as unknown as UserCredential);
  
  // Submit actions ...
  expect(createUserWithEmailAndPassword).toHaveBeenCalled();
});
```

### 3. Mocking Firebase Firestore Functions
Follow the same approach for database operations like `setDoc` or `getDoc`:

```typescript
import { doc, setDoc } from 'firebase/firestore';

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('firebase/firestore')>();
  return {
    ...actual,
    doc: vi.fn(),
    setDoc: vi.fn(),
  };
});
```
