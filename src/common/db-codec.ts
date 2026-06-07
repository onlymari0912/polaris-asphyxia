const DB_DOT_ESCAPE = '\uFF0E';
const DB_DOLLAR_ESCAPE = '\uFF04';

function encodeDbKey(key: string) {
  return key.replace(/\./g, DB_DOT_ESCAPE).replace(/^\$/g, DB_DOLLAR_ESCAPE);
}

function decodeDbKey(key: string) {
  return key.replace(new RegExp(DB_DOT_ESCAPE, 'g'), '.').replace(new RegExp(`^${DB_DOLLAR_ESCAPE}`), '$');
}

function mapDbKeys(value: any, mapper: (key: string) => string): any {
  if (Array.isArray(value)) {
    return value.map(item => mapDbKeys(item, mapper));
  }
  if (value == null || typeof value !== 'object') {
    return value;
  }

  const result: Record<string, any> = {};
  for (const [key, child] of Object.entries(value)) {
    result[mapper(key)] = mapDbKeys(child, mapper);
  }
  return result;
}

export function encodeDbDocument<T>(value: T): T {
  return mapDbKeys(value, encodeDbKey) as T;
}

export function decodeDbDocument<T>(value: T | null): T | null {
  return value ? (mapDbKeys(value, decodeDbKey) as T) : null;
}

export function decodeDbDocuments<T>(value: T[] | null): T[] | null {
  return value ? value.map(item => decodeDbDocument(item) as T) : null;
}

export function cleanProfileDocument<T extends Record<string, any>>(value: T): T {
  const { _id, __refid, dataId, sourceId, ...document } = value as any;
  return document as T;
}
