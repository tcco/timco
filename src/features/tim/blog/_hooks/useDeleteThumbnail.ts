import { deleteThumbnail } from '@/services/blogApi';
import toast from 'react-hot-toast';
import { useQueryClient, useMutation } from 'react-query';

export default function useDeleteThumbnail() {
  const queryClient = useQueryClient();

  const { mutate: removeThumbnail, isLoading: deletingThumbnail } = useMutation(
    ({ id, onSuccess }: { id: string; onSuccess: () => void }) =>
      deleteThumbnail(id).then(onSuccess),
    {
      onMutate: () => {
        return toast.loading('Deleting thumbnail...');
      },
      onSuccess: (_, __, toastId) => {
        queryClient.invalidateQueries(['blog']);
        toast.success('Thumbnail deleted successfully', { id: toastId as string });
      },
      onError: (err: any, _, toastId) => {
        toast.error(`Failed to delete thumbnail: ${err.message || err}`, { id: toastId as string });
      },
    }
  );

  return { deleteThumbnail: removeThumbnail, deletingThumbnail };
}
