import type { RowDataPacket } from 'mysql2';
import { database } from '../config/database';
import type { TicketRecord } from './ticketRepository';

export interface HistoryFilters {
  query?: string;
  prefix?: string;
  from?: string;
  to?: string;
  page: number;
  limit: number;
}

interface HistoryRow extends RowDataPacket {
  id: number;
  ticket_list_id: number;
  ticket_number: string;
  numeric_number: number | string;
  list_name: string;
  prefix: string;
  status: 'VALIDATED';
  validated_at: Date;
  validated_by: number | null;
  created_at: Date;
  updated_at: Date;
}

function mapTicket(row: HistoryRow): TicketRecord {
  return {
    ...row,
    id: Number(row.id),
    ticket_list_id: Number(row.ticket_list_id),
    numeric_number: Number(row.numeric_number),
  };
}

function buildWhere(filters: HistoryFilters): { clause: string; values: string[] } {
  const conditions = ["ticket.status = 'VALIDATED'"];
  const values: string[] = [];

  if (filters.query) {
    conditions.push('(ticket.ticket_number LIKE ? OR CAST(ticket.numeric_number AS CHAR) LIKE ?)');
    values.push(`%${filters.query}%`, `%${filters.query}%`);
  }
  if (filters.prefix) {
    conditions.push('list.prefix = ?');
    values.push(filters.prefix);
  }
  if (filters.from) {
    conditions.push('ticket.validated_at >= ?');
    values.push(`${filters.from} 00:00:00`);
  }
  if (filters.to) {
    conditions.push('ticket.validated_at < DATE_ADD(?, INTERVAL 1 DAY)');
    values.push(filters.to);
  }

  return { clause: `WHERE ${conditions.join(' AND ')}`, values };
}

async function search(filters: HistoryFilters): Promise<{ tickets: TicketRecord[]; total: number }> {
  const { clause, values } = buildWhere(filters);
  const select = `
    SELECT
      ticket.id,
      ticket.ticket_list_id,
      ticket.ticket_number,
      ticket.numeric_number,
      list.name AS list_name,
      list.prefix,
      ticket.status,
      ticket.validated_at,
      ticket.validated_by,
      ticket.created_at,
      ticket.updated_at
    FROM tickets AS ticket
    INNER JOIN ticket_lists AS list ON list.id = ticket.ticket_list_id`;
  const [rows] = await database.execute<HistoryRow[]>(
    `${select} ${clause} ORDER BY ticket.validated_at DESC, ticket.id DESC LIMIT ? OFFSET ?`,
    [...values, filters.limit, (filters.page - 1) * filters.limit],
  );
  const [countRows] = await database.execute<(RowDataPacket & { total: number | string })[]>(
    `SELECT COUNT(*) AS total FROM tickets AS ticket INNER JOIN ticket_lists AS list ON list.id = ticket.ticket_list_id ${clause}`,
    values,
  );

  return { tickets: rows.map(mapTicket), total: Number(countRows[0]?.total ?? 0) };
}

export const historyRepository = { search };