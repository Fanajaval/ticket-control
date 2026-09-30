import { ticketListRepository } from '../repositories/ticketListRepository';
import { HttpError } from '../utils/HttpError';

interface CreateTicketListInput {
  name: string;
  prefix: string;
  start_number: number;
  quantity: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseId(value: string): number {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id < 1) {
    throw new HttpError(400, 'Identifiant de liste invalide.');
  }
  return id;
}

function parseCreateInput(value: unknown): CreateTicketListInput {
  if (!isRecord(value)) {
    throw new HttpError(400, 'Les données de la liste sont invalides.');
  }

  const name = typeof value.name === 'string' ? value.name.trim() : '';
  const prefix = typeof value.prefix === 'string' ? value.prefix.trim().toUpperCase() : '';
  const startNumber = value.start_number;
  const quantity = value.quantity;

  if (!name || name.length > 100) {
    throw new HttpError(400, 'Le nom est obligatoire et ne doit pas dépasser 100 caractères.');
  }
  if (!/^[A-Z0-9][A-Z0-9_-]{0,19}$/.test(prefix)) {
    throw new HttpError(400, 'Le préfixe doit contenir de 1 à 20 caractères alphanumériques, tirets ou soulignés.');
  }
  if (!Number.isSafeInteger(startNumber) || (startNumber as number) < 1) {
    throw new HttpError(400, 'Le numéro de départ doit être un entier positif.');
  }
  if (!Number.isSafeInteger(quantity) || (quantity as number) < 1 || (quantity as number) > 100000) {
    throw new HttpError(400, 'Le nombre de billets doit être compris entre 1 et 100000.');
  }
  if (!Number.isSafeInteger((startNumber as number) + (quantity as number) - 1)) {
    throw new HttpError(400, 'La plage de numérotation dépasse la limite autorisée.');
  }

  return { name, prefix, start_number: startNumber as number, quantity: quantity as number };
}

function parseNameUpdate(value: unknown): string {
  if (!isRecord(value) || Object.keys(value).some((key) => key !== 'name')) {
    throw new HttpError(400, 'Seul le nom de la liste peut être modifié après génération.');
  }

  const name = typeof value.name === 'string' ? value.name.trim() : '';
  if (!name || name.length > 100) {
    throw new HttpError(400, 'Le nom est obligatoire et ne doit pas dépasser 100 caractères.');
  }
  return name;
}

async function create(value: unknown) {
  const input = parseCreateInput(value);
  try {
    return await ticketListRepository.createTicketList({
      name: input.name,
      prefix: input.prefix,
      startNumber: input.start_number,
      quantity: input.quantity,
    });
  } catch (error) {
    if (isRecord(error) && error.code === 'ER_DUP_ENTRY') {
      throw new HttpError(409, 'Un ou plusieurs numéros de billet existent déjà.');
    }
    throw error;
  }
}

async function findAll() {
  return ticketListRepository.findAllTicketLists();
}

async function findById(value: string) {
  const list = await ticketListRepository.findTicketListById(parseId(value));
  if (!list) {
    throw new HttpError(404, 'Liste de billets introuvable.');
  }
  return list;
}

async function updateName(idValue: string, body: unknown) {
  const list = await ticketListRepository.updateTicketListName(parseId(idValue), parseNameUpdate(body));
  if (!list) {
    throw new HttpError(404, 'Liste de billets introuvable.');
  }
  return list;
}

async function remove(idValue: string): Promise<void> {
  const removed = await ticketListRepository.deleteTicketList(parseId(idValue));
  if (!removed) {
    throw new HttpError(404, 'Liste de billets introuvable.');
  }
}

export const ticketListService = { create, findAll, findById, updateName, remove };