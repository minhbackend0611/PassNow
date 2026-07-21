import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import LocationPicker from './LocationPicker';
import { searchLocations } from '../../services/locationService';

vi.mock('../../services/locationService', () => ({
  searchLocations: vi.fn(),
  reverseGeocodeLocation: vi.fn(),
  getLocationProviderLabel: (provider: 'geoapify' | 'photon') =>
    provider === 'geoapify' ? 'Geoapify · OpenStreetMap' : 'Photon · OpenStreetMap',
}));

const searchLocationsMock = vi.mocked(searchLocations);

const makeSuggestion = (overrides: Partial<{
  id: string;
  title: string;
  subtitle: string;
  address: string;
  lat: number;
  lng: number;
}> = {}) => ({
  id: 'place-1',
  title: 'Thư viện Trung tâm ĐHQG-HCM',
  subtitle: 'Linh Trung, Thủ Đức, TP.HCM',
  address: 'Thư viện Trung tâm ĐHQG-HCM, Linh Trung, Thủ Đức, TP.HCM',
  lat: 10.875,
  lng: 106.801,
  provider: 'photon' as const,
  ...overrides,
});

const renderPicker = (props: Partial<React.ComponentProps<typeof LocationPicker>> = {}) => {
  const onAddressChange = vi.fn();
  const onCoordinatesChange = vi.fn();
  const onCoordinatesClear = vi.fn();

  render(
    <LocationPicker
      address=""
      onAddressChange={onAddressChange}
      onCoordinatesChange={onCoordinatesChange}
      onCoordinatesClear={onCoordinatesClear}
      {...props}
    />,
  );

  return { onAddressChange, onCoordinatesChange, onCoordinatesClear };
};

