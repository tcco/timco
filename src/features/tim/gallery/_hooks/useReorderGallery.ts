import { reorderGallery } from '@/services/galleryApi';
import toast from 'react-hot-toast';
import { useQueryClient, useMutation } from 'react-query';

export function useReorderGallery() {
  const queryClient = useQueryClient();

  const { mutate: reorderImages, isLoading: loading, error } = useMutation(
    ({ images, onSuccess }: { images: { id: string; order: number }[]; onSuccess?: () => void }) =>
      reorderGallery(images).then(() => onSuccess?.()),
    {
      onMutate: () => {
        return toast.loading('Reordering images...');
      },
      onSuccess: (_, __, toastId) => {
        queryClient.invalidateQueries(['gallery']);
        toast.success('Gallery reordered!', { id: toastId as string });
      },
      onError: (err: any, _, toastId) => {
        toast.error(`Failed to reorder: ${err.message || err}`, { id: toastId as string });
      },
    }
  );

  return { loading, reorderImages, error };
}
