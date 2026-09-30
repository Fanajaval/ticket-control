import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, ArrowRight, Search, SlidersHorizontal } from 'lucide-react';
import { api, formatDate, getApiError } from '../services/api';
import type { Paginated, Ticket } from '../types/api';

interface HistoryFilters {
  q: string;
  prefix: string;
  from: string;
  to: string;
}

const emptyFilters: HistoryFilters = { q: '', prefix: '', from: '', to: '' };

export function HistoryPage() {
  const [filters, setFilters] = useState(emptyFilters);
  const [applied, setApplied] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Paginated<Ticket> | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    Object.entries(applied).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setLoading(true);
    api.get<Paginated<Ticket>>(`/history?${params.toString()}`)
      .then((response) => { setResult(response.data); setError(''); })
      .catch((requestError: unknown) => setError(getApiError(requestError, 'Impossible de charger l’historique.')))
      .finally(() => setLoading(false));
  }, [applied, page]);

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPage(1);
    setApplied(filters);
  }

  return (
    <div className="page-stack page-enter">
      <div className="page-heading-row"><div><p className="eyebrow">SUIVI DES ACCÈS</p><h1>Historique</h1><p className="page-subtitle">Retrouvez les billets validés et leurs dates de passage.</p></div><span className="history-total">{result?.pagination.total ?? '—'} validation{result?.pagination.total !== 1 ? 's' : ''}</span></div>

      <section className="filter-section"><div className="filter-title"><SlidersHorizontal size={17} /><span>Filtrer l’historique</span></div><form className="history-filters" onSubmit={applyFilters}><label>Billet<input value={filters.q} onChange={(event) => setFilters({ ...filters, q: event.target.value })} placeholder="Numéro ou chiffres" /></label><label>Préfixe<input value={filters.prefix} onChange={(event) => setFilters({ ...filters, prefix: event.target.value.toUpperCase() })} placeholder="TKT-" /></label><label>Du<input type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} /></label><label>Au<input type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} /></label><button className="button button-primary filter-button" type="submit"><Search size={16} /> Filtrer</button></form></section>

      {error && <div className="inline-error" role="alert">{error}</div>}
      <section className="content-section history-table-section"><div className="table-scroll"><table><thead><tr><th>Billet</th><th>Type / liste</th><th>Statut</th><th>Date et heure</th><th>Agent</th></tr></thead><tbody>
        {loading ? <tr><td colSpan={5} className="table-message">Chargement…</td></tr> : !result?.data.length ? <tr><td colSpan={5} className="table-message">Aucune validation pour ces critères.</td></tr> : result.data.map((ticket) => <tr key={ticket.id}><td className="table-primary-cell ticket-number-cell">{ticket.ticket_number}</td><td>{ticket.list_name}</td><td><span className="status-pill status-validated">Validé</span></td><td>{formatDate(ticket.validated_at)}</td><td className="muted-cell">{ticket.validated_by ?? '—'}</td></tr>)}
      </tbody></table></div>
      <div className="pagination-row"><span>{result?.pagination.total ? `${(page - 1) * 20 + 1}–${Math.min(page * 20, result.pagination.total)} sur ${result.pagination.total}` : '0 résultat'}</span><div><button className="icon-button" type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)} aria-label="Page précédente"><ArrowLeft size={17} /></button><span className="page-indicator">{page} / {Math.max(result?.pagination.totalPages ?? 0, 1)}</span><button className="icon-button" type="button" disabled={loading || page >= (result?.pagination.totalPages ?? 0)} onClick={() => setPage((current) => current + 1)} aria-label="Page suivante"><ArrowRight size={17} /></button></div></div></section>
    </div>
  );
}