import { updatePost } from '@/services/blogApi';
import toast from 'react-hot-toast';
import { useQueryClient, useMutation } from 'react-query';

export default function useEditPost() {
  const queryClient = useQueryClient();

  const { mutate: editPost, isLoading: loading } = useMutation(updatePost, {
    onSuccess: () => {
      queryClient.invalidateQueries(['blog']);
      toast.success('Post edited');
    },
    onError: (error: any) => {
      toast.error(`Failed to edit post: ${error.message || error}`);
    },
  });

  return { editPost, loading };
}
