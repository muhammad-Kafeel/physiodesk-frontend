import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, BookOpen, Save, X } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { blogAPI } from '../../api/services';
import { toast } from 'react-toastify';
import './DoctorBlogs.css';

const TYPES = ['article','success_story','health_tip'];
const STATUS_STYLE = {
  published: { bg:'#DCFCE7', color:'#16A34A' },
  draft:     { bg:'#F3F4F6', color:'#6B7280' },
  archived:  { bg:'#FEE2E2', color:'#DC2626' },
};
const EMPTY_FORM = { title:'', excerpt:'', content:'', type:'article', category:'', status:'draft', tags:'' };

export default function DoctorBlogs() {
  const [blogs,   setBlogs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm,setShowForm]= useState(false);
  const [editing, setEditing] = useState(null); // blog id
  const [saving,  setSaving]  = useState(false);
  const [deleting,setDeleting]= useState(null);
  const [form,    setForm]    = useState(EMPTY_FORM);
  const [coverFile,setCoverFile]=useState(null);

  const load = () => {
    setLoading(true);
    blogAPI.myBlogs()
      .then(r => setBlogs(r.data.data.data || []))
      .catch(() => toast.error('Failed to load blogs'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setForm(EMPTY_FORM);
    setEditing(null);
    setCoverFile(null);
    setShowForm(true);
  };

  const openEdit = (b) => {
    setForm({
      title:    b.title    || '',
      excerpt:  b.excerpt  || '',
      content:  b.content  || '',
      type:     b.type     || 'article',
      category: b.category || '',
      status:   b.status   || 'draft',
      tags:     (b.tags || []).join(', '),
    });
    setCoverFile(null);
    setEditing(b.id);
    setShowForm(true);
  };

  const closeForm = () => { setShowForm(false); setEditing(null); };

  const buildFd = () => {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (k === 'tags') {
        const arr = v.split(',').map(t => t.trim()).filter(Boolean);
        arr.forEach(t => fd.append('tags[]', t));
      } else {
        fd.append(k, v);
      }
    });
    if (coverFile) fd.append('cover_image', coverFile);
    return fd;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      toast.error('Title and content are required');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await blogAPI.update(editing, buildFd());
        toast.success('Blog updated!');
      } else {
        await blogAPI.create(buildFd());
        toast.success('Blog created!');
      }
      closeForm();
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const deleteBlog = async (id) => {
    if (!window.confirm('Delete this blog?')) return;
    setDeleting(id);
    try {
      await blogAPI.delete(id);
      setBlogs(p => p.filter(b => b.id !== id));
      toast.success('Blog deleted');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="db-wrap">

        {/* Header */}
        <div className="db-header">
          <div>
            <h1 className="db-title">My Blogs</h1>
            <p className="db-sub">Share your expertise — write articles, health tips, and success stories</p>
          </div>
          <button className="btn-primary-pd" onClick={openNew}>
            <Plus size={15}/> Write New Blog
          </button>
        </div>

        {/* Blog form modal */}
        {showForm && (
          <div className="db-form-card">
            <div className="db-form-head">
              <p className="db-form-title">{editing ? '✏️ Edit Blog' : '✍️ Write New Blog'}</p>
              <button className="db-form-close" onClick={closeForm}><X size={18}/></button>
            </div>
            <form onSubmit={submit}>
              <div className="db-grid-2">
                <div className="db-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="db-label">Title *</label>
                  <input className="db-input" value={form.title}
                    onChange={e => setForm(p => ({...p, title: e.target.value}))}
                    placeholder="Blog post title..." required />
                </div>
                <div className="db-field">
                  <label className="db-label">Type *</label>
                  <select className="db-input" value={form.type}
                    onChange={e => setForm(p => ({...p, type: e.target.value}))}>
                    {TYPES.map(t => (
                      <option key={t} value={t}>{t.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>
                    ))}
                  </select>
                </div>
                <div className="db-field">
                  <label className="db-label">Category</label>
                  <input className="db-input" value={form.category}
                    onChange={e => setForm(p => ({...p, category: e.target.value}))}
                    placeholder="e.g. Physiotherapy, Orthopedics..." />
                </div>
                <div className="db-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="db-label">Excerpt (short preview)</label>
                  <textarea className="db-input db-textarea" rows={2} value={form.excerpt}
                    onChange={e => setForm(p => ({...p, excerpt: e.target.value}))}
                    placeholder="Brief summary shown in blog list..." />
                </div>
                <div className="db-field" style={{ gridColumn: '1 / -1' }}>
                  <label className="db-label">Content *</label>
                  <textarea className="db-input db-textarea" rows={10} value={form.content}
                    onChange={e => setForm(p => ({...p, content: e.target.value}))}
                    placeholder="Write your full blog post here..." required />
                </div>
                <div className="db-field">
                  <label className="db-label">Tags (comma separated)</label>
                  <input className="db-input" value={form.tags}
                    onChange={e => setForm(p => ({...p, tags: e.target.value}))}
                    placeholder="physiotherapy, back pain, exercise..." />
                </div>
                <div className="db-field">
                  <label className="db-label">Status</label>
                  <select className="db-input" value={form.status}
                    onChange={e => setForm(p => ({...p, status: e.target.value}))}>
                    <option value="draft">Draft (save for later)</option>
                    <option value="published">Published (go live now)</option>
                  </select>
                </div>
                <div className="db-field">
                  <label className="db-label">Cover Image</label>
                  <label className="db-file-label">
                    📷 {coverFile ? coverFile.name : 'Choose image (optional)'}
                    <input type="file" accept="image/*"
                      onChange={e => setCoverFile(e.target.files[0])} hidden />
                  </label>
                </div>
              </div>

              <div className="db-form-footer">
                <button type="button" className="btn-outline-pd" onClick={closeForm}>Cancel</button>
                <button type="submit" className="btn-primary-pd" disabled={saving}>
                  {saving ? <span className="auth-spinner"/> : <><Save size={14}/> {editing ? 'Save Changes' : 'Publish Blog'}</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Blog list */}
        {loading ? <div className="pd-spinner"/> :
          blogs.length === 0 ? (
            <div className="pd-empty">
              <BookOpen size={44}/>
              <p>No blogs yet</p>
              <p style={{fontSize:13, marginTop:6}}>Start sharing your expertise with patients</p>
              <button className="btn-primary-pd" onClick={openNew} style={{marginTop:16}}>
                <Plus size={14}/> Write First Blog
              </button>
            </div>
          ) : (
            <div className="db-list">
              {blogs.map(b => {
                const s = STATUS_STYLE[b.status] || STATUS_STYLE.draft;
                return (
                  <div key={b.id} className="db-blog-card">
                    {b.cover_image && (
                      <div className="db-cover">
                        <img src={`http://localhost:8000/storage/${b.cover_image}`} alt={b.title}/>
                      </div>
                    )}
                    <div className="db-blog-body">
                      <div className="db-blog-meta">
                        <span className="db-type-badge">{b.type?.replace(/_/g,' ')}</span>
                        <span className="db-status-badge" style={{background:s.bg, color:s.color}}>{b.status}</span>
                        {b.category && <span className="db-cat-badge">{b.category}</span>}
                      </div>
                      <h3 className="db-blog-title">{b.title}</h3>
                      {b.excerpt && <p className="db-blog-excerpt">{b.excerpt}</p>}
                      <div className="db-blog-footer">
                        <span className="db-blog-date">
                          {new Date(b.created_at).toLocaleDateString('en-PK',{day:'numeric',month:'short',year:'numeric'})}
                        </span>
                        <span style={{display:'flex',alignItems:'center',gap:4,fontSize:12,color:'var(--gray-400)'}}>
                          <Eye size={12}/> {b.views || 0} views
                        </span>
                      </div>
                    </div>
                    <div className="db-blog-actions">
                      <button className="db-action-btn db-edit" onClick={() => openEdit(b)}>
                        <Edit2 size={14}/> Edit
                      </button>
                      <button className="db-action-btn db-delete" onClick={() => deleteBlog(b.id)}
                        disabled={deleting === b.id}>
                        <Trash2 size={14}/> {deleting === b.id ? '...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        }
      </div>
    </DashboardLayout>
  );
}
