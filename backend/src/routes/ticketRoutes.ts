import { Router } from 'express';
import { getTicket, getTickets, searchTickets, validateTicket } from '../controllers/ticketController';

export const ticketRoutes = Router();

ticketRoutes.get('/search', searchTickets);
ticketRoutes.post('/:id/validate', validateTicket);
ticketRoutes.get('/:id', getTicket);
ticketRoutes.get('/', getTickets);