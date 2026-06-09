import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { BookOpen, Eye } from "lucide-react";
import Layout from "../../components/layout/Layout";
import { blogAPI } from "../../api/services";
import "./BlogsPage.css";

const TYPES = [
  { val:"",             label:"All"             },
  { val:"article",      label:"Articles"        },
  { val:"success_story",label:"Success Stories" },
  { val:"health_tip",   label:"Health Tips"     },
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

  return (
    <Layout>
      <div className="pd-container pd-section">
        <div style={{marginBottom:20}}>
          <h1 style={{fontSize:22, fontWeight:800, color:"var(--gray-800)", marginBottom:4}}>Health Blogs</h1>
          <p style={{fontSize:13, color:"var(--gray-400)"}}>Tips, articles and success stories from our community</p>
        </div>

        {/* Type filter */}
        <div style={{display:"flex", gap:8, marginBottom:20, flexWrap:"wrap"}}>
          {TYPES.map(t => (
            <button key={t.val} onClick={() => setType(t.val)}
              style={{padding:"7px 16px", borderRadius:99, border:"1.5px solid", fontSize:13, fontWeight:600, cursor:"pointer", transition:"all .2s",
                borderColor: type===t.val ? "var(--primary)" : "var(--gray-200)",
                background:  type===t.val ? "var(--primary)" : "white",
                color:       type===t.val ? "white" : "var(--gray-600)"}}>
              {t.label}
            </button>
          ))}
        </div>

        {loading ? <div className="pd-spinner" /> :
          blogs.length === 0 ? (
            <div className="pd-empty"><BookOpen size={40} /><p>No blogs found</p></div>
          ) : (
            <div className="blogs-grid">
              {blogs.map(b => (
                <Link key={b.id} to={`/blogs/${b.slug}`} className="blog-card">
                  <div className="blog-img">
                    {b.cover_image
                      ? <img src={`http://localhost:8000/storage/${b.cover_image}`} alt={b.title} />
                      : <div className="blog-img-placeholder"><BookOpen size={28} /></div>
                    }
                  </div>
                  <div className="blog-body">
                    <div style={{display:"flex", gap:6, marginBottom:8, flexWrap:"wrap"}}>
                      <span style={{fontSize:11, fontWeight:700, padding:"2px 8px", borderRadius:99, background:"var(--primary-light)", color:"var(--primary)", textTransform:"capitalize"}}>
                        {b.type?.replace(/_/g," ")}
                      </span>
                      {b.category && (
                        <span style={{fontSize:11, padding:"2px 8px", borderRadius:99, background:"var(--gray-100)", color:"var(--gray-600)"}}>
                          {b.category}
                        </span>
                      )}
                    </div>
                    <h3 className="blog-title">{b.title}</h3>
                    {b.excerpt && <p className="blog-excerpt">{b.excerpt}</p>}
                    <div className="blog-footer">
                      <span style={{fontSize:12, color:"var(--gray-400)"}}>By {b.user?.name}</span>
                      <span style={{fontSize:12, color:"var(--gray-400)", display:"flex", alignItems:"center", gap:4}}>
                        <Eye size={12} /> {b.views || 0}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        }
      </div>
    </Layout>
  );
}
