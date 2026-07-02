import { useEffect, useState, useCallback } from 'react';
import { Plus, X, ChevronDown, ChevronUp, ToggleLeft, ToggleRight, Trash2, FileText, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const fmt = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';

const statusBadge = (active) => active
  ? 'bg-green-100 text-green-800'
  : 'bg-gray-100 text-gray-600';

// ── AUM Cards ───────────────────────────────────────────────────────────────
const AumCard = ({ label, value, sub }) => (
  <div className="card p-5">
    <div className="text-xs uppercase tracking-widest text-ink/50 mb-1">{label}</div>
    <div className="font-display text-2xl text-navy">{value}</div>
    {sub && <div className="text-xs text-ink/50 mt-0.5">{sub}</div>}
  </div>
);

// ── Add Investment Modal ────────────────────────────────────────────────────
const AddModal = ({ users, onClose, onSaved }) => {
  const [form, setForm] = useState({ userId: '', monthlyReturnPercent: '', startDate: '', lockInMonths: '0', initialDeposit: '', note: '' });
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const save = async () => {
    if (!form.userId || !form.monthlyReturnPercent || !form.startDate) {
      return toast.error('User, return rate, and start date are required');
    }
    setSaving(true);
    try {
      await api.post('/admin/investments', form);
      toast.success('Investment created');
      onSaved();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to create investment');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/80 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-navy-100">
          <h3 className="font-display text-xl text-navy">New Investment</h3>
          <button onClick={onClose}><X size={20} className="text-ink/40 hover:text-ink" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="label-field">Search User</label>
            <input className="input-field mb-2" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
            <select className="input-field" value={form.userId} onChange={e => setForm(f => ({ ...f, userId: e.target.value }))}>
              <option value="">— Select User —</option>
              {filtered.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field">Monthly Return %</label>
              <input type="number" step="0.01" className="input-field" placeholder="e.g. 2.5" value={form.monthlyReturnPercent} onChange={e => setForm(f => ({ ...f, monthlyReturnPercent: e.target.value }))} />
            </div>
            <div>
              <label className="label-field">Lock-in Months</label>
              <input type="number" className="input-field" placeholder="0 = none" value={form.lockInMonths} onChange={e => setForm(f => ({ ...f, lockInMonths: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-field">Start Date</label>
              <input type="date" className="input-field" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div>
              <label className="label-field">Initial Deposit (₹)</label>
              <input type="number" className="input-field" placeholder="0" value={form.initialDeposit} onChange={e => setForm(f => ({ ...f, initialDeposit: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label-field">Note</label>
            <input className="input-field" placeholder="Internal note…" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />
          </div>
        </div>
        <div className="flex gap-3 p-6 pt-0">
          <button className="btn-gold flex-1" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Create Investment'}</button>
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

// ── Detail Drawer ───────────────────────────────────────────────────────────
const DetailDrawer = ({ inv, onClose, onRefresh }) => {
  const [tab, setTab] = useState('overview');
  const [settings, setSettings] = useState({ monthlyReturnPercent: inv.monthlyReturnPercent, lockInMonths: inv.lockInMonths, startDate: inv.startDate?.slice(0, 10), notes: inv.notes || '' });
  const [txForm, setTxForm] = useState({ type: 'deposit', amount: '', date: '', note: '' });
  const [returnForm, setReturnForm] = useState({ month: '', amount: '' });
  const [kycForm, setKycForm] = useState({ label: '', fileUrl: '' });
  const [wrs, setWrs] = useState([]);
  const [saving, setSaving] = useState(false);

  const stats = {
    principalAmount: inv.transactions?.filter(t => t.type === 'deposit').reduce((s, t) => s + t.amount, 0) || 0,
    totalWithdrawn: inv.transactions?.filter(t => t.type === 'withdrawal_credit').reduce((s, t) => s + t.amount, 0) || 0,
  };
  stats.netInvested = stats.principalAmount - stats.totalWithdrawn;

  useEffect(() => {
    if (tab === 'withdrawals') {
      api.get('/admin/withdrawal-requests')
        .then(({ data }) => setWrs(data.requests.filter(r => r.investment?._id === inv._id || r.investment === inv._id)))
        .catch(() => {});
    }
  }, [tab, inv._id]);

  const saveSettings = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin/investments/${inv._id}/settings`, settings);
      toast.success('Settings saved');
      onRefresh();
    } catch { toast.error('Failed'); } finally { setSaving(false); }
  };

  const addTx = async () => {
    if (!txForm.amount) return toast.error('Amount required');
    try {
      await api.post(`/admin/investments/${inv._id}/transaction`, txForm);
      toast.success('Transaction added');
      setTxForm({ type: 'deposit', amount: '', date: '', note: '' });
      onRefresh();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const deleteTx = async (txId) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/admin/investments/${inv._id}/transaction/${txId}`);
      toast.success('Deleted');
      onRefresh();
    } catch { toast.error('Failed'); }
  };

  const creditReturn = async () => {
    if (!returnForm.month || !returnForm.amount) return toast.error('Month and amount required');
    try {
      await api.post(`/admin/investments/${inv._id}/credit-return`, returnForm);
      toast.success('Return credited');
      setReturnForm({ month: '', amount: '' });
      onRefresh();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const autoAmount = () => {
    const suggested = (stats.netInvested * inv.monthlyReturnPercent / 100).toFixed(0);
    setReturnForm(f => ({ ...f, amount: suggested }));
  };

  const addKyc = async () => {
    if (!kycForm.label || !kycForm.fileUrl) return toast.error('Label and URL required');
    try {
      await api.post(`/admin/investments/${inv._id}/kyc`, kycForm);
      toast.success('Document added');
      setKycForm({ label: '', fileUrl: '' });
      onRefresh();
    } catch { toast.error('Failed'); }
  };

  const processWr = async (wrId, status, adminNote) => {
    try {
      await api.patch(`/admin/withdrawal-requests/${wrId}`, { status, adminNote });
      toast.success(`Request ${status}`);
      setWrs(prev => prev.map(r => r._id === wrId ? { ...r, status } : r));
    } catch { toast.error('Failed'); }
  };

  const TABS = ['overview', 'transactions', 'returns', 'withdrawals', 'kyc'];

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-navy-900/80 p-2 md:p-4">
      <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-navy-100 flex-shrink-0">
          <div>
            <div className="font-display text-xl text-navy">{inv.user?.name}</div>
            <div className="text-xs text-ink/50">{inv.user?.email}</div>
          </div>
          <button onClick={onClose}><X size={20} className="text-ink/40 hover:text-ink" /></button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pt-3 border-b border-navy-100 flex-shrink-0 overflow-x-auto">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize whitespace-nowrap transition-all rounded-t-lg ${tab === t ? 'bg-navy text-cream' : 'text-ink/60 hover:text-navy'}`}>
              {t === 'returns' ? 'Return Credits' : t === 'withdrawals' ? 'Withdrawals' : t}
            </button>
          ))}
        </div>

        <div className="overflow-y-auto flex-1 p-5">
          {/* OVERVIEW */}
          {tab === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-navy-50 rounded-xl p-4"><div className="text-xs text-ink/50 mb-1">Net Invested</div><div className="font-display text-lg text-navy">{fmt(stats.netInvested)}</div></div>
                <div className="bg-gold/10 rounded-xl p-4"><div className="text-xs text-ink/50 mb-1">Start Date</div><div className="font-display text-lg text-navy">{fmtDate(inv.startDate)}</div></div>
                <div className="bg-navy-50 rounded-xl p-4"><div className="text-xs text-ink/50 mb-1">Monthly Rate</div><div className="font-display text-lg text-navy">{inv.monthlyReturnPercent}%</div></div>
                <div className="bg-navy-50 rounded-xl p-4"><div className="text-xs text-ink/50 mb-1">Lock-in</div><div className="font-display text-lg text-navy">{inv.lockInMonths === 0 ? 'None' : `${inv.lockInMonths}mo`}</div></div>
              </div>
              {inv.notes && <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800"><strong>Notes:</strong> {inv.notes}</div>}
              <div className="border border-navy-100 rounded-xl p-5">
                <h4 className="font-display text-navy mb-4">Edit Settings</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="label-field">Monthly Return %</label><input type="number" step="0.01" className="input-field" value={settings.monthlyReturnPercent} onChange={e => setSettings(s => ({ ...s, monthlyReturnPercent: e.target.value }))} /></div>
                  <div><label className="label-field">Lock-in Months</label><input type="number" className="input-field" value={settings.lockInMonths} onChange={e => setSettings(s => ({ ...s, lockInMonths: e.target.value }))} /></div>
                  <div><label className="label-field">Start Date</label><input type="date" className="input-field" value={settings.startDate} onChange={e => setSettings(s => ({ ...s, startDate: e.target.value }))} /></div>
                  <div><label className="label-field">Internal Notes</label><input className="input-field" value={settings.notes} onChange={e => setSettings(s => ({ ...s, notes: e.target.value }))} /></div>
                </div>
                <button className="btn-gold mt-3" onClick={saveSettings} disabled={saving}>{saving ? 'Saving…' : 'Save Settings'}</button>
              </div>
            </div>
          )}

          {/* TRANSACTIONS */}
          {tab === 'transactions' && (
            <div className="space-y-5">
              <div className="border border-navy-100 rounded-xl p-4">
                <h4 className="font-display text-navy mb-3">Add Transaction</h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div><label className="label-field">Type</label>
                    <select className="input-field" value={txForm.type} onChange={e => setTxForm(f => ({ ...f, type: e.target.value }))}>
                      <option value="deposit">Deposit</option>
                      <option value="withdrawal_credit">Withdrawal / Credit</option>
                    </select>
                  </div>
                  <div><label className="label-field">Amount (₹)</label><input type="number" className="input-field" value={txForm.amount} onChange={e => setTxForm(f => ({ ...f, amount: e.target.value }))} /></div>
                  <div><label className="label-field">Date</label><input type="date" className="input-field" value={txForm.date} onChange={e => setTxForm(f => ({ ...f, date: e.target.value }))} /></div>
                  <div><label className="label-field">Note</label><input className="input-field" value={txForm.note} onChange={e => setTxForm(f => ({ ...f, note: e.target.value }))} /></div>
                </div>
                <button className="btn-gold" onClick={addTx}>Add Transaction</button>
              </div>
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-navy-50 text-navy">
                    <tr><th className="text-left p-3">Date</th><th className="text-left p-3">Type</th><th className="text-right p-3">Amount</th><th className="text-left p-3">Note</th><th className="p-3"></th></tr>
                  </thead>
                  <tbody>
                    {[...(inv.transactions || [])].sort((a, b) => new Date(b.date) - new Date(a.date)).map(t => (
                      <tr key={t._id} className="border-t border-navy-100">
                        <td className="p-3 text-ink/70">{fmtDate(t.date)}</td>
                        <td className="p-3"><span className={`badge text-xs ${t.type === 'deposit' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>{t.type === 'deposit' ? 'Deposit' : 'Credit'}</span></td>
                        <td className="p-3 text-right font-medium text-navy">{fmt(t.amount)}</td>
                        <td className="p-3 text-ink/60 text-xs">{t.note || '—'}</td>
                        <td className="p-3"><button onClick={() => deleteTx(t._id)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!inv.transactions?.length && <div className="p-6 text-center text-ink/50 text-sm">No transactions yet.</div>}
              </div>
            </div>
          )}

          {/* RETURN CREDITS */}
          {tab === 'returns' && (
            <div className="space-y-5">
              <div className="border border-navy-100 rounded-xl p-4">
                <h4 className="font-display text-navy mb-3">Credit Monthly Return</h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div><label className="label-field">Month</label><input className="input-field" placeholder="e.g. June 2026" value={returnForm.month} onChange={e => setReturnForm(f => ({ ...f, month: e.target.value }))} /></div>
                  <div>
                    <label className="label-field">Amount (₹)</label>
                    <div className="flex gap-2">
                      <input type="number" className="input-field flex-1" value={returnForm.amount} onChange={e => setReturnForm(f => ({ ...f, amount: e.target.value }))} />
                      <button className="btn-ghost !py-2 !px-3 text-xs whitespace-nowrap" onClick={autoAmount}>Auto</button>
                    </div>
                    <div className="text-xs text-ink/40 mt-1">Suggested: {fmt(stats.netInvested * inv.monthlyReturnPercent / 100)}</div>
                  </div>
                </div>
                <button className="btn-gold" onClick={creditReturn}>Credit Return</button>
              </div>
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-navy-50 text-navy">
                    <tr><th className="text-left p-3">Month</th><th className="text-right p-3">Amount</th><th className="text-left p-3">Credited On</th></tr>
                  </thead>
                  <tbody>
                    {[...(inv.monthlyReturnLog || [])].sort((a, b) => new Date(b.creditedAt) - new Date(a.creditedAt)).map(r => (
                      <tr key={r._id} className="border-t border-navy-100">
                        <td className="p-3 font-medium text-navy">{r.month}</td>
                        <td className="p-3 text-right text-green-700 font-medium">{fmt(r.amount)}</td>
                        <td className="p-3 text-ink/60">{fmtDate(r.creditedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!inv.monthlyReturnLog?.length && <div className="p-6 text-center text-ink/50 text-sm">No returns credited yet.</div>}
              </div>
            </div>
          )}

          {/* WITHDRAWAL REQUESTS */}
          {tab === 'withdrawals' && (
            <div className="space-y-3">
              {wrs.length === 0 ? <div className="p-8 text-center text-ink/50 text-sm">No withdrawal requests.</div> : wrs.map(r => (
                <div key={r._id} className="border border-navy-100 rounded-xl p-4">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <div className="font-medium text-navy">{fmt(r.amount)}</div>
                      <div className="text-xs text-ink/50">{r.reason || 'No reason given'} · {fmtDate(r.requestedAt)}</div>
                    </div>
                    <span className={`badge text-xs ${r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : r.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{r.status}</span>
                  </div>
                  {r.status === 'pending' && (
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => processWr(r._id, 'approved', '')} className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-800 rounded text-xs font-medium hover:bg-green-200">Approve</button>
                      <button onClick={() => processWr(r._id, 'rejected', 'Admin rejected')} className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200">Reject</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* KYC DOCS */}
          {tab === 'kyc' && (
            <div className="space-y-5">
              <div className="border border-navy-100 rounded-xl p-4">
                <h4 className="font-display text-navy mb-3">Upload Document</h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div><label className="label-field">Label</label><input className="input-field" placeholder="e.g. Aadhaar, PAN, Agreement" value={kycForm.label} onChange={e => setKycForm(f => ({ ...f, label: e.target.value }))} /></div>
                  <div><label className="label-field">File URL</label><input className="input-field" placeholder="https://…" value={kycForm.fileUrl} onChange={e => setKycForm(f => ({ ...f, fileUrl: e.target.value }))} /></div>
                </div>
                <button className="btn-gold" onClick={addKyc}>Add Document</button>
              </div>
              <div className="space-y-2">
                {(inv.kycDocuments || []).map(doc => (
                  <div key={doc._id} className="flex items-center justify-between p-3 border border-navy-100 rounded-xl">
                    <div><div className="font-medium text-navy text-sm">{doc.label}</div><div className="text-xs text-ink/50">{fmtDate(doc.uploadedAt)}</div></div>
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-gold text-xs font-medium hover:underline"><FileText size={14} /> View</a>
                  </div>
                ))}
                {!inv.kycDocuments?.length && <div className="p-6 text-center text-ink/50 text-sm">No documents uploaded.</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Page ────────────────────────────────────────────────────────────────
const ManageInvestments = () => {
  const [investments, setInvestments] = useState([]);
  const [aum, setAum] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [detail, setDetail] = useState(null);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [invRes, aumRes, usersRes] = await Promise.all([
        api.get('/admin/investments'),
        api.get('/admin/investments/aum'),
        api.get('/admin/users')
      ]);
      setInvestments(invRes.data.investments);
      setAum(aumRes.data.stats);
      setUsers(usersRes.data.users.filter(u => u.role === 'user'));
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggle = async (id) => {
    try {
      await api.patch(`/admin/investments/${id}/toggle`);
      toast.success('Status updated');
      load();
    } catch { toast.error('Failed'); }
  };

  const refreshDetail = async () => {
    await load();
    if (detail) {
      const fresh = await api.get('/admin/investments');
      const found = fresh.data.investments.find(i => i._id === detail._id);
      if (found) setDetail(found);
    }
  };

  const filtered = investments.filter(i =>
    !search ||
    i.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    i.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-cream min-h-screen">
      <section className="bg-navy-900 text-cream py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-start justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-gold mb-1">Admin</div>
            <h1 className="font-display text-3xl">Manage Investments</h1>
          </div>
          <button className="btn-gold mt-1" onClick={() => setShowAdd(true)}>
            <Plus size={16} /> Add Investment
          </button>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* AUM Dashboard */}
        {aum && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <AumCard label="Total AUM" value={fmt(aum.totalAUM)} sub="Net invested across all active accounts" />
            <AumCard label="Current Value" value={fmt(aum.totalCurrentValue)} sub="Compounded portfolio value" />
            <AumCard label="Returns Given" value={fmt(aum.totalGrowthGiven)} sub="Total growth credited" />
            <AumCard label="Active Investors" value={aum.activeInvestors} sub={`${aum.totalWithdrawals} withdrawal(s) approved`} />
          </div>
        )}

        {/* Search */}
        <div className="flex gap-3 mb-5">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40" />
            <input className="input-field !py-2 pl-9 text-sm" placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-16 text-navy">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center text-ink/60">No investments found.</div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-navy-50 text-navy">
                  <tr>
                    <th className="text-left p-4">Investor</th>
                    <th className="text-center p-4">Status</th>
                    <th className="text-right p-4 hidden sm:table-cell">Net Invested</th>
                    <th className="text-center p-4 hidden md:table-cell">Rate</th>
                    <th className="text-right p-4 hidden lg:table-cell">Current Value</th>
                    <th className="text-right p-4 hidden lg:table-cell">Growth</th>
                    <th className="text-right p-4 hidden xl:table-cell">Months</th>
                    <th className="text-right p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(inv => (
                    <tr key={inv._id} className="border-t border-navy-100 hover:bg-cream/40">
                      <td className="p-4">
                        <div className="font-medium text-navy">{inv.user?.name}</div>
                        <div className="text-xs text-ink/50">{inv.user?.email}</div>
                      </td>
                      <td className="p-4 text-center">
                        <button onClick={() => toggle(inv._id)} className={`badge cursor-pointer hover:opacity-80 transition-opacity ${statusBadge(inv.isActive)}`}>
                          {inv.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="p-4 text-right hidden sm:table-cell font-medium text-navy">{fmt(inv.netInvested || 0)}</td>
                      <td className="p-4 text-center hidden md:table-cell">{inv.monthlyReturnPercent}%/mo</td>
                      <td className="p-4 text-right hidden lg:table-cell text-gold font-medium">{fmt(inv.currentValue || 0)}</td>
                      <td className="p-4 text-right hidden lg:table-cell">
                        <span className="text-green-700 font-medium">{(inv.growthPercent || 0).toFixed(1)}%</span>
                      </td>
                      <td className="p-4 text-right hidden xl:table-cell text-ink/70">{(inv.monthsActive || 0).toFixed(1)}</td>
                      <td className="p-4 text-right">
                        <button onClick={() => setDetail(inv)} className="text-sm font-medium text-gold hover:text-navy transition-colors">View →</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showAdd && <AddModal users={users} onClose={() => setShowAdd(false)} onSaved={load} />}
      {detail && <DetailDrawer inv={detail} onClose={() => setDetail(null)} onRefresh={refreshDetail} />}
    </div>
  );
};

export default ManageInvestments;
