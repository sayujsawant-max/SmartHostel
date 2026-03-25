import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '@services/api';
import { DEFAULT_LAYOUT, WIDGET_REGISTRY } from '@/components/widgets/WidgetRegistry';
import type { WidgetLayout, WidgetType } from '@/components/widgets/WidgetRegistry';

const STORAGE_KEY = 'smarthostel-widget-layout';

function loadFromStorage(): WidgetLayout[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WidgetLayout[];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveToStorage(layout: WidgetLayout[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // storage full — ignore
  }
}

export function useWidgetLayout() {
  const [layout, setLayout] = useState<WidgetLayout[]>(
    () => loadFromStorage() ?? DEFAULT_LAYOUT,
  );
  const [isEditing, setIsEditing] = useState(false);

  // Persist to localStorage on every change
  useEffect(() => {
    saveToStorage(layout);
  }, [layout]);

  // Optional backend sync — fire-and-forget, ignore failures
  useEffect(() => {
    apiFetch('/admin/dashboard-widgets', {
      method: 'POST',
      body: JSON.stringify({ layout }),
    }).catch(() => {
      // 404 or any error — silently ignore
    });
  }, [layout]);

  const updateLayout = useCallback((next: WidgetLayout[]) => {
    setLayout(next);
  }, []);

  const addWidget = useCallback((type: WidgetType) => {
    setLayout((prev) => {
      if (prev.some((w) => w.type === type)) return prev;
      const config = WIDGET_REGISTRY[type];
      // Place at end: find max y, append below
      const maxY = prev.reduce((m, w) => Math.max(m, w.position.y + w.position.h), 0);
      return [
        ...prev,
        {
          type,
          position: { x: 0, y: maxY, w: config.defaultSize.w, h: config.defaultSize.h },
          isVisible: true,
        },
      ];
    });
  }, []);

  const removeWidget = useCallback((type: WidgetType) => {
    setLayout((prev) => prev.filter((w) => w.type !== type));
  }, []);

  const resetLayout = useCallback(() => {
    setLayout(DEFAULT_LAYOUT);
  }, []);

  return {
    layout,
    updateLayout,
    addWidget,
    removeWidget,
    resetLayout,
    isEditing,
    setIsEditing,
  };
}
