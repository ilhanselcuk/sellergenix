import Navigation from '../../components/landing/Navigation'
import Hero from '../../components/landing/Hero'
import Features from '../../components/landing/Features'
import CTASection from '../../components/landing/CTASection'
import Footer from '../../components/landing/Footer'
import DataFlowAnimation from '../../components/landing/DataFlowAnimation'

export default function Home() {
  return (
    <div className="min-h-screen bg-black relative">
      <DataFlowAnimation />
      <Navigation />
      <main>
        <Hero />
        <Features />
        <CTASection />
      </main>
      <Footer />
    </div>
  )
}