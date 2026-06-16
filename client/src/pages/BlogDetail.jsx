import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock, Calendar, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { fadeUp, fadeLeft } from '../utils/motion';
import api from '../api/axios';

const VP = { once: true, margin: '-80px' };

const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

const BlogDetail = () => {
  const { slug } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/blogs/${slug}`)
      .then(({ data }) => setBlog(data.blog))
      .catch(() => toast.error('Article not found'))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-navy">Loading…</div>;

  if (!blog) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-navy gap-4">
        <p>Article not found.</p>
        <Link to="/blogs" className="btn-outline">Back to all articles</Link>
      </div>
    );
  }

  const paragraphs = blog.content.split(/\n\s*\n/).filter(Boolean);

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-navy text-cream overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-40 mask-fade-b" aria-hidden />
        <div className="absolute top-20 -right-32 w-96 h-96 bg-gold/20 rounded-full blur-3xl" aria-hidden />
        <div className="relative container-page py-16 md:py-24">
          <motion.div
            className="max-w-3xl"
            variants={fadeLeft} initial="hidden" animate="show"
          >
            <Link to="/blogs" className="inline-flex items-center gap-1.5 text-cream/60 hover:text-gold text-sm mb-6 transition-colors">
              <ArrowLeft size={15} /> Back to all articles
            </Link>
            <div className="badge-gold mb-6">{blog.category}</div>
            <h1 className="h-display text-balance mb-6">{blog.title}</h1>
            <div className="flex flex-wrap items-center gap-5 text-cream/60 text-sm">
              <span className="flex items-center gap-1.5"><User size={14} /> {blog.author}</span>
              <span className="flex items-center gap-1.5"><Calendar size={14} /> {formatDate(blog.publishedAt || blog.createdAt)}</span>
              <span className="flex items-center gap-1.5"><Clock size={14} /> {blog.readTime} min read</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Cover image */}
      {blog.coverImage && (
        <div className="container-page -mt-10 relative z-10">
          <motion.img
            src={blog.coverImage}
            alt={blog.title}
            className="w-full max-h-[28rem] object-cover rounded-2xl shadow-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          />
        </div>
      )}

      {/* Content */}
      <section className="section bg-cream">
        <div className="container-page max-w-2xl">
          <motion.div
            className="space-y-5 text-ink/80 leading-relaxed text-pretty"
            variants={fadeUp} initial="hidden" whileInView="show" viewport={VP}
          >
            {paragraphs.map((p, i) => <p key={i}>{p}</p>)}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy-950 text-cream py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" aria-hidden />
        <motion.div
          className="relative container-page text-center max-w-2xl"
          variants={fadeUp} initial="hidden" whileInView="show" viewport={VP}
        >
          <h2 className="font-display text-2xl md:text-3xl text-cream mb-4 text-balance">
            Want frameworks like this, applied to your own trading?
          </h2>
          <p className="text-cream/65 mb-8">Browse our programs or apply directly for the next cohort.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/courses" className="btn-gold">View Programs <ArrowRight size={16} /></Link>
            <Link to="/blogs" className="btn-outline border-cream/25 !text-cream hover:!bg-cream hover:!text-navy-900">More Articles</Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
};

export default BlogDetail;
