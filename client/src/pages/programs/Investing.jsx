import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Check, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, fadeLeft, fadeRight, stagger, slideDown } from '../../utils/motion';

const VP = { once: true, margin: '-80px' };

const OUTCOMES = [
  'Understand equity, debt, and alternative asset classes',
  'Build a diversified portfolio with proper allocation models',
  'Analyse companies using quality screens and fundamentals',
  'Use SIP discipline to remove emotional decision-making',
  'Understand inflation, real returns, and compounding',
  'Manage behavioural biases that destroy long-term wealth'
];

const MODULES = [
  { title: 'Foundations of Wealth', desc: 'Inflation, compounding, why markets go up long-term' },
  { title: 'Asset Classes Deep Dive', desc: 'Equity, debt, gold, REITs, international funds' },
  { title: 'Portfolio Construction', desc: 'Allocation models, rebalancing, risk tolerance' },
  { title: 'Equity Fundamentals', desc: 'How to screen quality companies' },
  { title: 'SIP & Goal-Based Investing', desc: 'Linking money to life goals' },
  { title: 'Behavioural Finance', desc: 'The biases that make smart people poor investors' }
];

const PERSONAS = [
  { title: 'Salaried professionals', text: 'You earn well but your money is sitting in a savings account or FD. Time to put it to work.' },
  { title: 'New investors', text: "You've heard about SIPs and mutual funds but want to understand the logic, not just follow advice." },
  { title: 'Traders who want balance', text: 'Trading is a skill. Investing is a system. Learn to separate the two.' }
];

const FAQS = [
  { q: 'Do I need to know anything about finance first?', a: 'No. This program starts from scratch and builds up systematically.' },
  { q: 'Is this about stock picking?', a: 'Partly. But the emphasis is on system-building — allocation, rebalancing, and discipline — not stock tips.' },
  { q: 'How is this different from a mutual fund advisor?', a: 'We teach you to understand your own portfolio. The goal is informed independence, not dependency on advisors.' },
  { q: 'Is this investment advice?', a: 'No. Educational content only.' }
];

