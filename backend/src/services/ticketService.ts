import { ticketRepository, type TicketSearchFilters, type TicketStatus } from '../repositories/ticketRepository';
import { HttpError } from '../utils/HttpError';

function queryString(value: unknown, field: string): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'string') {
    throw new HttpError(400, `Le paramètre ${field} est invalide.`);
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}

function positiveInteger(value: unknown, fallback: number, field: string, maximum: number): number {
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

function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new HttpError(400, 'Identifiant de billet invalide.');
  }
  return id;
}

function parseFilters(query: Record<string, unknown>, requireSearch: boolean): TicketSearchFilters {
  const searchTerm = queryString(query.q, 'q');
  const prefix = queryString(query.prefix, 'prefix')?.toUpperCase();

  if (requireSearch && !searchTerm && !prefix) {
    throw new HttpError(400, 'Le paramètre q ou prefix est obligatoire.');
  }

  const requestedStatus = queryString(query.status, 'status')?.toUpperCase();
  if (requestedStatus && requestedStatus !== 'PENDING' && requestedStatus !== 'VALIDATED') {
    throw new HttpError(400, 'Le statut doit être PENDING ou VALIDATED.');
  }

  if (prefix && !/^[A-Z0-9][A-Z0-9_-]{0,19}$/.test(prefix)) {
    throw new HttpError(400, 'Le préfixe est invalide.');
  }

  return {
    query: searchTerm,
    status: requestedStatus as TicketStatus | undefined,
    prefix,
    page: positiveInteger(query.page, 1, 'page', 1000000),
    limit: positiveInteger(query.limit, 20, 'limit', 100),
  };
}

async function search(query: Record<string, unknown>, requireSearch = false) {
  const filters = parseFilters(query, requireSearch);
  const result = await ticketRepository.search(filters);

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

async function findById(idValue: string) {
  const ticket = await ticketRepository.findById(parseId(idValue));
  if (!ticket) {
    throw new HttpError(404, 'Billet introuvable.');
  }
  return ticket;
}

async function validate(idValue: string) {
  const id = parseId(idValue);
  const validated = await ticketRepository.validatePending(id);
  if (!validated) {
    const ticket = await ticketRepository.findById(id);
    if (!ticket) {
      throw new HttpError(404, 'Billet introuvable.');
    }
    throw new HttpError(409, 'Ce billet a déjà été validé.');
  }

  const ticket = await ticketRepository.findById(id);
  if (!ticket) {
    throw new HttpError(404, 'Billet introuvable.');
  }
  return ticket;
}

async function cancelValidation(idValue: string) {
  const id = parseId(idValue);
  const cancelled = await ticketRepository.cancelValidation(id);
  if (!cancelled) {
    const ticket = await ticketRepository.findById(id);
    if (!ticket) {
      throw new HttpError(404, 'Billet introuvable.');
    }
    throw new HttpError(409, 'Ce billet n’est pas validé.');
  }

  const ticket = await ticketRepository.findById(id);
  if (!ticket) {
    throw new HttpError(404, 'Billet introuvable.');
  }
  return ticket;
}

export const ticketService = { search, findById, validate, cancelValidation };