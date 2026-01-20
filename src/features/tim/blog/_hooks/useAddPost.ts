import { AddPost } from '@/services/blogApi';
import toast from 'react-hot-toast';
import { useQueryClient, useMutation } from 'react-query';

export default function useAddPost() {
  const queryClient = useQueryClient();

  const { mutate: publishPost, isLoading: loading } = useMutation(AddPost, {
    onSuccess: () => {
      queryClient.invalidateQueries(['blog']);
      toast.success('Post added successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to publish post: ${error.message || error}`);
    },
  });

  return { publishPost, loading };
}
