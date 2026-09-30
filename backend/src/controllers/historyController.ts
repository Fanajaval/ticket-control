import type { Request, Response } from 'express';
import { historyService } from '../services/historyService';

export async function getValidationHistory(request: Request, response: Response): Promise<void> {
  const result = await historyService.search(request.query as Record<string, unknown>);
  response.status(200).json({ success: true, data: result.tickets, pagination: result.pagination });
}