/**
 * Represents a single category returned from the public-facing API.
 *
 * Important: Does NOT include `status` — that is internal backend workflow data
 * and must not be exposed to the user-facing frontend.
 * Matches UserCategoryResponse from DANANG-1764 backend: id, name, description only.
 */
export interface Category {
  id: number;
  name: string;
  description: string | null;
}
