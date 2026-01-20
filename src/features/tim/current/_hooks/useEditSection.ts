import toast from 'react-hot-toast';
import { useQueryClient, useMutation } from 'react-query';
import { editSection } from '@/features/tim/current/currentApi';

export default function useEditSection() {
  const queryClient = useQueryClient();

  const { mutate: changeSectionTitle, isLoading: isEditing } = useMutation(
    editSection,
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['sections']);
        toast.success(`Section ${data[0].title} edited successfully`);
      },
      onError: (error: any) => {
        toast.error(`Could not change title (${error.message || error})`);
      },
    }
  );

  return { changeSectionTitle, isEditing };
}