const Investing = () => {
  const [openFaq, setOpenFaq] = useState(0);

  return (
    <div>
      {/* Hero */}
      <section className="bg-navy-900 text-cream py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" aria-hidden />
        <div className="container-page relative">
          <motion.div variants={fadeLeft} initial="hidden" animate="show" className="flex items-center gap-2 text-cream/50 text-sm mb-8">
            <Link to="/courses" className="hover:text-gold transition-colors">Programs</Link>
            <span>/</span>
            <span className="text-cream/80">Investing</span>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-12 items-start">
            <motion.div className="lg:col-span-2" variants={fadeLeft} initial="hidden" animate="show">
              <div className="badge-gold mb-6">Long-Term Investing</div>
              <h1 className="h-display text-balance mb-6">
                Build <span className="italic text-gold">wealth</span> across generations.
              </h1>
              <p className="text-cream/70 text-lg leading-relaxed max-w-2xl mb-8 text-pretty">
                Stop chasing returns. Learn to build a portfolio that compounds quietly, survives volatility, and grows across decades — the way institutions and family offices do it.
              </p>
              <div className="flex flex-wrap gap-8">
                {['45–60 Days', 'All Levels', '6+ Modules'].map(s => (
                  <div key={s} className="border-l-2 border-gold/30 pl-4">
                    <div className="font-display text-lg text-cream">{s}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div className="lg:col-span-1" variants={fadeRight} initial="hidden" animate="show">
              <div className="bg-cream text-ink rounded-xl shadow-2xl border border-gold/30 p-7 lg:sticky lg:top-24">
                <h3 className="font-display text-xl text-navy mb-4">Enroll in this Program</h3>
                <div className="mb-6">
                  <span className="text-ink/40 line-through text-sm mr-2">₹12,999</span>
                  <span className="font-display text-3xl text-navy">₹7,999</span>
                </div>
                <Link to="/contact" state={{ program: 'Investing' }} className="btn-gold w-full mb-6">
                  Apply Now <ArrowRight size={16} />
                </Link>
                <ul className="space-y-2.5 text-sm text-ink/75">
                  {['Live cohort sessions', 'Weekly portfolio reviews', 'Private community', 'Lifetime material access'].map(b => (
                    <li key={b} className="flex items-center gap-2">
                      <Check size={16} className="text-gold shrink-0" /> {b}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What You'll Learn */}
      <section className="section bg-cream">
        <div className="container-page">
          <motion.h2 className="h-section text-center mb-12" variants={fadeUp} initial="hidden" whileInView="show" viewport={VP}>
            What you'll learn
          </motion.h2>
          <motion.div className="grid md:grid-cols-2 gap-5" variants={stagger} initial="hidden" whileInView="show" viewport={VP}>
            {OUTCOMES.map((o, i) => (
              <motion.div key={i} variants={fadeUp} className="flex items-start gap-3 p-4 rounded-lg bg-white border border-navy-100">
                <Check className="text-gold mt-0.5 shrink-0" size={18} />
                <span className="text-ink/80 text-sm">{o}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Curriculum */}
      <section className="section bg-navy-50">
        <div className="container-page max-w-3xl">
          <motion.h2 className="h-section text-center mb-12" variants={fadeUp} initial="hidden" whileInView="show" viewport={VP}>
            Curriculum
          </motion.h2>
          <motion.div className="space-y-4" variants={stagger} initial="hidden" whileInView="show" viewport={VP}>
            {MODULES.map((m, i) => (
              <motion.div key={m.title} variants={fadeUp} className="flex gap-5 bg-white rounded-xl p-5 border border-navy-100">
                <div className="w-9 h-9 rounded-full bg-navy text-cream flex items-center justify-center font-display text-sm shrink-0">{i + 1}</div>
                <div>
                  <h3 className="font-display text-lg text-navy mb-1">{m.title}</h3>
                  <p className="text-ink/65 text-sm">{m.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
          <p className="text-center text-ink/45 text-sm mt-8">Modules are fetched live from the database. This is a curriculum preview.</p>
        </div>
      </section>

      {/* Who Is This For */}
      <section className="section bg-cream">
        <div className="container-page">
          <motion.h2 className="h-section text-center mb-12" variants={fadeUp} initial="hidden" whileInView="show" viewport={VP}>
            Who is this for?
          </motion.h2>
          <motion.div className="grid md:grid-cols-3 gap-6" variants={stagger} initial="hidden" whileInView="show" viewport={VP}>
            {PERSONAS.map(p => (
              <motion.div key={p.title} variants={fadeUp} className="card p-6">
                <h3 className="font-display text-lg text-navy mb-2">{p.title}</h3>
                <p className="text-ink/65 text-sm leading-relaxed">{p.text}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section bg-navy-50">
        <div className="container-page max-w-3xl">
          <motion.h2 className="h-section text-center mb-12" variants={fadeUp} initial="hidden" whileInView="show" viewport={VP}>
            Frequently asked questions
          </motion.h2>
          <motion.div className="space-y-3" variants={stagger} initial="hidden" whileInView="show" viewport={VP}>
            {FAQS.map((f, i) => (
              <motion.div key={f.q} variants={fadeUp}>
                <FaqItem q={f.q} a={f.a} open={openFaq === i} onToggle={() => setOpenFaq(openFaq === i ? -1 : i)} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-navy-900 text-cream py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-25" aria-hidden />
        <motion.div className="relative container-page text-center max-w-2xl" variants={fadeUp} initial="hidden" whileInView="show" viewport={VP}>
          <h2 className="font-display text-3xl md:text-4xl text-cream mb-4 text-balance">Ready to start building?</h2>
          <p className="text-cream/65 mb-9 text-lg">Join Cohort 12 — limited seats available.</p>
          <Link to="/contact" state={{ program: 'Investing' }} className="btn-gold mb-8">
            Enroll in Investing <ArrowRight size={16} />
          </Link>
          <div>
            <Link to="/courses" className="inline-flex items-center gap-1.5 text-cream/55 hover:text-gold text-sm transition-colors">
              <ArrowLeft size={14} /> Back to all programs
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

const FaqItem = ({ q, a, open, onToggle }) => (
  <div className={`border rounded-xl overflow-hidden transition-colors duration-200 ${open ? 'border-gold/40' : 'border-navy-100'}`}>
    <motion.button
      onClick={onToggle}
      className={`w-full flex items-center justify-between gap-4 px-6 py-5 text-left transition-colors ${open ? 'bg-cream-50' : 'bg-white hover:bg-cream-50/50'}`}
      whileTap={{ scale: 0.995 }}
    >
      <span className={`font-medium text-sm sm:text-base ${open ? 'text-navy' : 'text-navy/85'}`}>{q}</span>
      <motion.span
        animate={{ rotate: open ? 45 : 0 }}
        transition={{ duration: 0.2 }}
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${open ? 'bg-gold text-navy-900' : 'bg-navy-50 text-navy'}`}
      >
        <Plus size={16} />
      </motion.span>
    </motion.button>
    <AnimatePresence initial={false}>
      {open && (
        <motion.div variants={slideDown} initial="hidden" animate="show" exit="exit">
          <div className="px-6 pb-5 pt-1 text-ink/70 text-sm leading-relaxed bg-cream-50">{a}</div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export default Investing;
