import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Check, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, fadeLeft, fadeRight, stagger, slideDown } from '../../utils/motion';

const VP = { once: true, margin: '-80px' };

const OUTCOMES = [
  "Understand how currency markets work in India (NSE/BSE derivatives)",
  'Trade INR pairs legally via exchange-listed currency futures and options',
  'Apply SMC concepts to Forex structure and liquidity',
  'Understand cross-currency relationships and correlations',
  'Use currency positions for portfolio hedging',
  'Build a compliant trading setup with an Indian broker'
];

const MODULES = [
  { title: 'Currency Markets 101', desc: "Pairs, pips, lots, and how India's forex market works" },
  { title: 'Legal Framework', desc: 'Regulations, permitted pairs, compliant brokers' },
  { title: 'SMC Applied to Forex', desc: 'Order blocks and liquidity in currency charts' },
  { title: 'Currency Futures & Options', desc: 'Derivatives structure, expiry, margin' },
  { title: 'Hedging & Portfolio Use', desc: 'Using currency positions as a hedge' }
];

const PERSONAS = [
  { title: 'Equity traders expanding', text: 'You trade stocks or indices and want to add a new, uncorrelated market.' },
  { title: 'Curious about forex', text: "You've seen forex content online but want the version that works legally in India." },
  { title: 'Business owners', text: 'You have foreign currency exposure and want to understand hedging.' }
];

const FAQS = [
  { q: 'Can I legally trade forex in India?', a: 'Yes — through exchange-listed currency derivatives on NSE/BSE. This is the only legal route, and exactly what we teach.' },
  { q: 'Do I need an international broker?', a: 'No. Everything taught uses Indian regulated exchanges and compliant brokers.' },
  { q: 'How much capital do I need?', a: 'Currency futures have relatively low margin requirements — typically ₹2,000–5,000 per lot. We cover this in detail.' },
  { q: 'Is prior trading experience required?', a: 'Basic understanding of charts helps but is not mandatory. The program starts from forex fundamentals.' }
];

const Forex = () => {
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
            <span className="text-cream/80">Forex</span>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-12 items-start">
            <motion.div className="lg:col-span-2" variants={fadeLeft} initial="hidden" animate="show">
              <div className="badge-gold mb-6">Forex</div>
              <h1 className="h-display text-balance mb-6">
                Trade <span className="italic text-gold">currencies.</span> The legal way.
              </h1>
              <p className="text-cream/70 text-lg leading-relaxed max-w-2xl mb-8 text-pretty">
                Currency derivatives, exchange-listed pairs, and hedging strategies — all within a regulated exchange framework. No offshore brokers, no regulatory grey zones.
              </p>
              <div className="flex flex-wrap gap-8">
                {['45 Days', 'Beginner–Intermediate', '5+ Modules'].map(s => (
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
                  <span className="text-ink/40 line-through text-sm mr-2">₹9,999</span>
                  <span className="font-display text-3xl text-navy">₹5,999</span>
                </div>
                <Link to="/contact" state={{ program: 'Forex' }} className="btn-gold w-full mb-6">
                  Apply Now <ArrowRight size={16} />
                </Link>
                <ul className="space-y-2.5 text-sm text-ink/75">
                  {['Live cohort sessions', 'Weekly trade reviews', 'Private community', 'Lifetime material access'].map(b => (
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
          <h2 className="font-display text-3xl md:text-4xl text-cream mb-4 text-balance">Ready to trade currencies?</h2>
          <p className="text-cream/65 mb-9 text-lg">Join Cohort 12 — limited seats available.</p>
          <Link to="/contact" state={{ program: 'Forex' }} className="btn-gold mb-8">
            Enroll in Forex <ArrowRight size={16} />
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

export default Forex;
