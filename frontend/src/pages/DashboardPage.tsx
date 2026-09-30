import { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, CircleCheck, CircleDashed, Plus, TicketCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api, formatDate, getApiError } from '../services/api';
import type { Dashboard } from '../types/api';

function Metric({ label, value, detail, tone, icon: Icon }: {
  label: string;
  value: string;
  detail: string;
  tone: 'green' | 'amber' | 'ink' | 'blue';
  icon: typeof CircleCheck;
}) {
  return (
    <section className={`metric metric-${tone}`}>
      <div className="metric-top"><span>{label}</span><Icon size={18} strokeWidth={1.8} /></div>
      <strong className="metric-value">{value}</strong>
      <span className="metric-detail">{detail}</span>
    </section>
  );
}

export function DashboardPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<{ data: Dashboard }>('/dashboard')
      .then((response) => setDashboard(response.data.data))
      .catch((requestError: unknown) => setError(getApiError(requestError, 'Impossible de charger le tableau de bord.')));
  }, []);

  if (error) {
    return <div className="inline-error" role="alert">{error}</div>;
  }
  if (!dashboard) {
    return <div className="loading-state">Chargement des statistiques…</div>;
  }

  const rate = dashboard.validation_rate.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="page-stack page-enter">
      <div className="page-heading-row">
        <div><p className="eyebrow">TABLEAU DE BORD</p><h1>Vue d’ensemble</h1><p className="page-subtitle">Suivez les entrées et l’activité de votre billetterie.</p></div>
        <Link className="button button-primary" to="/lists"><Plus size={17} /> Nouvelle liste</Link>
      </div>

      <div className="metrics-grid">
        <Metric label="Billets émis" value={dashboard.total_tickets.toLocaleString('fr-FR')} detail={`${dashboard.list_count} liste${dashboard.list_count > 1 ? 's' : ''}`} tone="ink" icon={TicketCheck} />
        <Metric label="Entrées validées" value={dashboard.validated_tickets.toLocaleString('fr-FR')} detail="Billets déjà contrôlés" tone="green" icon={CircleCheck} />
        <Metric label="À contrôler" value={dashboard.remaining_tickets.toLocaleString('fr-FR')} detail="Billets encore en attente" tone="amber" icon={CircleDashed} />
        <Metric label="Taux de validation" value={`${rate} %`} detail="Sur l’ensemble des billets" tone="blue" icon={ArrowUpRight} />
      </div>

      <section className="content-section">
        <div className="section-heading"><div><p className="eyebrow">RÉPARTITION</p><h2>Listes de billets</h2></div><Link className="text-link" to="/lists">Gérer les listes <ArrowDownRight size={16} /></Link></div>
        {dashboard.lists.length === 0 ? (
          <div className="empty-state"><span className="empty-icon"><TicketCheck size={21} /></span><strong>Aucune liste pour le moment</strong><p>Créez une liste pour générer vos premiers billets.</p><Link className="button button-secondary" to="/lists"><Plus size={16} /> Créer une liste</Link></div>
        ) : (
          <div className="table-scroll"><table><thead><tr><th>Liste</th><th>Préfixe</th><th>Billets</th><th>Validés</th><th>Restants</th><th>Progression</th><th>Créée le</th></tr></thead><tbody>
            {dashboard.lists.map((list) => {
              const progress = list.total_tickets ? (list.validated_tickets / list.total_tickets) * 100 : 0;
              return <tr key={list.id}><td className="table-primary-cell">{list.name}</td><td><span className="prefix-tag">{list.prefix}</span></td><td>{list.total_tickets.toLocaleString('fr-FR')}</td><td className="cell-green">{list.validated_tickets.toLocaleString('fr-FR')}</td><td>{list.remaining_tickets.toLocaleString('fr-FR')}</td><td><div className="progress-cell"><div className="progress-track"><span style={{ width: `${progress}%` }} /></div><small>{progress.toFixed(0)}%</small></div></td><td className="muted-cell">{formatDate(list.created_at)}</td></tr>;
            })}
          </tbody></table></div>
        )}
      </section>

      <section className="entry-callout"><div className="entry-callout-icon"><CircleCheck size={20} /></div><div><strong>Le contrôle est prêt</strong><p>Recherchez un billet ou validez une entrée en quelques secondes.</p></div><Link className="button button-dark" to="/validation">Ouvrir le contrôle <ArrowUpRight size={16} /></Link></section>
    </div>
  );
}