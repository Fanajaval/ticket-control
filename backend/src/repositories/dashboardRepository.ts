import { ticketListRepository } from './ticketListRepository';

async function getDashboard() {
  const lists = await ticketListRepository.findAllTicketLists();
  const totals = lists.reduce(
    (summary, list) => ({
      total_tickets: summary.total_tickets + list.total_tickets,
      validated_tickets: summary.validated_tickets + list.validated_tickets,
      remaining_tickets: summary.remaining_tickets + list.remaining_tickets,
    }),
    { total_tickets: 0, validated_tickets: 0, remaining_tickets: 0 },
  );

  return {
    ...totals,
    validation_rate: totals.total_tickets === 0
      ? 0
      : Number(((totals.validated_tickets / totals.total_tickets) * 100).toFixed(2)),
    list_count: lists.length,
    lists,
  };
}

export const dashboardRepository = { getDashboard };