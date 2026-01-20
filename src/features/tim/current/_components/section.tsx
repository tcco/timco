import Loading from '@/components/Loading';
import { Button } from '@/components/ui/button';
import { Section as SectionType, Item } from '../_types/types.d';
import { useQuery } from 'react-query';
import { useCallback } from 'react';
import { getItems } from '@/features/tim/current/currentApi';
import Sorty from './sort-items/sorty';
import useReorderItems from '../_hooks/useReorderItems';
import useAddItem from '../_hooks/useAddItem';
import useEditSection from '../_hooks/useEditSection';
import useDeleteSection from '../_hooks/useDeleteSection';
import FormSection from './form-section';
import FormSectionItem from './form-item';
import { Pencil, Trash } from '@phosphor-icons/react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function Section({ section }: { section: SectionType }) {
  const { changeSectionTitle, isEditing } = useEditSection();
  const { createItem, isAdding } = useAddItem(section);
  const { removeSection, deleteLoading } = useDeleteSection();

  const { changeItemsOrder, handleReorderItems, newOrder, isReordering } = 
    useReorderItems({ sectionId: section.id });

  const { data: items, isLoading } = useQuery<Item[]>(['section', section.id], {
    queryFn: () => getItems(section.id) as Promise<Item[]>,
  });

  const handleCreateItem = useCallback((values: any) => {
    createItem({ ...values, order: items?.length || 0 });
  }, [createItem, items?.length]);

  const handleChangeTitle = useCallback((values: { title: string }) => {
    changeSectionTitle({ title: values.title, id: section.id });
  }, [changeSectionTitle, section.id]);

  return (
    <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-neutral-900 tracking-tight">
          {section.title}
        </h2>

        <div className="flex items-center gap-2">
          {newOrder.length > 0 && (
            <Button 
              onClick={() => changeItemsOrder()} 
              disabled={isReordering}
              variant="secondary"
              size="sm"
            >
              {isReordering ? 'Saving...' : 'Save Order'}
            </Button>
          )}

          <FormSectionItem
            onSubmit={handleCreateItem}
          >
            <Button size="sm" variant="default" disabled={isAdding}>
              {isAdding ? 'Adding...' : 'Add Item'}
            </Button>
          </FormSectionItem>

          <FormSection
            onSubmit={handleChangeTitle}
            defaultValues={{
              title: section.title!,
            }}
          >
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 text-neutral-600 hover:text-neutral-900"
              disabled={isEditing}
            >
              <Pencil size={18} weight="bold" />
            </Button>
          </FormSection>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                size="icon"
                variant="destructive"
                className="h-8 w-8"
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <Loading type="self" size="small" />
                ) : (
                  <Trash size={18} weight="bold" />
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Section?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove <strong>{section.title}</strong> and all its items. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => removeSection(section.id)}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {isLoading ? (
        <div className="py-8 flex justify-center">
          <Loading type="self" size="medium" />
        </div>
      ) : (
        <div className="space-y-2">
          {items && items.length > 0 ? (
            <ul className="grid grid-cols-1 gap-3">
              <Sorty 
                items={items} 
                onOrderChange={handleReorderItems} 
              />
            </ul>
          ) : (
            <p className="text-sm text-neutral-500 italic py-2">No items in this section.</p>
          )}
        </div>
      )}
    </div>
  );
}
