import { database } from '@/features/storage/database';
export type ShoppingItem = {
  id: number;
  name: string;
  quantity: string;
  unit: string | null;
  purchased: number;
};
export const shoppingRepository = {
  list: async () =>
    (await database()).getAllAsync<ShoppingItem>('SELECT * FROM shopping_items ORDER BY id'),
  add: async (name: string, quantity: string, unit: string | null) =>
    (await database()).runAsync(
      'INSERT INTO shopping_items (name, quantity, unit) VALUES (?, ?, ?)',
      name,
      quantity,
      unit,
    ),
  setPurchased: async (id: number, purchased: boolean) =>
    (await database()).runAsync(
      'UPDATE shopping_items SET purchased = ? WHERE id = ?',
      purchased ? 1 : 0,
      id,
    ),
  remove: async (id: number) =>
    (await database()).runAsync('DELETE FROM shopping_items WHERE id = ?', id),
};
