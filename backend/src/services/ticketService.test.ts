import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ticketRepository } from '../repositories/ticketRepository';
import { ticketService } from './ticketService';

describe('ticketService cancellation flow', () => {
  it('marks a validated ticket as pending when cancelling validation', async () => {
    const originalCancelValidation = ticketRepository.cancelValidation;
    const originalFindById = ticketRepository.findById;

    ticketRepository.cancelValidation = async (id: number) => {
      assert.equal(id, 42);
      return true;
    };
    ticketRepository.findById = async (id: number) => ({
      id,
      ticket_list_id: 1,
      ticket_number: 'TKT-0042',
      numeric_number: 42,
      list_name: 'Pass VIP',
      prefix: 'TKT',
      status: 'PENDING',
      validated_at: null,
      validated_by: null,
      created_at: new Date(),
      updated_at: new Date(),
    });

    try {
      const result = await ticketService.cancelValidation('42');
      assert.equal(result.status, 'PENDING');
      assert.equal(result.ticket_number, 'TKT-0042');
    } finally {
      ticketRepository.cancelValidation = originalCancelValidation;
      ticketRepository.findById = originalFindById;
    }
  });
});
