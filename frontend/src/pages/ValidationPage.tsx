import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowRight, Check, CircleCheck, LoaderCircle, Search, TicketCheck, X } from 'lucide-react';
import { api, formatDate, getApiError } from '../services/api';
import type { Paginated, Ticket, TicketList } from '../types/api';

export function ValidationPage() {
  const [query, setQuery] = useState('');
  const [prefixFilter, setPrefixFilter] = useState('');
  const [prefixOptions, setPrefixOptions] = useState<string[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<{ data: TicketList[] }>('/ticket-lists')
      .then((response) => {
        const nextPrefixes = [...new Set(response.data.data.map((list) => list.prefix).filter(Boolean))].sort();
        setPrefixOptions(nextPrefixes);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const normalized = query.trim();
    const normalizedPrefix = prefixFilter.trim().toUpperCase();

    if (!normalized && !normalizedPrefix) {
      setTickets([]);
      setSelected(null);
      setError('');
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(() => {
      setLoading(true);
      setError('');
      api.get<Paginated<Ticket>>('/tickets/search', {
        params: {
          q: normalized || undefined,
          prefix: normalizedPrefix || undefined,
          limit: 20,
        },
        signal: controller.signal,
      })
        .then((response) => {
          setTickets(response.data.data);
          setSelected((current) => response.data.data.find((ticket) => ticket.id === current?.id) ?? response.data.data[0] ?? null);
        })
        .catch((requestError: unknown) => {
          if (!controller.signal.aborted) {
            setError(getApiError(requestError, 'La recherche a échoué.'));
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setLoading(false);
          }
        });
    }, 240);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query, prefixFilter]);

  async function validateSelected() {
    if (!selected) {
      return;
    }
    setValidating(true);
    setError('');
    setMessage('');
    try {
      const response = await api.post<{ data: Ticket }>(`/tickets/${selected.id}/validate`);
      setSelected(response.data.data);
      setTickets((current) => current.map((ticket) => ticket.id === selected.id ? response.data.data : ticket));
      setMessage('Entrée validée. Le billet est maintenant marqué comme utilisé.');
    } catch (requestError) {
      setError(getApiError(requestError, 'Impossible de valider ce billet.'));
      api.get<{ data: Ticket }>(`/tickets/${selected.id}`).then((response) => setSelected(response.data.data)).catch(() => undefined);
    } finally {
      setValidating(false);
    }
  }

  async function cancelSelectedValidation() {
    if (!selected) {
      return;
    }
    const confirmed = window.confirm('Voulez-vous vraiment annuler la validation de ce billet ?');
    if (!confirmed) {
      return;
    }

    setCanceling(true);
    setError('');
    setMessage('');
    try {
      const response = await api.delete<{ data: Ticket }>(`/tickets/${selected.id}/validate`);
      setSelected(response.data.data);
      setTickets((current) => current.map((ticket) => ticket.id === selected.id ? response.data.data : ticket));
      setMessage('Validation annulée. Le billet est de nouveau disponible pour la vérification.');
    } catch (requestError) {
      setError(getApiError(requestError, 'Impossible d’annuler la validation de ce billet.'));
      api.get<{ data: Ticket }>(`/tickets/${selected.id}`).then((response) => setSelected(response.data.data)).catch(() => undefined);
    } finally {
      setCanceling(false);
    }
  }

  return (
    <div className="page-stack page-enter">
      <div className="page-heading-row"><div><p className="eyebrow">ACCÈS ÉVÉNEMENT</p><h1>Contrôle des billets</h1><p className="page-subtitle">Recherchez un billet pour vérifier son statut et valider l’entrée.</p></div><div className="live-label"><span /> Contrôle actif</div></div>

      <section className="validation-workspace">
        <div className="search-column">
          <label className="field-label" htmlFor="ticket-search">Recherche</label>
          <div className="single-search-row">
            <div className="search-field prefix-field">
              <label htmlFor="ticket-prefix" className="sr-only">Préfixe</label>
              <select id="ticket-prefix" value={prefixFilter} onChange={(event) => { setPrefixFilter(event.target.value.toUpperCase()); setMessage(''); }}>
                <option value="">Tous les préfixes</option>
                {prefixOptions.map((prefix) => <option key={prefix} value={prefix}>{prefix}</option>)}
              </select>
            </div>
            <div className="search-field query-field">
              <Search size={18} />
              <input id="ticket-search" type="search" autoComplete="off" placeholder="Ex. TKT-0288 ou 288" value={query} onChange={(event) => { setQuery(event.target.value); setMessage(''); }} />
              <kbd>⌕</kbd>
            </div>
          </div>

          {error && <div className="inline-error" role="alert"><AlertTriangle size={16} />{error}</div>}
          {message && <div className="inline-success" role="status"><Check size={16} />{message}</div>}
          <div className="results-heading"><span>Résultats</span><span>{loading ? <LoaderCircle className="spin" size={15} /> : `${tickets.length} trouvé${tickets.length > 1 ? 's' : ''}`}</span></div>
          <div className="result-list">
            {!query.trim() && !prefixFilter.trim() && <div className="result-placeholder"><Search size={21} /><span>Saisissez un numéro ou un préfixe pour rechercher.</span></div>}
            {!loading && tickets.length === 0 && !error && (query.trim() || prefixFilter.trim()) && <div className="result-placeholder"><X size={20} /><span>Aucun billet correspondant.</span></div>}
            {tickets.map((ticket) => <button key={ticket.id} type="button" className={`ticket-result${selected?.id === ticket.id ? ' selected' : ''}`} onClick={() => { setSelected(ticket); setMessage(''); }}><span className="result-ticket-info"><strong>{ticket.ticket_number}</strong><small>{ticket.list_name}</small></span><span className={`status-pill ${ticket.status === 'VALIDATED' ? 'status-validated' : 'status-pending'}`}>{ticket.status === 'VALIDATED' ? 'Validé' : 'En attente'}</span><ArrowRight className="result-arrow" size={16} /></button>)}
          </div>
          <p className="search-footnote">La recherche s’effectue en direct dans toutes les listes.</p>
        </div>

        <div className="ticket-detail-column">
          {selected ? (
            <div className={`ticket-verdict ${selected.status === 'VALIDATED' ? 'verdict-used' : 'verdict-ready'}`}>
              <div className="verdict-symbol">{selected.status === 'VALIDATED' ? <X size={22} /> : <CircleCheck size={22} />}</div>
              <p className="eyebrow">{selected.status === 'VALIDATED' ? 'ACCÈS REFUSÉ' : 'BILLET RECONNU'}</p>
              <h2>{selected.status === 'VALIDATED' ? 'Déjà utilisé' : 'Prêt à valider'}</h2>
              <div className="ticket-code-display">{selected.ticket_number}</div>
              <p className="ticket-list-name">{selected.list_name}</p>
              <div className="verdict-divider" />
              <div className="verdict-meta"><span>Statut</span><strong>{selected.status === 'VALIDATED' ? 'Validé' : 'Non validé'}</strong></div>
              {selected.validated_at && <div className="verdict-meta"><span>Validation</span><strong>{formatDate(selected.validated_at)}</strong></div>}
              {selected.status === 'PENDING' && <button type="button" className="button button-validate" disabled={validating} onClick={validateSelected}>{validating ? <LoaderCircle className="spin" size={18} /> : <TicketCheck size={18} />} Valider l’entrée</button>}
              {selected.status === 'VALIDATED' && (
                <>
                  <button type="button" className="button button-secondary" disabled={canceling} onClick={cancelSelectedValidation}>{canceling ? <LoaderCircle className="spin" size={18} /> : <X size={18} />} Annuler la validation</button>
                  <div className="used-notice"><AlertTriangle size={16} />Ce billet a déjà été utilisé. Ne pas autoriser l’entrée.</div>
                </>
              )}
            </div>
          ) : (
            <div className="ticket-empty-detail"><span className="empty-ticket-icon"><TicketCheck size={25} /></span><strong>En attente d’un billet</strong><p>Le statut et les actions apparaîtront ici après la recherche.</p></div>
          )}
          <div className="scan-note"><span className="scan-note-mark">QR</span><span><strong>Lecture QR bientôt disponible</strong><small>Le contrôle accepte déjà le numéro décodé du billet.</small></span></div>
        </div>
      </section>
    </div>
  );
}