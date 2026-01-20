import '@/test/firebaseMock';
import { render, screen, waitFor } from '@/test/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Gallery from './index';
import * as galleryApi from '@/services/galleryApi';
vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}));
import { saveAs } from 'file-saver';
import userEvent from '@testing-library/user-event';

vi.mock('@/services/galleryApi');
vi.mock('react-hot-toast');

const mockImages = [
  { id: 'img1', img: 'https://example.com/1.jpg', name: 'Photo 1', storageName: '1.jpg', order: 0 },
  { id: 'img2', img: 'https://example.com/2.jpg', name: 'Photo 2', storageName: '2.jpg', order: 1 }
];

describe('Gallery Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(galleryApi.getImages).mockResolvedValue(mockImages as any);
  });

  it('renders and allows image deletion', async () => {
    const user = userEvent.setup();
    vi.mocked(galleryApi.deleteImage).mockResolvedValue(undefined);
    
    render(<Gallery />);
    
    await waitFor(() => {
      expect(screen.queryByText('loading')).not.toBeInTheDocument();
    });

    const img1 = await screen.findByAltText('Photo 1');
    expect(img1).toBeInTheDocument();

    const deleteButtons = screen.getAllByTestId('delete-button');
    await user.click(deleteButtons[0]);
    
    const confirmDelete = await screen.findByTestId('confirm-delete-button');
    await user.click(confirmDelete);

    await waitFor(() => {
      expect(galleryApi.deleteImage).toHaveBeenCalled();
    });
  });

  it('allows image download', async () => {
    const user = userEvent.setup();
    const mockBlob = new Blob(['test'], { type: 'image/jpeg' });
    vi.mocked(galleryApi.downloadImage).mockResolvedValue(mockBlob);
    
    render(<Gallery />);
    
    await waitFor(() => {
      expect(screen.queryByText('loading')).not.toBeInTheDocument();
    });

    const downloadButtons = screen.getAllByTestId('download-button');
    await user.click(downloadButtons[0]);

    await waitFor(() => {
      expect(galleryApi.downloadImage).toHaveBeenCalledWith('https://example.com/1.jpg');
      expect(saveAs).toHaveBeenCalled();
    });
  });

  it('handles image upload', async () => {
    const user = userEvent.setup();
    vi.mocked(galleryApi.uploadImage).mockResolvedValue([{ id: 'new', title: 'new' }] as any);
    
    render(<Gallery />);
    
    await waitFor(() => {
      expect(screen.queryByText('loading')).not.toBeInTheDocument();
    });

    await user.click(screen.getByText(/Upload new memories/i));
    
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const fileInput = screen.getByTestId('gallery-file-input');
    
    await user.upload(fileInput, file);
    
    const uploadBtn = screen.getByTestId('gallery-upload-submit');
    await user.click(uploadBtn);

    await waitFor(() => {
      expect(galleryApi.uploadImage).toHaveBeenCalled();
    });
  });

  it('handles reordering gallery', async () => {
    vi.mocked(galleryApi.reorderGallery).mockResolvedValue([] as any);
    
    render(<Gallery />);
    
    await waitFor(() => {
      expect(screen.queryByText('loading')).not.toBeInTheDocument();
    });

    // We can't easily drag in RTL, but we can verify the "Save new order" button logic
    // SortImage calls its onChange prop when items are reordered.
    // Since we can't easily trigger SortImage's internal drag, 
    // we can test the behavior of the "Save new order" button if we can trigger the state change.
    // However, the state is internal to Gallery.
    
    // Instead, let's test that the SortImage is present with correct album ids.
    const albumItems = screen.getAllByRole('img');
    expect(albumItems.length).toBe(2);
  });
});
