import toast from 'react-hot-toast';
import { useQueryClient, useMutation } from 'react-query';
import { addSection as addSectionApi } from '@/features/tim/current/currentApi';

export default function useAddSection() {
  const queryClient = useQueryClient();

  const { mutate: createSection, isLoading: isAdding } = useMutation(
    addSectionApi,
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['sections']);
        toast.success(`Section ${data[0].title} added successfully`);
      },
      onError: (error: any) => {
        toast.error(`Could not add section (${error.message || error})`);
      },
    }
  );

  return { createSection, isAdding };
}
