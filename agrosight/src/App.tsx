import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { ScrollTrigger } from '@/lib/gsap'
import { TopNav } from '@/components/nav/TopNav'
import { MobileTabBar } from '@/components/nav/MobileTabBar'
import { AssistantOrb } from '@/components/assistant/AssistantOrb'
import { InstallPrompt } from '@/components/pwa/InstallPrompt'
import { GyroPermitButton } from '@/components/fx'
import { useLenis } from '@/hooks/useLenis'

const Landing = lazy(() => import('@/routes/Landing'))
const Inspect = lazy(() => import('@/routes/Inspect'))
const Prices = lazy(() => import('@/routes/Prices'))
const Advisory = lazy(() => import('@/routes/Advisory'))
const Yield = lazy(() => import('@/routes/Yield'))
const Market = lazy(() => import('@/routes/Market'))
const Insights = lazy(() => import('@/routes/Insights'))
const Ethics = lazy(() => import('@/routes/Ethics'))

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4">
      <div className="skeleton h-10 w-10 rounded-full" />
      <div className="skeleton h-3 w-40" />
      <div className="skeleton h-3 w-28" />
    </div>
  )
}

function AppLayout() {
  const location = useLocation()
  useLenis()

  useEffect(() => {
    const t = setTimeout(() => ScrollTrigger.refresh(), 100)
    return () => clearTimeout(t)
  }, [location.pathname])

  return (
    <div className="min-h-dvh bg-bg">
      <div className="grain-overlay" aria-hidden />
      <TopNav />
      <main
        key={location.pathname}
        className="animate-fade-in pb-24 pt-28 sm:pt-24 lg:pb-8"
      >
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/inspect" element={<Inspect />} />
            <Route path="/prices" element={<Prices />} />
            <Route path="/advisory" element={<Advisory />} />
            <Route path="/yield" element={<Yield />} />
            <Route path="/market" element={<Market />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/ethics" element={<Ethics />} />
          </Routes>
        </Suspense>
      </main>
      <MobileTabBar />
      <AssistantOrb />
      <InstallPrompt />
      <GyroPermitButton />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}
