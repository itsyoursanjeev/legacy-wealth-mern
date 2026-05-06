// Reusable Framer Motion animation variants
// Use with: variants={fadeUp} initial="hidden" whileInView="show" viewport={{ once: true }}

const ease = [0.22, 1, 0.36, 1]; // custom spring-like ease

export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.55, ease } }
};

export const fadeIn = {
  hidden: { opacity: 0 },
  show:   { opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } }
};

export const fadeLeft = {
  hidden: { opacity: 0, x: -32 },
  show:   { opacity: 1, x: 0,  transition: { duration: 0.55, ease } }
};

export const fadeRight = {
  hidden: { opacity: 0, x: 32 },
  show:   { opacity: 1, x: 0,  transition: { duration: 0.55, ease } }
};

export const scaleIn = {
  hidden: { opacity: 0, scale: 0.94 },
  show:   { opacity: 1, scale: 1, transition: { duration: 0.45, ease } }
};

// Container that staggers its children
export const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.12, delayChildren: 0.05 } }
};

export const staggerFast = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07 } }
};

// Animated mobile menu / accordion (height collapse)
export const slideDown = {
  hidden: { opacity: 0, height: 0,    overflow: 'hidden' },
  show:   { opacity: 1, height: 'auto', overflow: 'hidden', transition: { duration: 0.3, ease } },
  exit:   { opacity: 0, height: 0,    overflow: 'hidden', transition: { duration: 0.22, ease: 'easeIn' } }
};

// Page-level wrapper (subtle)
export const pageVariant = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0,  transition: { duration: 0.3, ease } },
  exit:    { opacity: 0,         transition: { duration: 0.18 } }
};