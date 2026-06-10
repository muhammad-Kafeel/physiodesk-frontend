import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, Calendar, User, Tag, BookOpen, Clock } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import { blogAPI } from '../../api/services';
import './BlogDetail.css';

export default function BlogDetail() {
  const { slug }      = useParams();
  const navigate      = useNavigate();
  const [blog,    setBlog]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    setLoading(true);
    blogAPI.getBySlug(slug)
      .then(r => setBlog(r.data.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug]);

  // Estimate reading time (avg 200 words/min)
  const readTime = blog?.content
    ? Math.max(1, Math.ceil(blog.content.split(/\s+/).length / 200))
    : null;

  const TYPE_LABEL = {
    article:       { label: 'Article',       bg: '#EFF6FF', color: '#2563EB' },
    success_story: { label: 'Success Story', bg: '#F0FDF4', color: '#16A34A' },
    health_tip:    { label: 'Health Tip',    bg: '#FDF4FF', color: '#7C3AED' },
  };

  if (loading) return (
    <Layout>
      <div className="pd-container" style={{ paddingTop: 60 }}>
        <div className="bd-skeleton">
          <div className="bd-skel-img" />
          <div className="bd-skel-title" />
          <div className="bd-skel-line" />
          <div className="bd-skel-line bd-skel-short" />
          <div className="bd-skel-body" />
        </div>
      </div>
    </Layout>
  );

  if (error || !blog) return (
    <Layout>
      <div className="pd-container pd-section">
        <div className="pd-empty">
          <BookOpen size={44} />
          <p>Blog post not found</p>
          <Link to="/blogs" className="btn-primary-pd" style={{ marginTop: 16 }}>
            ← Back to Blogs
          </Link>
        </div>
      </div>
    </Layout>
  );

  const typeStyle = TYPE_LABEL[blog.type] || TYPE_LABEL.article;
  const tags      = Array.isArray(blog.tags) ? blog.tags : [];

  return (
    <Layout>
      <div className="bd-wrap">

        {/* Back button */}
        <div className="pd-container">
          <button className="bd-back" onClick={() => navigate(-1)}>
            <ArrowLeft size={16} /> Back to Blogs
          </button>
        </div>

        {/* Cover image */}
        {blog.cover_image && (
          <div className="bd-cover-wrap">
            <img
              src={`http://localhost:8000/storage/${blog.cover_image}`}
              alt={blog.title}
              className="bd-cover-img"
            />
          </div>
        )}

        <div className="pd-container">
          <div className="bd-layout">

            {/* Main article */}
            <article className="bd-article">

              {/* Meta badges */}
              <div className="bd-meta-top">
                <span className="bd-type-badge" style={{ background: typeStyle.bg, color: typeStyle.color }}>
                  {typeStyle.label}
                </span>
                {blog.category && (
                  <span className="bd-cat-badge">{blog.category}</span>
                )}
              </div>

              {/* Title */}
              <h1 className="bd-title">{blog.title}</h1>

              {/* Author & meta row */}
              <div className="bd-author-row">
                <div className="bd-author-avatar">
                  {blog.user?.name?.[0] || 'A'}
                </div>
                <div className="bd-author-info">
                  <p className="bd-author-name">{blog.user?.name || 'PhysioDesk Team'}</p>
                  <div className="bd-meta-pills">
                    <span><Calendar size={12} />
                      {blog.published_at
                        ? new Date(blog.published_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })
                        : new Date(blog.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' })
                      }
                    </span>
                    <span><Clock size={12} /> {readTime} min read</span>
                    <span><Eye size={12} /> {blog.views || 0} views</span>
                  </div>
                </div>
              </div>

              <div className="bd-divider" />

              {/* Excerpt */}
              {blog.excerpt && (
                <p className="bd-excerpt">{blog.excerpt}</p>
              )}

              {/* Content */}
              <div className="bd-content">
                {blog.content.split('\n').map((para, i) =>
                  para.trim() ? <p key={i}>{para}</p> : <br key={i} />
                )}
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className="bd-tags">
                  <Tag size={14} color="var(--gray-400)" />
                  {tags.map(tag => (
                    <span key={tag} className="bd-tag">{tag}</span>
                  ))}
                </div>
              )}

              <div className="bd-divider" />

              {/* Author card */}
              <div className="bd-author-card">
                <div className="bd-author-card-avatar">
                  {blog.user?.name?.[0] || 'A'}
                </div>
                <div className="bd-author-card-info">
                  <p className="bd-author-card-label">Written by</p>
                  <p className="bd-author-card-name">{blog.user?.name || 'PhysioDesk Team'}</p>
                  <p className="bd-author-card-role">
                    {blog.user?.doctor?.specialization || 'Healthcare Professional'} at PhysioDesk
                  </p>
                </div>
              </div>

              {/* Back link */}
              <div style={{ marginTop: 32 }}>
                <Link to="/blogs" className="btn-outline-pd">
                  <ArrowLeft size={14} /> All Blogs
                </Link>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="bd-sidebar">

              {/* About author */}
              <div className="bd-sidebar-card">
                <p className="bd-sidebar-title">About the Author</p>
                <div className="bd-sidebar-author">
                  <div className="bd-sa-avatar">{blog.user?.name?.[0] || 'A'}</div>
                  <div>
                    <p className="bd-sa-name">{blog.user?.name || 'PhysioDesk Team'}</p>
                    <p className="bd-sa-role">
                      {blog.user?.doctor?.specialization || 'Healthcare Professional'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Article info */}
              <div className="bd-sidebar-card">
                <p className="bd-sidebar-title">Article Info</p>
                <div className="bd-info-rows">
                  <div className="bd-info-row">
                    <span>Category</span>
                    <span>{blog.category || 'General'}</span>
                  </div>
                  <div className="bd-info-row">
                    <span>Type</span>
                    <span>{typeStyle.label}</span>
                  </div>
                  <div className="bd-info-row">
                    <span>Read time</span>
                    <span>{readTime} min</span>
                  </div>
                  <div className="bd-info-row">
                    <span>Views</span>
                    <span>{blog.views || 0}</span>
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="bd-sidebar-cta">
                <p style={{ fontWeight: 700, fontSize: 15, color: 'white', marginBottom: 8 }}>
                  Need expert care?
                </p>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,.8)', marginBottom: 16 }}>
                  Book a consultation with one of our verified physiotherapists today.
                </p>
                <Link to="/doctors" className="bd-cta-btn">
                  Find a Doctor →
                </Link>
              </div>
            </aside>

          </div>
        </div>
      </div>
    </Layout>
  );
}
