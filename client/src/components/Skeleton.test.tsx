// @vitest-environment jsdom
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Skeleton, CardSkeleton, TableRowSkeleton, StatSkeleton, PageSkeleton } from './Skeleton';

describe('Skeleton', () => {
  it('renders as a div element', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild;
    expect(el).toBeTruthy();
    expect(el!.tagName).toBe('DIV');
  });

  it('includes the skeleton-premium base CSS class', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild!;
    expect(el.className).toContain('skeleton-premium');
  });

  it('includes the rounded-lg base CSS class', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild!;
    expect(el.className).toContain('rounded-lg');
  });

  it('applies custom className', () => {
    const { container } = render(<Skeleton className="h-4 w-1/3" />);
    const el = container.firstElementChild!;
    expect(el.className).toContain('h-4');
    expect(el.className).toContain('w-1/3');
  });

  it('renders with empty className by default', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstElementChild!;
    // Should have base classes but not break
    expect(el.className).toContain('rounded-lg');
    expect(el.className).toContain('skeleton-premium');
  });
});

describe('CardSkeleton', () => {
  it('renders multiple Skeleton children', () => {
    const { container } = render(<CardSkeleton />);
    const skeletons = container.querySelectorAll('.skeleton-premium');
    expect(skeletons.length).toBeGreaterThanOrEqual(3);
  });
});

describe('TableRowSkeleton', () => {
  it('renders a table row with default 5 columns', () => {
    const { container } = render(
      <table>
        <tbody>
          <TableRowSkeleton />
        </tbody>
      </table>,
    );
    const cells = container.querySelectorAll('td');
    expect(cells.length).toBe(5);
  });

  it('renders a table row with custom column count', () => {
    const { container } = render(
      <table>
        <tbody>
          <TableRowSkeleton cols={3} />
        </tbody>
      </table>,
    );
    const cells = container.querySelectorAll('td');
    expect(cells.length).toBe(3);
  });
});

describe('StatSkeleton', () => {
  it('renders skeleton elements', () => {
    const { container } = render(<StatSkeleton />);
    const skeletons = container.querySelectorAll('.skeleton-premium');
    expect(skeletons.length).toBeGreaterThanOrEqual(2);
  });
});

describe('PageSkeleton', () => {
  it('renders multiple stat and card skeletons', () => {
    const { container } = render(<PageSkeleton />);
    const skeletons = container.querySelectorAll('.skeleton-premium');
    // PageSkeleton includes header skeletons + 4 StatSkeletons + 3 CardSkeletons
    expect(skeletons.length).toBeGreaterThanOrEqual(10);
  });
});
