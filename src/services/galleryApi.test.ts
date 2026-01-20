import '@/test/firebaseMock';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getImages, reorderGallery } from './galleryApi';
import { getDocs, writeBatch } from 'firebase/firestore';

describe('galleryApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getImages', () => {
        it('should fetch and return images', async () => {
            const mockDocs = [
                { id: 'img1', data: () => ({ img: 'url1', order: 1 }) },
            ];
            vi.mocked(getDocs).mockResolvedValueOnce({
                docs: mockDocs,
            } as any);

            const images = await getImages();

            expect(images).toHaveLength(1);
            expect(images[0].id).toBe('img1');
            expect(getDocs).toHaveBeenCalled();
        });
    });

    describe('reorderGallery', () => {
        it('should update orders in batch', async () => {
            const newOrder = [
                { id: 'img1', order: 2 },
                { id: 'img2', order: 1 },
            ];

            await reorderGallery(newOrder);

            expect(writeBatch).toHaveBeenCalled();
        });
    });
});
