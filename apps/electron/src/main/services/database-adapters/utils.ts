let idCounter = 0;
export function generateId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${idCounter}_${Math.random().toString(36).substring(2, 9)}`;
}
