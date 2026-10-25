import { Directory, File, Paths } from 'expo-file-system';
function recipeDirectory(id: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error('Invalid recipe ID');
  return new Directory(Paths.document, 'recipes', id);
}
// Only pass reviewed content with permission to store offline. Images are handled separately.
export function writeRecipeFile(id: string, version: number, content: unknown) {
  const directory = recipeDirectory(id);
  directory.create({ intermediates: true, idempotent: true });
  const file = new File(directory, 'recipe.json');
  file.write(JSON.stringify({ version, savedAt: new Date().toISOString(), content }));
  return file.uri;
}
export function readRecipeFile(id: string): Promise<string> {
  return new File(recipeDirectory(id), 'recipe.json').text();
}
export function deleteRecipeFiles(id: string) {
  const directory = recipeDirectory(id);
  if (directory.exists) directory.delete();
}
