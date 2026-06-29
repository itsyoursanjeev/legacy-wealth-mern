import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { fadeUp, stagger } from '../utils/motion';

const VP = { once: true, margin: '-60px' };
const EFFECTIVE_DATE = 'June 29, 2025';
const CONTACT_EMAIL = 'hello@legacywealth.in';

const Section = ({ title, children }) => (
  <motion.div variants={fadeUp} className="mb-10">
    <h2 className="font-display text-xl text-navy mb-4 pb-2 border-b border-navy-100">{title}</h2>
    <div className="text-ink/75 text-sm leading-relaxed space-y-3">{children}</div>
  </motion.div>
);

const RefundPolicy = () => (
  <div>
    <section className="bg-navy-900 text-cream py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-20" aria-hidden />
      <motion.div
        className="relative container-page max-w-3xl"
        variants={fadeUp} initial="hidden" animate="show"
      >
        <div className="eyebrow-cream mb-3">Legal</div>
        <h1 className="font-display text-4xl md:text-5xl text-cream mb-4">Refund Policy</h1>
        <p className="text-cream/60 text-sm">Effective date: {EFFECTIVE_DATE}</p>
      </motion.div>
    </section>

    <section className="section bg-cream">
      <motion.div
        className="container-page max-w-3xl"
        variants={stagger} initial="hidden" whileInView="show" viewport={VP}
      >
        {/* Summary box */}
        <motion.div variants={fadeUp} className="mb-10 p-6 bg-navy rounded-2xl text-cream relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-radial-gold opacity-20" aria-hidden />
          <div className="relative">
            <h2 className="font-display text-xl text-cream mb-4">The short version</h2>
            <ul className="space-y-2">
              {[
                '7-day no-questions-asked refund from your enrollment date',
                'After 7 days, no refunds are issued',
                'Cohort seat transfers are allowed within the same program',
                'To request a refund, email us — we respond within 24 hours',
              ].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-cream/85">
                  <Check size={15} className="text-gold shrink-0 mt-0.5" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        <Section title="1. Eligibility for Refund">
          <p>
            We offer a <strong className="text-navy">7-day refund window</strong> from the date of enrollment for all
            programs. If you are not satisfied for any reason within the first 7 days, you may request a full refund
            — no questions asked.
          </p>
          <p>
            After 7 days from enrollment, refunds will not be issued regardless of whether you have accessed the
            course content or attended any live sessions.
          </p>
        </Section>

        <Section title="2. How to Request a Refund">
          <p>To initiate a refund within the eligible window:</p>
          <ol className="list-decimal list-inside space-y-1.5 ml-2">
            <li>Email us at <a href={`mailto:${CONTACT_EMAIL}`} className="text-gold-dark underline hover:text-navy transition-colors">{CONTACT_EMAIL}</a> with the subject line <strong className="text-navy">"Refund Request — [Your Name]"</strong></li>
            <li>Include your registered email address and the program name</li>
            <li>We will confirm receipt within 24 hours and process the refund within 5–7 business days</li>
          </ol>
          <p>
            Refunds are credited to the original payment method used at the time of purchase.
          </p>
        </Section>

        <Section title="3. Non-Refundable Situations">
          <p>Refunds will <strong className="text-navy">not</strong> be issued in the following cases:</p>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li>Requests made after the 7-day window from enrollment date</li>
            <li>Accounts suspended due to violation of our <Link to="/terms" className="text-gold-dark underline hover:text-navy transition-colors">Terms & Conditions</Link></li>
            <li>Disputes filed directly with payment processors without first contacting us</li>
            <li>Change of mind after attending more than one live cohort session</li>
          </ul>
        </Section>

        <Section title="4. Cohort Seat Transfers">
          <p>
            If you are unable to attend the current cohort, you may request a <strong className="text-navy">one-time transfer</strong> of
            your seat to the next available cohort of the same program. Transfer requests must be made at least
            7 days before the cohort start date.
          </p>
          <p>
            Transfers are not redeemable for cash and can only be used once per enrollment.
          </p>
        </Section>

        <Section title="5. Self-Paced Courses">
          <p>
            For self-paced (non-cohort) courses, the same 7-day refund policy applies from the date of purchase.
            Given that full course content may be accessible immediately upon purchase, we encourage you to review
            the curriculum and program details before enrolling.
          </p>
        </Section>

        <Section title="6. Contact Us">
          <p>
            If you have any questions about this policy or your specific situation, please reach out before filing
            a dispute — we are happy to work with you.
          </p>
          <p>
            Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-gold-dark underline hover:text-navy transition-colors">{CONTACT_EMAIL}</a><br />
            Response time: within 24 hours
          </p>
        </Section>

        <motion.div variants={fadeUp} className="pt-6 border-t border-navy-100">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-gold-dark hover:text-navy transition-colors font-medium">
            ← Back to Home
          </Link>
        </motion.div>
      </motion.div>
    </section>
  </div>
);

export default RefundPolicy;