beforeEach(() => {
  searchLocationsMock.mockReset();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('LocationPicker', () => {
  it('requires an explicit campus choice and confirmation for a multi-campus university', () => {
    const callbacks = renderPicker({ userSchool: 'HCMUT' });

    fireEvent.click(screen.getByRole('button', { name: /My university campus/i }));

    expect(screen.getByRole('dialog', { name: 'Choose a meetup campus' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Use this campus' })).toBeDisabled();
    expect(callbacks.onAddressChange).not.toHaveBeenCalled();
    expect(callbacks.onCoordinatesChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('radio', { name: /Cơ sở Dĩ An/i }));
    expect(screen.getByRole('radio', { name: /Cơ sở Dĩ An/i })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    expect(callbacks.onAddressChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'Use this campus' }));

    expect(callbacks.onAddressChange).toHaveBeenCalledOnce();
    expect(callbacks.onAddressChange).toHaveBeenCalledWith(
      'Cơ sở Dĩ An, Khu đô thị ĐHQG-HCM, Phường Đông Hòa, TP. Dĩ An, Bình Dương',
    );
    expect(callbacks.onCoordinatesChange).toHaveBeenCalledWith(10.880491, 106.805372);
    expect(callbacks.onCoordinatesClear).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog', { name: 'Choose a meetup campus' })).not.toBeInTheDocument();
  });

  it('clears the committed address and coordinates as soon as the user edits it', () => {
    const callbacks = renderPicker({
      address: 'Điểm hẹn cũ',
      coordinates: { lat: 10.75, lng: 106.67 },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Change' }));
    const input = screen.getByRole('combobox', { name: /Meetup location/i });
    expect(input).toHaveValue('Điểm hẹn cũ');

    fireEvent.change(input, { target: { value: 'Điểm hẹn mới' } });

    expect(callbacks.onAddressChange).toHaveBeenCalledWith('');
    expect(callbacks.onCoordinatesClear).toHaveBeenCalledOnce();
    expect(callbacks.onCoordinatesChange).not.toHaveBeenCalled();
    expect(screen.getByText('Select another result to confirm the new location.')).toBeVisible();
  });

  it('supports keyboard navigation and only commits the highlighted autocomplete result', async () => {
    vi.useFakeTimers();
    searchLocationsMock.mockResolvedValue([
      makeSuggestion(),
      makeSuggestion({
        id: 'place-2',
        title: 'Nhà văn hóa Sinh viên',
        subtitle: 'Khu đô thị ĐHQG-HCM',
        address: 'Nhà văn hóa Sinh viên, Khu đô thị ĐHQG-HCM, TP.HCM',
        lat: 10.877,
        lng: 106.802,
      }),
    ]);
    const callbacks = renderPicker();
    const input = screen.getByRole('combobox', { name: /Meetup location/i });

    fireEvent.change(input, { target: { value: 'ĐHQG HCM' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });
    expect(screen.getAllByRole('option')).toHaveLength(2);

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(screen.getByRole('option', { name: /Nhà văn hóa Sinh viên/i })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(callbacks.onAddressChange).toHaveBeenCalledWith(
      'Nhà văn hóa Sinh viên, Khu đô thị ĐHQG-HCM, TP.HCM',
    );
    expect(callbacks.onCoordinatesChange).toHaveBeenCalledWith(10.877, 106.802);
  });

  it('aborts an in-flight autocomplete lookup when a newer query starts', async () => {
    vi.useFakeTimers();
    let firstSignal: AbortSignal | undefined;
    searchLocationsMock
      .mockImplementationOnce((_query, options) => {
        firstSignal = options?.signal;
        return new Promise(() => undefined);
      })
      .mockResolvedValueOnce([makeSuggestion({ title: 'Kết quả mới' })]);
    renderPicker();
    const input = screen.getByRole('combobox', { name: /Meetup location/i });

    fireEvent.change(input, { target: { value: 'Truy vấn cũ' } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });
    expect(searchLocationsMock).toHaveBeenCalledTimes(1);
    expect(firstSignal?.aborted).toBe(false);

    fireEvent.change(input, { target: { value: 'Truy vấn mới' } });
    expect(firstSignal?.aborted).toBe(true);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    expect(screen.getByText('Kết quả mới')).toBeVisible();
    expect(searchLocationsMock).toHaveBeenLastCalledWith(
      'Truy vấn mới',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('loads selectable location candidates for a university outside the verified registry', async () => {
    vi.useFakeTimers();
    searchLocationsMock.mockResolvedValue([
      makeSuggestion({
        title: 'Cơ sở chính - Trường Đại học Mở Hà Nội',
        address: 'Cơ sở chính - Trường Đại học Mở Hà Nội, Hà Nội',
      }),
    ]);
    const callbacks = renderPicker({ userSchool: 'Trường Đại học Không Tồn Tại' });

    fireEvent.click(screen.getByRole('button', { name: /My university campus/i }));
    expect(screen.getByRole('dialog', { name: 'Your university campus' })).toBeVisible();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    expect(searchLocationsMock).toHaveBeenCalledWith(
      'Trường Đại học Không Tồn Tại',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    fireEvent.click(screen.getByRole('radio', { name: /Cơ sở chính/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Use this location' }));

    expect(callbacks.onAddressChange).toHaveBeenCalledWith(
      'Cơ sở chính - Trường Đại học Mở Hà Nội, Hà Nội',
    );
    expect(callbacks.onCoordinatesChange).toHaveBeenCalledWith(10.875, 106.801);
  });

  it('commits an official campus address without guessing missing coordinates', () => {
    const callbacks = renderPicker({ userSchool: 'FPT University' });

    fireEvent.click(screen.getByRole('button', { name: /My university campus/i }));
    fireEvent.click(screen.getByRole('radio', { name: /Campus Quy Nhơn/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Use this campus' }));

    expect(callbacks.onAddressChange).toHaveBeenCalledWith(
      'Campus Quy Nhơn, Khu đô thị mới An Phú Thịnh, Phường Quy Nhơn Đông, Gia Lai',
    );
    expect(callbacks.onCoordinatesChange).not.toHaveBeenCalled();
    expect(callbacks.onCoordinatesClear).toHaveBeenCalledOnce();
    expect(searchLocationsMock).not.toHaveBeenCalled();
    expect(screen.getByText(/distance estimates are unavailable/i)).toBeVisible();
  });

  it('does not render a manual map action', () => {
    renderPicker({ userSchool: 'HCMUT' });

    expect(screen.queryByRole('button', { name: /map/i })).not.toBeInTheDocument();
  });
});
