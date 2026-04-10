import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Slider from '../lib/reactSlick'
import { motion } from 'motion/react'
import { Leaf, Megaphone, Shield, Sparkles } from 'lucide-react'
import { getLanguage, getSplashDone, setOnboardingDone } from '../lib/storage'
import { getResumeSetupPath } from '../lib/setup'
import 'slick-carousel/slick/slick.css'
import 'slick-carousel/slick/slick-theme.css'

const slides = [
  {
    title: 'Clean India Starts with Us',
    body: 'Report what you see. Small actions add up to cleaner cities for everyone.',
    icon: Leaf,
    accent: 'from-lime-400 to-emerald-600',
  },
  {
    title: 'Your Eyes, Your Voice',
    body: 'Photos and locations help crews fix issues faster with fewer repeat visits.',
    icon: Megaphone,
    accent: 'from-sky-400 to-blue-600',
  },
  {
    title: "Not Government's Job Alone",
    body: 'Civic sense starts with us—partnership beats blame.',
    icon: Shield,
    accent: 'from-amber-400 to-orange-500',
  },
  {
    title: 'Earn Rewards for Good Actions',
    body: 'Points you can redeem on essentials when you report responsibly.',
    icon: Sparkles,
    accent: 'from-violet-400 to-indigo-600',
  },
]

export default function Onboarding() {
  const nav = useNavigate()
  const sliderRef = useRef<InstanceType<typeof Slider> | null>(null)
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    if (!getSplashDone() || !getLanguage()) {
      nav(getResumeSetupPath(), { replace: true })
      return
    }
    const resume = getResumeSetupPath()
    if (resume !== '/onboarding') nav(resume, { replace: true })
  }, [nav])

  const settings = {
    dots: true,
    infinite: false,
    speed: 400,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
    adaptiveHeight: true,
    afterChange: (index: number) => setSlide(index),
  }

  function finish() {
    setOnboardingDone()
    nav('/phone', { replace: true })
  }

  return (
    <div className="flex min-h-dvh flex-col px-5 pb-8 pt-12">
      <div className="mb-6 flex items-center justify-end">
        <button
          type="button"
          onClick={finish}
          className="rounded-full px-4 py-2 text-sm font-semibold text-blue-700 underline-offset-4 hover:underline"
        >
          Skip
        </button>
      </div>

      <Slider ref={sliderRef} {...settings} className="onboarding-slider pb-8">
        {slides.map((s, i) => {
          const Icon = s.icon
          return (
            <div key={s.title} className="px-1">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.35 }}
                className="glass-panel-strong overflow-hidden rounded-[28px] p-6"
              >
                <div
                  className={`mx-auto mb-6 flex h-36 w-36 items-center justify-center rounded-3xl bg-gradient-to-br ${s.accent} shadow-lg`}
                >
                  <Icon className="h-16 w-16 text-white" aria-hidden />
                </div>
                <h1 className="text-center text-2xl font-bold leading-tight text-slate-900">{s.title}</h1>
                <p className="mt-3 text-center text-[15px] leading-relaxed text-slate-600">{s.body}</p>
              </motion.div>
            </div>
          )
        })}
      </Slider>

      <div className="mt-auto flex flex-col gap-3 pt-4">
        <button
          type="button"
          onClick={() => {
            const s = sliderRef.current
            if (!s) return
            if (slide >= slides.length - 1) finish()
            else s.slickNext()
          }}
          className="w-full rounded-full bg-blue-600 py-3.5 text-base font-semibold text-white shadow-lg shadow-blue-600/25"
        >
          Next
        </button>
        <button
          type="button"
          onClick={finish}
          className="w-full rounded-full border border-slate-300/80 bg-white/50 py-3 text-base font-semibold text-slate-800"
        >
          Get Started
        </button>
      </div>
    </div>
  )
}
