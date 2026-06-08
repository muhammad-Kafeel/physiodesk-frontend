export default function Spinner({ fullPage = false }) {
  if (fullPage) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:'var(--gray-50)' }}>
        <div style={{ textAlign:'center' }}>
          <div className="pd-spinner" />
          <p style={{ marginTop:12, fontSize:13, color:'var(--gray-400)' }}>Loading PhysioDesk...</p>
        </div>
      </div>
    );
  }
  return <div className="pd-spinner" />;
}
