import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import CreateListingPage from './CreateListingPage';
import { useAuthStore } from '../../../store/useAuthStore';
import * as listingService from '../../../services/listingService';

vi.mock('../../../store/useAuthStore', () => ({
  useAuthStore: vi.fn()
}));

vi.mock('../../../services/listingService', () => ({
  createListing: vi.fn(),
  uploadListingImages: vi.fn().mockResolvedValue(['http://mock-image.com/test.png'])
}));

describe('CreateListingPage', () => {
  const renderWithRouter = (component: React.ReactNode) => {
    return render(<BrowserRouter>{component}</BrowserRouter>);
  };

  it('toggles price input based on listing type', async () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: {
        uid: '123',
        email: 'test@example.com',
        displayName: 'John Doe',
        isProfileComplete: true,
        school: 'Test Uni',
        province: 'Hanoi',
        district: 'Test District',
        emailVerified: true
      },
      isLoading: false,
      setUser: vi.fn(),
      setLoading: vi.fn(),
      initializeAuthListener: vi.fn(),
    });

    renderWithRouter(<CreateListingPage />);

    // By default, 'Sell Item' is selected and price input is enabled
    const sellRadio = screen.getByDisplayValue('sell');
    const freeRadio = screen.getByDisplayValue('free');
    const priceInput = screen.getByPlaceholderText('0');

    expect(sellRadio).toBeChecked();
    expect(priceInput).toBeEnabled();

    // Switch to free
    fireEvent.click(freeRadio);
    expect(freeRadio).toBeChecked();
    
    // In our implementation, we use disabled prop when listingType is 'free'
    expect(priceInput).toBeDisabled();

    // Switch back to sell
    fireEvent.click(sellRadio);
    expect(priceInput).toBeEnabled();
  });

  it('calls createListing with correct data on valid submit', async () => {
    vi.mocked(useAuthStore).mockReturnValue({
      user: {
        uid: '123',
        email: 'test@example.com',
        displayName: 'John Doe',
        isProfileComplete: true,
        school: 'Đại học Bách khoa Hà Nội',
        province: 'Hanoi',
        district: 'Test District',
        emailVerified: true
      },
      isLoading: false,
      setUser: vi.fn(),
      setLoading: vi.fn(),
      initializeAuthListener: vi.fn(),
    });

    vi.mocked(listingService.createListing).mockResolvedValue('new-listing-id');

    renderWithRouter(<CreateListingPage />);

    // Fill form
    fireEvent.change(screen.getByPlaceholderText('e.g., Biology 101 Textbook, 4th Ed.'), { target: { value: 'Test Item' } });
    fireEvent.change(screen.getByPlaceholderText(/Describe any wear and tear/i), { target: { value: 'This is a valid description with enough characters.' } });
    
    fireEvent.click(screen.getByText('Select Category'));
    fireEvent.click(screen.getAllByText('Electronics')[0]);

    fireEvent.click(screen.getByText('Select Condition'));
    fireEvent.click(screen.getAllByText('New')[0]);

    fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '1000' } });

    // Fill required photo
    const file = new File(['dummy content'], 'test.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '1000' } });
    // A single-campus university is preselected, but still requires an explicit confirmation.
    fireEvent.click(screen.getByRole('button', { name: /My university campus/i }));
    expect(screen.getByRole('dialog', { name: 'Choose a meetup campus' })).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Use this campus' }));

    // Submit
    fireEvent.click(screen.getByText('Post Listing'));

    await waitFor(() => {
      expect(listingService.createListing).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Test Item',
        category: 'Electronics',
        condition: 'New',
        price: 1000,
        isFree: false,
        specificAddress: 'Khuôn viên Đại Cồ Việt, Số 1 Đại Cồ Việt, Phường Bạch Mai, Hà Nội',
        description: 'This is a valid description with enough characters.',
        images: ['http://mock-image.com/test.png'],
        coordinates: { lat: 21.00713, lng: 105.84277 },
        sellerId: '123',
        school: 'Đại học Bách khoa Hà Nội',
        district: 'Test District',
        province: 'Hanoi',
      }));
    });
  });
});
