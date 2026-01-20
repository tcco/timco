import toast from 'react-hot-toast';
import { useQueryClient, useMutation } from 'react-query';
import { removeAlbum } from '../_utils/removeAlbum';

export default function useDeleteAlbum(
  originalAlbum: string[][],
  postTitle: string
) {
  const queryClient = useQueryClient();

  const { mutate: deleteAlbum, isLoading: deleting } = useMutation(
    (album: string[]) => removeAlbum(postTitle, album, originalAlbum),
    {
      onMutate: () => {
        return toast.loading('Deleting album...');
      },
      onSuccess: (_, __, toastId) => {
        queryClient.invalidateQueries(['blog']);
        toast.success('Album deleted successfully', { id: toastId as string });
      },
      onError: (err: any, _, toastId) => {
        toast.error(`Failed to delete album: ${err.message || err}`, { id: toastId as string });
      },
    }
  );

  return { deleteAlbum, deleting };
}
