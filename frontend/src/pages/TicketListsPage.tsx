import { useEffect, useState, type FormEvent } from 'react';
import { AlertCircle, LoaderCircle, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { api, formatDate, getApiError } from '../services/api';
import type { TicketList } from '../types/api';

const initialForm = { name: '', prefix: '', start_number: '1', quantity: '3000' };

export function TicketListsPage() {
  const [lists, setLists] = useState<TicketList[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function loadLists() {
    setLoading(true);
    try {
      const response = await api.get<{ data: TicketList[] }>('/ticket-lists');
      setLists(response.data.data);
      setError('');
    } catch (requestError) {
      setError(getApiError(requestError, 'Impossible de charger les listes.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLists();
  }, []);

  async function createList(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await api.post<{ data: TicketList }>('/ticket-lists', {
        name: form.name,
        prefix: form.prefix,
        start_number: Number(form.start_number),
        quantity: Number(form.quantity),
      });
      setNotice(`${response.data.data.total_tickets.toLocaleString('fr-FR')} billets générés.`);
      setForm(initialForm);
      await loadLists();
    } catch (requestError) {
      setError(getApiError(requestError, 'La liste n’a pas pu être créée.'));
    } finally {
      setSaving(false);
    }
  }

  async function deleteList(list: TicketList) {
    if (!window.confirm(`Supprimer « ${list.name} » et ses ${list.total_tickets} billets ? Cette action est définitive.`)) {
      return;
    }
    setError('');
    try {
      await api.delete(`/ticket-lists/${list.id}`);
      setNotice(`La liste « ${list.name} » a été supprimée.`);
      await loadLists();
    } catch (requestError) {
      setError(getApiError(requestError, 'La liste n’a pas pu être supprimée.'));
    }
  }

  return (
    <div className="page-stack page-enter">
      <div className="page-heading-row"><div><p className="eyebrow">BILLETTERIE</p><h1>Listes de billets</h1><p className="page-subtitle">Générez et gérez les séries de billets de votre événement.</p></div><button className="icon-button" type="button" onClick={loadLists} aria-label="Actualiser les listes" title="Actualiser"><RefreshCw size={17} /></button></div>
      {error && <div className="inline-error" role="alert"><AlertCircle size={16} />{error}</div>}
      {notice && <div className="inline-success" role="status">{notice}</div>}

      <div className="lists-layout">
        <section className="content-section lists-table-section">
          <div className="section-heading"><div><p className="eyebrow">SÉRIES ACTIVES</p><h2>{lists.length} liste{lists.length > 1 ? 's' : ''}</h2></div><span className="subtle-count">{lists.reduce((sum, list) => sum + list.total_tickets, 0).toLocaleString('fr-FR')} billets</span></div>
          {loading ? <div className="loading-state">Chargement des listes…</div> : lists.length === 0 ? <div className="empty-state compact"><strong>Aucune liste créée</strong><p>La première série peut être générée ici.</p></div> : (
            <div className="table-scroll"><table><thead><tr><th>Nom de la liste</th><th>Total</th><th>Validés</th><th>Restants</th><th>Créée</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>
              {lists.map((list) => <tr key={list.id}><td><div className="list-name-cell"><span className="list-prefix-dot" /><span><strong>{list.name}</strong><small>{list.prefix}</small></span></div></td><td>{list.total_tickets.toLocaleString('fr-FR')}</td><td className="cell-green">{list.validated_tickets.toLocaleString('fr-FR')}</td><td>{list.remaining_tickets.toLocaleString('fr-FR')}</td><td className="muted-cell">{formatDate(list.created_at)}</td><td><button className="icon-button danger-hover" type="button" onClick={() => deleteList(list)} aria-label={`Supprimer ${list.name}`} title="Supprimer la liste"><Trash2 size={16} /></button></td></tr>)}
            </tbody></table></div>
          )}
        </section>

        <section className="form-section">
          <div className="section-heading"><div><p className="eyebrow">NOUVELLE SÉRIE</p><h2>Générer des billets</h2></div></div>
          <form className="ticket-list-form" onSubmit={createList}>
            <label>Nom de la liste<input required maxLength={100} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Billets Standard" /></label>
            <label>Préfixe<input required maxLength={20} value={form.prefix} onChange={(event) => setForm({ ...form, prefix: event.target.value.toUpperCase() })} placeholder="TKT-" /></label>
            <div className="form-fields-row"><label>Numéro de départ<input required type="number" min="1" step="1" value={form.start_number} onChange={(event) => setForm({ ...form, start_number: event.target.value })} /></label><label>Quantité<input required type="number" min="1" max="100000" step="1" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} /></label></div>
            <div className="generation-preview"><span>Aperçu de la série</span><strong>{form.prefix || 'TKT-'}{String(Math.max(Number(form.start_number) || 1, 1)).padStart(4, '0')} <span>→</span> {form.prefix || 'TKT-'}{String(Math.max((Number(form.start_number) || 1) + (Number(form.quantity) || 1) - 1, 1)).padStart(4, '0')}</strong></div>
            <button className="button button-primary button-full" type="submit" disabled={saving}>{saving ? <LoaderCircle className="spin" size={17} /> : <Plus size={17} />} Générer les billets</button>
            <p className="form-footnote">La génération est effectuée en transaction. Les numéros déjà utilisés ne seront pas dupliqués.</p>
          </form>
        </section>
      </div>
    </div>
  );
}