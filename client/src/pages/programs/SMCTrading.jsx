import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Check, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, fadeLeft, fadeRight, stagger, slideDown } from '../../utils/motion';

const VP = { once: true, margin: '-80px' };

const OUTCOMES = [
  'Identify institutional Order Blocks on any timeframe',
  'Spot Fair Value Gaps and understand when they fill',
  'Read liquidity sweeps before they happen',
  'Execute high-probability entries with defined risk',
  'Build and journal a rule-based trading system',
  'Understand BOS/CHOCH for trend confirmation',
  'Apply multi-timeframe analysis top-down',
  'Manage drawdown using institutional risk models'
];

const MODULES = [
  { title: 'Market Structure & Liquidity Theory', desc: 'How institutions create and hunt liquidity' },
  { title: 'Order Blocks & Breaker Blocks', desc: 'Identifying institutional footprints' },
  { title: 'Fair Value Gaps & Imbalances', desc: 'Reading price inefficiencies' },
  { title: 'Supply & Demand Zones (SMC version)', desc: 'Beyond retail S&D' },
  { title: 'Multi-Timeframe Analysis', desc: 'Aligning HTF bias with LTF entries' },
  { title: 'Entry Models & Execution', desc: 'Optimal Trade Entry (OTE) framework' },
  { title: 'Risk Management & Position Sizing', desc: 'Institutional-grade R:R discipline' },
  { title: 'Trade Journaling & System Building', desc: 'Building an edge you can replicate' }
];

const PERSONAS = [
  { title: 'Stuck traders', text: "You've watched hundreds of YouTube videos, taken 2–3 courses, and you're still not consistently profitable. You need structure, not more content." },
  { title: 'Self-taught traders', text: 'You know the basics but lack a repeatable framework. SMC gives you a systematic way to read every market, every day.' },
  { title: 'Serious beginners', text: 'You want to start right. Not with hype — with the same logic professional desks use to make trading decisions.' }
];

const TESTIMONIALS = [
  { quote: "I'd been trading for 5 years on YouTube content and breaking even at best. The 90-day cohort was the first time someone showed me how to actually read structure. Six months later, I'm consistently green — and I know why.", name: 'Rahul M.', role: 'Software Engineer · Bengaluru' },
  { quote: "What I value isn't the entries — it's the journaling discipline. Akshat made me realise my edge wasn't a setup, it was a process. That single shift changed everything.", name: 'Priya K.', role: 'CA · Mumbai' },
  { quote: 'No hype. No screenshots. Just a curriculum that respects your intelligence. This is what financial education should look like in India.', name: 'Arjun S.', role: 'Founder · Pune' }
];

const FAQS = [
  { q: 'Do I need prior trading experience?', a: 'Yes — this program is best suited for traders with at least 3–6 months of screen time. Complete beginners should start with Foundation first.' },
  { q: 'Is this a signal service?', a: 'No. We teach you a framework — not buy/sell calls. The goal is to make you an independent, self-sufficient trader.' },
  { q: 'How long does the program run?', a: '60–90 days depending on your cohort schedule. Recordings stay accessible for life.' },
  { q: 'Is there a refund policy?', a: 'Yes — 7-day no-questions-asked refund from enrollment date.' },
  { q: 'Is this SEBI-regulated investment advice?', a: 'No. All content is educational only and does not constitute personalised investment advice.' }
];

const SMCTrading = () => {
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
            <span className="text-cream/80">SMC Trading</span>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-12 items-start">
            <motion.div className="lg:col-span-2" variants={fadeLeft} initial="hidden" animate="show">
              <div className="badge-gold mb-6">Smart Money Concepts</div>
              <h1 className="h-display text-balance mb-3">
                Trade like the <span className="italic text-gold">institutions.</span>
              </h1>
              <p className="font-display text-2xl md:text-3xl text-cream/85 mb-6">Not against them.</p>
              <p className="text-cream/70 text-lg leading-relaxed max-w-2xl mb-8 text-pretty">
                Master Order Blocks, Fair Value Gaps, and the liquidity-driven framework that institutional traders use to move markets — then profit alongside them.
              </p>
              <div className="flex flex-wrap gap-8">
                {['60–90 Days', 'Intermediate', '8+ Modules'].map(s => (
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
                  <span className="text-ink/40 line-through text-sm mr-2">₹24,999</span>
                  <span className="font-display text-3xl text-navy">₹21,999</span>
                </div>
                <Link to="/contact" state={{ program: 'SMC Trading' }} className="btn-gold w-full mb-6">
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

      {/* Instructor */}
      <section className="section bg-navy-900 text-cream relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial-gold opacity-40" aria-hidden />
        <div className="container-page relative">
          <motion.h2 className="h-section text-cream text-center mb-12" variants={fadeUp} initial="hidden" whileInView="show" viewport={VP}>
            Your Mentor
          </motion.h2>
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <motion.div className="lg:col-span-7" variants={fadeLeft} initial="hidden" whileInView="show" viewport={VP}>
              <h3 className="font-display text-2xl text-cream mb-1">Akshat Jain</h3>
              <div className="eyebrow-cream mb-4">Founder, Legacy Wealth Institute</div>
              <p className="text-cream/70 leading-relaxed mb-8 text-pretty">
                Akshat has spent over a decade studying institutional market behaviour and Smart Money Concepts. He built Legacy Wealth Institute to give serious traders in India the framework that professional desks use — structured, accountable, and built for long-term edge.
              </p>
              <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-cream/70">
                <span className="flex items-center gap-2"><Check className="text-gold" size={16} /> 10+ Years studying markets</span>
                <span className="flex items-center gap-2"><Check className="text-gold" size={16} /> 500+ Students trained</span>
                <span className="flex items-center gap-2"><Check className="text-gold" size={16} /> Cohort 12 running</span>
              </div>
            </motion.div>
            <motion.div className="lg:col-span-5 flex justify-center" variants={fadeRight} initial="hidden" whileInView="show" viewport={VP}>
              <div className="w-40 h-40 rounded-full bg-gold/15 border-2 border-gold/40 flex items-center justify-center backdrop-blur">
                <span className="font-display text-6xl text-gold">AJ</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section bg-cream">
        <div className="container-page">
          <motion.h2 className="h-section text-center mb-12" variants={fadeUp} initial="hidden" whileInView="show" viewport={VP}>
            What students say
          </motion.h2>
          <motion.div className="grid md:grid-cols-3 gap-6" variants={stagger} initial="hidden" whileInView="show" viewport={VP}>
            {TESTIMONIALS.map(t => (
              <motion.div key={t.name} variants={fadeUp} className="card p-6 flex flex-col h-full">
                <p className="text-ink/75 text-sm leading-relaxed flex-1">"{t.quote}"</p>
                <div className="mt-5 pt-4 border-t border-navy-100">
                  <div className="font-semibold text-navy text-sm">{t.name}</div>
                  <div className="text-xs text-ink/50 mt-0.5">{t.role}</div>
                </div>
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
          <h2 className="font-display text-3xl md:text-4xl text-cream mb-4 text-balance">Ready to trade with an edge?</h2>
          <p className="text-cream/65 mb-9 text-lg">Join Cohort 12 — limited seats available.</p>
          <Link to="/contact" state={{ program: 'SMC Trading' }} className="btn-gold mb-8">
            Apply for SMC Trading <ArrowRight size={16} />
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

export default SMCTrading;
