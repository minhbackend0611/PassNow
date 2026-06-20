import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FeedSidebar from './FeedSidebar';

describe('FeedSidebar', () => {
  it('renders all filter fields correctly', () => {
    render(<FeedSidebar />);
    
    expect(screen.getByLabelText(/Keyword Search/i)).toBeInTheDocument();
    expect(screen.getByText('Books & Documents')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Min')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Max')).toBeInTheDocument();
    expect(screen.getByLabelText(/Condition/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/School \/ University/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/District \/ Area/i)).toBeInTheDocument();
  });

  it('triggers onFilterChange with form values when clicking Apply Filters', () => {
    const handleFilterChange = vi.fn();
    render(<FeedSidebar onFilterChange={handleFilterChange} />);

    // Type search keyword
    const searchInput = screen.getByLabelText(/Keyword Search/i);
    fireEvent.change(searchInput, { target: { value: 'laptop' } });

    // Set price range
    const minInput = screen.getByPlaceholderText('Min');
    fireEvent.change(minInput, { target: { value: '100' } });
    
    const maxInput = screen.getByPlaceholderText('Max');
    fireEvent.change(maxInput, { target: { value: '500' } });

    // Click Category badge
    const bookCategoryBtn = screen.getByRole('button', { name: /Books & Documents/i });
    fireEvent.click(bookCategoryBtn);

    // Apply
    const applyBtn = screen.getByRole('button', { name: /Apply Filters/i });
    fireEvent.click(applyBtn);

    expect(handleFilterChange).toHaveBeenCalledWith(expect.objectContaining({
      searchQuery: 'laptop',
      minPrice: 100,
      maxPrice: 500,
      category: 'books'
    }));
  });

  it('resets values and triggers onFilterChange when clicking Reset All', () => {
    const handleFilterChange = vi.fn();
    render(
      <FeedSidebar 
        onFilterChange={handleFilterChange} 
        initialFilters={{ searchQuery: 'book', category: 'books' }} 
      />
    );

    expect(screen.getByLabelText(/Keyword Search/i)).toHaveValue('book');

    const resetBtn = screen.getByRole('button', { name: /Reset All/i });
    fireEvent.click(resetBtn);

    expect(screen.getByLabelText(/Keyword Search/i)).toHaveValue('');
    expect(handleFilterChange).toHaveBeenCalledWith({});
  });
});
