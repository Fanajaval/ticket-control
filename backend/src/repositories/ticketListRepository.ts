import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import type { PoolConnection } from 'mysql2/promise';
import { database } from '../config/database';

export interface TicketListSummary {
  id: number;
  name: string;
  prefix: string;
  start_number: number;
  quantity: number;
  total_tickets: number;
  validated_tickets: number;
  remaining_tickets: number;
  created_at: Date;
  updated_at: Date;
}

interface TicketListRow extends RowDataPacket {
  id: number;
  name: string;
  prefix: string;
  start_number: number | string;
  quantity: number;
  total_tickets: number | string;
  validated_tickets: number | string;
  remaining_tickets: number | string;
  created_at: Date;
  updated_at: Date;
}

const summaryQuery = `
  SELECT
    list.id,
    list.name,
    list.prefix,
    list.start_number,
    list.quantity,
    list.quantity AS total_tickets,
    COALESCE(SUM(ticket.status = 'VALIDATED'), 0) AS validated_tickets,
    GREATEST(list.quantity - COALESCE(SUM(ticket.status = 'VALIDATED'), 0), 0) AS remaining_tickets,
    list.created_at,
    list.updated_at
  FROM ticket_lists AS list
  LEFT JOIN tickets AS ticket ON ticket.ticket_list_id = list.id`;

function mapSummary(row: TicketListRow): TicketListSummary {
  return {
    ...row,
    id: Number(row.id),
    start_number: Number(row.start_number),
    quantity: Number(row.quantity),
    total_tickets: Number(row.total_tickets),
    validated_tickets: Number(row.validated_tickets),
    remaining_tickets: Number(row.remaining_tickets),
  };
}

async function insertTickets(
  connection: PoolConnection,
  listId: number,
  prefix: string,
  startNumber: number,
  quantity: number,
): Promise<void> {
  const lastNumber = startNumber + quantity - 1;
  const numberWidth = Math.max(4, String(lastNumber).length);
  const batchSize = 500;

  for (let offset = 0; offset < quantity; offset += batchSize) {
    const batchLength = Math.min(batchSize, quantity - offset);
    const placeholders = Array.from({ length: batchLength }, () => '(?, ?, ?)').join(', ');
    const values: Array<number | string> = [];

    for (let index = 0; index < batchLength; index += 1) {
      const numericNumber = startNumber + offset + index;
      values.push(listId, `${prefix}${String(numericNumber).padStart(numberWidth, '0')}`, numericNumber);
    }

    await connection.execute<ResultSetHeader>(
      `INSERT INTO tickets (ticket_list_id, ticket_number, numeric_number) VALUES ${placeholders}`,
      values,
    );
  }
}

async function createTicketList(input: {
  name: string;
  prefix: string;
  startNumber: number;
  quantity: number;
}): Promise<TicketListSummary | null> {
  const connection = await database.getConnection();
  let transactionStarted = false;

  try {
    await connection.beginTransaction();
    transactionStarted = true;

    const [result] = await connection.execute<ResultSetHeader>(
      'INSERT INTO ticket_lists (name, prefix, start_number, quantity) VALUES (?, ?, ?, ?)',
      [input.name, input.prefix, input.startNumber, input.quantity],
    );

    await insertTickets(connection, result.insertId, input.prefix, input.startNumber, input.quantity);
    await connection.commit();
    transactionStarted = false;

    return findTicketListById(result.insertId);
  } catch (error) {
    if (transactionStarted) {
      await connection.rollback();
    }
    throw error;
  } finally {
    connection.release();
  }
}

async function findAllTicketLists(): Promise<TicketListSummary[]> {
  const [rows] = await database.query<TicketListRow[]>(
    `${summaryQuery} GROUP BY list.id ORDER BY list.created_at DESC, list.id DESC`,
  );
  return rows.map(mapSummary);
}

async function findTicketListById(id: number): Promise<TicketListSummary | null> {
  const [rows] = await database.execute<TicketListRow[]>(
    `${summaryQuery} WHERE list.id = ? GROUP BY list.id`,
    [id],
  );
  return rows[0] ? mapSummary(rows[0]) : null;
}

async function updateTicketListName(id: number, name: string): Promise<TicketListSummary | null> {
  await database.execute('UPDATE ticket_lists SET name = ? WHERE id = ?', [name, id]);
  return findTicketListById(id);
}

async function deleteTicketList(id: number): Promise<boolean> {
  const [result] = await database.execute<ResultSetHeader>('DELETE FROM ticket_lists WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

export const ticketListRepository = {
  createTicketList,
  findAllTicketLists,
  findTicketListById,
  updateTicketListName,
  deleteTicketList,
};