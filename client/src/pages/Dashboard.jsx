import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, Download, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { fadeUp, fadeLeft, stagger } from '../utils/motion';

const statusConfig = {
  active:   { label: 'Active',            cls: 'bg-green-100 text-green-800',  icon: <CheckCircle size={12}/> },
  pending:  { label: 'Pending Approval',  cls: 'bg-yellow-100 text-yellow-800', icon: <Clock size={12}/> },
  rejected: { label: 'Rejected',          cls: 'bg-red-100 text-red-800',      icon: <XCircle size={12}/> }
};

const paymentConfig = {
  paid:    { label: 'Paid',            cls: 'bg-green-100 text-green-800' },
  pending: { label: 'Payment Pending', cls: 'bg-yellow-100 text-yellow-800' },
  failed:  { label: 'Payment Failed',  cls: 'bg-red-100 text-red-800' }
};

const fmt = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';

// ── Investment Section ───────────────────────────────────────────────────────
const InvestmentSection = ({ user }) => {
  const [inv, setInv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState('');
  const [showReturns, setShowReturns] = useState(false);
  const [wrForm, setWrForm] = useState({ amount: '', reason: '' });
  const [wrHistory, setWrHistory] = useState([]);
  const [wrLoading, setWrLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/investments/me')
      .then(({ data }) => { if (data.active) setInv(data.investment); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (inv?.canWithdraw) {
      api.get('/investments/withdrawal-requests')
        .then(({ data }) => setWrHistory(data.requests))
        .catch(() => {});
    }
  }, [inv]);

  if (loading || !inv) return null;

  const goalMonths = goal && inv.netInvested > 0
    ? Math.ceil(Math.log(Number(goal) / inv.netInvested) / Math.log(1 + inv.monthlyReturnPercent / 100))
    : null;
  const goalDate = goalMonths > 0
    ? new Date(Date.now() + goalMonths * 30 * 24 * 60 * 60 * 1000).toLocaleString('en-IN', { month: 'long', year: 'numeric' })
    : null;

  const submitWr = async () => {
    if (!wrForm.amount || Number(wrForm.amount) <= 0) return;
    setSubmitting(true);
    try {
      await api.post('/investments/withdrawal-request', wrForm);
      import('react-hot-toast').then(({ default: toast }) => toast.success('Withdrawal request submitted'));
      setWrForm({ amount: '', reason: '' });
      const { data } = await api.get('/investments/withdrawal-requests');
      setWrHistory(data.requests);
    } catch (e) {
      import('react-hot-toast').then(({ default: toast }) => toast.error(e.response?.data?.message || 'Failed'));
    } finally { setSubmitting(false); }
  };

  const apiUrl = import.meta.env.VITE_API_URL || '/api';
  const token = localStorage.getItem('lw_token');

  return (
    <motion.div variants={fadeUp} initial="hidden" animate="show" className="mb-10">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-2xl text-navy">My Investment</h2>
        <a
          href={`${apiUrl}/investments/me/statement`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={e => {
            e.preventDefault();
            const url = `${apiUrl}/investments/me/statement`;
            fetch(url, { headers: { Authorization: `Bearer ${token}` } })
              .then(r => r.blob())
              .then(blob => { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'LW-Statement.pdf'; a.click(); })
              .catch(() => {});
          }}
          className="flex items-center gap-1.5 text-sm text-gold hover:text-navy font-medium transition-colors"
        >
          <Download size={14} /> Download Statement
        </a>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="card p-4">
          <div className="text-xs uppercase tracking-widest text-ink/50 mb-1">Net Invested</div>
          <div className="font-display text-xl text-navy">{fmt(inv.netInvested)}</div>
        </div>
        <div className="card p-4 border-gold/30 bg-gold/5">
          <div className="text-xs uppercase tracking-widest text-ink/50 mb-1">Current Value</div>
          <div className="font-display text-xl text-gold">{fmt(inv.currentValue)}</div>
        </div>
        <div className="card p-4">
          <div className="text-xs uppercase tracking-widest text-ink/50 mb-1">Total Growth</div>
          <div className="font-display text-xl text-green-700">{fmt(inv.totalGrowthAmount)}</div>
          <div className="text-xs text-green-600 mt-0.5">+{inv.totalGrowthPercent.toFixed(2)}%</div>
        </div>
        <div className="card p-4">
          <div className="text-xs uppercase tracking-widest text-ink/50 mb-1">Duration</div>
          <div className="font-display text-xl text-navy">{Math.floor(inv.monthsActive)}mo</div>
          <div className="text-xs text-ink/50 mt-0.5">{inv.daysActive} days</div>
        </div>
      </div>

      {/* Growth Chart */}
      {inv.projections?.length > 0 && (
        <div className="card p-5 mb-6">
          <h3 className="font-display text-lg text-navy mb-4">12-Month Projection</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={inv.projections} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <defs>
                <linearGradient id="colorPortfolio" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorFd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0D1B2A" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#0D1B2A" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorNifty" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#27AE60" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#27AE60" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} width={55} />
              <Tooltip formatter={(v, name) => [`₹${Math.round(v).toLocaleString('en-IN')}`, name]} />
              <Legend />
              <Area type="monotone" dataKey="value" name="Your Portfolio" stroke="#C9A84C" strokeWidth={2} fill="url(#colorPortfolio)" dot={false} />
              <Area type="monotone" dataKey="nifty" name="Nifty (12%/yr)" stroke="#27AE60" strokeWidth={1.5} fill="url(#colorNifty)" dot={false} strokeDasharray="4 3" />
              <Area type="monotone" dataKey="fd" name="FD (6.5%/yr)" stroke="#0D1B2A" strokeWidth={1.5} fill="url(#colorFd)" dot={false} strokeDasharray="2 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Goal Calculator */}
      <div className="card p-5 mb-6">
        <h3 className="font-display text-lg text-navy mb-3">Goal Calculator</h3>
        <div className="flex gap-3 items-end flex-wrap">
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs text-ink/60 mb-1 block">I want to reach ₹</label>
            <input
              type="number"
              className="input-field"
              placeholder="e.g. 1000000"
              value={goal}
              onChange={e => setGoal(e.target.value)}
            />
          </div>
          {goalMonths !== null && goalMonths > 0 && (
            <div className="flex-1 min-w-[200px] bg-gold/10 border border-gold/30 rounded-xl p-4">
              <div className="text-xs text-ink/60">At {inv.monthlyReturnPercent}%/month, you'll reach your goal in</div>
              <div className="font-display text-xl text-navy mt-1">{goalMonths} months</div>
              <div className="text-sm text-gold">Around {goalDate}</div>
            </div>
          )}
          {goal && Number(goal) <= inv.netInvested && (
            <div className="flex-1 min-w-[200px] text-sm text-ink/60 p-4 bg-cream rounded-xl">Enter an amount greater than your current invested value.</div>
          )}
        </div>
      </div>

      {/* Transaction History */}
      <div className="card mb-6 overflow-hidden">
        <div className="p-4 border-b border-navy-100">
          <h3 className="font-display text-lg text-navy">Transaction History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-navy-50 text-navy">
              <tr>
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Type</th>
                <th className="text-right p-3">Amount</th>
                <th className="text-left p-3 hidden sm:table-cell">Note</th>
              </tr>
            </thead>
            <tbody>
              {inv.transactions.map(t => (
                <tr key={t._id} className="border-t border-navy-100">
                  <td className="p-3 text-ink/70">{fmtDate(t.date)}</td>
                  <td className="p-3">
                    <span className={`badge text-xs ${t.type === 'deposit' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                      {t.type === 'deposit' ? 'Deposit' : 'Return Credit'}
                    </span>
                  </td>
                  <td className="p-3 text-right font-medium text-navy">{fmt(t.amount)}</td>
                  <td className="p-3 text-ink/60 text-xs hidden sm:table-cell">{t.note || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!inv.transactions.length && <div className="p-6 text-center text-ink/50">No transactions yet.</div>}
        </div>
      </div>

      {/* Withdrawal */}
      {inv.canWithdraw ? (
        <div className="card p-5 mb-6">
          <h3 className="font-display text-lg text-navy mb-4">Request Withdrawal</h3>
          <div className="flex gap-3 flex-wrap mb-4">
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs text-ink/60 mb-1 block">Amount (₹)</label>
              <input type="number" className="input-field" placeholder="Enter amount" value={wrForm.amount} onChange={e => setWrForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs text-ink/60 mb-1 block">Reason</label>
              <input className="input-field" placeholder="Optional reason" value={wrForm.reason} onChange={e => setWrForm(f => ({ ...f, reason: e.target.value }))} />
            </div>
          </div>
          <button className="btn-gold" onClick={submitWr} disabled={submitting || !wrForm.amount}>
            {submitting ? 'Submitting…' : 'Submit Request'}
          </button>
          {wrHistory.length > 0 && (
            <div className="mt-5 space-y-2">
              <div className="text-sm font-medium text-navy mb-2">Past Requests</div>
              {wrHistory.map(r => (
                <div key={r._id} className="flex justify-between items-center p-3 bg-navy-50 rounded-lg text-sm">
                  <div>
                    <span className="font-medium text-navy">{fmt(r.amount)}</span>
                    {r.reason && <span className="text-ink/60 ml-2">· {r.reason}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge text-xs ${r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : r.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{r.status}</span>
                    <span className="text-xs text-ink/40">{fmtDate(r.requestedAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="card p-5 mb-6 flex items-center gap-4">
          <Lock className="text-ink/40 shrink-0" size={24} />
          <div>
            <div className="font-medium text-navy">Withdrawals Locked</div>
            <div className="text-sm text-ink/60">Available from <strong>{fmtDate(inv.lockInEndsAt)}</strong> ({inv.lockInMonths} month lock-in)</div>
          </div>
        </div>
      )}

      {/* Monthly Return Log */}
      {inv.monthlyReturnLog?.length > 0 && (
        <div className="card overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-4 text-left hover:bg-navy-50/50 transition-colors"
            onClick={() => setShowReturns(r => !r)}
          >
            <h3 className="font-display text-lg text-navy">Monthly Return Log</h3>
            {showReturns ? <ChevronUp size={18} className="text-ink/40" /> : <ChevronDown size={18} className="text-ink/40" />}
          </button>
          {showReturns && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-navy-50 text-navy">
                  <tr>
                    <th className="text-left p-3">Month</th>
                    <th className="text-right p-3">Amount</th>
                    <th className="text-left p-3 hidden sm:table-cell">Credited On</th>
                  </tr>
                </thead>
                <tbody>
                  {inv.monthlyReturnLog.map(r => (
                    <tr key={r._id} className="border-t border-navy-100">
                      <td className="p-3 font-medium text-navy">{r.month}</td>
                      <td className="p-3 text-right text-green-700 font-medium">{fmt(r.amount)}</td>
                      <td className="p-3 text-ink/60 hidden sm:table-cell">{fmtDate(r.creditedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/enrollments/me')
      .then(({ data }) => setEnrollments(data.enrollments))
      .catch(() => setEnrollments([]))
      .finally(() => setLoading(false));
  }, []);

  const active   = enrollments.filter(e => e.enrollmentStatus === 'active');
  const pending  = enrollments.filter(e => e.enrollmentStatus === 'pending');
  const totalInvested = enrollments
    .filter(e => e.paymentStatus === 'paid')
    .reduce((s, e) => s + e.amountPaid, 0);

  return (
    <div className="bg-cream min-h-screen">
      <section className="bg-navy-900 text-cream py-12 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeLeft} initial="hidden" animate="show">
            <div className="text-xs uppercase tracking-[0.3em] text-gold mb-2">Your Dashboard</div>
            <h1 className="font-display text-3xl md:text-4xl">
              Welcome back, <span className="italic text-gold">{user?.name?.split(' ')[0]}</span>
            </h1>
          </motion.div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Investment Section */}
        <InvestmentSection user={user} />

        {/* Stats */}
        <motion.div
          className="grid sm:grid-cols-3 gap-4 mb-10"
          variants={stagger} initial="hidden" animate="show"
        >
          <StatCard icon={<BookOpen/>} label="Active Programs"  value={active.length} />
          <StatCard icon={<Clock/>}    label="Pending Approval" value={pending.length} />
          <StatCard icon={<TrendingUp/>} label="Total Invested" value={`₹${totalInvested.toLocaleString('en-IN')}`} />
        </motion.div>

        {/* Pending notice */}
        <AnimatePresence>
          {pending.length > 0 && (
            <motion.div
              variants={fadeUp} initial="hidden" animate="show"
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 overflow-hidden"
            >
              <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={18}/>
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  {pending.length} enrollment{pending.length > 1 ? 's' : ''} awaiting admin approval
                </p>
                <p className="text-xs text-yellow-700 mt-0.5">
                  Make your offline payment and contact us — we'll activate your access within 24 hours.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.h2
          className="font-display text-2xl text-navy mb-5"
          variants={fadeUp} initial="hidden" animate="show"
        >
          My Programs
        </motion.h2>

        {loading ? (
          <div className="grid md:grid-cols-2 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="flex justify-between mb-3">
                  <div className="h-5 w-24 bg-navy-100 rounded-full" />
                  <div className="h-5 w-28 bg-navy-100 rounded-full" />
                </div>
                <div className="h-6 w-3/4 bg-navy-100 rounded mb-4" />
                <div className="h-2 w-full bg-navy-100 rounded-full mb-1" />
                <div className="h-3 w-10 bg-navy-100 rounded mt-1 ml-auto mb-5" />
                <div className="h-9 w-full bg-navy-100 rounded-lg" />
              </div>
            ))}
          </div>
        ) : enrollments.length === 0 ? (
          <motion.div variants={fadeUp} initial="hidden" animate="show" className="card p-10 text-center">
            <BookOpen className="text-gold mx-auto mb-3" size={40}/>
            <h3 className="font-display text-xl text-navy mb-2">No programs yet</h3>
            <p className="text-ink/60 mb-5">Browse our programs and start your learning journey.</p>
            <Link to="/courses" className="btn-gold">Explore Programs</Link>
          </motion.div>
        ) : (
          <motion.div
            className="grid md:grid-cols-2 gap-5"
            variants={stagger} initial="hidden" animate="show"
          >
            {enrollments.map(e => (
              <motion.div key={e._id} variants={fadeUp}>
                <EnrollmentCard enrollment={e}/>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value }) => (
  <motion.div
    variants={fadeUp}
    whileHover={{ y: -3, transition: { duration: 0.2 } }}
    className="card p-5 flex items-center gap-4 cursor-default"
  >
    <div className="w-12 h-12 bg-navy text-gold rounded-lg flex items-center justify-center">{icon}</div>
    <div>
      <div className="text-xs uppercase tracking-widest text-ink/60">{label}</div>
      <div className="font-display text-2xl text-navy">{value}</div>
    </div>
  </motion.div>
);

const EnrollmentCard = ({ enrollment }) => {
  const course = enrollment.course;
  if (!course) return null;

  const es = statusConfig[enrollment.enrollmentStatus] || statusConfig.pending;
  const ps = paymentConfig[enrollment.paymentStatus] || paymentConfig.pending;
  const isActive = enrollment.enrollmentStatus === 'active';

  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.18 } }}
      className={`card p-6 ${!isActive ? 'opacity-90' : ''}`}
    >
      <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
        <span className="badge bg-navy-50 text-navy">{course.category}</span>
        <div className="flex gap-2">
          <span className={`badge flex items-center gap-1 ${es.cls}`}>{es.icon}{es.label}</span>
          <span className={`badge ${ps.cls}`}>{ps.label}</span>
        </div>
      </div>

      <h3 className="font-display text-xl text-navy mb-3">{course.title}</h3>

      {isActive ? (
        <>
          <div className="mb-4">
            <div className="flex justify-between text-xs text-ink/60 mb-1.5">
              <span>Progress</span>
              <span>{enrollment.progressPercent}%</span>
            </div>
            <div className="w-full bg-navy-100 rounded-full h-2 overflow-hidden">
              <motion.div
                className="bg-gold h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${enrollment.progressPercent}%` }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
              />
            </div>
          </div>
          <Link to={`/learn/${course.slug}`} className="btn-gold w-full !py-2.5 text-sm">
            Continue Learning →
          </Link>
        </>
      ) : enrollment.enrollmentStatus === 'rejected' ? (
        <div className="text-sm text-red-700 bg-red-50 rounded-lg p-3">
          Your enrollment was not approved. Please contact us for more information.
        </div>
      ) : (
        <div className="text-sm text-yellow-800 bg-yellow-50 rounded-lg p-3">
          Your enrollment is pending admin approval. Please complete your offline payment if not done yet.
        </div>
      )}

      <div className="flex justify-between text-xs text-ink/60 pt-3 mt-3 border-t border-navy-100">
        <span className="flex items-center gap-1">
          <Calendar size={12}/> Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString('en-IN')}
        </span>
        <span>₹{enrollment.amountPaid.toLocaleString('en-IN')}</span>
      </div>
    </motion.div>
  );
};

export default Dashboard;