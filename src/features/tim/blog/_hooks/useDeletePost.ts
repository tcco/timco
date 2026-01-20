import { deletePost as removePost } from '@/services/blogApi';
import toast from 'react-hot-toast';
import { useQueryClient, useMutation } from 'react-query';

export default function useDeletePost() {
  const queryClient = useQueryClient();

  const { mutate: deletePost, isLoading: deleting } = useMutation(removePost, {
    onSuccess: () => {
      queryClient.invalidateQueries(['blog']);
      toast.success('Post deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete post: ${error.message || error}`);
    },
  });

  return { deletePost, deleting };
}
