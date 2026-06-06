export function formatDateTime(date: Date = new Date()) {
  const pad = (value: number) => value.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function parseCompositeId(value?: string | null) {
  const raw = (value || '').toString().trim();
  if (!raw) {
    return {
      raw: '',
      refId: '',
      printedCard: '',
    };
  }

  const [refId, printedCard = ''] = raw.split('|');
  return {
    raw,
    refId: refId.trim(),
    printedCard: printedCard.trim(),
  };
}

export function scalarValue(node: any, fallback = '') {
  if (node == null) {
    return fallback;
  }

  if (typeof node !== 'object') {
    return `${node}`;
  }

  const content = node['@content'];
  if (Array.isArray(content)) {
    if (content.length === 0) {
      return fallback;
    }
    return `${content[0]}`;
  }

  if (content == null) {
    return fallback;
  }

  return `${content}`;
}

export function toInt(value: any, fallback = 0) {
  if (value == null || value === '') {
    return fallback;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  const text = `${value}`.trim().toLowerCase();
  if (text === 'true') {
    return 1;
  }
  if (text === 'false') {
    return 0;
  }

  const parsed = Number.parseInt(text, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

export function toBool(value: any, fallback = false) {
  if (value == null || value === '') {
    return fallback;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const text = `${value}`.trim().toLowerCase();
  if (text === 'true') {
    return true;
  }
  if (text === 'false') {
    return false;
  }

  const parsed = Number.parseInt(text, 10);
  if (!Number.isNaN(parsed)) {
    return parsed > 0;
  }

  return fallback;
}

export function readScalarChildren(
  node: KDataReader | null,
  intFields: Set<string> = new Set(),
  boolFields: Set<string> = new Set()
) {
  const result: Record<string, string | number | boolean> = {};
  if (!node || node.obj == null || typeof node.obj !== 'object') {
    return result;
  }

  for (const [key, value] of Object.entries(node.obj)) {
    if (key === '@attr') {
      continue;
    }

    const text = scalarValue(value);
    if (boolFields.has(key)) {
      result[key] = toBool(text);
    } else if (intFields.has(key)) {
      result[key] = toInt(text);
    } else {
      result[key] = text;
    }
  }

  return result;
}
