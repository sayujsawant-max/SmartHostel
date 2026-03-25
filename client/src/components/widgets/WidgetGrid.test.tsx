// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import {
  WIDGET_REGISTRY,
  DEFAULT_LAYOUT,
  type WidgetLayout,
  type WidgetType,
} from './WidgetRegistry';

describe('WidgetRegistry', () => {
  it('has 8 widget types registered', () => {
    const keys = Object.keys(WIDGET_REGISTRY);
    expect(keys).toHaveLength(8);
  });

  it('each widget has required config fields', () => {
    for (const [key, config] of Object.entries(WIDGET_REGISTRY)) {
      expect(config.type).toBe(key);
      expect(config.title).toBeTruthy();
      expect(config.description).toBeTruthy();
      expect(config.icon).toBeTruthy();
      expect(config.defaultSize).toHaveProperty('w');
      expect(config.defaultSize).toHaveProperty('h');
      expect(config.minSize).toHaveProperty('w');
      expect(config.minSize).toHaveProperty('h');
    }
  });

  it('defaultSize is always >= minSize', () => {
    for (const config of Object.values(WIDGET_REGISTRY)) {
      expect(config.defaultSize.w).toBeGreaterThanOrEqual(config.minSize.w);
      expect(config.defaultSize.h).toBeGreaterThanOrEqual(config.minSize.h);
    }
  });

  it('all widget type strings are kebab-case', () => {
    const kebabCaseRegex = /^[a-z]+(-[a-z]+)*$/;
    for (const key of Object.keys(WIDGET_REGISTRY)) {
      expect(key).toMatch(kebabCaseRegex);
    }
  });
});

describe('DEFAULT_LAYOUT', () => {
  it('contains all registered widget types', () => {
    const layoutTypes = DEFAULT_LAYOUT.map((l) => l.type);
    const registryTypes = Object.keys(WIDGET_REGISTRY) as WidgetType[];

    for (const type of registryTypes) {
      expect(layoutTypes).toContain(type);
    }
  });

  it('has correct number of widgets matching the registry', () => {
    expect(DEFAULT_LAYOUT).toHaveLength(Object.keys(WIDGET_REGISTRY).length);
  });

  it('all default layout items are visible', () => {
    for (const item of DEFAULT_LAYOUT) {
      expect(item.isVisible).toBe(true);
    }
  });

  it('each layout item has valid position properties', () => {
    for (const item of DEFAULT_LAYOUT) {
      expect(item.position).toHaveProperty('x');
      expect(item.position).toHaveProperty('y');
      expect(item.position).toHaveProperty('w');
      expect(item.position).toHaveProperty('h');
      expect(item.position.x).toBeGreaterThanOrEqual(0);
      expect(item.position.y).toBeGreaterThanOrEqual(0);
      expect(item.position.w).toBeGreaterThan(0);
      expect(item.position.h).toBeGreaterThan(0);
    }
  });

  it('no two widgets overlap in the default layout', () => {
    const occupied = new Set<string>();

    for (const item of DEFAULT_LAYOUT) {
      const { x, y, w, h } = item.position;
      for (let dx = 0; dx < w; dx++) {
        for (let dy = 0; dy < h; dy++) {
          const key = `${x + dx},${y + dy}`;
          expect(occupied.has(key)).toBe(false);
          occupied.add(key);
        }
      }
    }
  });

  it('handles empty layout gracefully (zero-length array)', () => {
    const emptyLayout: WidgetLayout[] = [];
    expect(emptyLayout).toHaveLength(0);
    expect(emptyLayout.filter((w) => w.isVisible)).toHaveLength(0);
  });

  it('can filter layout to only visible widgets', () => {
    const layout: WidgetLayout[] = [
      { type: 'occupancy-summary', position: { x: 0, y: 0, w: 2, h: 1 }, isVisible: true },
      { type: 'complaint-status', position: { x: 2, y: 0, w: 2, h: 1 }, isVisible: false },
    ];

    const visible = layout.filter((w) => w.isVisible);
    expect(visible).toHaveLength(1);
    expect(visible[0].type).toBe('occupancy-summary');
  });

  it('can remove widget from layout by type', () => {
    const layout = [...DEFAULT_LAYOUT];
    const typeToRemove: WidgetType = 'occupancy-summary';
    const newLayout = layout.filter((w) => w.type !== typeToRemove);

    expect(newLayout).toHaveLength(DEFAULT_LAYOUT.length - 1);
    expect(newLayout.find((w) => w.type === typeToRemove)).toBeUndefined();
  });
});
