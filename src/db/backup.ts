import { db, userTables } from './schema';

export async function exportAll() {
  const data: Record<string, unknown[]> = {};
  for (const t of userTables) data[t] = await db.table(t).toArray();
  return { app: 'gita-companion', version: 1, exportedAt: new Date().toISOString(), data };
}

export function downloadJson(obj: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** Merge import: newer updatedAt wins, so importing the same backup twice is harmless. */
export async function importAll(json: unknown) {
  const j = json as { app?: string; data?: Record<string, Array<Record<string, unknown>>> };
  if (j?.app !== 'gita-companion' || !j.data) throw new Error('This file is not a Gita Companion backup.');
  let count = 0;
  await db.transaction('rw', userTables.map((t) => db.table(t)), async () => {
    for (const t of userTables) {
      const table = db.table(t);
      const pk = table.schema.primKey.keyPath as string;
      for (const row of j.data![t] ?? []) {
        const existing = await table.get(row[pk] as string);
        if (!existing || t === 'settings' || ((row.updatedAt as number) ?? 0) >= ((existing.updatedAt as number) ?? 0)) {
          await table.put(row); count++;
        }
      }
    }
  });
  return count;
}

export async function clearAll() {
  for (const t of userTables) await db.table(t).clear();
}
