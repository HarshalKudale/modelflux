import { About } from './components/About';
import { FAQ } from './components/FAQ';
import { Features } from './components/Features';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { Navbar } from './components/Navbar';
import { Screenshots } from './components/Screenshots';
import { Technologies } from './components/Technologies';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans">
      <Navbar />
      <main className="flex-1 pt-16">
        <Hero />
        <Screenshots />
        <Features />
        <Technologies />
        <About />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
