import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from './useAuthStore';

// Mock Firebase
vi.mock('../lib/firebase', () => ({
  auth: {},
  db: {}
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn(() => {
    // Return a dummy unsubscribe function
    return () => {};
  })
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn()
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset the store state before each test
    useAuthStore.setState({
      user: null,
      isLoading: true
    });
  });

  it('should initialize with null user and loading true', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isLoading).toBe(true);
  });

  it('should update user state when setUser is called', () => {
    const testUser = {
      uid: '123',
      email: 'test@example.com',
      displayName: 'Test User',
      school: 'Test Uni',
      district: 'Test District',
      isProfileComplete: true,
      emailVerified: true,
      province: 'Hanoi',
    };

    useAuthStore.getState().setUser(testUser);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(testUser);
  });

  it('should update loading state when setLoading is called', () => {
    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);

    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);
  });
});
