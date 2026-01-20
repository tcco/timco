import { useMutation, useQueryClient } from 'react-query';
import { deleteImage } from '@/services/galleryApi';
import toast from 'react-hot-toast';

export function useDeleteImage() {
    const queryClient = useQueryClient();

    const { mutate: removeImage, isLoading: isDeleting } = useMutation(
        deleteImage,
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['gallery']);
                toast.success('Image deleted successfully');
            },
            onError: (err: any) => {
                toast.error(`Failed to delete image: ${err.message || err}`);
            },
        }
    );

    return { removeImage, isDeleting };
}
