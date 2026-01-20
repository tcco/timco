import { Button } from '@/components/ui/button';
import { Download, Trash2 } from 'lucide-react';
import { useState } from 'react';
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
import { useDeleteImage } from '../_hooks/useDeleteImage';
import { useDownloadImage } from '../_hooks/useDownloadImage';

function GalleryItem({
  src,
  alt,
  id,
  storageName,
}: {
  src: string;
  alt: string;
  id: string;
  storageName?: string;
}) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  
  const { removeImage, isDeleting } = useDeleteImage();
  const { download, isDownloading } = useDownloadImage();

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    download({ url: src, fileName: alt || 'photo.jpg' });
  };

  return (
    <div
      className="relative group overflow-hidden rounded-xl border border-neutral-200 aspect-square shadow-sm transition-all hover:shadow-md cursor-pointer"
    >
      <img 
        src={src} 
        alt={alt} 
        className="absolute inset-0 h-full w-full object-cover transition-all duration-500 group-hover:scale-105" 
      />

      {(isDeleting || isDownloading) && (
        <div className="absolute inset-0 bg-white/60 z-30 flex items-center justify-center backdrop-blur-[1px]">
          <Loading size="medium" type="self" />
        </div>
      )}

      {!isDeleting && (
        <div className="absolute inset-0 w-full h-full bg-black/40 p-4 flex flex-col justify-end z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex gap-2 justify-end relative z-40">
              <Button
                size="icon"
                variant="secondary"
                className="h-10 w-10 rounded-full bg-white/90 hover:bg-white text-neutral-800 border-none shadow-lg transition-transform active:scale-90"
                onClick={handleDownload}
                disabled={isDownloading}
                data-testid="download-button"
              >
              <Download size={20} />
            </Button>

            <Button
              size="icon"
              variant="destructive"
              className="h-10 w-10 rounded-full shadow-lg transition-transform active:scale-90"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsAlertOpen(true);
              }}
              disabled={isDeleting}
              data-testid="delete-button"
            >
              <Trash2 size={20} />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this photo?</AlertDialogTitle>
            <AlertDialogDescription>
              This memory will be permanently removed from your gallery. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                removeImage({ id, imageUrl: src, imageName: storageName });
                setIsAlertOpen(false);
              }}
              data-testid="confirm-delete-button"
            >
              Delete Photo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default GalleryItem;
