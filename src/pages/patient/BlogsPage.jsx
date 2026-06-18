import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BookOpen, Eye, Clock } from "lucide-react";
import Layout from "../../components/layout/Layout";
import { blogAPI } from "../../api/services";
import { storageUrl } from "../../utils/helpers";
import { BlogCardSkeleton } from "../../components/common/Skeleton";
import "./BlogsPage.css";

const TYPES = [
  { val:"",              label:"All" },
  { val:"article",       label:"Articles" },
  { val:"success_story", label:"Success Stories" },
  { val:"health_tip",    label:"Health Tips" },
];

export default function BlogsPage() {
  const [blogs,   setBlogs]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [params]              = useSearchParams();
  const [type,    setType]    = useState(params.get("type") || "");

  useEffect(() => {
    setLoading(true);
    blogAPI.list({ type: type || undefined })
      .then(r => setBlogs(r.data.data.data || []))
      .catch(() => setBlogs([]))
      .finally(() => setLoading(false));
  }, [type]);

  const TYPE_STYLE = {
    article:       { bg:"#EFF6FF", color:"#2563EB" },
    success_story: { bg:"#DCFCE7", color:"#16A34A" },
    health_tip:    { bg:"#FDF4FF", color:"#7C3AED" },
  };

  return (
    <Layout>
      <div className="pd-container pd-section">
        <div className="bp-header">
          <div>
            <h1 className="bp-title">Health Blogs</h1>
            <p className="bp-sub">Tips, articles and success stories from our medical community</p>
          </div>
        </div>

        {/* Type filter */}
        <div className="bp-filters">
          {TYPES.map(t => (
            <button key={t.val} onClick={() => setType(t.val)}
              className={`bp-filter-btn ${type === t.val ? "active" : ""}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="blogs-grid">
            {Array.from({ length: 6 }).map((_, i) => <BlogCardSkeleton key={i} />)}
          </div>
        ) : blogs.length === 0 ? (
          <div className="pd-empty">
            <BookOpen size={40} />
            <p>No blogs found</p>
          </div>
        ) : (
          <div className="blogs-grid">
            {blogs.map(b => {
              const ts = TYPE_STYLE[b.type] || TYPE_STYLE.article;
              const readTime = b.content
                ? Math.max(1, Math.ceil(b.content.split(/\s+/).length / 200))
                : 1;
              return (
                <Link key={b.id} to={`/blogs/${b.slug}`} className="blog-card">
                  <div className="blog-img">
                    {b.cover_image
                      ? <img src={storageUrl(b.cover_image)} alt={b.title} />
                      : <div className="blog-img-placeholder"><BookOpen size={28} /></div>
                    }
                    <span className="blog-type-badge" style={{ background: ts.bg, color: ts.color }}>
                      {b.type?.replace(/_/g, " ")}
                    </span>
                  </div>
                  <div className="blog-body">
                    {b.category && (
                      <span className="blog-category">{b.category}</span>
                    )}
                    <h3 className="blog-title">{b.title}</h3>
                    {b.excerpt && <p className="blog-excerpt">{b.excerpt}</p>}
                    <div className="blog-footer">
                      <span className="blog-author">By {b.user?.name || "PhysioDesk"}</span>
                      <div className="blog-stats">
                        <span><Clock size={11}/> {readTime} min</span>
                        <span><Eye size={11}/> {b.views || 0}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
