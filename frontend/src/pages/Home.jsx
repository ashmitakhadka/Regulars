import { Navbar } from "../components/navbar";
import { Hero } from "../components/Hero";
import { HowItWorks } from "../components/HowItWorks";
import { ForBusinesses } from "../components/ForBusinesses";
import { ForCustomers } from "../components/ForCustomers";
import { Footer } from "../components/Footer";

export const Home = () => {
  return (
    <div id="top" className="min-h-screen bg-white font-sans text-ink antialiased selection:bg-blush-200 selection:text-brand-900">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <ForBusinesses />
        <ForCustomers />
      </main>
      <Footer />
    </div>
  );
};

export default Home;
