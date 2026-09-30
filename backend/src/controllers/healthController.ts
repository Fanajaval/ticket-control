import type { Request, Response } from 'express';
import { checkDatabaseConnection } from '../services/healthService';

export async function getHealth(_request: Request, response: Response): Promise<void> {
  try {
    await checkDatabaseConnection();
    response.status(200).json({
      success: true,
      message: 'API et base de données opérationnelles.',
      data: { server: 'ok', database: 'connected' },
    });
  } catch {
    response.status(503).json({
      success: false,
      message: 'API opérationnelle, mais la base de données est indisponible.',
      data: { server: 'ok', database: 'disconnected' },
    });
  }
}