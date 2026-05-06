import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Plus, Edit2, Trash2, X, ArrowLeft,
  ChevronUp, ChevronDown, BookOpen, Video, FileText, File
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../api/axios';

const emptyModuleForm = { title: '', description: '' };
const emptyLessonForm = {
  title: '', description: '', type: 'video',
  videoUrl: '', duration: 0, isPreview: false, content: '', resources: ''
};

const TYPE_BADGE = {
  video: 'bg-blue-50 text-blue-700',
  text:  'bg-emerald-50 text-emerald-700',
  pdf:   'bg-red-50 text-red-700',
};
const TYPE_ICON = {
  video: <Video size={12} />,
  text:  <FileText size={12} />,
  pdf:   <File size={12} />,
};

const ManageLessons = () => {
  const { courseId } = useParams();
  const [course, setCourse]   = useState(null);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Module modal state ────────────────────────────────────────────────────
  const [modModal, setModModal]     = useState(false);
  const [modEditing, setModEditing] = useState(null);
  const [modForm, setModForm]       = useState(emptyModuleForm);
  const [modSaving, setModSaving]   = useState(false);

  // ── Lesson modal state ────────────────────────────────────────────────────
  const [lesModal, setLesModal]       = useState(false);
  const [lesEditing, setLesEditing]   = useState(null);
  const [lesModuleId, setLesModuleId] = useState('');
  const [lesForm, setLesForm]         = useState(emptyLessonForm);
  const [lesSaving, setLesSaving]     = useState(false);

  // ── Data loading ──────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cRes, lRes] = await Promise.all([
        api.get(`/courses/admin/${courseId}`),
        api.get(`/admin/lessons?courseId=${courseId}`)
      ]);
      setCourse(cRes.data.course);
      setLessons(lRes.data.lessons);
    } catch {
      toast.error('Failed to load course data');
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  // ── Module actions ────────────────────────────────────────────────────────
  const openNewModule = () => {
    setModEditing(null);
    setModForm(emptyModuleForm);
    setModModal(true);
  };

  const openEditModule = (mod) => {
    setModEditing(mod);
    setModForm({ title: mod.title, description: mod.description || '' });
    setModModal(true);
  };

  const saveModule = async (e) => {
    e.preventDefault();
    if (!modForm.title.trim()) return toast.error('Module title is required');
    setModSaving(true);
    try {
      if (modEditing) {
        await api.put(`/courses/${courseId}/modules/${modEditing._id}`, modForm);
        toast.success('Module updated');
      } else {
        await api.post(`/courses/${courseId}/modules`, modForm);
        toast.success('Module created');
      }
      setModModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save module');
    } finally {
      setModSaving(false);
    }
  };

  const deleteModule = async (mod) => {
    const count = lessons.filter(l => l.moduleId?.toString() === mod._id?.toString()).length;
    const msg = count > 0
      ? `Delete "${mod.title}" and its ${count} lesson(s)? This cannot be undone.`
      : `Delete module "${mod.title}"? This cannot be undone.`;
    if (!confirm(msg)) return;
    try {
      await api.delete(`/courses/${courseId}/modules/${mod._id}`);
      toast.success('Module deleted');
      load();
    } catch {
      toast.error('Failed to delete module');
    }
  };

  const moveModule = async (idx, direction) => {
    const mods = [...(course?.modules || [])];
    const target = idx + direction;
    if (target < 0 || target >= mods.length) return;
    [mods[idx], mods[target]] = [mods[target], mods[idx]];
    try {
      await api.put(`/courses/${courseId}/modules/reorder`, { orderedIds: mods.map(m => m._id) });
      setCourse(prev => ({ ...prev, modules: mods }));
    } catch {
      toast.error('Reorder failed');
    }
  };

  // ── Lesson actions ────────────────────────────────────────────────────────
  const openNewLesson = (moduleId) => {
    setLesEditing(null);
    setLesModuleId(moduleId);
    setLesForm(emptyLessonForm);
    setLesModal(true);
  };

  const openEditLesson = (lesson) => {
    setLesEditing(lesson);
    setLesModuleId(lesson.moduleId);
    setLesForm({
      title:       lesson.title,
      description: lesson.description || '',
      type:        lesson.type,
      videoUrl:    lesson.videoUrl || '',
      duration:    lesson.duration || 0,
      isPreview:   lesson.isPreview || false,
      content:     lesson.content || '',
      resources:   (lesson.resources || []).map(r => `${r.name}|${r.url}`).join('\n')
    });
    setLesModal(true);
  };

  const saveLesson = async (e) => {
    e.preventDefault();
    if (!lesForm.title.trim()) return toast.error('Lesson title is required');
    if (!lesModuleId) return toast.error('Please select a module');
    setLesSaving(true);
    const resources = lesForm.resources
      ? lesForm.resources.split('\n').map(line => {
          const [name, url] = line.split('|');
          return { name: name?.trim() || '', url: url?.trim() || '' };
        }).filter(r => r.url)
      : [];
    const payload = {
      ...lesForm,
      courseId,
      moduleId: lesModuleId,
      duration: Number(lesForm.duration) || 0,
      resources
    };
    try {
      if (lesEditing) {
        await api.put(`/admin/lessons/${lesEditing._id}`, payload);
        toast.success('Lesson updated');
      } else {
        await api.post('/admin/lessons', payload);
        toast.success('Lesson created');
      }
      setLesModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save lesson');
    } finally {
      setLesSaving(false);
    }
  };

  const deleteLesson = async (lesson) => {
    if (!confirm(`Delete "${lesson.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/lessons/${lesson._id}`);
      toast.success('Lesson deleted');
      load();
    } catch {
      toast.error('Failed to delete lesson');
    }
  };

  const moveLesson = async (moduleId, idx, direction) => {
    const modLessons = lessons
      .filter(l => l.moduleId?.toString() === moduleId?.toString())
      .sort((a, b) => a.order - b.order);
    const target = idx + direction;
    if (target < 0 || target >= modLessons.length) return;
    [modLessons[idx], modLessons[target]] = [modLessons[target], modLessons[idx]];
    try {
      await api.put('/admin/lessons/reorder', { lessonIds: modLessons.map(l => l._id) });
      const updated = modLessons.map((l, i) => ({ ...l, order: i }));
      setLessons(prev => [
        ...prev.filter(l => l.moduleId?.toString() !== moduleId?.toString()),
        ...updated
      ]);
    } catch {
      toast.error('Reorder failed');
    }
  };

  // ── Loading screen ────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-navy/60 text-sm">Loading course builder…</p>
      </div>
    </div>
  );

  const modules = course?.modules || [];

  return (
    <div className="bg-cream min-h-screen">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <section className="bg-navy-900 text-cream py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/admin/courses" className="inline-flex items-center gap-1 text-cream/60 hover:text-gold text-sm mb-3 transition-colors">
            <ArrowLeft size={15} /> Back to Courses
          </Link>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-gold mb-1">Course Builder</div>
              <h1 className="font-display text-3xl">{course?.title || '—'}</h1>
              <p className="text-cream/50 text-sm mt-1">
                {modules.length} module{modules.length !== 1 ? 's' : ''} · {lessons.length} lesson{lessons.length !== 1 ? 's' : ''} total
              </p>
            </div>
            <button onClick={openNewModule} className="btn-gold flex items-center gap-2 !py-2.5">
              <Plus size={16} /> Add Module
            </button>
          </div>
        </div>
      </section>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">

        {/* Empty state */}
        {modules.length === 0 && (
          <div className="card p-14 text-center">
            <BookOpen className="text-gold/40 mx-auto mb-4" size={52} />
            <h3 className="font-display text-xl text-navy mb-2">No modules yet</h3>
            <p className="text-ink/50 text-sm mb-6">Create your first module, then add lessons inside it.</p>
            <button onClick={openNewModule} className="btn-gold inline-flex items-center gap-2">
              <Plus size={15} /> Create First Module
            </button>
          </div>
        )}

        {/* Module cards */}
        {modules.map((mod, modIdx) => {
          const modLessons = lessons
            .filter(l => l.moduleId?.toString() === mod._id?.toString())
            .sort((a, b) => a.order - b.order);

          return (
            <div key={mod._id} className="card overflow-hidden">

              {/* Module header */}
              <div className="bg-navy-50 border-b border-navy-100 px-5 py-4 flex items-start gap-3">
                {/* Up / Down */}
                <div className="flex flex-col gap-0.5 pt-0.5 flex-shrink-0">
                  <button
                    onClick={() => moveModule(modIdx, -1)}
                    disabled={modIdx === 0}
                    title="Move module up"
                    className="p-0.5 rounded hover:bg-navy-200 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronUp size={14} className="text-navy/50" />
                  </button>
                  <button
                    onClick={() => moveModule(modIdx, 1)}
                    disabled={modIdx === modules.length - 1}
                    title="Move module down"
                    className="p-0.5 rounded hover:bg-navy-200 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronDown size={14} className="text-navy/50" />
                  </button>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] text-ink/35 uppercase tracking-widest font-mono">Module {modIdx + 1}</span>
                  <h2 className="font-display text-lg text-navy leading-tight">{mod.title}</h2>
                  {mod.description && (
                    <p className="text-ink/50 text-xs mt-0.5">{mod.description}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => openEditModule(mod)}
                    title="Edit module"
                    className="p-2 hover:bg-white rounded transition-colors"
                  >
                    <Edit2 size={14} className="text-navy/50" />
                  </button>
                  <button
                    onClick={() => deleteModule(mod)}
                    title="Delete module"
                    className="p-2 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                  <button
                    onClick={() => openNewLesson(mod._id)}
                    className="btn-gold !py-1.5 !px-3 text-xs flex items-center gap-1 ml-1"
                  >
                    <Plus size={13} /> Add Lesson
                  </button>
                </div>
              </div>

              {/* Lessons */}
              {modLessons.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-ink/35 text-sm">No lessons yet.</p>
                  <button
                    onClick={() => openNewLesson(mod._id)}
                    className="mt-2 text-gold-dark hover:text-gold text-sm hover:underline underline-offset-2 transition-colors"
                  >
                    Add the first lesson →
                  </button>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-ink/40 border-b border-navy-100 bg-white/40">
                      <th className="w-8 px-4 py-2.5" />
                      <th className="px-2 py-2.5">Lesson</th>
                      <th className="px-3 py-2.5 hidden sm:table-cell">Type</th>
                      <th className="px-3 py-2.5 hidden md:table-cell">Duration</th>
                      <th className="px-3 py-2.5 hidden md:table-cell">Preview</th>
                      <th className="px-3 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {modLessons.map((lesson, lesIdx) => (
                      <tr key={lesson._id} className="border-t border-navy-100 hover:bg-cream/40 transition-colors">

                        {/* Reorder arrows */}
                        <td className="px-4 py-3 w-8">
                          <div className="flex flex-col gap-0.5">
                            <button
                              onClick={() => moveLesson(mod._id, lesIdx, -1)}
                              disabled={lesIdx === 0}
                              title="Move lesson up"
                              className="p-0.5 rounded hover:bg-navy-100 disabled:opacity-20 disabled:cursor-not-allowed"
                            >
                              <ChevronUp size={12} className="text-ink/40" />
                            </button>
                            <button
                              onClick={() => moveLesson(mod._id, lesIdx, 1)}
                              disabled={lesIdx === modLessons.length - 1}
                              title="Move lesson down"
                              className="p-0.5 rounded hover:bg-navy-100 disabled:opacity-20 disabled:cursor-not-allowed"
                            >
                              <ChevronDown size={12} className="text-ink/40" />
                            </button>
                          </div>
                        </td>

                        {/* Title + description */}
                        <td className="px-2 py-3">
                          <div className="font-medium text-navy leading-tight">{lesson.title}</div>
                          {lesson.description && (
                            <div className="text-xs text-ink/40 mt-0.5 truncate max-w-xs">{lesson.description}</div>
                          )}
                        </td>

                        {/* Type */}
                        <td className="px-3 py-3 hidden sm:table-cell">
                          <span className={`badge flex items-center gap-1 w-fit capitalize ${TYPE_BADGE[lesson.type] || 'bg-gray-50 text-gray-600'}`}>
                            {TYPE_ICON[lesson.type]} {lesson.type}
                          </span>
                        </td>

                        {/* Duration */}
                        <td className="px-3 py-3 hidden md:table-cell text-ink/50 text-xs">
                          {lesson.duration > 0 ? `${lesson.duration} min` : '—'}
                        </td>

                        {/* Free preview badge */}
                        <td className="px-3 py-3 hidden md:table-cell">
                          {lesson.isPreview
                            ? <span className="badge bg-gold/10 text-gold-dark">Free</span>
                            : <span className="text-ink/25 text-xs">—</span>}
                        </td>

                        {/* Edit / Delete */}
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openEditLesson(lesson)}
                              title="Edit lesson"
                              className="p-2 hover:bg-navy-50 rounded transition-colors"
                            >
                              <Edit2 size={14} className="text-navy/50" />
                            </button>
                            <button
                              onClick={() => deleteLesson(lesson)}
                              title="Delete lesson"
                              className="p-2 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 size={14} className="text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          );
        })}

        {/* Add another module button (shown when at least 1 module exists) */}
        {modules.length > 0 && (
          <button
            onClick={openNewModule}
            className="w-full py-4 border-2 border-dashed border-navy-200 rounded-xl text-ink/40 hover:border-gold/50 hover:text-gold-dark transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <Plus size={15} /> Add Another Module
          </button>
        )}
      </div>

      {/* ── Module Modal ────────────────────────────────────────────────────── */}
      {modModal && (
        <div className="fixed inset-0 bg-navy-900/70 z-50 flex items-center justify-center p-4">
          <div className="bg-cream rounded-xl max-w-md w-full shadow-2xl">
            <div className="bg-navy text-cream px-5 py-4 rounded-t-xl flex items-center justify-between">
              <h2 className="font-display text-xl">{modEditing ? 'Edit Module' : 'New Module'}</h2>
              <button onClick={() => setModModal(false)} className="hover:text-gold transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={saveModule} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Module Title *</label>
                <input
                  required
                  autoFocus
                  className="input-field"
                  value={modForm.title}
                  onChange={e => setModForm({ ...modForm, title: e.target.value })}
                  placeholder="e.g. Introduction to Market Structure"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-navy mb-1">
                  Description <span className="text-ink/40 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  className="input-field"
                  value={modForm.description}
                  onChange={e => setModForm({ ...modForm, description: e.target.value })}
                  placeholder="Brief overview of what this module covers…"
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setModModal(false)} className="btn-outline flex-1">Cancel</button>
                <button type="submit" disabled={modSaving} className="btn-gold flex-1 disabled:opacity-50">
                  {modSaving ? 'Saving…' : modEditing ? 'Update Module' : 'Create Module'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Lesson Modal ────────────────────────────────────────────────────── */}
      {lesModal && (
        <div className="fixed inset-0 bg-navy-900/70 z-50 flex items-center justify-center p-4">
          <div className="bg-cream rounded-xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-navy text-cream px-5 py-4 rounded-t-xl flex items-center justify-between">
              <h2 className="font-display text-xl">{lesEditing ? 'Edit Lesson' : 'New Lesson'}</h2>
              <button onClick={() => setLesModal(false)} className="hover:text-gold transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveLesson} className="p-6 space-y-4">

              {/* Module selector */}
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Module</label>
                <select
                  className="input-field"
                  value={lesModuleId}
                  onChange={e => setLesModuleId(e.target.value)}
                >
                  {course?.modules?.map(m => (
                    <option key={m._id} value={m._id}>{m.title}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-navy mb-1">Lesson Title *</label>
                <input
                  required
                  className="input-field"
                  value={lesForm.title}
                  onChange={e => setLesForm({ ...lesForm, title: e.target.value })}
                  placeholder="e.g. What is Market Structure?"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-navy mb-1">
                  Description <span className="text-ink/40 font-normal">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  className="input-field"
                  value={lesForm.description}
                  onChange={e => setLesForm({ ...lesForm, description: e.target.value })}
                  placeholder="Short summary of what this lesson covers…"
                />
              </div>

              {/* Type + Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-navy mb-1">Lesson Type</label>
                  <select
                    className="input-field"
                    value={lesForm.type}
                    onChange={e => setLesForm({ ...lesForm, type: e.target.value })}
                  >
                    <option value="video">Video</option>
                    <option value="text">Text / Notes</option>
                    <option value="pdf">PDF</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-navy mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    min="0"
                    className="input-field"
                    value={lesForm.duration}
                    onChange={e => setLesForm({ ...lesForm, duration: e.target.value })}
                  />
                </div>
              </div>

              {/* Video URL */}
              {lesForm.type === 'video' && (
                <div>
                  <label className="block text-sm font-medium text-navy mb-1">Video URL</label>
                  <input
                    className="input-field"
                    value={lesForm.videoUrl}
                    onChange={e => setLesForm({ ...lesForm, videoUrl: e.target.value })}
                    placeholder="YouTube, Vimeo, or direct video URL"
                  />
                  <p className="text-xs text-ink/40 mt-1">
                    Supports: youtube.com/watch?v=… · youtu.be/… · vimeo.com/…
                  </p>
                </div>
              )}

              {/* Text content */}
              {lesForm.type === 'text' && (
                <div>
                  <label className="block text-sm font-medium text-navy mb-1">Content</label>
                  <textarea
                    rows={7}
                    className="input-field font-mono text-xs"
                    value={lesForm.content}
                    onChange={e => setLesForm({ ...lesForm, content: e.target.value })}
                    placeholder="Write your lesson content here…"
                  />
                </div>
              )}

              {/* PDF URL */}
              {lesForm.type === 'pdf' && (
                <div>
                  <label className="block text-sm font-medium text-navy mb-1">PDF URL</label>
                  <input
                    className="input-field"
                    value={lesForm.videoUrl}
                    onChange={e => setLesForm({ ...lesForm, videoUrl: e.target.value })}
                    placeholder="Google Drive share link, Dropbox URL, etc."
                  />
                  <p className="text-xs text-ink/40 mt-1">Use a publicly accessible link to your PDF file.</p>
                </div>
              )}

              {/* Resources */}
              <div>
                <label className="block text-sm font-medium text-navy mb-1">
                  Resources{' '}
                  <span className="text-ink/40 font-normal">(one per line — Name|URL)</span>
                </label>
                <textarea
                  rows={3}
                  className="input-field text-xs font-mono"
                  value={lesForm.resources}
                  onChange={e => setLesForm({ ...lesForm, resources: e.target.value })}
                  placeholder={'Slide Deck|https://drive.google.com/...\nCheatsheet|https://...'}
                />
              </div>

              {/* Free preview toggle */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={lesForm.isPreview}
                  onChange={e => setLesForm({ ...lesForm, isPreview: e.target.checked })}
                  className="w-4 h-4 accent-navy"
                />
                <span className="text-sm text-navy">Free preview — visible without enrollment</span>
              </label>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setLesModal(false)} className="btn-outline flex-1">Cancel</button>
                <button type="submit" disabled={lesSaving} className="btn-gold flex-1 disabled:opacity-50">
                  {lesSaving ? 'Saving…' : lesEditing ? 'Update Lesson' : 'Create Lesson'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageLessons;
