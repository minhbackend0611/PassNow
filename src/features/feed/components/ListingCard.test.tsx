import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import ListingCard from './ListingCard';
import type { Listing } from '../../../types';

describe('ListingCard', () => {
  const renderWithRouter = (component: React.ReactNode) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  const mockPricedListing: Listing = {
    id: '1',
    title: 'Calculus Textbook',
    description: 'Good condition',
    price: 250,
    isFree: false,
    condition: 'Used',
    images: ['test.jpg'],
    category: 'Books',
    school: 'Test Uni',
    district: 'Hai Ba Trung',
    province: 'Ha Noi',
    status: 'available' as const,
    updatedAt: new Date().toISOString(),
    sellerId: 'user1',
    createdAt: Date.now()
  };

  const mockFreeListing: Listing = {
    ...mockPricedListing,
    id: '2',
    title: 'Free Desk',
    price: 0,
    isFree: true,
  };

  it('renders a priced listing correctly', () => {
    renderWithRouter(<ListingCard listing={mockPricedListing} />);
    
    expect(screen.getByText('Calculus Textbook')).toBeInTheDocument();
    expect(screen.getByText('Used')).toBeInTheDocument();
    expect(screen.getByText('250 ₫')).toBeInTheDocument();
    expect(screen.getByText('Test Uni')).toBeInTheDocument();
  });

  it('renders a free listing correctly with FREE badge', () => {
    renderWithRouter(<ListingCard listing={mockFreeListing} />);
    
    expect(screen.getByText('Free Desk')).toBeInTheDocument();
    expect(screen.getByText('FREE')).toBeInTheDocument();
    expect(screen.getByText('0 ₫')).toBeInTheDocument();
  });
});
