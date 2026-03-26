import { InventoryItem, InventoryStatus } from '@models/inventory.model.js';
import { logger } from '@utils/logger.js';

function computeStatus(quantity: number, minStock: number): InventoryStatus {
  if (quantity === 0) return InventoryStatus.OUT_OF_STOCK;
  if (quantity <= minStock) return InventoryStatus.LOW_STOCK;
  return InventoryStatus.IN_STOCK;
}

export async function getInventory() {
  const items = await InventoryItem.find().sort({ name: 1 }).lean();
  // Re-compute status in case data was modified outside the save hook
  return items.map((item) => ({
    ...item,
    status: computeStatus(item.quantity, item.minStock),
  }));
}

export async function addItem(data: {
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  unit: string;
  location: string;
}) {
  const item = await InventoryItem.create({
    ...data,
    lastRestocked: new Date(),
  });

  logger.info({ itemId: item._id, name: data.name }, 'Inventory item created');

  return item;
}

export async function getStats() {
  const items = await InventoryItem.find().lean();

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const categories = new Set(items.map((i) => i.category)).size;
  let lowStock = 0;
  let outOfStock = 0;

  for (const item of items) {
    const status = computeStatus(item.quantity, item.minStock);
    if (status === InventoryStatus.LOW_STOCK) lowStock++;
    else if (status === InventoryStatus.OUT_OF_STOCK) outOfStock++;
  }

  return { totalItems, categories, lowStock, outOfStock };
}
