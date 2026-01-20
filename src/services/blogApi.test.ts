import '@/test/firebaseMock';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllPosts, getPostById, deletePost, draftPost } from './blogApi';
import { getDocs, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';

describe('blogApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getAllPosts', () => {
        it('should fetch and return filtered posts', async () => {
            const mockDocs = [
                { id: '1', data: () => ({ title: 'Post 1', category: 'Growth', created_at: '2023-01-01' }) },
                { id: '2', data: () => ({ title: 'Post 2', category: 'Daily', created_at: '2023-01-02' }) },
            ];
            vi.mocked(getDocs).mockResolvedValueOnce({
                docs: mockDocs,
            } as any);

            const posts = await getAllPosts({ title: 'Post 1', category: '' });

            expect(posts).toHaveLength(1);
            expect(posts[0].title).toBe('Post 1');
            expect(getDocs).toHaveBeenCalled();
        });
    });

    describe('getPostById', () => {
        it('should return a post by its ID', async () => {
            vi.mocked(getDoc).mockResolvedValueOnce({
                exists: () => true,
                id: 'post1',
                data: () => ({ title: 'Post 1', category: 'Growth' }),
            } as any);

            const post = await getPostById('post1');

            expect(post).toHaveLength(1);
            expect(post[0].id).toBe('post1');
            expect(getDoc).toHaveBeenCalled();
        });

        it('should return empty array if post does not exist', async () => {
            vi.mocked(getDoc).mockResolvedValueOnce({
                exists: () => false,
            } as any);

            const post = await getPostById('non-existent');

            expect(post).toHaveLength(0);
        });
    });

    describe('deletePost', () => {
        it('should delete a post', async () => {
            await deletePost('post1');
            expect(deleteDoc).toHaveBeenCalled();
        });
    });

    describe('draftPost', () => {
        it('should update the draft status', async () => {
            await draftPost({ id: 'post1', draft: true });
            expect(updateDoc).toHaveBeenCalledWith(undefined, { draft: true });
        });
    });
});
