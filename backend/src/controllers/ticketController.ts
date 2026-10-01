import type { Request, Response } from 'express';
import { ticketService } from '../services/ticketService';
import { HttpError } from '../utils/HttpError';

function getTicketId(request: Request): string {
  const id = request.params.id;
  if (typeof id !== 'string') {
    throw new HttpError(400, 'Identifiant de billet invalide.');
  }
  return id;
}

export async function getTickets(request: Request, response: Response): Promise<void> {
  const result = await ticketService.search(request.query as Record<string, unknown>);
  response.status(200).json({ success: true, data: result.tickets, pagination: result.pagination });
}

export async function searchTickets(request: Request, response: Response): Promise<void> {
  const result = await ticketService.search(request.query as Record<string, unknown>, true);
  response.status(200).json({ success: true, data: result.tickets, pagination: result.pagination });
}

export async function getTicket(request: Request, response: Response): Promise<void> {
  const ticket = await ticketService.findById(getTicketId(request));
  response.status(200).json({ success: true, data: ticket });
}

export async function validateTicket(request: Request, response: Response): Promise<void> {
  const ticket = await ticketService.validate(getTicketId(request));
  response.status(200).json({ success: true, message: 'Billet validé avec succès.', data: ticket });
}

export async function cancelTicketValidation(request: Request, response: Response): Promise<void> {
  const ticket = await ticketService.cancelValidation(getTicketId(request));
  response.status(200).json({ success: true, message: 'Validation annulée avec succès.', data: ticket });
}