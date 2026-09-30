import type { Request, Response } from 'express';
import { dashboardService } from '../services/dashboardService';

export async function getDashboard(_request: Request, response: Response): Promise<void> {
  const dashboard = await dashboardService.getDashboard();
  response.status(200).json({ success: true, data: dashboard });
}