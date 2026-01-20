import '@/test/firebaseMock';
import { render, screen, fireEvent, waitFor } from '@/test/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Section from './section';
import * as currentApi from '../currentApi';
import { Section as SectionType, Item } from '../_types/types';

vi.mock('../currentApi');

const mockSection: SectionType = {
  id: 'sec1',
  title: 'Test Section',
  created_at: new Date().toISOString(),
};

const mockItems: Item[] = [
  { id: 'item1', title: 'Item 1', section_id: 'sec1', order: 0, description: '', link: '', created_at: '' },
  { id: 'item2', title: 'Item 2', section_id: 'sec1', order: 1, description: '', link: '', created_at: '' }
];

describe('Section Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(currentApi.getItems).mockResolvedValue(mockItems);
  });

  it('renders section title and items', async () => {
    render(<Section section={mockSection} />);
    
    expect(screen.getByText('Test Section')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('- Item 1')).toBeInTheDocument();
      expect(screen.getByText('- Item 2')).toBeInTheDocument();
    });
  });

  it('calls addItem when adding a new item', async () => {
    vi.mocked(currentApi.addItem).mockResolvedValue([{ 
        id: 'new-item', 
        title: 'New Test Item',
        section_id: 'sec1',
        description: '',
        link: '',
        order: 2,
    }] as any);
    
    render(<Section section={mockSection} />);
    
    const addButton = screen.getByText('Add Item');
    fireEvent.click(addButton);
    
    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'New Test Item' } });
    
    const submitButton = screen.getByRole('button', { name: /add/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(currentApi.addItem).toHaveBeenCalledWith(expect.objectContaining({
        title: 'New Test Item',
        section_id: 'sec1'
      }));
    });
  });

  it('calls deleteItem when deleting an item', async () => {
    vi.mocked(currentApi.deleteItem).mockResolvedValue([{ id: 'item1' }]);
    
    render(<Section section={mockSection} />);
    
    await waitFor(() => {
      expect(screen.getByText('- Item 1')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button');
    const item1DeleteBtn = deleteButtons.find(btn => btn.className.includes('bg-red-500'));
    fireEvent.click(item1DeleteBtn!);

    const continueButton = screen.getByText('Continue');
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(currentApi.deleteItem).toHaveBeenCalledWith('item1');
    });
  });
});
