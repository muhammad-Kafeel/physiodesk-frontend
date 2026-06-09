import { Link } from "react-router-dom";
import Layout from "../components/layout/Layout";

export default function NotFound() {
  return (
    <Layout>
      <div style={{textAlign:"center", padding:"80px 16px"}}>
        <p style={{fontSize:80}}>😕</p>
        <h1 style={{fontSize:28, fontWeight:800, color:"var(--gray-800)", margin:"16px 0 8px"}}>404 — Page Not Found</h1>
        <p style={{fontSize:15, color:"var(--gray-400)", marginBottom:28}}>The page you are looking for does not exist.</p>
        <Link to="/" className="btn-primary-pd">Go back to Home</Link>
      </div>
    </Layout>
  );
}
