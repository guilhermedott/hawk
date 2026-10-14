
'use client';

import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Plus,
  Search,
  X,
} from 'lucide-react';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';

import { DataPageState } from '@/components/dashboard/DataPageState';
import { useDashboardData } from '@/components/dashboard/useDashboardData';
import { api, ApiError } from '@/lib/api';

import {
  formatDateTime,
  ticketStatusLabel,
  ticketStatusTone,
  ticketStatuses,
  type Asset,
  type Ticket,
  type TicketStatus,
  type TicketSummary,
} from '@/lib/dashboard-types';

type TicketPriority = Ticket['priority'];

type TicketsData = {
  summary: TicketSummary;
  items: Ticket[];
};

type NewTicketForm = {
  assetId: string;
  title: string;
  description: string;
  priority: TicketPriority;
};

const blankForm: NewTicketForm = {
  assetId: '',
  title: '',
  description: '',
  priority: 'medium',
};

const priorities: { value: TicketPriority; label: string }[] = [
  { value: 'critical', label: 'Crítica' },
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Média' },
  { value: 'low', label: 'Baixa' },
];

function priorityLabel(priority: TicketPriority) {
  return priorities.find((item) => item.value === priority)?.label ?? priority;
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError
    ? error.messages.join(', ')
    : fallback;
}

