import cors from 'cors';
import express from 'express';
import { healthRoutes } from './routes/healthRoutes';
import { dashboardRoutes } from './routes/dashboardRoutes';
import { historyRoutes } from './routes/historyRoutes';
import { ticketRoutes } from './routes/ticketRoutes';
import { ticketListRoutes } from './routes/ticketListRoutes';
import { errorMiddleware } from './middlewares/errorMiddleware';

export const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/health', healthRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/ticket-lists', ticketListRoutes);
app.use('/api/tickets', ticketRoutes);
app.use(errorMiddleware);