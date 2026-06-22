import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FeedSidebar from './FeedSidebar';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn()
}));

global.fetch = vi.fn().mockResolvedValue({
  json: () => Promise.resolve([
    { country: 'Viet Nam', name: 'BK University' },
    { country: 'Viet Nam', name: 'Other Uni' },
    { country: 'USA', name: 'MIT' }
  ])
});

describe('FeedSidebar', () => {
  it('renders all filter fields correctly', async () => {
    render(<FeedSidebar />);
    
    await waitFor(() => {
      expect(screen.getByText('Textbooks & Books')).toBeInTheDocument();
      expect(screen.getByLabelText('100,000 ₫ - 500,000 ₫')).toBeInTheDocument();
      expect(screen.getByText('All Universities')).toBeInTheDocument();
    });
  });

  it('triggers onFilterChange with form values when clicking Apply Filters', async () => {
    const handleFilterChange = vi.fn();
    render(<FeedSidebar onFilterChange={handleFilterChange} />);

    // Wait for initial render and fetch to settle
    await waitFor(() => {
      expect(screen.getByText('Textbooks & Books')).toBeInTheDocument();
    });

    // Select price range
    const priceRadio = screen.getByLabelText('100,000 ₫ - 500,000 ₫');
    fireEvent.click(priceRadio);

    // Click Category checkbox
    const bookCategoryCheckbox = screen.getByLabelText(/Textbooks & Books/i);
    fireEvent.click(bookCategoryCheckbox);

    // Apply
    const applyBtn = screen.getByRole('button', { name: /Apply Filters/i });
    fireEvent.click(applyBtn);

    expect(handleFilterChange).toHaveBeenCalledWith(expect.objectContaining({
      minPrice: 100000,
      maxPrice: 500000,
      category: 'Books'
    }));
  });

  it('resets values and triggers onFilterChange when clicking Reset All', async () => {
    const handleFilterChange = vi.fn();
    render(
      <FeedSidebar 
        onFilterChange={handleFilterChange} 
        initialFilters={{ category: 'Books' }} 
      />
    );

    // Wait for initial render and fetch to settle
    await waitFor(() => {
      expect(screen.getByText('Textbooks & Books')).toBeInTheDocument();
    });

    const resetBtn = screen.getByRole('button', { name: /Reset All/i });
    fireEvent.click(resetBtn);

    expect(handleFilterChange).toHaveBeenCalledWith({});
  });
});
