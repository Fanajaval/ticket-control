import { Router } from 'express';
import { cancelTicketValidation, getTicket, getTickets, searchTickets, validateTicket } from '../controllers/ticketController';

export const ticketRoutes = Router();

ticketRoutes.get('/search', searchTickets);
ticketRoutes.post('/:id/validate', validateTicket);
ticketRoutes.delete('/:id/validate', cancelTicketValidation);
ticketRoutes.get('/:id', getTicket);
ticketRoutes.get('/', getTickets);