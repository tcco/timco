import { useQueryClient, useMutation } from 'react-query';
import { deleteSection } from '@/features/tim/current/currentApi';
import { useToast } from '@/components/ui/use-toast';

export default function useDeleteSection() {
    const queryClient = useQueryClient();
    const { toast } = useToast();

    const { mutate: removeSection, isLoading: deleteLoading } = useMutation(
        deleteSection,
        {
            onSuccess: () => {
                queryClient.invalidateQueries(['sections']);
                toast({
                    title: 'Section deleted',
                });
            },
            onError: (error: any) => {
                toast({
                    title: 'Error deleting section',
                    description: error.message || error,
                    variant: 'destructive',
                });
            },
        }
    );

    return { removeSection, deleteLoading };
}
