import { useEffect, useState, useCallback } from 'react';
import {
  Trash2, Phone, Mail, Calendar, Search, X,
  MessageSquare, ChevronDown, ChevronUp, MapPin,
  TrendingUp, Clock, Wallet, BookOpen, User
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const STATUS_META = {
  new:       { label: 'New',       cls: 'bg-blue-100 text-blue-800',    dot: 'bg-blue-500' },
  contacted: { label: 'Contacted', cls: 'bg-yellow-100 text-yellow-800', dot: 'bg-yellow-500' },
  qualified: { label: 'Qualified', cls: 'bg-purple-100 text-purple-800', dot: 'bg-purple-500' },
  converted: { label: 'Converted', cls: 'bg-green-100 text-green-800',  dot: 'bg-green-500' },
  lost:      { label: 'Lost',      cls: 'bg-gray-100 text-gray-600',    dot: 'bg-gray-400' },
};

const SOURCE_COLORS = {
  'Popup':        'bg-gold/10 text-gold-dark',
  'Website':      'bg-navy-50 text-navy',
  'Instagram DM': 'bg-pink-50 text-pink-700',
  'YouTube':      'bg-red-50 text-red-700',
  'Webinar':      'bg-indigo-50 text-indigo-700',
  'Referral':     'bg-emerald-50 text-emerald-700',
  'Ad Campaign':  'bg-orange-50 text-orange-700',
};

const STATUSES = ['all', 'new', 'contacted', 'qualified', 'converted', 'lost'];

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, color }) => (
  <div className="card p-4 flex items-center gap-3">
    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color}`} />
    <div>
      <div className="text-2xl font-display text-navy">{value}</div>
      <div className="text-xs text-ink/50 uppercase tracking-wider">{label}</div>
    </div>
  </div>
);

// ── Notes editor ──────────────────────────────────────────────────────────────
const NotesEditor = ({ lead, onSave }) => {
  const [text, setText] = useState(lead.notes || '');
  const [saving, setSaving] = useState(false);
  const dirty = text !== (lead.notes || '');

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/leads/${lead._id}`, { notes: text });
      onSave(lead._id, text);
      toast.success('Notes saved');
    } catch { toast.error('Failed to save'); }
    finally { setSaving(false); }
  };

  return (
    <div className="mt-3">
      <label className="text-xs text-ink/50 uppercase tracking-wider mb-1 block">Admin Notes</label>
      <textarea
        rows={2}
        className="w-full text-sm px-3 py-2 border border-navy-200 rounded-lg bg-cream focus:outline-none focus:ring-1 focus:ring-gold resize-none"
        placeholder="Add internal notes…"
        value={text}
        onChange={e => setText(e.target.value)}
      />
      {dirty && (
        <button
          onClick={save}
          disabled={saving}
          className="mt-1.5 text-xs bg-navy text-cream px-3 py-1.5 rounded-md hover:bg-navy-900 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Notes'}
        </button>
      )}
    </div>
  );
};

