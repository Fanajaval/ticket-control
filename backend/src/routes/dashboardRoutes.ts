import { Router } from 'express';
import { getDashboard } from '../controllers/dashboardController';

export const dashboardRoutes = Router();

dashboardRoutes.get('/', getDashboard);