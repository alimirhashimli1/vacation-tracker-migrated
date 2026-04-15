import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Modal from './Modal';

describe('Modal', () => {
  const onClose = vi.fn();
  const title = 'Test Modal';
  const children = <div>Modal Content</div>;

  it('is not visible when isOpen is false', () => {
    const { queryByText } = render(
      <Modal isOpen={false} onClose={onClose} title={title}>
        {children}
      </Modal>
    );
    expect(queryByText(title)).not.toBeInTheDocument();
    expect(queryByText('Modal Content')).not.toBeInTheDocument();
  });

  it('is visible when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={onClose} title={title}>
        {children}
      </Modal>
    );
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  it('calls onClose when clicking the close button', () => {
    render(
      <Modal isOpen={true} onClose={onClose} title={title}>
        {children}
      </Modal>
    );
    
    // Find the button with the close icon (X)
    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking the background overlay', () => {
    render(
      <Modal isOpen={true} onClose={onClose} title={title}>
        {children}
      </Modal>
    );
    
    // The background overlay is the outermost div
    // We can find it by its test class or by selecting based on how Modal is rendered
    // In this case, clicking the element with 'fixed' class
    const overlay = screen.getByText(title).closest('.fixed');
    if (overlay) {
        fireEvent.click(overlay);
        expect(onClose).toHaveBeenCalled();
    } else {
        throw new Error('Overlay not found');
    }
  });

  it('does NOT call onClose when clicking the modal content', () => {
    onClose.mockClear();
    render(
      <Modal isOpen={true} onClose={onClose} title={title}>
        {children}
      </Modal>
    );
    
    const content = screen.getByText('Modal Content');
    fireEvent.click(content);
    
    expect(onClose).not.toHaveBeenCalled();
  });
});