export default function ChamadosPage() {
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [query, setQuery] = useState('');

  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState<NewTicketForm>(blankForm);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [assetsError, setAssetsError] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailError, setDetailError] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadData = useCallback(async (): Promise<TicketsData> => {
    const [summary, items] = await Promise.all([
      api<TicketSummary>('/tickets/summary'),
      api<Ticket[]>('/tickets'),
    ]);

    return { summary, items };
  }, []);

  const { data, loading, error, reload } = useDashboardData(loadData);

  const tickets = useMemo(() => {
    const q = query.trim().toLowerCase();

    return (data?.items ?? [])
      .filter((ticket) => status === 'all' || ticket.status === status)
      .filter(
        (ticket) => priority === 'all' || ticket.priority === priority,
      )
      .filter(
        (ticket) =>
          !q ||
          [
            ticket.id,
            ticket.title,
            ticket.description,
            ticket.asset.tag,
            ticket.asset.name,
            ticket.createdBy.name,
            ticket.assignedTo?.name ?? '',
          ].some((value) => value.toLowerCase().includes(q)),
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime(),
      );
  }, [data, query, status, priority]);

  const selected = useMemo(
    () => data?.items.find((ticket) => ticket.id === selectedId) ?? null,
    [data, selectedId],
  );

  useEffect(() => {
    if (!showNew && !selectedId) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !submitting && !updatingStatus) {
        setShowNew(false);
        setSelectedId(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showNew, selectedId, submitting, updatingStatus]);

  useEffect(() => {
    if (!showNew) return;

    let active = true;

    async function loadAssets() {
      setAssetsLoading(true);
      setAssetsError('');

      try {
        const result = await api<Asset[]>('/assets');

        if (active) {
          setAssets(result);
          setForm((current) => ({
            ...current,
            assetId: current.assetId || result[0]?.id || '',
          }));
        }
      } catch (err) {
        if (active) {
          setAssetsError(
            errorMessage(err, 'Não foi possível carregar os ativos.'),
          );
        }
      } finally {
        if (active) setAssetsLoading(false);
      }
    }

    void loadAssets();

    return () => {
      active = false;
    };
  }, [showNew]);

  async function createTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      await api<Ticket>('/tickets', {
        method: 'POST',
        body: {
          assetId: form.assetId,
          title: form.title.trim(),
          description: form.description.trim(),
          priority: form.priority,
        },
      });

      setForm(blankForm);
      setShowNew(false);
      await reload();
    } catch (err) {
      setFormError(
        errorMessage(err, 'Não foi possível abrir o chamado.'),
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatus(newStatus: TicketStatus) {
    if (!selected || selected.status === newStatus) return;

    setUpdatingStatus(true);
    setDetailError('');

    try {
      await api<Ticket>(`/tickets/${selected.id}`, {
        method: 'PATCH',
        body: { status: newStatus },
      });

      await reload();
    } catch (err) {
      setDetailError(
        errorMessage(err, 'Não foi possível atualizar o status.'),
      );
    } finally {
      setUpdatingStatus(false);
    }
  }

  const closeNew = () => {
    if (submitting) return;
    setShowNew(false);
    setFormError('');
  };

  return (
    <div className="data-page">
      <DataPageState
        loading={loading && !data}
        error={error && !data ? error : ''}
        retry={reload}
      />

      {error && data && (
        <div className="dashboard-refresh-error" role="status">
          {error}
        </div>
      )}

      {data && (
        <>
          <div className="ticket-page-heading">
            <div>
              <h1>Chamados</h1>
              <p>Acompanhe as solicitações de suporte da empresa.</p>
            </div>

            <button
              className="text-action"
              type="button"
              onClick={() => {
                setForm(blankForm);
                setFormError('');
                setAssetsError('');
                setShowNew(true);
              }}
            >
              <Plus size={15} />
              Novo chamado
            </button>
          </div>

          <section className="page-stat-grid ticket-stat-grid">
            <article className="page-stat-card">
              <span className="page-stat-icon blue">
                <ClipboardList size={17} />
              </span>
              <div>
                <strong>{data.summary.status.open}</strong>
                <span>Abertos</span>
              </div>
            </article>

            <article className="page-stat-card">
              <span className="page-stat-icon orange">
                <Clock3 size={17} />
              </span>
              <div>
                <strong>{data.summary.status.in_progress}</strong>
                <span>Em andamento</span>
              </div>
            </article>

            <article className="page-stat-card">
              <span className="page-stat-icon red">
                <AlertTriangle size={17} />
              </span>
              <div>
                <strong>{data.summary.openByPriority.critical}</strong>
                <span>Críticos ativos</span>
              </div>
            </article>

            <article className="page-stat-card">
              <span className="page-stat-icon green">
                <CheckCircle2 size={17} />
              </span>
              <div>
                <strong>{data.summary.status.resolved}</strong>
                <span>Resolvidos</span>
              </div>
            </article>
          </section>

          <section className="panel data-panel">
            <div className="panel-heading">
              <div>
                <h2>Todos os chamados</h2>
                <p>
                  {tickets.length} de {data.summary.total} chamados
                </p>
              </div>

              <div className="data-filters">
                <label className="search-field">
                  <Search size={14} />
                  <input
                    aria-label="Buscar chamados"
                    placeholder="Buscar chamado, ativo ou solicitante"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </label>

                <select
                  className="data-select"
                  aria-label="Filtrar por status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                >
                  <option value="all">Todos os status</option>
                  {ticketStatuses.map((item) => (
                    <option key={item.status} value={item.status}>
                      {item.title}
                    </option>
                  ))}
                </select>

                <select
                  className="data-select"
                  aria-label="Filtrar por prioridade"
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                >
                  <option value="all">Todas as prioridades</option>
                  {priorities.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="data-table-wrap">
              <table className="data-table tickets-table">
                <thead>
                  <tr>
                    <th>Chamado</th>
                    <th>Ativo</th>
                    <th>Solicitante</th>
                    <th>Responsável</th>
                    <th>Prioridade</th>
                    <th>Status</th>
                    <th>Criação</th>
                  </tr>
                </thead>

                <tbody>
                  {tickets.map((ticket) => (
                    <tr
                      key={ticket.id}
                      className="ticket-clickable-row"
                      tabIndex={0}
                      onClick={() => {
                        setSelectedId(ticket.id);
                        setDetailError('');
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          setSelectedId(ticket.id);
                          setDetailError('');
                        }
                      }}
                    >
                      <td>
                        <strong>
                          #{ticket.id.slice(0, 8).toUpperCase()}
                        </strong>
                        <span className="table-secondary">
                          {ticket.title}
                        </span>
                      </td>

                      <td>
                        <strong>{ticket.asset.tag}</strong>
                        <span className="table-secondary">
                          {ticket.asset.name}
                        </span>
                      </td>

                      <td>{ticket.createdBy.name}</td>
                      <td>{ticket.assignedTo?.name ?? 'Não atribuído'}</td>

                      <td>
                        <span
                          className={`priority-label priority-${ticket.priority}`}
                        >
                          {priorityLabel(ticket.priority)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`status-badge ${ticketStatusTone(ticket.status)}`}
                        >
                          {ticketStatusLabel(ticket.status)}
                        </span>
                      </td>

                      <td>{formatDateTime(ticket.createdAt).date}</td>
                    </tr>
                  ))}

                  {tickets.length === 0 && (
                    <tr>
                      <td colSpan={7} className="table-empty">
                        Nenhum chamado encontrado com esses filtros.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {showNew && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeNew();
          }}
        >
          <section
            className="panel asset-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-ticket-title"
          >
            <div className="panel-heading">
              <div>
                <h2 id="new-ticket-title">Novo chamado</h2>
                <p>Descreva o problema para a equipe de suporte.</p>
              </div>

              <button
                className="icon-button"
                type="button"
                aria-label="Fechar formulário"
                disabled={submitting}
                onClick={closeNew}
              >
                <X size={17} />
              </button>
            </div>

            <form className="asset-form" onSubmit={createTicket}>
              {formError && (
                <div className="form-error" role="alert">
                  {formError}
                </div>
              )}

              {assetsError && (
                <div className="form-error" role="alert">
                  {assetsError}
                </div>
              )}

              <label>
                Ativo relacionado
                <select
                  required
                  value={form.assetId}
                  disabled={assetsLoading || assets.length === 0}
                  onChange={(event) =>
                    setForm({ ...form, assetId: event.target.value })
                  }
                >
                  <option value="">
                    {assetsLoading
                      ? 'Carregando ativos...'
                      : 'Selecione um ativo'}
                  </option>
                  {assets.map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.tag} — {asset.name}
                    </option>
                  ))}
                </select>
              </label>

              {!assetsLoading && !assetsError && assets.length === 0 && (
                <p className="ticket-form-hint">
                  Cadastre um ativo no inventário antes de abrir um chamado.
                </p>
              )}

              <label>
                Título
                <input
                  required
                  minLength={3}
                  maxLength={100}
                  placeholder="Ex.: Computador não liga"
                  value={form.title}
                  onChange={(event) =>
                    setForm({ ...form, title: event.target.value })
                  }
                />
              </label>

              <label>
                Prioridade
                <select
                  value={form.priority}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      priority: event.target.value as TicketPriority,
                    })
                  }
                >
                  {priorities.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="asset-notes-field">
                Descrição do problema
                <textarea
                  required
                  minLength={10}
                  maxLength={1000}
                  rows={4}
                  placeholder="Descreva o que está acontecendo..."
                  value={form.description}
                  onChange={(event) =>
                    setForm({ ...form, description: event.target.value })
                  }
                />
              </label>

              <p className="ticket-form-hint">
                O solicitante será identificado automaticamente pela sua conta.
              </p>

              <div className="asset-modal-actions">
                <button
                  className="modal-cancel"
                  type="button"
                  disabled={submitting}
                  onClick={closeNew}
                >
                  Cancelar
                </button>

                <button
                  className="text-action submit-asset"
                  type="submit"
                  disabled={
                    submitting ||
                    assetsLoading ||
                    assets.length === 0 ||
                    Boolean(assetsError)
                  }
                >
                  <Plus size={14} />
                  {submitting ? 'Abrindo...' : 'Abrir chamado'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {selected && (
        <div
          className="ticket-detail-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setSelectedId(null);
            }
          }}
        >
          <aside
            className="ticket-detail-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ticket-detail-title"
          >
            <div className="ticket-detail-header">
              <div>
                <span className="ticket-detail-id">
                  #{selected.id.slice(0, 8).toUpperCase()}
                </span>
                <h2 id="ticket-detail-title">{selected.title}</h2>
              </div>

              <button
                className="icon-button"
                type="button"
                aria-label="Fechar detalhes"
                onClick={() => setSelectedId(null)}
              >
                <X size={17} />
              </button>
            </div>

            <div className="ticket-detail-badges">
              <span
                className={`priority-label priority-${selected.priority}`}
              >
                {priorityLabel(selected.priority)}
              </span>
              <span
                className={`status-badge ${ticketStatusTone(selected.status)}`}
              >
                {ticketStatusLabel(selected.status)}
              </span>
            </div>

            {detailError && (
              <div className="form-error" role="alert">
                {detailError}
              </div>
            )}

            <section className="ticket-detail-section">
              <h3>Descrição</h3>
              <p className="ticket-description">{selected.description}</p>
            </section>

            <section className="ticket-detail-section">
              <h3>Informações</h3>

              <dl className="ticket-detail-grid">
                <div>
                  <dt>Ativo</dt>
                  <dd>
                    {selected.asset.tag} — {selected.asset.name}
                  </dd>
                </div>
                <div>
                  <dt>Solicitante</dt>
                  <dd>{selected.createdBy.name}</dd>
                </div>
                <div>
                  <dt>Responsável</dt>
                  <dd>{selected.assignedTo?.name ?? 'Não atribuído'}</dd>
                </div>
                <div>
                  <dt>Criado em</dt>
                  <dd>{formatDateTime(selected.createdAt).date}</dd>
                </div>
              </dl>
            </section>

            <section className="ticket-detail-section">
              <label htmlFor="ticket-status">
                <h3>Atualizar status</h3>
              </label>

              <select
                id="ticket-status"
                className="data-select ticket-status-select"
                value={selected.status}
                disabled={updatingStatus}
                onChange={(event) =>
                  void updateStatus(event.target.value as TicketStatus)
                }
              >
                {ticketStatuses.map((item) => (
                  <option key={item.status} value={item.status}>
                    {item.title}
                  </option>
                ))}
              </select>

              {updatingStatus && (
                <p className="ticket-form-hint">Salvando alteração...</p>
              )}
            </section>
          </aside>
        </div>
      )}
    </div>
  );
}
