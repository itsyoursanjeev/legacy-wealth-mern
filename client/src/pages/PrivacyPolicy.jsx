import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { fadeUp, stagger } from '../utils/motion';

const VP = { once: true, margin: '-60px' };
const EFFECTIVE_DATE = 'June 29, 2025';
const CONTACT_EMAIL = 'hello@legacywealth.in';
const SITE_URL = 'https://legacywealth.info';

const Section = ({ title, children }) => (
  <motion.div variants={fadeUp} className="mb-10">
    <h2 className="font-display text-xl text-navy mb-4 pb-2 border-b border-navy-100">{title}</h2>
    <div className="text-ink/75 text-sm leading-relaxed space-y-3">{children}</div>
  </motion.div>
);

const PrivacyPolicy = () => (
  <div>
    {/* Hero */}
    <section className="bg-navy-900 text-cream py-16 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-20" aria-hidden />
      <motion.div
        className="relative container-page max-w-3xl"
        variants={fadeUp} initial="hidden" animate="show"
      >
        <div className="eyebrow-cream mb-3">Legal</div>
        <h1 className="font-display text-4xl md:text-5xl text-cream mb-4">Privacy Policy</h1>
        <p className="text-cream/60 text-sm">Effective date: {EFFECTIVE_DATE}</p>
      </motion.div>
    </section>

    {/* Content */}
    <section className="section bg-cream">
      <motion.div
        className="container-page max-w-3xl"
        variants={stagger} initial="hidden" whileInView="show" viewport={VP}
      >
        <motion.p variants={fadeUp} className="text-ink/70 text-sm leading-relaxed mb-10 p-5 bg-gold/8 border border-gold/25 rounded-xl">
          This Privacy Policy describes how <strong className="text-navy">Legacy Wealth Institute</strong> ("we", "us", or "our")
          collects, uses, and shares your personal information when you visit <strong className="text-navy">{SITE_URL}</strong>,
          enroll in our programs, or interact with our advertisements. By using our website, you agree to the
          practices described in this policy.
        </motion.p>

        <Section title="1. Information We Collect">
          <p><strong className="text-navy">Information you provide directly:</strong></p>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li>Full name, email address, and phone number when you submit an inquiry or apply for a program</li>
            <li>Account credentials (name, email, password) when you register on our platform</li>
            <li>Course enrollment and payment details when you purchase a program</li>
            <li>Messages or inquiries submitted through our contact form</li>
          </ul>
          <p className="mt-3"><strong className="text-navy">Information collected automatically:</strong></p>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li>Browser type, device type, IP address, and operating system</li>
            <li>Pages visited, time spent on pages, and referring URLs</li>
            <li>Cookies and similar tracking technologies (see Section 5)</li>
            <li>Interaction data from Meta (Facebook/Instagram) Pixel, including page views and events when you visit our site from or interact with our ads</li>
          </ul>
        </Section>

        <Section title="2. How We Use Your Information">
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>To process your enrollment and provide access to courses and learning materials</li>
            <li>To respond to your inquiries within 24 hours</li>
            <li>To send program updates, cohort announcements, and educational newsletters (you may opt out at any time)</li>
            <li>To run and optimise our advertising campaigns on Meta platforms (Facebook and Instagram)</li>
            <li>To analyse website traffic and improve our content and user experience</li>
            <li>To comply with applicable legal obligations</li>
          </ul>
        </Section>

        <Section title="3. Meta Pixel & Advertising">
          <p>
            We use the <strong className="text-navy">Meta Pixel</strong> (formerly Facebook Pixel) on our website.
            This is a piece of code that allows Meta Platforms, Inc. to collect data about your activity on
            our site and show you relevant advertisements on Facebook and Instagram.
          </p>
          <p>The Meta Pixel may collect:</p>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li>Pages you visit on legacywealth.info</li>
            <li>Actions you take (e.g., submitting an inquiry form, viewing a program page)</li>
            <li>Device and browser information</li>
          </ul>
          <p>
            This data is used to measure the effectiveness of our ads and to show our programs to people who
            may be interested. Meta's use of your data is governed by{' '}
            <a
              href="https://www.facebook.com/privacy/policy/"
              target="_blank"
              rel="noreferrer"
              className="text-gold-dark underline hover:text-navy transition-colors"
            >
              Meta's Privacy Policy
            </a>.
            You can opt out of Meta's data collection by visiting your{' '}
            <a
              href="https://www.facebook.com/ads/preferences"
              target="_blank"
              rel="noreferrer"
              className="text-gold-dark underline hover:text-navy transition-colors"
            >
              Facebook Ad Preferences
            </a>.
          </p>
        </Section>

        <Section title="4. Sharing Your Information">
          <p>We do not sell your personal data. We may share it with:</p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li>
              <strong className="text-navy">Service providers:</strong> Cloud infrastructure (MongoDB Atlas, Render, Vercel),
              payment processors (Razorpay), and email tools — only to the extent necessary to operate our platform.
            </li>
            <li>
              <strong className="text-navy">Meta Platforms, Inc.:</strong> Via the Meta Pixel as described in Section 3.
            </li>
            <li>
              <strong className="text-navy">Legal requirements:</strong> When required by law, court order, or government authority in India.
            </li>
          </ul>
          <p>All third-party service providers are bound by their own privacy and data security obligations.</p>
        </Section>

        <Section title="5. Cookies">
          <p>
            Our website uses cookies to enhance your experience. Cookies are small text files stored on your device.
            We use:
          </p>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li><strong className="text-navy">Essential cookies:</strong> Required for the site to function (e.g., login sessions)</li>
            <li><strong className="text-navy">Analytics cookies:</strong> To understand how visitors use our site</li>
            <li><strong className="text-navy">Advertising cookies:</strong> Meta Pixel cookies for ad measurement and targeting</li>
          </ul>
          <p>
            You can disable cookies through your browser settings. Note that disabling cookies may affect some
            features of the website.
          </p>
        </Section>

        <Section title="6. Data Security">
          <p>
            We implement industry-standard security measures including encrypted data transmission (HTTPS),
            bcrypt password hashing, and JWT-based authentication. However, no method of transmission over
            the internet is 100% secure. We encourage you to use a strong, unique password for your account.
          </p>
        </Section>

        <Section title="7. Data Retention">
          <p>
            We retain your personal information for as long as your account is active or as needed to provide
            services. Lead inquiry data is retained for up to 2 years. You may request deletion of your data
            at any time by contacting us (see Section 9).
          </p>
        </Section>

        <Section title="8. Your Rights">
          <p>Under applicable Indian law (Information Technology Act, 2000 and IT Rules, 2011), you have the right to:</p>
          <ul className="list-disc list-inside space-y-1.5 ml-2">
            <li>Access the personal data we hold about you</li>
            <li>Request correction of inaccurate information</li>
            <li>Request deletion of your personal data</li>
            <li>Withdraw consent for marketing communications at any time</li>
            <li>Opt out of Meta advertising data via your Meta Ad Preferences</li>
          </ul>
          <p>To exercise any of these rights, email us at <strong className="text-navy">{CONTACT_EMAIL}</strong>.</p>
        </Section>

        <Section title="9. Children's Privacy">
          <p>
            Our services are intended for individuals aged 18 and above. We do not knowingly collect personal
            information from anyone under 18. If you believe a minor has submitted information to us, please
            contact us immediately and we will delete it.
          </p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>
            We may update this Privacy Policy from time to time. When we do, we will revise the effective date
            at the top of this page. Continued use of our website after changes constitutes acceptance of the
            updated policy.
          </p>
        </Section>

        <Section title="11. Contact Us">
          <p>
            If you have any questions or concerns about this Privacy Policy or how we handle your data, please
            contact us:
          </p>
          <div className="mt-3 p-5 bg-white border border-navy-100 rounded-xl">
            <div className="font-display text-lg text-navy mb-2">Legacy Wealth Institute</div>
            <div className="space-y-1 text-sm">
              <div>Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-gold-dark hover:text-navy transition-colors">{CONTACT_EMAIL}</a></div>
              <div>Website: <a href={SITE_URL} className="text-gold-dark hover:text-navy transition-colors">{SITE_URL}</a></div>
              <div>Location: Mumbai, India</div>
            </div>
          </div>
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

export default PrivacyPolicy;
