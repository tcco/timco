import { Button } from '@/components/ui/button';
import { deleteImage, downloadImage } from '@/services/galleryApi';
import { Download, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useMutation, useQueryClient } from 'react-query';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Loading from '@/components/Loading';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';

function GalleryItem({
  src,
  alt,
  id,
}: {
  src: string;
  alt: string;
  id: string;
}) {
  const queryClient = useQueryClient();
  const [show, setShow] = useState(false);
  const [open, setOpen] = useState(false);

  const { mutate, isLoading: isDeleting } = useMutation(deleteImage, {
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      toast.success('Image deleted successfully');
    },
    onError: (err: any) => {
      toast.error('Failed to delete image');
      console.error(err);
    },
  });

  const { mutate: download, isLoading: isDownloading } = useMutation(
    downloadImage,
    {
      onSuccess: (data) => saveAs(data),
      onError: () => {
        toast.error('Failed to download image');
      },
    }
  );

  return (
    <div
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => !open && setShow(false)}
      className="relative group overflow-hidden rounded-md border border-slate-200 aspect-square"
    >
      <img src={src} alt={alt} className="absolute inset-0 h-full w-full object-cover transition-all duration-300 group-hover:scale-110" />

      {isDeleting && (
        <div className="absolute inset-0 bg-slate-900/60 z-30 flex items-center justify-center backdrop-blur-[2px]">
          <Loading size="medium" type="self" />
        </div>
      )}

      {show && (
        <div className="absolute inset-0 w-full h-full bg-black/40 p-3 flex flex-col justify-end z-20 group-hover:bg-black/60 transition-colors">
          <div className="flex gap-2 justify-end">
            <Button
              size={'icon'}
              variant={'secondary'}
              className="h-9 w-9 rounded-full bg-white/20 hover:bg-white/40 text-white border-none backdrop-blur-sm"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                const fileName = src.split('/').at(-1)?.split('?')[0];
                if (fileName) download(decodeURIComponent(fileName));
                else download(src);
              }}
            >
              {isDownloading ? (
                <Loading size="small" type="self" />
              ) : (
                <Download className="w-5 h-5" />
              )}
            </Button>

            <Button
              size={'icon'}
              variant={'destructive'}
              className="h-9 w-9 rounded-full bg-red-500/80 hover:bg-red-600 text-white border-none backdrop-blur-sm"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setOpen(true);
              }}
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent onPointerDown={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this memory?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The photo will be permanently removed from your gallery and storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={(e) => {
                e.stopPropagation();
                mutate({ id, imageUrl: src });
                setOpen(false);
              }}
            >
              Confirm Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default GalleryItem;
