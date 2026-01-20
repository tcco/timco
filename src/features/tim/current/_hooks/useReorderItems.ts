import toast from 'react-hot-toast';
import { useQueryClient, useMutation } from 'react-query';
import { updateOrder } from '../currentApi';
import { useState, useCallback } from 'react';
import { Item } from '../_types/types';

export default function useReorderItems({ sectionId }: { sectionId: string }) {
  const [newOrder, setNewOrder] = useState<{ id: string; order: number }[]>([]);
  const queryClient = useQueryClient();

  const { mutate: changeItemsOrder, isLoading: isReordering } = useMutation(
    () => updateOrder(newOrder),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['section', sectionId]);
        setNewOrder([]);
        toast.success(`Section reordered successfully!`);
      },
      onError: (error: any) => {
        toast.error(`Could not reorder this section (${error.message || error})`);
      },
    }
  );

  const handleReorderItems = useCallback((newOrderIds: string[], items: Item[]) => {
    const newItems = newOrderIds
      .map((id, index) => {
        const item = items.find((i) => i.id === id);
        if (item?.order === index) return;
        return { id, order: index };
      })
      .filter((item): item is { id: string; order: number } => item !== undefined);

    setNewOrder(newItems);
  }, []);

  return { changeItemsOrder, handleReorderItems, newOrder, isReordering };
}
