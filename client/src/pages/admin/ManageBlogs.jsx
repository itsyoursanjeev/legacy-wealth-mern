import { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, X, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const emptyForm = {
  title: '', slug: '', excerpt: '', content: '', coverImage: '',
  category: 'General', author: 'Akshat Jain', readTime: 5, isPublished: false
};

const CATEGORIES = ['Market Structure', 'Risk Management', 'Psychology', 'Investing', 'News', 'General'];

const ManageBlogs = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/blogs/admin/all');
      setBlogs(data.blogs);
    } catch (err) {
      toast.error('Failed to load blogs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setModal(true);
  };

  const openEdit = (b) => {
    setEditing(b);
    setForm({ ...b });
    setModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, readTime: Number(form.readTime) };

    try {
      if (editing) {
        await api.put(`/blogs/${editing._id}`, payload);
        toast.success('Blog updated');
      } else {
        await api.post('/blogs', payload);
        toast.success('Blog created');
      }
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    }
  };

  const togglePublish = async (b) => {
    try {
      await api.put(`/blogs/${b._id}`, { isPublished: !b.isPublished });
      toast.success(b.isPublished ? 'Unpublished' : 'Published');
      load();
    } catch {
      toast.error('Failed');
    }
  };

  const handleDelete = async (b) => {
    if (!confirm(`Delete "${b.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/blogs/${b._id}`);
      toast.success('Deleted');
      load();
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="bg-cream min-h-screen">
      <section className="bg-navy-900 text-cream py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-gold mb-1">Admin</div>
            <h1 className="font-display text-3xl">Manage Blogs</h1>
          </div>
          <button onClick={openNew} className="btn-gold !py-2.5">
            <Plus size={16}/> New Article
          </button>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12 text-navy">Loading…</div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-navy-50 text-navy">
                <tr>
                  <th className="text-left p-4">Title</th>
                  <th className="text-left p-4 hidden md:table-cell">Category</th>
                  <th className="text-right p-4 hidden sm:table-cell">Views</th>
                  <th className="text-center p-4">Status</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blogs.map(b => (
                  <tr key={b._id} className="border-t border-navy-100 hover:bg-cream/50">
                    <td className="p-4">
                      <div className="font-medium text-navy">{b.title}</div>
                      <div className="text-xs text-ink/50">{b.slug}</div>
                    </td>
                    <td className="p-4 hidden md:table-cell">
                      <span className="badge bg-navy-50 text-navy">{b.category}</span>
                    </td>
                    <td className="p-4 text-right hidden sm:table-cell text-ink/60">{b.views}</td>
                    <td className="p-4 text-center">
                      <span className={`badge ${b.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}`}>
                        {b.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        {b.isPublished && (
                          <Link to={`/blogs/${b.slug}`} target="_blank" title="View live" className="p-2 hover:bg-gold/10 text-gold-dark rounded">
                            <ExternalLink size={16}/>
                          </Link>
                        )}
                        <button onClick={() => togglePublish(b)} title={b.isPublished ? 'Unpublish' : 'Publish'} className="p-2 hover:bg-navy-50 rounded">
                          {b.isPublished ? <EyeOff size={16}/> : <Eye size={16}/>}
                        </button>
                        <button onClick={() => openEdit(b)} title="Edit" className="p-2 hover:bg-navy-50 rounded">
                          <Edit2 size={16}/>
                        </button>
                        <button onClick={() => handleDelete(b)} title="Delete" className="p-2 hover:bg-red-50 text-red-600 rounded">
                          <Trash2 size={16}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {blogs.length === 0 && (
                  <tr><td colSpan={5} className="p-8 text-center text-ink/60">No articles yet. Click "New Article" above.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-navy-900/70 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-cream rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-navy text-cream p-5 flex items-center justify-between">
              <h2 className="font-display text-xl">{editing ? 'Edit Article' : 'New Article'}</h2>
              <button onClick={() => setModal(false)}><X size={20}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Title *</label>
                <input required className="input-field" value={form.title} onChange={e => setForm({...form, title: e.target.value})}/>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Slug (auto-generated if left blank)</label>
                <input className="input-field" placeholder="e.g. reading-market-structure" value={form.slug} onChange={e => setForm({...form, slug: e.target.value})}/>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Excerpt *</label>
                <textarea required rows={2} maxLength={300} className="input-field" placeholder="One or two sentences shown on the blog listing card" value={form.excerpt} onChange={e => setForm({...form, excerpt: e.target.value})}/>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Content *</label>
                <textarea required rows={10} className="input-field" placeholder="Write the full article here. Separate paragraphs with a blank line." value={form.content} onChange={e => setForm({...form, content: e.target.value})}/>
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Cover Image URL</label>
                <input className="input-field" placeholder="https://..." value={form.coverImage} onChange={e => setForm({...form, coverImage: e.target.value})}/>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy mb-1">Category</label>
                  <select className="input-field" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy mb-1">Author</label>
                  <input className="input-field" value={form.author} onChange={e => setForm({...form, author: e.target.value})}/>
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy mb-1">Read time (min)</label>
                  <input type="number" min="1" className="input-field" value={form.readTime} onChange={e => setForm({...form, readTime: e.target.value})}/>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isPublished} onChange={e => setForm({...form, isPublished: e.target.checked})} className="w-4 h-4 accent-navy"/>
                <span className="text-sm text-navy">Publish immediately (visible to users)</span>
              </label>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(false)} className="btn-outline flex-1">Cancel</button>
                <button type="submit" className="btn-gold flex-1">{editing ? 'Update' : 'Create'} Article</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBlogs;
