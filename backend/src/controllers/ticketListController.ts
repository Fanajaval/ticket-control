import type { Request, Response } from 'express';
import { ticketListService } from '../services/ticketListService';
import { HttpError } from '../utils/HttpError';

function getListId(request: Request): string {
  const id = request.params.id;
  if (typeof id !== 'string') {
    throw new HttpError(400, 'Identifiant de liste invalide.');
  }
  return id;
}

export async function createTicketList(request: Request, response: Response): Promise<void> {
  const list = await ticketListService.create(request.body);
  response.status(201).json({ success: true, message: 'Liste créée et billets générés.', data: list });
}

export async function getTicketLists(_request: Request, response: Response): Promise<void> {
  const lists = await ticketListService.findAll();
  response.status(200).json({ success: true, data: lists });
}

export async function getTicketList(request: Request, response: Response): Promise<void> {
  const list = await ticketListService.findById(getListId(request));
  response.status(200).json({ success: true, data: list });
}

export async function updateTicketList(request: Request, response: Response): Promise<void> {
  const list = await ticketListService.updateName(getListId(request), request.body);
  response.status(200).json({ success: true, message: 'Liste mise à jour.', data: list });
}

export async function deleteTicketList(request: Request, response: Response): Promise<void> {
  await ticketListService.remove(getListId(request));
  response.status(200).json({ success: true, message: 'Liste et billets supprimés.' });
}