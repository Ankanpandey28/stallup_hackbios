
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChefHat,
  CircleDollarSign,
  Handshake,
  MapPin,
  Menu,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Utensils,
  Wallet,
  X,
} from "lucide-react";

const benefits = [
  {
    icon: ChefHat,
    title: "For Vendors",
    description:
      "Turn your food-business idea into a real opportunity. Showcase your business, share your vision, and connect with potential funders.",
    points: [
      "Create your business profile",
      "Present your funding requirements",
      "Connect with interested funders",
    ],
    href: "/login",
    link: "Register your business",
  },
  {
    icon: CircleDollarSign,
    title: "For funders",
    description:
      "Discover food businesses, explore their profiles, and connect with Vendors looking for funding and growth opportunities.",
    points: [
      "Discover emerging businesses",
      "Explore business information",
      "Build connections with Vendors",
    ],
    href: "/signup",
    link: "Join as a funder",
  },
];

const steps = [
  {
    number: "01",
    title: "Create your account",
    description:
      "Join StallUp as a food Vendor or a potential funder.",
  },
  {
    number: "02",
    title: "Discover opportunities",
    description:
      "Build your business profile or explore food-business opportunities.",
  },
  {
    number: "03",
    title: "Connect and grow",
    description:
      "Reach out, build relationships, and explore potential partnerships.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#faf9f6] text-[#183b2b]">
      <header className="sticky top-0 z-50 border-b border-[#e8e9df] bg-[#faf9f6]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#174d36] text-white">
              <Utensils size={21} />
            </span>
            <span className="text-2xl font-black tracking-tight">
              stall<span className="text-[#5c9368]">up</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link href="/" className="text-sm font-semibold text-[#174d36]">
              Home
            </Link>
            <a
              href="#opportunities"
              className="text-sm font-medium text-[#68776b] transition hover:text-[#174d36]"
            >
              Opportunities
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-[#68776b] transition hover:text-[#174d36]"
            >
              How it works
            </a>
            <a
              href="#about"
              className="text-sm font-medium text-[#68776b] transition hover:text-[#174d36]"
            >
              About
            </a>
          </nav>

          <div className="hidden items-center gap-3 sm:flex">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:bg-[#edf0e8]"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-[#174d36] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-[#174d36]/10 transition hover:bg-[#103c29]"
            >
              Get started <ArrowUpRight size={16} />
            </Link>
          </div>

          <Link
            href="/signup"
            className="rounded-xl bg-[#174d36] px-4 py-2.5 text-sm font-semibold text-white sm:hidden"
          >
            Get started
          </Link>
        </div>
      </header>

      <section className="relative">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-2 lg:gap-16 lg:px-12 lg:py-24">
          <div className="relative z-10">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#dce6d9] bg-white px-4 py-2 text-sm font-medium text-[#35694b] shadow-sm">
              <Sparkles size={15} />
              A new way to grow food businesses
            </div>

            <h1 className="max-w-2xl text-5xl leading-[1.08] font-semibold tracking-[-0.055em] sm:text-6xl lg:text-[72px]">
              Great food ideas deserve{" "}
              <span className="relative inline-block text-[#63966b]">
                a chance
                <svg
                  className="absolute -bottom-2 left-0 w-full"
                  viewBox="0 0 240 14"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M3 10C63 2 160 2 236 8"
                    stroke="#d2a85b"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>{" "}
              to grow.
            </h1>

            <p className="mt-7 max-w-xl text-lg leading-8 text-[#69786c]">
              StallUp brings food Vendors and potential funders together
              to discover opportunities, build connections, and take the next
              step toward growth.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#174d36] px-6 py-4 font-semibold text-white shadow-xl shadow-[#174d36]/15 transition hover:-translate-y-0.5 hover:bg-[#103c29]"
              >
                Register your business <ArrowRight size={18} />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#dfe4da] bg-white px-6 py-4 font-semibold text-[#254b35] transition hover:border-[#9cb69f]"
              >
                Explore your account <ArrowUpRight size={17} />
              </Link>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-[#6c7a6e]">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={17} className="text-[#63966b]" />
                Built for Vendors
              </span>
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 size={17} className="text-[#63966b]" />
                Designed for funders
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-[#e8ebd9] blur-2xl" />
            <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-[#dce9d8] blur-2xl" />

            <div className="relative rounded-[2rem] border border-white bg-[#e9eee3] p-4 shadow-2xl shadow-[#294d32]/10 sm:p-6">
              <div className="overflow-hidden rounded-[1.5rem] bg-[#174d36] p-6 text-white sm:p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-white/70">
                      Your next chapter starts here
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                      Ideas into opportunity.
                    </h2>
                  </div>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                    <TrendingUp size={25} />
                  </span>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4">
                    <ChefHat size={22} className="text-[#d7c18b]" />
                    <p className="mt-4 font-semibold">Build</p>
                    <p className="mt-1 text-sm leading-5 text-white/65">
                      Showcase your business
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.08] p-4">
                    <Handshake size={22} className="text-[#d7c18b]" />
                    <p className="mt-4 font-semibold">Connect</p>
                    <p className="mt-1 text-sm leading-5 text-white/65">
                      Meet potential partners
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-[#f4f1e6] p-5 text-[#214632]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#dfe8d8]">
                        <Wallet size={22} />
                      </span>
                      <div>
                        <p className="font-semibold">Growth begins with a connection</p>
                        <p className="mt-1 text-xs text-[#708071]">
                          Vendors + funders
                        </p>
                      </div>
                    </div>
                    <ArrowUpRight size={20} />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 px-2 pb-1 pt-5 sm:px-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#477b50] shadow-sm">
                    <ShieldCheck size={20} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Your journey, your goals</p>
                    <p className="mt-1 text-xs text-[#788678]">
                      Create a profile that works for you
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-[#628267]">
                  StallUp
                </span>
              </div>
            </div>

            <div className="absolute -left-4 top-24 hidden rounded-2xl border border-[#e9e8de] bg-white p-4 shadow-xl sm:block lg:-left-10">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f0e4] text-[#3b7249]">
                  <Handshake size={20} />
                </span>
                <div>
                  <p className="text-sm font-semibold">Find your people</p>
                  <p className="mt-1 text-xs text-[#7a857a]">
                    Connections start here
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="opportunities" className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold tracking-[0.18em] text-[#719276] uppercase">
              One platform, two possibilities
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
              Growth looks different for everyone.
            </h2>
            <p className="mt-5 leading-7 text-[#748074]">
              Whether you are building a business or looking for your next
              opportunity, StallUp helps you take the next step.
            </p>
          </div>

          <div className="mt-14 grid gap-6 lg:grid-cols-2">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <article
                  key={benefit.title}
                  className="rounded-3xl border border-[#e7e9e0] bg-[#fafaf7] p-7 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-[#294d32]/5 sm:p-9"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e5eddf] text-[#3f754b]">
                    <Icon size={27} />
                  </span>

                  <h3 className="mt-6 text-2xl font-semibold">
                    {benefit.title}
                  </h3>
                  <p className="mt-3 max-w-lg leading-7 text-[#748074]">
                    {benefit.description}
                  </p>

                  <ul className="mt-6 space-y-3">
                    {benefit.points.map((point) => (
                      <li
                        key={point}
                        className="flex items-start gap-3 text-sm text-[#405b47]"
                      >
                        <CheckCircle2
                          size={18}
                          className="mt-0.5 shrink-0 text-[#719b70]"
                        />
                        {point}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={benefit.href}
                    className="mt-8 inline-flex items-center gap-2 font-semibold text-[#245d3b] hover:gap-3"
                  >
                    {benefit.link} <ArrowRight size={17} />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
            <div>
              <p className="text-sm font-bold tracking-[0.18em] text-[#719276] uppercase">
                Simple by design
              </p>
              <h2 className="mt-4 text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
                Your next step starts with three.
              </h2>
              <p className="mt-5 max-w-md leading-7 text-[#748074]">
                Getting started should feel simple. Create your account,
                discover possibilities, and start building meaningful
                connections.
              </p>
              <Link
                href="/signup"
                className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#174d36] px-5 py-3.5 font-semibold text-white transition hover:bg-[#103c29]"
              >
                Start your journey <ArrowRight size={17} />
              </Link>
            </div>

            <div className="space-y-4">
              {steps.map((step) => (
                <article
                  key={step.number}
                  className="flex gap-5 rounded-2xl border border-[#e5e8de] bg-white p-6 sm:gap-7 sm:p-7"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e7eee1] text-sm font-bold text-[#47794e]">
                    {step.number}
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold">{step.title}</h3>
                    <p className="mt-2 leading-7 text-[#748074]">
                      {step.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="px-5 pb-20 sm:px-8 sm:pb-24 lg:px-12">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#174d36] px-6 py-14 text-center text-white sm:px-12 sm:py-16">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <Sparkles size={26} />
          </span>
          <h2 className="mx-auto mt-6 max-w-2xl text-3xl leading-tight font-semibold tracking-tight sm:text-5xl">
            Your idea has a future. Let&apos;s build toward it.
          </h2>
          <p className="mx-auto mt-5 max-w-xl leading-7 text-white/70">
            Create your StallUp account and discover a new way to connect food
            Vendors with potential funders.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#f4f1e6] px-6 py-4 font-semibold text-[#174d36] transition hover:bg-white"
            >
              Get started today <ArrowRight size={18} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl border border-white/25 px-6 py-4 font-semibold text-white transition hover:bg-white/10"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#e4e7dd] bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#174d36] text-white">
              <Utensils size={18} />
            </span>
            <span className="text-xl font-black tracking-tight">
              stall<span className="text-[#5c9368]">up</span>
            </span>
          </Link>
          <p className="text-sm text-[#7a857a]">
            Helping food businesses connect with new possibilities.
          </p>
          <div className="flex gap-5 text-sm font-medium text-[#526754]">
            <Link href="/login" className="hover:text-[#174d36]">
              Log in
            </Link>
            <Link href="/signup" className="hover:text-[#174d36]">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}