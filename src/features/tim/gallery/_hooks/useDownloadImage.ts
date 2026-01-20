import { useMutation } from 'react-query';
import { downloadImage } from '@/services/galleryApi';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';

export function useDownloadImage() {
    const { mutate: download, isLoading: isDownloading } = useMutation(
        async ({ url, fileName }: { url: string; fileName: string }) => {
            const blob = await downloadImage(url);
            return { blob, fileName };
        },
        {
            onSuccess: ({ blob, fileName }) => {
                saveAs(blob, fileName);
                toast.success('Download started');
            },
            onError: (err: any, variables) => {
                console.error('Download fetch failed, falling back to direct link:', err);
                // Fallback: Use saveAs with URL directly. 
                // This might open in a new tab if it's cross-origin and CORS prevents blob access,
                // but at least the user sees the image.
                if (variables.url) {
                    try {
                        saveAs(variables.url, variables.fileName);
                        toast('Opened in new tab (direct download failed)', { icon: '⚠️' });
                    } catch (fallbackError) {
                        toast.error(`Failed to download image: ${err.message || err}`);
                    }
                } else {
                    toast.error(`Failed to download image: ${err.message || err}`);
                }
            },
        }
    );

    return { download, isDownloading };
}
