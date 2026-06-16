import { Link } from 'react-router-dom';
import { LineChart, TrendingUp, Globe, BookOpen, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp, fadeLeft, stagger } from '../utils/motion';

const VP = { once: true, margin: '-80px' };

const ICONS = { LineChart, TrendingUp, Globe, BookOpen };

const PROGRAMS = [
  {
    slug: 'smc-trading',
    icon: 'LineChart',
    badge: 'SMC Trading',
    title: 'Smart Money Concepts',
    desc: 'Decode institutional order flow. Learn Order Blocks, FVGs, liquidity sweeps, and the execution playbook used by professional traders.',
    stats: ['60–90 Days', 'Intermediate', '8+ Modules'],
    accent: true
  },
  {
    slug: 'investing',
    icon: 'TrendingUp',
    badge: 'Investing',
    title: 'Long-Term Wealth Building',
    desc: 'Build a multi-decade portfolio using quality screens, asset allocation models, SIP discipline, and behavioral edge.',
    stats: ['45–60 Days', 'All Levels', '6+ Modules'],
    accent: false
  },
  {
    slug: 'forex',
    icon: 'Globe',
    badge: 'Forex',
    title: 'Currency Markets for Indian Traders',
    desc: 'Currency derivatives, hedging strategies, and exchange-listed forex — the legal, structured way to trade global markets from India.',
    stats: ['45 Days', 'Beginner–Intermediate', '5+ Modules'],
    accent: false
  },
  {
    slug: 'foundation',
    icon: 'BookOpen',
    badge: 'Foundation',
    title: 'Financial Foundations',
    desc: 'The starting point. Markets, instruments, risk basics, and the mental models every trader and investor needs before anything else.',
    stats: ['30 Days', 'Beginner', '4+ Modules'],
    accent: false
  }
];

const Courses = () => (
  <div>
    {/* Hero */}
    <section className="relative bg-gradient-navy text-cream overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40 mask-fade-b" aria-hidden />
      <div className="absolute top-20 -right-32 w-96 h-96 bg-gold/20 rounded-full blur-3xl" aria-hidden />
      <div className="relative container-page py-20 md:py-28">
        <motion.div
          className="max-w-3xl"
          variants={fadeLeft} initial="hidden" animate="show"
        >
          <div className="eyebrow-cream mb-3">Our Programs</div>
          <h1 className="h-display text-balance mb-6">
            Choose your <span className="italic text-gold">path.</span><br />
            Build your edge.
          </h1>
          <p className="text-cream/75 text-lg leading-relaxed text-pretty max-w-2xl">
            Four structured programs — each built around real institutional logic, not YouTube theory.
          </p>
        </motion.div>
      </div>
    </section>

    {/* Program cards */}
    <section className="section bg-cream">
      <div className="container-page">
        <motion.div
          className="grid md:grid-cols-2 gap-6"
          variants={stagger} initial="hidden" whileInView="show" viewport={VP}
        >
          {PROGRAMS.map(p => (
            <motion.div key={p.slug} variants={fadeUp}>
              <ProgramCard program={p} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>

    {/* Trust bar */}
    <section className="bg-navy text-cream py-14 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-30" aria-hidden />
      <motion.div
        className="relative container-page grid grid-cols-1 sm:grid-cols-3 gap-8 text-center"
        variants={stagger} initial="hidden" whileInView="show" viewport={VP}
      >
        {[
          { number: '500+', label: 'Students Trained' },
          { number: '4', label: 'Structured Programs' },
          { number: 'Cohort 12', label: 'Now Enrolling' }
        ].map(s => (
          <motion.div key={s.label} variants={fadeUp}>
            <div className="font-display text-3xl md:text-4xl text-gold mb-2">{s.number}</div>
            <div className="text-xs uppercase tracking-super-wide text-cream/60">{s.label}</div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  </div>
);

const ProgramCard = ({ program }) => {
  const Icon = ICONS[program.icon];
  return (
    <Link
      to={`/programs/${program.slug}`}
      className={`card-premium relative block overflow-hidden h-full ${
        program.accent ? 'ring-2 ring-gold/40 shadow-gold-glow' : ''
      }`}
    >
      <div className="h-[3px] bg-gradient-gold" />

      {program.accent && (
        <span className="absolute -top-3 right-6 bg-gold text-navy-900 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow">
          Most Popular
        </span>
      )}

      <div className="p-7 flex flex-col h-full">
        <div className="flex items-center justify-between mb-5 mt-1">
          <span className="badge-gold">{program.badge}</span>
          <div className="w-11 h-11 rounded-lg bg-navy-50 text-navy flex items-center justify-center">
            <Icon size={20} />
          </div>
        </div>

        <h3 className="font-display text-2xl text-navy mb-3">{program.title}</h3>
        <p className="text-ink/65 text-sm leading-relaxed mb-5 flex-1">{program.desc}</p>

        <div className="flex flex-wrap gap-2 mb-6">
          {program.stats.map(s => (
            <span key={s} className="badge bg-navy-50 text-navy">{s}</span>
          ))}
        </div>

        <motion.span
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-dark"
          whileHover={{ x: 6 }}
          transition={{ duration: 0.18 }}
        >
          Explore Program <ArrowRight size={14} />
        </motion.span>
      </div>
    </Link>
  );
};

export default Courses;
