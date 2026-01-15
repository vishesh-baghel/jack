/**
 * Unit tests for Pagination component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from '@/components/pagination';

describe('Pagination Component', () => {
  describe('Rendering', () => {
    it('should render pagination controls with page info', () => {
      const mockPrev = vi.fn();
      const mockNext = vi.fn();

      render(
        <Pagination
          currentPage={2}
          totalPages={5}
          onPrevPage={mockPrev}
          onNextPage={mockNext}
          hasPrevPage={true}
          hasNextPage={true}
        />
      );

      expect(screen.getByText('2/5')).toBeInTheDocument();
      expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
      expect(screen.getByLabelText('Next page')).toBeInTheDocument();
    });

    it('should show correct page numbers', () => {
      const mockPrev = vi.fn();
      const mockNext = vi.fn();

      render(
        <Pagination
          currentPage={1}
          totalPages={3}
          onPrevPage={mockPrev}
          onNextPage={mockNext}
          hasPrevPage={false}
          hasNextPage={true}
        />
      );

      expect(screen.getByText('1/3')).toBeInTheDocument();
    });

    it('should always render pagination for consistent layout', () => {
      const mockPrev = vi.fn();
      const mockNext = vi.fn();

      render(
        <Pagination
          currentPage={1}
          totalPages={1}
          onPrevPage={mockPrev}
          onNextPage={mockNext}
          hasPrevPage={false}
          hasNextPage={false}
        />
      );

      // Pagination always renders for consistent layout, even with 1 page
      expect(screen.getByText('1/1')).toBeInTheDocument();
      const prevButton = screen.getByLabelText('Previous page');
      const nextButton = screen.getByLabelText('Next page');
      expect(prevButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
    });

    it('should render with disabled buttons when totalPages is 0', () => {
      const mockPrev = vi.fn();
      const mockNext = vi.fn();

      render(
        <Pagination
          currentPage={1}
          totalPages={0}
          onPrevPage={mockPrev}
          onNextPage={mockNext}
          hasPrevPage={false}
          hasNextPage={false}
        />
      );

      // Pagination always renders for consistent layout
      expect(screen.getByText('1/0')).toBeInTheDocument();
      const prevButton = screen.getByLabelText('Previous page');
      const nextButton = screen.getByLabelText('Next page');
      expect(prevButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
    });
  });

  describe('Button States', () => {
    it('should disable previous button when hasPrevPage is false', () => {
      const mockPrev = vi.fn();
      const mockNext = vi.fn();

      render(
        <Pagination
          currentPage={1}
          totalPages={3}
          onPrevPage={mockPrev}
          onNextPage={mockNext}
          hasPrevPage={false}
          hasNextPage={true}
        />
      );

      const prevButton = screen.getByLabelText('Previous page');
      expect(prevButton).toBeDisabled();
    });

    it('should enable previous button when hasPrevPage is true', () => {
      const mockPrev = vi.fn();
      const mockNext = vi.fn();

      render(
        <Pagination
          currentPage={2}
          totalPages={3}
          onPrevPage={mockPrev}
          onNextPage={mockNext}
          hasPrevPage={true}
          hasNextPage={true}
        />
      );

      const prevButton = screen.getByLabelText('Previous page');
      expect(prevButton).not.toBeDisabled();
    });

    it('should disable next button when hasNextPage is false', () => {
      const mockPrev = vi.fn();
      const mockNext = vi.fn();

      render(
        <Pagination
          currentPage={3}
          totalPages={3}
          onPrevPage={mockPrev}
          onNextPage={mockNext}
          hasPrevPage={true}
          hasNextPage={false}
        />
      );

      const nextButton = screen.getByLabelText('Next page');
      expect(nextButton).toBeDisabled();
    });

    it('should enable next button when hasNextPage is true', () => {
      const mockPrev = vi.fn();
      const mockNext = vi.fn();

      render(
        <Pagination
          currentPage={1}
          totalPages={3}
          onPrevPage={mockPrev}
          onNextPage={mockNext}
          hasPrevPage={false}
          hasNextPage={true}
        />
      );

      const nextButton = screen.getByLabelText('Next page');
      expect(nextButton).not.toBeDisabled();
    });

    it('should have both buttons enabled on middle page', () => {
      const mockPrev = vi.fn();
      const mockNext = vi.fn();

      render(
        <Pagination
          currentPage={2}
          totalPages={3}
          onPrevPage={mockPrev}
          onNextPage={mockNext}
          hasPrevPage={true}
          hasNextPage={true}
        />
      );

      expect(screen.getByLabelText('Previous page')).not.toBeDisabled();
      expect(screen.getByLabelText('Next page')).not.toBeDisabled();
    });
  });

  describe('User Interactions', () => {
    it('should call onPrevPage when previous button is clicked', async () => {
      const user = userEvent.setup();
      const mockPrev = vi.fn();
      const mockNext = vi.fn();

      render(
        <Pagination
          currentPage={2}
          totalPages={3}
          onPrevPage={mockPrev}
          onNextPage={mockNext}
          hasPrevPage={true}
          hasNextPage={true}
        />
      );

      const prevButton = screen.getByLabelText('Previous page');
      await user.click(prevButton);

      expect(mockPrev).toHaveBeenCalledTimes(1);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should call onNextPage when next button is clicked', async () => {
      const user = userEvent.setup();
      const mockPrev = vi.fn();
      const mockNext = vi.fn();

      render(
        <Pagination
          currentPage={1}
          totalPages={3}
          onPrevPage={mockPrev}
          onNextPage={mockNext}
          hasPrevPage={false}
          hasNextPage={true}
        />
      );

      const nextButton = screen.getByLabelText('Next page');
      await user.click(nextButton);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockPrev).not.toHaveBeenCalled();
    });

    it('should not call onPrevPage when previous button is disabled', async () => {
      const user = userEvent.setup();
      const mockPrev = vi.fn();
      const mockNext = vi.fn();

      render(
        <Pagination
          currentPage={1}
          totalPages={3}
          onPrevPage={mockPrev}
          onNextPage={mockNext}
          hasPrevPage={false}
          hasNextPage={true}
        />
      );

      const prevButton = screen.getByLabelText('Previous page');

      // Clicking a disabled button shouldn't trigger the callback
      await user.click(prevButton);

      expect(mockPrev).not.toHaveBeenCalled();
    });

    it('should not call onNextPage when next button is disabled', async () => {
      const user = userEvent.setup();
      const mockPrev = vi.fn();
      const mockNext = vi.fn();

      render(
        <Pagination
          currentPage={3}
          totalPages={3}
          onPrevPage={mockPrev}
          onNextPage={mockNext}
          hasPrevPage={true}
          hasNextPage={false}
        />
      );

      const nextButton = screen.getByLabelText('Next page');

      await user.click(nextButton);

      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria labels for screen readers', () => {
      const mockPrev = vi.fn();
      const mockNext = vi.fn();

      render(
        <Pagination
          currentPage={2}
          totalPages={5}
          onPrevPage={mockPrev}
          onNextPage={mockNext}
          hasPrevPage={true}
          hasNextPage={true}
        />
      );

      expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
      expect(screen.getByLabelText('Next page')).toBeInTheDocument();
    });

    it('should indicate disabled state to screen readers', () => {
      const mockPrev = vi.fn();
      const mockNext = vi.fn();

      render(
        <Pagination
          currentPage={1}
          totalPages={3}
          onPrevPage={mockPrev}
          onNextPage={mockNext}
          hasPrevPage={false}
          hasNextPage={true}
        />
      );

      const prevButton = screen.getByLabelText('Previous page');
      expect(prevButton).toHaveAttribute('disabled');
    });
  });

  describe('Edge Cases', () => {
    it('should handle large page numbers', () => {
      const mockPrev = vi.fn();
      const mockNext = vi.fn();

      render(
        <Pagination
          currentPage={99}
          totalPages={100}
          onPrevPage={mockPrev}
          onNextPage={mockNext}
          hasPrevPage={true}
          hasNextPage={true}
        />
      );

      expect(screen.getByText('99/100')).toBeInTheDocument();
    });

    it('should render correctly on last page of 2-page set', () => {
      const mockPrev = vi.fn();
      const mockNext = vi.fn();

      render(
        <Pagination
          currentPage={2}
          totalPages={2}
          onPrevPage={mockPrev}
          onNextPage={mockNext}
          hasPrevPage={true}
          hasNextPage={false}
        />
      );

      expect(screen.getByText('2/2')).toBeInTheDocument();
      expect(screen.getByLabelText('Previous page')).not.toBeDisabled();
      expect(screen.getByLabelText('Next page')).toBeDisabled();
    });
  });
});
