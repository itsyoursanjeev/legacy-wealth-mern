import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users, BookOpen, IndianRupee, BadgeCheck, ArrowRight,
  Clock, FileText, TrendingUp, ArrowLeftRight, Filter
} from 'lucide-react';
import api from '../../api/axios';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard-stats')
      .then(({ data }) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-navy">Loading…</div>;

  return (
    <div className="bg-cream min-h-screen">
      <section className="bg-navy-900 text-cream py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-xs uppercase tracking-[0.3em] text-gold mb-2">Admin</div>
          <h1 className="font-display text-3xl md:text-4xl">Control Centre</h1>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Users"             value={stats?.usersCount || 0} />
          <StatCard label="Courses"           value={stats?.coursesCount || 0} />
          <StatCard label="Pending Approvals" value={stats?.pendingEnrollments || 0} alert={stats?.pendingEnrollments > 0} />
          <StatCard label="Revenue Collected" value={`₹${(stats?.totalRevenue || 0).toLocaleString('en-IN')}`} gold />
        </div>

        {/* Pending approval alert */}
        {stats?.pendingEnrollments > 0 && (
          <Link
            to="/admin/enrollments?status=pending"
            className="flex items-center justify-between bg-yellow-50 border border-yellow-200 rounded-xl p-4 hover:bg-yellow-100 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Clock className="text-yellow-600 shrink-0" size={20} />
              <div>
                <p className="font-medium text-yellow-800">
                  {stats.pendingEnrollments} enrollment{stats.pendingEnrollments > 1 ? 's' : ''} waiting for your approval
                </p>
                <p className="text-xs text-yellow-700">Click to review and approve</p>
              </div>
            </div>
            <ArrowRight className="text-yellow-600 shrink-0" size={18} />
          </Link>
        )}

        {/* ── Content & Users ── */}
        <div>
          <p className="text-xs uppercase tracking-widest text-ink/40 mb-4">Content &amp; Users</p>
          <div className="grid sm:grid-cols-3 gap-4">
            <NavCard icon={<Users size={18} />}    iconBg="bg-navy text-gold"       title="Manage Users"   desc="View and control accounts"    to="/admin/users" />
            <NavCard icon={<BookOpen size={18} />} iconBg="bg-navy text-gold"       title="Manage Courses" desc="Add, edit, publish programs"   to="/admin/courses" />
            <NavCard icon={<FileText size={18} />} iconBg="bg-navy text-gold"       title="Manage Blogs"   desc="Write and publish articles"    to="/admin/blogs" />
          </div>
        </div>

        {/* ── Financial & Investments ── */}
        <div>
          <p className="text-xs uppercase tracking-widest text-ink/40 mb-4">Financial &amp; Investments</p>
          <div className="grid sm:grid-cols-2 gap-4">
            <NavCard icon={<BadgeCheck size={18} />}     iconBg="bg-gold/15 text-gold-dark"  title="Manage Enrollments"  desc="Approve, reject, mark payments"       to="/admin/enrollments" />
            <NavCard icon={<TrendingUp size={18} />}     iconBg="bg-gold/15 text-gold-dark"  title="Manage Investments"  desc="Track investor portfolios &amp; returns"   to="/admin/investments" />
            <NavCard icon={<ArrowLeftRight size={18} />} iconBg="bg-gold/15 text-gold-dark"  title="Manage Withdrawals"  desc="Review &amp; process withdrawal requests" to="/admin/withdrawals" />
            <NavCard icon={<Filter size={18} />}         iconBg="bg-gold/15 text-gold-dark"  title="View Leads"          desc="Track funnel and conversions"         to="/admin/leads" />
          </div>
        </div>

        {/* ── Recent Enrollments ── */}
        <div className="bg-white border border-navy-100 rounded-2xl p-6">
          <h2 className="font-display text-xl text-navy mb-5 flex items-center gap-2">
            <BadgeCheck className="text-gold" size={20} /> Recent Enrollments
          </h2>
          {!stats?.recentEnrollments?.length ? (
            <p className="text-ink/60 text-sm">No enrollments yet.</p>
          ) : (
            <div className="divide-y divide-navy-100">
              {stats.recentEnrollments.map(e => (
                <div key={e._id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium text-navy">{e.user?.name || 'Guest'}</div>
                    <div className="text-xs text-ink/50">{e.user?.email || '—'}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-navy">{e.course?.title}</div>
                    <div className="flex items-center gap-2 justify-end mt-1">
                      <span className={`badge text-[10px] ${
                        e.enrollmentStatus === 'active'   ? 'bg-green-100 text-green-800' :
                        e.enrollmentStatus === 'rejected' ? 'bg-red-100 text-red-700'    :
                        'bg-yellow-100 text-yellow-800'
                      }`}>{e.enrollmentStatus}</span>
                      <span className="text-xs text-gold-dark">₹{e.amountPaid.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <Link to="/admin/enrollments" className="mt-4 inline-block text-sm text-gold-dark hover:underline">
            View all enrollments →
          </Link>
        </div>

      </div>
    </div>
  );
};

// ── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, gold, alert }) => (
  <div className={`bg-white border rounded-xl p-5 ${alert ? 'border-yellow-300 bg-yellow-50' : 'border-navy-100'}`}>
    <div className={`text-xs uppercase tracking-widest mb-2 ${alert ? 'text-yellow-700' : 'text-ink/50'}`}>{label}</div>
    <div className={`font-display text-3xl ${gold ? 'text-gold' : alert ? 'text-yellow-800' : 'text-navy'}`}>{value}</div>
  </div>
);

// ── Nav Card ─────────────────────────────────────────────────────────────────
const NavCard = ({ icon, iconBg, title, desc, to }) => (
  <Link
    to={to}
    className="group flex items-start gap-4 bg-white border border-navy-100 rounded-xl p-5 hover:border-navy-300 hover:shadow-md transition-all"
  >
    <div className={`rounded-lg p-2 shrink-0 ${iconBg}`}>{icon}</div>
    <div className="flex flex-col flex-1 min-w-0">
      <span className="font-semibold text-navy text-sm group-hover:text-gold-dark transition-colors">{title}</span>
      <span className="text-xs text-ink/55 mt-0.5 leading-snug">{desc}</span>
      <span className="text-xs font-medium text-gold-dark mt-3">Open →</span>
    </div>
  </Link>
);

export default AdminDashboard;
