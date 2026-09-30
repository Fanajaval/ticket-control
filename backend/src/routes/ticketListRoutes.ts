import { Router } from 'express';
import {
  createTicketList,
  deleteTicketList,
  getTicketList,
  getTicketLists,
  updateTicketList,
} from '../controllers/ticketListController';

export const ticketListRoutes = Router();

ticketListRoutes.get('/', getTicketLists);
ticketListRoutes.get('/:id', getTicketList);
ticketListRoutes.post('/', createTicketList);
ticketListRoutes.put('/:id', updateTicketList);
ticketListRoutes.delete('/:id', deleteTicketList);