import { Features } from './components/Features';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { Navbar } from './components/Navbar';
import { Screenshots } from './components/Screenshots';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <Navbar />
      <main className="flex-1 pt-16">
        <Hero />
        <Screenshots />
        <Features />
      </main>
      <Footer />
    </div>
  );
}
