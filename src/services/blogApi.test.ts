import '@/test/firebaseMock';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAllPosts, getPostById, getPostByIdOrSlug, deletePost, draftPost } from './blogApi';
import { getDocs, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';

describe('blogApi', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getPostByIdOrSlug', () => {
        it('should resolve directly by document ID', async () => {
            vi.mocked(getDoc).mockResolvedValueOnce({
                exists: () => true,
                id: '88',
                data: () => ({ title: 'Stripe Sessions', slug: 'stripe-sessions-2024' }),
            } as any);

            const post = await getPostByIdOrSlug('88');
            expect(post).toHaveLength(1);
            expect(post[0].id).toBe('88');
            expect(post[0].title).toBe('Stripe Sessions');
        });

        it('should resolve by slug field when doc lookup misses', async () => {
            vi.mocked(getDoc).mockResolvedValueOnce({
                exists: () => false,
            } as any);

            const mockDocs = [
                { id: '93', data: () => ({ id: 93, title: 'FYNN (Finance You Need Now) AI Edition', slug: 'fynn-ai-edition' }) },
            ];
            vi.mocked(getDocs).mockResolvedValueOnce({
                docs: mockDocs,
            } as any);

            const post = await getPostByIdOrSlug('fynn-ai-edition');
            expect(post).toHaveLength(1);
            expect(post[0].slug).toBe('fynn-ai-edition');
        });

        it('should resolve legacy title with underscores for backward compatibility', async () => {
            vi.mocked(getDoc).mockResolvedValueOnce({
                exists: () => false,
            } as any);

            const mockDocs = [
                { id: '22', data: () => ({ id: 22, title: 'Life Developments', slug: 'life-developments' }) },
            ];
            vi.mocked(getDocs).mockResolvedValueOnce({
                docs: mockDocs,
            } as any);

            const post = await getPostByIdOrSlug('Life_Developments');
            expect(post).toHaveLength(1);
            expect(post[0].title).toBe('Life Developments');
        });

        it('should return empty array when post does not exist', async () => {
            vi.mocked(getDoc).mockResolvedValueOnce({
                exists: () => false,
            } as any);
            vi.mocked(getDocs).mockResolvedValueOnce({
                docs: [],
            } as any);

            const post = await getPostByIdOrSlug('non-existent');
            expect(post).toHaveLength(0);
        });
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
