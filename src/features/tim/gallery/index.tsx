/* eslint-disable @typescript-eslint/no-explicit-any */
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import usePics from '@/hooks/usePics';
import GalleryItem from './_components/galleryItem';
import Header from '../_components/header';
import SortImage from '@/components/album-sort/drag';
import { AlbumSortItem } from '@/components/album-sort/album-sort-item';
import { Fragment, useState, useMemo, useCallback } from 'react';
import { Database } from '@/types/schema';
import { useAddImage } from './_hooks/useAddImg';
import { DialogClose } from '@radix-ui/react-dialog';
import { useReorderGallery } from './_hooks/useReorderGallery';

type ImgGallery = Database['public']['Tables']['gallery']['Row'];

function Gallery() {
  const { data, isLoading: isDataLoading } = usePics();
  const { register, handleSubmit, reset } = useForm();
  const [newOrder, setNewOrder] = useState<{ id: string; order: number }[]>([]);
  const { addImage, loading: isLoading } = useAddImage();
  const { reorderImages } = useReorderGallery();

  // const { mutate, isLoading } = useMutation(uploadImage, {
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ['gallery'] });
  //     toast.success('Image uploaded successfully');
  //     reset();
  //   },
  //   onError() {
  //     toast.error('Something went wrong');
  //   },
  // });

  const onSubmit = useCallback((data: any) => {
    const image: FileList =
      typeof data.image === 'string' ? data.image : data.image;

    Array.from(image).map((file) =>
      addImage({
        image: file,
        onSuccess: () => {
          reset();
        },
      })
    );
  }, [addImage, reset]);

  const onError = useCallback((errors: any) => {
    console.log(errors);
  }, []);

  const handleReorderImage = useCallback((newOrderIds: string[], gallery: ImgGallery[]) => {
    if (gallery.length === 0) return;

    const newGallery = newOrderIds
      .map((id, index) => {
        const img = gallery.find((img) => img.id === id);

        if (img?.order === index) return;

        return {
          id,
          order: index,
        };
      })
      .filter((img): img is { id: string; order: number } => img !== undefined);

    setNewOrder(newGallery);
  }, []);

  const albumIds = useMemo(() => 
    data ? data.map((img) => String(img.id)) : [], 
  [data]);

  return (
    <div className=" space-y-8 max-md:space-y-2">
      <Header title="Gallery">
        {newOrder.length > 0 && (
          <Button
            className="max-md:h-8 max-md:text-xs"
            onClick={() => {
              reorderImages({ images: newOrder });
            }}
          >
            Save new order
          </Button>
        )}

        <Dialog>
          <DialogTrigger asChild>
            <Button className="max-md:h-8 max-md:text-xs">
              Upload new memories
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload new memories</DialogTitle>
            </DialogHeader>

            <form
              onSubmit={handleSubmit(onSubmit, onError)}
              className="flex flex-col gap-2 bg-white p-6 rounded-md w-full"
            >
              <Input
                {...register('image', {
                  required: 'This field is required',
                })}
                type="file"
                accept="image/*"
                multiple
                className="text-base text-gray-8"
                disabled={isLoading}
                data-testid="gallery-file-input"
              />

              <DialogClose asChild>
                <Button type="submit" disabled={isLoading} data-testid="gallery-upload-submit">
                  {isLoading ? 'Uploading...' : 'Upload'}
                </Button>
              </DialogClose>
            </form>
          </DialogContent>
        </Dialog>
      </Header>

      {isDataLoading ? (
        'loading'
      ) : (
        <SortImage
          album={albumIds}
          onChange={(items) => handleReorderImage(items, (data || []) as any)}
          render={(items) => {
            return (
              <div className="grid grid-cols-4 max-md:grid-cols-3 max-sm:grid-cols-2 gap-2">
                {(items as string[]).map((id) => {
                  const imgData = (data as any)?.find((img: any) => img.id === id);
                  if (!imgData) return null;
                  return (
                    <Fragment key={id}>
                      <AlbumSortItem key={id} id={id}>
                        <GalleryItem
                          id={String(id)}
                          src={imgData.img as string}
                          alt={imgData.name as string}
                          storageName={imgData.storageName as string}
                        />
                      </AlbumSortItem>
                    </Fragment>
                  );
                })}
              </div>
            );
          }}
        />
      )}
    </div>
  );
}

export default Gallery;
