import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
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

const Terms = () => (
  <div>
    <section className="bg-navy-900 text-cream py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-20" aria-hidden />
      <motion.div
        className="relative container-page max-w-3xl"
        variants={fadeUp} initial="hidden" animate="show"
      >
        <div className="eyebrow-cream mb-3">Legal</div>
        <h1 className="font-display text-4xl md:text-5xl text-cream mb-4">Terms & Conditions</h1>
        <p className="text-cream/60 text-sm">Effective date: {EFFECTIVE_DATE}</p>
      </motion.div>
    </section>

    <section className="section bg-cream">
      <motion.div
        className="container-page max-w-3xl"
        variants={stagger} initial="hidden" whileInView="show" viewport={VP}
      >
        <motion.p variants={fadeUp} className="text-ink/70 text-sm leading-relaxed mb-10 p-5 bg-gold/8 border border-gold/25 rounded-xl">
          By accessing or using <strong className="text-navy">legacywealth.info</strong> and enrolling in any program offered by
          <strong className="text-navy"> Legacy Wealth Institute</strong>, you agree to be bound by these Terms & Conditions.
          Please read them carefully before using our platform.
        </motion.p>

        <Section title="1. Educational Purpose Only">
          <p>
            All content, programs, courses, webinars, and materials provided by Legacy Wealth Institute are for
            <strong className="text-navy"> educational purposes only</strong>. Nothing on this platform constitutes
            investment advice, financial advice, trading advice, or any other type of advice. You are solely responsible
            for your own financial decisions.
          </p>
          <p>
            Trading and investing in financial markets involves substantial risk of loss. Past performance discussed
            in any program is not indicative of future results.
          </p>
        </Section>

        <Section title="2. Enrollment & Access">
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li>Program access is granted to the individual enrollee only and may not be shared or transferred.</li>
            <li>Login credentials must be kept confidential. You are responsible for all activity under your account.</li>
            <li>We reserve the right to revoke access if credentials are shared or the platform is misused.</li>
            <li>Cohort schedules, session timings, and module releases are subject to change with reasonable notice.</li>
          </ul>
        </Section>

        <Section title="3. Intellectual Property">
          <p>
            All course materials, videos, slides, frameworks, worksheets, and content published on this platform are
            the exclusive intellectual property of Legacy Wealth Institute. You may not reproduce, distribute, resell,
            or create derivative works from any content without prior written permission.
          </p>
          <p>
            Recording of live sessions is strictly prohibited unless explicitly permitted by the instructor.
          </p>
        </Section>

        <Section title="4. User Conduct">
          <p>You agree not to:</p>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li>Share, resell, or distribute course content to third parties</li>
            <li>Use the platform for any unlawful purpose</li>
            <li>Harass, abuse, or disrespect instructors or fellow students in community spaces</li>
            <li>Attempt to reverse-engineer or scrape content from the platform</li>
            <li>Misrepresent your identity or provide false information during enrollment</li>
          </ul>
        </Section>

        <Section title="5. Payments & Pricing">
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li>All prices are listed in Indian Rupees (INR) and are inclusive of applicable taxes.</li>
            <li>Payment is due in full at the time of enrollment unless an instalment plan is explicitly offered.</li>
            <li>We reserve the right to change pricing at any time. Enrolled students will not be retroactively charged.</li>
            <li>For refund terms, please refer to our <Link to="/refund-policy" className="text-gold-dark underline hover:text-navy transition-colors">Refund Policy</Link>.</li>
          </ul>
        </Section>

        <Section title="6. Limitation of Liability">
          <p>
            To the maximum extent permitted by applicable law, Legacy Wealth Institute shall not be liable for any
            indirect, incidental, or consequential damages arising out of your use of the platform or participation
            in any program — including but not limited to trading losses, loss of profits, or loss of data.
          </p>
          <p>
            Our total liability for any claim shall not exceed the amount you paid for the specific program to which
            the claim relates.
          </p>
        </Section>

        <Section title="7. Modifications">
          <p>
            We reserve the right to update these Terms at any time. Changes will be posted on this page with a
            revised effective date. Continued use of the platform after changes constitutes acceptance of the
            updated Terms.
          </p>
        </Section>

        <Section title="8. Governing Law">
          <p>
            These Terms are governed by the laws of India. Any disputes arising from these Terms shall be subject
            to the exclusive jurisdiction of the courts in Ludhiana, Punjab, India.
          </p>
        </Section>

        <Section title="9. Contact">
          <p>
            For any questions regarding these Terms, contact us at{' '}
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-gold-dark underline hover:text-navy transition-colors">
              {CONTACT_EMAIL}
            </a>.
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

export default Terms;
