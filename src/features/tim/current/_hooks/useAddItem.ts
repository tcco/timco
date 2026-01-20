import toast from 'react-hot-toast';
import { useQueryClient, useMutation } from 'react-query';
import { addItem } from '@/features/tim/current/currentApi';
import { Section } from '../_types/types';

export default function useAddItem(section: Section) {
  const queryClient = useQueryClient();

  const { mutate: createItem, isLoading: isAdding } = useMutation(
    (itemValues: {
      title: string;
      description?: string;
      link?: string;
      order?: number;
    }) => addItem({ ...itemValues, section_id: section.id }),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['section', section.id]);
        toast.success(`Item ${data[0].title} added successfully`);
      },
      onError: (error: any) => {
        toast.error(`Could not add item (${error.message || error})`);
      },
    }
  );

  return { createItem, isAdding };
}
