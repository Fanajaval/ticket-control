import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { database } from '../config/database';

export type TicketStatus = 'PENDING' | 'VALIDATED';

export interface TicketRecord {
  id: number;
  ticket_list_id: number;
  ticket_number: string;
  numeric_number: number;
  list_name: string;
  prefix: string;
  status: TicketStatus;
  validated_at: Date | null;
  validated_by: number | null;
  created_at: Date;
  updated_at: Date;
}

interface TicketRow extends RowDataPacket {
  id: number;
  ticket_list_id: number;
  ticket_number: string;
  numeric_number: number | string;
  list_name: string;
  prefix: string;
  status: TicketStatus;
  validated_at: Date | null;
  validated_by: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface TicketSearchFilters {
  query?: string;
  status?: TicketStatus;
  prefix?: string;
  page: number;
  limit: number;
}

export interface TicketSearchResult {
  tickets: TicketRecord[];
  total: number;
}

const ticketSelect = `
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

function mapTicket(row: TicketRow): TicketRecord {
  return { ...row, id: Number(row.id), ticket_list_id: Number(row.ticket_list_id), numeric_number: Number(row.numeric_number) };
}

function buildWhere(filters: TicketSearchFilters): { clause: string; values: Array<string> } {
  const conditions: string[] = [];
  const values: string[] = [];

  if (filters.query) {
    conditions.push('(ticket.ticket_number LIKE ? OR CAST(ticket.numeric_number AS CHAR) LIKE ?)');
    values.push(`%${filters.query}%`, `%${filters.query}%`);
  }
  if (filters.status) {
    conditions.push('ticket.status = ?');
    values.push(filters.status);
  }
  if (filters.prefix) {
    conditions.push('list.prefix = ?');
    values.push(filters.prefix);
  }

  return { clause: conditions.length ? `WHERE ${conditions.join(' AND ')}` : '', values };
}

async function search(filters: TicketSearchFilters): Promise<TicketSearchResult> {
  const { clause, values } = buildWhere(filters);
  const [rows] = await database.execute<TicketRow[]>(
    `${ticketSelect} ${clause} ORDER BY ticket.numeric_number, ticket.id LIMIT ? OFFSET ?`,
    [...values, filters.limit, (filters.page - 1) * filters.limit],
  );
  const [countRows] = await database.execute<(RowDataPacket & { total: number | string })[]>(
    `SELECT COUNT(*) AS total FROM tickets AS ticket INNER JOIN ticket_lists AS list ON list.id = ticket.ticket_list_id ${clause}`,
    values,
  );

  return { tickets: rows.map(mapTicket), total: Number(countRows[0]?.total ?? 0) };
}

async function findById(id: number): Promise<TicketRecord | null> {
  const [rows] = await database.execute<TicketRow[]>(`${ticketSelect} WHERE ticket.id = ? LIMIT 1`, [id]);
  return rows[0] ? mapTicket(rows[0]) : null;
}

async function validatePending(id: number): Promise<boolean> {
  const [result] = await database.execute<ResultSetHeader>(
    "UPDATE tickets SET status = 'VALIDATED', validated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'PENDING'",
    [id],
  );
  return result.affectedRows === 1;
}

export const ticketRepository = { search, findById, validatePending };