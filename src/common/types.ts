export type Paginated<T> = {
  data: T[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
};

export function paginated<T>(
  data: T[],
  total: number,
  limit: number,
  offset: number,
): Paginated<T> {
  return { data, meta: { total, limit, offset } };
}
