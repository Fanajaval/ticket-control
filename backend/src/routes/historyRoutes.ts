import { Router } from 'express';
import { getValidationHistory } from '../controllers/historyController';

export const historyRoutes = Router();

historyRoutes.get('/', getValidationHistory);