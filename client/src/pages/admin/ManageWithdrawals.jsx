import { useEffect, useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const fmt = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';

const statusBadge = (s) => ({
  pending:  'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
})[s] || 'bg-gray-100 text-gray-600';

const ManageWithdrawals = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [noteMap, setNoteMap] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/withdrawal-requests');
      setRequests(data.requests);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const process = async (id, status) => {
    try {
      await api.patch(`/admin/withdrawal-requests/${id}`, { status, adminNote: noteMap[id] || '' });
      toast.success(`Request ${status}`);
      load();
    } catch { toast.error('Failed'); }
  };

  const filtered = requests.filter(r => tab === 'all' || r.status === tab);

  return (
    <div className="bg-cream min-h-screen">
      <section className="bg-navy-900 text-cream py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-xs uppercase tracking-[0.3em] text-gold mb-1">Admin</div>
          <h1 className="font-display text-3xl">Withdrawal Requests</h1>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['pending', 'approved', 'rejected', 'all'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${tab === t ? 'bg-navy text-cream' : 'bg-white text-navy border border-navy-200 hover:border-navy'}`}>
              {t} {t === 'pending' && requests.filter(r => r.status === 'pending').length > 0 && (
                <span className="ml-1 bg-gold text-navy-900 text-xs font-bold rounded-full px-1.5 py-0.5">{requests.filter(r => r.status === 'pending').length}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-navy">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center text-ink/60">No requests found.</div>
        ) : (
          <div className="space-y-4">
            {filtered.map(r => (
              <div key={r._id} className="card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="font-display text-xl text-navy">{fmt(r.amount)}</div>
                    <div className="font-medium text-ink mt-0.5">{r.user?.name}</div>
                    <div className="text-xs text-ink/50">{r.user?.email} {r.user?.phone && `· ${r.user.phone}`}</div>
                    {r.reason && <div className="text-sm text-ink/70 mt-2">Reason: {r.reason}</div>}
                    <div className="text-xs text-ink/40 mt-1">Requested: {fmtDate(r.requestedAt)}</div>
                    {r.status !== 'pending' && r.adminNote && (
                      <div className="text-xs text-ink/60 mt-1">Admin Note: {r.adminNote}</div>
                    )}
                    {r.status !== 'pending' && (
                      <div className="text-xs text-ink/40 mt-0.5">Processed: {fmtDate(r.processedAt)}</div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <span className={`badge ${statusBadge(r.status)}`}>{r.status}</span>
                    {r.status === 'pending' && (
                      <div className="flex flex-col gap-2 items-end">
                        <input
                          className="input-field !py-1.5 text-xs w-48"
                          placeholder="Admin note (optional)…"
                          value={noteMap[r._id] || ''}
                          onChange={e => setNoteMap(m => ({ ...m, [r._id]: e.target.value }))}
                        />
                        <div className="flex gap-2">
                          <button onClick={() => process(r._id, 'approved')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-800 rounded text-xs font-medium hover:bg-green-200 transition-colors">
                            <CheckCircle size={13} /> Approve
                          </button>
                          <button onClick={() => process(r._id, 'rejected')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 transition-colors">
                            <XCircle size={13} /> Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageWithdrawals;
