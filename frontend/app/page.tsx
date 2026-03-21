import { Header } from '@/components/landing/header'
import { Hero } from '@/components/landing/hero'
import { Pricing } from '@/components/landing/pricing'
import { FAQ } from '@/components/landing/faq'
import { Footer } from '@/components/landing/footer'

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </div>
  )
}
