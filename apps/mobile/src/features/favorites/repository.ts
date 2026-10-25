import { database } from '@/features/storage/database';
import type { SavedRecipe } from '@/types/api';
export const favoritesRepository = {
  list: async () =>
    (await database()).getAllAsync<SavedRecipe>(
      'SELECT recipe_id AS id, title, version FROM favorites ORDER BY title',
    ),
  save: async (recipe: SavedRecipe) =>
    (await database()).runAsync(
      'INSERT OR REPLACE INTO favorites (recipe_id, title, version) VALUES (?, ?, ?)',
      recipe.id,
      recipe.title,
      recipe.version,
    ),
  remove: async (id: string) =>
    (await database()).runAsync('DELETE FROM favorites WHERE recipe_id = ?', id),
};
