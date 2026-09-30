import { historyRepository, type HistoryFilters } from '../repositories/historyRepository';
import { HttpError } from '../utils/HttpError';

function readString(value: unknown, field: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new HttpError(400, `Le paramètre ${field} est invalide.`);
  }
  return value.trim() || undefined;
}

function readDate(value: unknown, field: string): string | undefined {
  const date = readString(value, field);
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new HttpError(400, `Le paramètre ${field} doit respecter le format AAAA-MM-JJ.`);
  }
  if (date) {
    const parsed = new Date(`${date}T00:00:00.000Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) {
      throw new HttpError(400, `Le paramètre ${field} ne correspond pas à une date valide.`);
    }
  }
  return date;
}

function readPage(value: unknown, fallback: number, field: string, maximum: number): number {
  if (value === undefined) {
    return fallback;
  }
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    throw new HttpError(400, `Le paramètre ${field} doit être un entier positif.`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1 || parsed > maximum) {
    throw new HttpError(400, `Le paramètre ${field} doit être compris entre 1 et ${maximum}.`);
  }
  return parsed;
}

async function search(query: Record<string, unknown>) {
  const prefix = readString(query.prefix, 'prefix')?.toUpperCase();
  if (prefix && !/^[A-Z0-9][A-Z0-9_-]{0,19}$/.test(prefix)) {
    throw new HttpError(400, 'Le préfixe est invalide.');
  }

  const from = readDate(query.from, 'from');
  const to = readDate(query.to, 'to');
  if (from && to && from > to) {
    throw new HttpError(400, 'La date de début doit précéder la date de fin.');
  }

  const filters: HistoryFilters = {
    query: readString(query.q, 'q'),
    prefix,
    from,
    to,
    page: readPage(query.page, 1, 'page', 1000000),
    limit: readPage(query.limit, 20, 'limit', 100),
  };
  const result = await historyRepository.search(filters);

  return {
    ...result,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total: result.total,
      totalPages: Math.ceil(result.total / filters.limit),
    },
  };
}

export const historyService = { search };