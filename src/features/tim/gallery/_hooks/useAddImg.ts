import { uploadImage } from '@/services/galleryApi';
import toast from 'react-hot-toast';
import { useQueryClient, useMutation } from 'react-query';

export function useAddImage() {
  const queryClient = useQueryClient();

  const { mutate: addImage, isLoading: loading, error } = useMutation(
    ({ image, onSuccess }: { image: File; onSuccess: () => void }) =>
      uploadImage(image).then(onSuccess),
    {
      onMutate: () => {
        return toast.loading('Uploading image...');
      },
      onSuccess: (_, __, toastId) => {
        queryClient.invalidateQueries(['gallery']);
        toast.success('Image uploaded!', { id: toastId as string });
      },
      onError: (err: any, _, toastId) => {
        toast.error(`Failed to upload image: ${err.message || err}`, { id: toastId as string });
      },
    }
  );

  return { loading, addImage, error };
}
