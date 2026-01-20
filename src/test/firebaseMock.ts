import { vi } from 'vitest';

export const mockDb = {};
export const mockStorage = {};

vi.mock('firebase/app', () => ({
    initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
    getAuth: vi.fn(() => ({})),
}));

vi.mock('firebase/firestore', () => ({
    getFirestore: vi.fn(() => mockDb),
    collection: vi.fn(),
    getDocs: vi.fn(),
    getDoc: vi.fn(),
    addDoc: vi.fn(),
    deleteDoc: vi.fn(),
    updateDoc: vi.fn(),
    doc: vi.fn(),
    query: vi.fn(),
    where: vi.fn(),
    orderBy: vi.fn(),
    writeBatch: vi.fn(() => ({
        update: vi.fn(),
        commit: vi.fn(),
    })),
}));

vi.mock('firebase/storage', () => ({
    getStorage: vi.fn(() => mockStorage),
    ref: vi.fn(),
    uploadBytes: vi.fn(),
    getDownloadURL: vi.fn(),
    deleteObject: vi.fn(),
}));

vi.mock('@/services/firebase', () => ({
    db: mockDb,
    storage: mockStorage,
}));
