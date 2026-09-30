export type TicketStatus = 'PENDING' | 'VALIDATED';

export interface TicketList {
  id: number;
  name: string;
  prefix: string;
  start_number: number;
  quantity: number;
  total_tickets: number;
  validated_tickets: number;
  remaining_tickets: number;
  created_at: string;
  updated_at: string;
}

export interface Ticket {
  id: number;
  ticket_list_id: number;
  ticket_number: string;
  numeric_number: number;
  list_name: string;
  prefix: string;
  status: TicketStatus;
  validated_at: string | null;
  validated_by: number | null;
  created_at: string;
  updated_at: string;
}

export interface Dashboard {
  total_tickets: number;
  validated_tickets: number;
  remaining_tickets: number;
  validation_rate: number;
  list_count: number;
  lists: TicketList[];
}

export interface Paginated<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}