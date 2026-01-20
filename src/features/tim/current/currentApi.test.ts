import '@/test/firebaseMock';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSections, addSection, getItems, addItem } from './currentApi';
import { getDocs, addDoc, query, where, orderBy } from 'firebase/firestore';

describe('currentApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getSections', () => {
        it('should fetch and return sections', async () => {
            const mockDocs = [
                { id: '1', data: () => ({ title: 'Section 1' }) },
                { id: '2', data: () => ({ title: 'Section 2' }) },
            ];
            vi.mocked(getDocs).mockResolvedValueOnce({
                docs: mockDocs,
            } as any);

            const sections = await getSections();

            expect(sections).toHaveLength(2);
            expect(sections[0]).toEqual({ id: '1', title: 'Section 1' });
            expect(getDocs).toHaveBeenCalled();
        });
    });

    describe('addSection', () => {
        it('should add a section and return its data', async () => {
            vi.mocked(addDoc).mockResolvedValueOnce({ id: 'new-id' } as any);

            const result: any = await addSection('New Section');

            expect(result).toEqual([{ id: 'new-id', title: 'New Section' }]);
            expect(addDoc).toHaveBeenCalledWith(undefined, { title: 'New Section' });
        });
    });

    describe('getItems', () => {
        it('should fetch items for a specific section', async () => {
            const mockDocs = [
                { id: 'item1', data: () => ({ title: 'Item 1', section_id: 'sec1', order: 0 }) },
            ];
            vi.mocked(getDocs).mockResolvedValueOnce({
                docs: mockDocs,
            } as any);

            const items: any = await getItems('sec1');

            expect(items).toHaveLength(1);
            expect(items[0].title).toBe('Item 1');
            expect(query).toHaveBeenCalled();
            expect(where).toHaveBeenCalledWith('section_id', '==', 'sec1');
            expect(orderBy).toHaveBeenCalledWith('order', 'asc');
        });
    });

    describe('addItem', () => {
        it('should add an item and sanitize undefined fields', async () => {
            vi.mocked(addDoc).mockResolvedValueOnce({ id: 'new-item-id' } as any);

            const result: any = await addItem({
                title: 'New Item',
                section_id: 'sec1',
                description: undefined,
                link: 'https://example.com',
            });

            expect(result[0].id).toBe('new-item-id');
            expect(result[0].description).toBeUndefined();
            expect(addDoc).toHaveBeenCalledWith(undefined, {
                title: 'New Item',
                section_id: 'sec1',
                link: 'https://example.com',
            });
        });
    });
});
