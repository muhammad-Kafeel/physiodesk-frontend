import Header from './Header';
import Footer from './Footer';

export default function Layout({ children, noFooter = false }) {
  return (
    <>
      <Header />
      <main className="pd-main">
        {children}
      </main>
      {!noFooter && <Footer />}
    </>
  );
}
