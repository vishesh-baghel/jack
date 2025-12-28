/**
 * Unit tests for UI components
 * Testing component rendering and interactions
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('Button Component', () => {
  it('should render button with text', async () => {
    const { Button } = await import('@/components/ui/button');
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('should apply variant classes', async () => {
    const { Button } = await import('@/components/ui/button');
    const { container } = render(<Button variant="outline">Outline</Button>);
    const button = container.querySelector('button');
    expect(button).toHaveClass('border-2');
  });
});

describe('Card Component', () => {
  it('should render card with content', async () => {
    const { Card, CardHeader, CardTitle, CardContent } = await import('@/components/ui/card');
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
        </CardHeader>
        <CardContent>Test Content</CardContent>
      </Card>
    );
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });
});

describe('Badge Component', () => {
  it('should render badge with text', async () => {
    const { Badge } = await import('@/components/ui/badge');
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });
});

describe('Textarea Component', () => {
  it('should render textarea', async () => {
    const { Textarea } = await import('@/components/ui/textarea');
    render(<Textarea placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });
});

describe('Input Component', () => {
  it('should render input', async () => {
    const { Input } = await import('@/components/ui/input');
    render(<Input placeholder="Enter value" />);
    expect(screen.getByPlaceholderText('Enter value')).toBeInTheDocument();
  });
});
