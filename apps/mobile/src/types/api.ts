/** Foundation only. Replace endpoint DTOs with generated Ktor OpenAPI types in BL-010. */
export type ApiResponse<T> = { data: T };
export type ApiErrorBody = { code: string; message: string };
export type Page<T> = { items: T[]; nextCursor: string | null };
export type Session = { accessToken: string };
export type SavedRecipe = { id: string; version: number; title: string };