// ── Lead card ─────────────────────────────────────────────────────────────────
const LeadCard = ({ lead, onUpdate, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const sm = STATUS_META[lead.status] || STATUS_META.new;
  const srcCls = SOURCE_COLORS[lead.source] || 'bg-navy-50 text-navy';
  const displayName = lead.name || [lead.firstName, lead.lastName].filter(Boolean).join(' ') || '—';

  const updateStatus = async (status) => {
    try {
      const { data } = await api.put(`/leads/${lead._id}`, { status });
      onUpdate(data.lead);
      toast.success('Status updated');
    } catch { toast.error('Failed'); }
  };

  const updateNotes = (_id, notes) => onUpdate({ ...lead, notes });

  return (
    <div className="card p-5 flex flex-col gap-0">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-display text-lg text-navy leading-tight">{displayName}</h3>
            <span className={`badge ${sm.cls}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sm.dot} mr-1`} />
              {sm.label}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {lead.source && (
              <span className={`badge text-[10px] ${srcCls}`}>{lead.source}</span>
            )}
            {lead.interestedCourse && lead.interestedCourse !== 'General' && (
              <span className="badge bg-gold/10 text-gold-dark text-[10px]">{lead.interestedCourse}</span>
            )}
          </div>
        </div>

        <button
          onClick={() => setExpanded(e => !e)}
          className="p-1.5 hover:bg-navy-50 rounded-lg transition-colors text-ink/40"
          title={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>

      {/* Contact links */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mb-3">
        <a href={`tel:+91${lead.phone}`} className="flex items-center gap-1.5 text-ink/70 hover:text-gold-dark transition-colors">
          <Phone size={13} /> +91 {lead.phone}
        </a>
        <a href={`mailto:${lead.email}`} className="flex items-center gap-1.5 text-ink/70 hover:text-gold-dark transition-colors">
          <Mail size={13} /> {lead.email}
        </a>
        {lead.city && (
          <span className="flex items-center gap-1.5 text-ink/50 text-xs">
            <MapPin size={12} /> {lead.city}
          </span>
        )}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-navy-100 pt-3 mt-1 space-y-3">
          {/* Profile grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {lead.age && (
              <Detail icon={<User size={11}/>} label="Age" value={lead.age} />
            )}
            {lead.tradingExperience && (
              <Detail icon={<TrendingUp size={11}/>} label="Experience" value={lead.tradingExperience} />
            )}
            {lead.plannedCapital && (
              <Detail icon={<Wallet size={11}/>} label="Capital" value={lead.plannedCapital} />
            )}
            {lead.preferredContactTime && (
              <Detail icon={<Clock size={11}/>} label="Best Time" value={lead.preferredContactTime} />
            )}
            {lead.interestedCourse && (
              <Detail icon={<BookOpen size={11}/>} label="Program" value={lead.interestedCourse} />
            )}
            {lead.sourcePage && lead.sourcePage !== '/' && (
              <Detail icon={<MapPin size={11}/>} label="Source Page" value={lead.sourcePage} />
            )}
          </div>

          {/* Message */}
          {lead.message && (
            <div className="bg-cream rounded-lg p-3 text-sm text-ink/70 italic border border-navy-100">
              "{lead.message}"
            </div>
          )}

          {/* Notes editor */}
          <NotesEditor lead={lead} onSave={updateNotes} />

          {/* WhatsApp quick link */}
          <a
            href={`https://wa.me/91${lead.phone}?text=${encodeURIComponent(`Hi ${lead.firstName || displayName}, this is Legacy Wealth Institute. Thank you for your interest!`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            <MessageSquare size={12} /> WhatsApp
          </a>
        </div>
      )}

      {/* Footer: status + date + delete */}
      <div className="flex items-center justify-between pt-3 mt-auto border-t border-navy-100 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <select
            value={lead.status}
            onChange={e => updateStatus(e.target.value)}
            className="text-xs px-2 py-1.5 rounded-lg border border-navy-200 bg-white text-navy focus:outline-none focus:ring-1 focus:ring-gold"
          >
            {Object.entries(STATUS_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
          <span className="flex items-center gap-1 text-ink/40 text-xs">
            <Calendar size={11} /> {new Date(lead.createdAt).toLocaleDateString('en-IN')}
          </span>
        </div>
        <button
          onClick={() => onDelete(lead)}
          className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
          title="Delete lead"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
};

const Detail = ({ icon, label, value }) => (
  <div className="flex items-start gap-1.5 text-xs">
    <span className="text-ink/40 mt-0.5 flex-shrink-0">{icon}</span>
    <div>
      <div className="text-ink/40 leading-none mb-0.5">{label}</div>
      <div className="text-navy font-medium">{value}</div>
    </div>
  </div>
);

// ── Page ──────────────────────────────────────────────────────────────────────
const ManageLeads = () => {
  const [leads, setLeads]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const [search, setSearch]   = useState('');
  const [query, setQuery]     = useState('');   // debounced

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setQuery(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      if (query) params.set('search', query);
      const { data } = await api.get(`/leads?${params}`);
      setLeads(data.leads);
    } catch {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [filter, query]);

  useEffect(() => { load(); }, [load]);

  const handleUpdate = useCallback((updated) => {
    setLeads(prev => prev.map(l => l._id === updated._id ? updated : l));
  }, []);

  const handleDelete = useCallback(async (lead) => {
    if (!confirm(`Delete lead for ${lead.name || lead.firstName}? This cannot be undone.`)) return;
    try {
      await api.delete(`/leads/${lead._id}`);
      setLeads(prev => prev.filter(l => l._id !== lead._id));
      toast.success('Lead deleted');
    } catch {
      toast.error('Delete failed');
    }
  }, []);

  // Stats from current full load (unfiltered)
  const counts = leads.reduce((acc, l) => { acc[l.status] = (acc[l.status] || 0) + 1; return acc; }, {});

  return (
    <div className="bg-cream min-h-screen">

      {/* Header */}
      <section className="bg-navy-900 text-cream py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-xs uppercase tracking-[0.3em] text-gold mb-1">Admin</div>
          <h1 className="font-display text-3xl">Leads & Inquiries</h1>
          <p className="text-cream/50 text-sm mt-1">
            Popup captures, website forms, and ad campaign inquiries.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
          <StatCard label="Total"     value={leads.length}         color="bg-navy-400" />
          <StatCard label="New"       value={counts.new || 0}      color={STATUS_META.new.dot} />
          <StatCard label="Contacted" value={counts.contacted || 0} color={STATUS_META.contacted.dot} />
          <StatCard label="Qualified" value={counts.qualified || 0} color={STATUS_META.qualified.dot} />
          <StatCard label="Converted" value={counts.converted || 0} color={STATUS_META.converted.dot} />
        </div>

        {/* Filters + search */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Status tabs */}
          <div className="flex flex-wrap gap-1.5">
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs uppercase tracking-wider font-medium transition-all ${
                  filter === s
                    ? 'bg-navy text-cream shadow-sm'
                    : 'bg-white text-navy border border-navy-200 hover:border-navy'
                }`}
              >
                {s === 'all' ? 'All' : STATUS_META[s]?.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative sm:ml-auto">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
            <input
              className="pl-8 pr-8 py-2 text-sm border border-navy-200 rounded-full bg-white text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-gold w-full sm:w-56"
              placeholder="Search name, email, city…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink/40 hover:text-ink"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-16 text-navy">
            <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading leads…
          </div>
        ) : leads.length === 0 ? (
          <div className="card p-12 text-center text-ink/50">
            {search || filter !== 'all'
              ? 'No leads match your filters.'
              : 'No leads yet. The popup will capture leads automatically once visitors submit the form.'}
          </div>
        ) : (
          <>
            <p className="text-xs text-ink/40 mb-4">{leads.length} lead{leads.length !== 1 ? 's' : ''} found</p>
            <div className="grid md:grid-cols-2 gap-4">
              {leads.map(lead => (
                <LeadCard
                  key={lead._id}
                  lead={lead}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ManageLeads;