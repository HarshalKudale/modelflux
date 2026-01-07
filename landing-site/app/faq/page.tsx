import { FAQ } from '../components/FAQ';
import { Footer } from '../components/Footer';
import { Navbar } from '../components/Navbar';

export default function FAQPage() {
    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="pt-16">
                <FAQ />
            </main>
            <Footer />
        </div>
    );
}
