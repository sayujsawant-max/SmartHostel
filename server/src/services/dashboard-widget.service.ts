import { DashboardWidget } from '../models/dashboard-widget.model.js';

export async function getLayout(userId: string) {
  let widgets = await DashboardWidget.find({ userId }).lean();
  if (widgets.length === 0) {
    // Create default layout
    const defaults = [
      { widgetType: 'OCCUPANCY', position: { x: 0, y: 0, w: 6, h: 4 }, isVisible: true },
      { widgetType: 'COMPLAINTS', position: { x: 6, y: 0, w: 6, h: 4 }, isVisible: true },
      { widgetType: 'NOTICES', position: { x: 0, y: 4, w: 4, h: 3 }, isVisible: true },
      { widgetType: 'LEAVES', position: { x: 4, y: 4, w: 4, h: 3 }, isVisible: true },
      { widgetType: 'VISITORS', position: { x: 8, y: 4, w: 4, h: 3 }, isVisible: true },
    ];
    widgets = await DashboardWidget.insertMany(
      defaults.map(d => ({ ...d, userId }))
    );
  }
  return widgets;
}

export async function saveLayout(userId: string, widgets: Array<{ widgetType: string; position: { x: number; y: number; w: number; h: number }; isVisible: boolean }>) {
  await DashboardWidget.deleteMany({ userId });
  const docs = await DashboardWidget.insertMany(
    widgets.map(w => ({ ...w, userId }))
  );
  return docs;
}

export async function resetLayout(userId: string) {
  await DashboardWidget.deleteMany({ userId });
  return getLayout(userId); // will recreate defaults
}
