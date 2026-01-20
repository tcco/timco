import toast from 'react-hot-toast';
import { useQueryClient, useMutation } from 'react-query';
import { deleteItem as deleteItemApi } from '@/features/tim/current/currentApi';

export default function useDeleteItem(sectionId: string) {
    const queryClient = useQueryClient();

    const { mutate: removeItem, isLoading: isDeleting } = useMutation(
        (id: string) => deleteItemApi(id),
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['section', sectionId]);
                toast.success('Item deleted successfully');
            },
            onError: (error: any) => {
                toast.error(`Could not delete item (${error.message || error})`);
            },
        }
    );

    return { removeItem, isDeleting };
}
