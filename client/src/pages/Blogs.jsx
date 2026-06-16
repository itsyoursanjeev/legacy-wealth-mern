import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock, Calendar, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp, fadeLeft, stagger } from '../utils/motion';
import api from '../api/axios';

const VP = { once: true, margin: '-80px' };

const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const Blogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/blogs')
      .then(({ data }) => setBlogs(data.blogs || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
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
            <div className="badge-gold mb-6">Insights</div>
            <h1 className="h-display text-balance mb-6">
              Market structure, <span className="italic text-gold">explained</span>.
            </h1>
            <p className="text-cream/75 text-lg leading-relaxed text-pretty max-w-2xl">
              Essays on institutional logic, risk discipline, and the psychology of trading — written for serious students of the market, not subscribers to a signal feed.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Blog grid */}
      <section className="section bg-cream">
        <div className="container-page">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card-premium p-0 overflow-hidden animate-pulse">
                  <div className="h-44 bg-navy-100" />
                  <div className="p-6 space-y-3">
                    <div className="h-3 w-20 bg-navy-100 rounded" />
                    <div className="h-5 w-3/4 bg-navy-100 rounded" />
                    <div className="h-4 w-full bg-navy-100 rounded" />
                    <div className="h-4 w-2/3 bg-navy-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-20 max-w-md mx-auto">
              <BookOpen className="text-gold mx-auto mb-4" size={32} />
              <h2 className="font-display text-2xl text-navy mb-2">No articles yet</h2>
              <p className="text-ink/60">We're working on the first batch of insights. Check back soon.</p>
            </div>
          ) : (
            <motion.div
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
              variants={stagger} initial="hidden" whileInView="show" viewport={VP}
            >
              {blogs.map(b => (
                <motion.div key={b._id} variants={fadeUp} whileHover={{ y: -5 }} transition={{ duration: 0.2 }}>
                  <BlogCard blog={b} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
};

const BlogCard = ({ blog }) => (
  <Link to={`/blogs/${blog.slug}`} className="card-premium p-0 overflow-hidden flex flex-col h-full group">
    <div className="relative h-44 bg-gradient-navy overflow-hidden">
      {blog.coverImage ? (
        <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      ) : (
        <div className="absolute inset-0 bg-gradient-radial-gold opacity-50" />
      )}
      <span className="absolute top-3 left-3 bg-gold text-navy-900 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
        {blog.category}
      </span>
    </div>
    <div className="p-6 flex flex-col flex-1">
      <h3 className="font-display text-xl text-navy mb-2 leading-snug group-hover:text-gold-dark transition-colors">{blog.title}</h3>
      <p className="text-ink/65 text-sm leading-relaxed mb-4 flex-1">{blog.excerpt}</p>
      <div className="flex items-center justify-between text-xs text-ink/45 pt-4 border-t border-navy-100">
        <span className="flex items-center gap-1.5"><Calendar size={12} /> {formatDate(blog.publishedAt || blog.createdAt)}</span>
        <span className="flex items-center gap-1.5"><Clock size={12} /> {blog.readTime} min read</span>
      </div>
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-dark mt-4 group-hover:gap-2.5 transition-all">
        Read article <ArrowRight size={14} />
      </span>
    </div>
  </Link>
);

export default Blogs;
