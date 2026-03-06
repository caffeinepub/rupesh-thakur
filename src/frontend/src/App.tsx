import { Toaster } from "@/components/ui/sonner";
import {
  ChevronDown,
  Github,
  Instagram,
  Lightbulb,
  Linkedin,
  Mail,
  Megaphone,
  Menu,
  Mic2,
  Palette,
  Puzzle,
  TrendingUp,
  Twitter,
  Users,
  UsersRound,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  useGetVisitorCount,
  useIncrementVisitorCount,
} from "./hooks/useQueries";

// ── Smoke Canvas ─────────────────────────────────────────────────────────────
interface SmokeBlob {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  opacity: number;
  noiseOffsetX: number;
  noiseOffsetY: number;
  noiseSpeedX: number;
  noiseSpeedY: number;
}

function SmokeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Initialise blobs
    const blobCount = 26;
    const blobs: SmokeBlob[] = Array.from({ length: blobCount }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      radius: 80 + Math.random() * 170,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.2,
      opacity: 0.018 + Math.random() * 0.014,
      noiseOffsetX: Math.random() * 1000,
      noiseOffsetY: Math.random() * 1000,
      noiseSpeedX: 0.0003 + Math.random() * 0.0004,
      noiseSpeedY: 0.0003 + Math.random() * 0.0004,
    }));

    let tick = 0;

    const draw = () => {
      tick++;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);
      ctx.filter = "blur(60px)";

      for (const blob of blobs) {
        // Sinusoidal noise drift
        blob.x +=
          blob.vx + Math.sin(tick * blob.noiseSpeedX + blob.noiseOffsetX) * 0.4;
        blob.y +=
          blob.vy + Math.cos(tick * blob.noiseSpeedY + blob.noiseOffsetY) * 0.3;

        // Wrap around canvas edges
        if (blob.x < -blob.radius) blob.x = w + blob.radius;
        if (blob.x > w + blob.radius) blob.x = -blob.radius;
        if (blob.y < -blob.radius) blob.y = h + blob.radius;
        if (blob.y > h + blob.radius) blob.y = -blob.radius;

        // Draw radial gradient blob
        const gradient = ctx.createRadialGradient(
          blob.x,
          blob.y,
          0,
          blob.x,
          blob.y,
          blob.radius,
        );
        gradient.addColorStop(0, `rgba(140, 0, 0, ${blob.opacity})`);
        gradient.addColorStop(0.5, `rgba(120, 0, 0, ${blob.opacity * 0.6})`);
        gradient.addColorStop(1, "rgba(100, 0, 0, 0)");

        ctx.beginPath();
        ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
      }

      ctx.filter = "none";
      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        pointerEvents: "none",
      }}
    />
  );
}

// ── Scroll reveal hook ──────────────────────────────────────────────────────
function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          observer.unobserve(el);
        }
      },
      { threshold },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);
  return ref;
}

// ── Staggered children reveal ───────────────────────────────────────────────
function useStaggerReveal(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    const children = Array.from(container.children) as HTMLElement[];
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          for (let i = 0; i < children.length; i++) {
            const child = children[i];
            setTimeout(() => {
              child.style.opacity = "1";
              child.style.transform = "translateY(0)";
            }, i * 100);
          }
          observer.unobserve(container);
        }
      },
      { threshold },
    );
    for (const child of children) {
      child.style.opacity = "0";
      child.style.transform = "translateY(40px)";
      child.style.transition =
        "opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1)";
    }
    observer.observe(container);
    return () => observer.disconnect();
  }, [threshold]);
  return ref;
}

// ── Visitor Map: pre-computed land dot grid (module level for perf) ──────────
interface LandDot {
  cx: number;
  cy: number;
}

function latLngToSvg(lat: number, lng: number): { x: number; y: number } {
  return {
    x: ((lng + 180) / 360) * 1000,
    y: ((90 - lat) / 180) * 500,
  };
}

function isLand(lat: number, lng: number): boolean {
  // North America
  if (lng >= -170 && lng <= -50 && lat >= 15 && lat <= 80) return true;
  // South America
  if (lng >= -82 && lng <= -34 && lat >= -56 && lat <= 13) return true;
  // Europe
  if (lng >= -25 && lng <= 45 && lat >= 35 && lat <= 72) return true;
  // Africa
  if (lng >= -20 && lng <= 52 && lat >= -36 && lat <= 38) return true;
  // Asia (main)
  if (lng >= 25 && lng <= 150 && lat >= 0 && lat <= 80) return true;
  // Southeast Asia islands
  if (lng >= 95 && lng <= 145 && lat >= -10 && lat <= 25) return true;
  // Australia
  if (lng >= 113 && lng <= 155 && lat >= -44 && lat <= -10) return true;
  // New Zealand
  if (lng >= 165 && lng <= 180 && lat >= -47 && lat <= -34) return true;
  // Greenland
  if (lng >= -60 && lng <= -15 && lat >= 59 && lat <= 85) return true;
  // Japan
  if (lng >= 129 && lng <= 146 && lat >= 30 && lat <= 46) return true;
  return false;
}

const LAND_DOTS: LandDot[] = (() => {
  const dots: LandDot[] = [];
  for (let lat = -80; lat <= 80; lat += 10) {
    for (let lng = -180; lng <= 180; lng += 10) {
      if (isLand(lat, lng)) {
        const { x, y } = latLngToSvg(lat, lng);
        dots.push({ cx: x, cy: y });
      }
    }
  }
  return dots;
})();

interface CityMarker {
  name: string;
  lat: number;
  lng: number;
}

const CITY_MARKERS: CityMarker[] = [
  { name: "New York", lat: 40.7, lng: -74.0 },
  { name: "Los Angeles", lat: 34.0, lng: -118.2 },
  { name: "Toronto", lat: 43.7, lng: -79.4 },
  { name: "Mexico City", lat: 19.4, lng: -99.1 },
  { name: "São Paulo", lat: -23.5, lng: -46.6 },
  { name: "Buenos Aires", lat: -34.6, lng: -58.4 },
  { name: "Bogotá", lat: 4.7, lng: -74.1 },
  { name: "London", lat: 51.5, lng: -0.1 },
  { name: "Paris", lat: 48.9, lng: 2.3 },
  { name: "Berlin", lat: 52.5, lng: 13.4 },
  { name: "Moscow", lat: 55.8, lng: 37.6 },
  { name: "Madrid", lat: 40.4, lng: -3.7 },
  { name: "Rome", lat: 41.9, lng: 12.5 },
  { name: "Amsterdam", lat: 52.4, lng: 4.9 },
  { name: "Lagos", lat: 6.5, lng: 3.4 },
  { name: "Cairo", lat: 30.0, lng: 31.2 },
  { name: "Nairobi", lat: -1.3, lng: 36.8 },
  { name: "Johannesburg", lat: -26.2, lng: 28.0 },
  { name: "Mumbai", lat: 19.1, lng: 72.9 },
  { name: "Delhi", lat: 28.6, lng: 77.2 },
  { name: "Tokyo", lat: 35.7, lng: 139.7 },
  { name: "Beijing", lat: 39.9, lng: 116.4 },
  { name: "Bangkok", lat: 13.8, lng: 100.5 },
  { name: "Dubai", lat: 25.2, lng: 55.3 },
  { name: "Singapore", lat: 1.3, lng: 103.8 },
  { name: "Sydney", lat: -33.9, lng: 151.2 },
];

// ── Skills data ──────────────────────────────────────────────────────────────
const skills = [
  {
    name: "Leadership",
    icon: Users,
    desc: "Inspiring teams to achieve the impossible.",
  },
  {
    name: "Strategic Thinking",
    icon: Lightbulb,
    desc: "Seeing the big picture before others do.",
  },
  {
    name: "Creative Direction",
    icon: Palette,
    desc: "Turning abstract visions into reality.",
  },
  {
    name: "Brand Building",
    icon: TrendingUp,
    desc: "Crafting identities that resonate deeply.",
  },
  {
    name: "Digital Marketing",
    icon: Megaphone,
    desc: "Growth strategies that actually move needles.",
  },
  {
    name: "Public Speaking",
    icon: Mic2,
    desc: "Words that captivate, stories that inspire.",
  },
  {
    name: "Problem Solving",
    icon: Puzzle,
    desc: "Breaking complexity into elegant solutions.",
  },
  {
    name: "Innovation",
    icon: Zap,
    desc: "Relentless pursuit of what has never been done.",
  },
  {
    name: "Team Management",
    icon: UsersRound,
    desc: "Building cultures where greatness is expected.",
  },
];

// ── Navigation ───────────────────────────────────────────────────────────────
function Navigation() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = useCallback((id: string) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }, []);

  return (
    <nav
      data-ocid="nav.section"
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        background: scrolled ? "rgba(0,0,0,0.9)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(225,0,0,0.1)" : "none",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <button
            type="button"
            onClick={() => scrollTo("hero")}
            className="relative group"
          >
            <span className="font-bebas text-2xl tracking-widest rt-logo-glow">
              RT
            </span>
            <span
              className="absolute -bottom-1 left-0 right-0 h-px"
              style={{
                background: "var(--red-bright)",
                boxShadow: "0 0 6px rgba(225,0,0,0.6)",
                transform: "scaleX(0)",
                transition: "transform 0.3s ease",
              }}
            />
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {[
              "about",
              "skills",
              "vision",
              "achievements",
              "map",
              "contact",
            ].map((id) => (
              <button
                type="button"
                key={id}
                onClick={() => scrollTo(id === "map" ? "visitor-map" : id)}
                className="nav-link"
                data-ocid={`nav.link.${id}`}
              >
                {id}
              </button>
            ))}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-white p-2"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden transition-all duration-300 overflow-hidden ${
          menuOpen ? "max-h-64 opacity-100" : "max-h-0 opacity-0"
        }`}
        style={{
          background: "rgba(0,0,0,0.97)",
          borderBottom: "1px solid rgba(225,0,0,0.15)",
        }}
      >
        <div className="px-6 py-4 flex flex-col gap-4">
          {["about", "skills", "vision", "achievements", "map", "contact"].map(
            (id) => (
              <button
                type="button"
                key={id}
                onClick={() => scrollTo(id === "map" ? "visitor-map" : id)}
                className="nav-link text-left py-2"
              >
                {id}
              </button>
            ),
          )}
        </div>
      </div>
    </nav>
  );
}

// ── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection() {
  const { mutate: incrementVisitor } = useIncrementVisitorCount();

  useEffect(() => {
    incrementVisitor();
  }, [incrementVisitor]);

  const scrollToContact = () => {
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      id="hero"
      data-ocid="hero.section"
      className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "#000" }}
    >
      {/* Background image with overlay */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage:
            "url('/assets/generated/rupesh-hero-bg.dim_1600x900.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center top",
          opacity: 0.25,
        }}
      />

      {/* FIX 2 — Ambient glow orbs: amplified opacity + filter:blur for real bloom */}
      <div
        className="absolute pointer-events-none z-0"
        style={{
          width: 800,
          height: 800,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(225,0,0,0.28) 0%, rgba(180,0,0,0.10) 40%, transparent 70%)",
          top: "5%",
          left: "50%",
          transform: "translateX(-50%)",
          filter: "blur(60px)",
          animation: "orb-float-1 12s ease-in-out infinite",
        }}
      />
      <div
        className="absolute pointer-events-none z-0"
        style={{
          width: 400,
          height: 400,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(225,0,0,0.20) 0%, transparent 70%)",
          bottom: "15%",
          right: "5%",
          filter: "blur(50px)",
          animation: "orb-float-2 16s ease-in-out infinite",
        }}
      />
      <div
        className="absolute pointer-events-none z-0"
        style={{
          width: 300,
          height: 300,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(200,0,0,0.18) 0%, transparent 70%)",
          top: "35%",
          left: "2%",
          filter: "blur(40px)",
          animation: "orb-float-3 10s ease-in-out infinite",
        }}
      />

      {/* Noise texture */}
      <div className="noise-overlay" />

      {/* Scan line effect */}
      <div
        className="absolute left-0 right-0 h-px pointer-events-none z-10"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(225,0,0,0.3), transparent)",
          animation: "scan-line 6s linear infinite",
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-4 md:px-8 max-w-6xl mx-auto w-full">
        {/* Eyebrow label */}
        <div
          className="inline-flex items-center gap-2 mb-8 hero-tagline-animate"
          style={{ animationDelay: "0s", opacity: 0 }}
        >
          <span
            className="inline-block w-8 h-px"
            style={{ background: "var(--red-bright)" }}
          />
          <span
            className="text-xs font-display font-semibold tracking-widest uppercase"
            style={{ color: "var(--red-bright)" }}
          >
            Personal Brand
          </span>
          <span
            className="inline-block w-8 h-px"
            style={{ background: "var(--red-bright)" }}
          />
        </div>

        {/* Main name — FIX 1: truly massive, wall-filling slab */}
        <h1
          className="hero-name-animate font-bebas select-none"
          style={{
            fontSize: "clamp(5rem, 20vw, 18rem)",
            letterSpacing: "0.02em",
            lineHeight: 0.88,
            marginBottom: "1.5rem",
            color: "#fff",
            textShadow:
              "0 0 40px rgba(225,0,0,0.5), 0 0 100px rgba(225,0,0,0.2), 0 0 200px rgba(225,0,0,0.08)",
          }}
        >
          <span style={{ display: "block" }}>RUPESH</span>
          <span
            style={{
              display: "block",
              color: "var(--red-bright)",
              textShadow:
                "0 0 30px rgba(225,0,0,0.9), 0 0 80px rgba(225,0,0,0.5), 0 0 160px rgba(225,0,0,0.25), 0 0 300px rgba(225,0,0,0.08)",
            }}
          >
            THAKUR
          </span>
        </h1>

        {/* Profile Photo */}
        <div
          className="hero-tagline-animate flex justify-center"
          style={{
            animationDelay: "0.35s",
            opacity: 0,
            marginTop: "-0.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <div
            style={{
              width: 128,
              height: 128,
              borderRadius: "50%",
              padding: 4,
              background:
                "linear-gradient(135deg, rgba(225,0,0,0.9) 0%, rgba(120,0,0,0.6) 50%, rgba(225,0,0,0.9) 100%)",
              boxShadow:
                "0 0 24px rgba(225,0,0,0.7), 0 0 60px rgba(225,0,0,0.35), 0 0 120px rgba(225,0,0,0.15)",
              animation: "profile-glow-pulse 3s ease-in-out infinite",
            }}
          >
            <img
              src="/assets/uploads/Picsart_25-10-19_16-04-16-616-1-1.jpg"
              alt="Rupesh Thakur"
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                objectFit: "cover",
                objectPosition: "center top",
                display: "block",
              }}
            />
          </div>
        </div>

        {/* Subtitle */}
        <div
          className="hero-tagline-animate flex justify-center mb-6"
          style={{ animationDelay: "0.5s", opacity: 0 }}
        >
          <p
            style={{
              fontSize: "clamp(0.75rem, 2vw, 1rem)",
              letterSpacing: "0.18em",
              fontWeight: 600,
              color: "#e10000",
              textShadow:
                "0 0 8px rgba(225,0,0,0.9), 0 0 20px rgba(225,0,0,0.6), 0 0 40px rgba(225,0,0,0.3)",
            }}
          >
            Creator | Vision Builder | Digital Presence
          </p>
        </div>

        {/* Tagline */}
        <p
          className="hero-tagline-animate font-display font-light mb-12 mx-auto"
          style={{
            fontSize: "clamp(1rem, 2.5vw, 1.5rem)",
            color: "rgba(255,255,255,0.7)",
            letterSpacing: "0.05em",
            maxWidth: "600px",
            lineHeight: 1.5,
          }}
        >
          Not Here to Fit In.{" "}
          <span style={{ color: "rgba(255,255,255,0.95)", fontWeight: 600 }}>
            Here to Stand Out.
          </span>
        </p>

        {/* CTA Buttons */}
        <div className="hero-buttons-animate flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            type="button"
            data-ocid="hero.primary_button"
            onClick={() =>
              document
                .getElementById("skills")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="btn-red px-8 py-4 text-sm font-bold tracking-widest uppercase"
            style={{ borderRadius: 2 }}
          >
            Explore My Work
          </button>
          <button
            type="button"
            data-ocid="hero.secondary_button"
            onClick={scrollToContact}
            className="btn-outline-red px-8 py-4 text-sm font-bold tracking-widest uppercase"
            style={{ borderRadius: 2 }}
          >
            Get In Touch
          </button>
          <button
            type="button"
            data-ocid="hero.explore_button"
            onClick={() =>
              document
                .getElementById("about")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="btn-ghost-red px-8 py-4 text-sm font-bold tracking-widest uppercase"
            style={{ borderRadius: 2 }}
          >
            Explore My World
          </button>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 hero-buttons-animate"
        style={{ animationDelay: "2s", opacity: 0 }}
      >
        <span
          className="text-xs font-display tracking-widest uppercase"
          style={{ color: "rgba(255,255,255,0.4)" }}
        >
          Scroll
        </span>
        <ChevronDown
          className="animate-bounce"
          size={18}
          style={{ color: "var(--red-bright)" }}
        />
      </div>

      {/* FIX 3 — Deep hero bottom melt: extends further for seamless transition */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 pointer-events-none"
        style={{
          height: "18rem",
          background:
            "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.5) 40%, rgba(0,0,0,0.9) 75%, #000 100%)",
        }}
      />
    </section>
  );
}

// ── Intro Section ─────────────────────────────────────────────────────────────
function IntroSection() {
  const revealRef = useScrollReveal(0.2);

  return (
    <section
      id="intro"
      data-ocid="intro.section"
      className="relative py-16 md:py-24"
      style={{ background: "#000" }}
    >
      {/* Subtle red centerline glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 50% 50%, rgba(225,0,0,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12 text-center">
        <div
          ref={revealRef as React.RefObject<HTMLDivElement>}
          className="scroll-reveal"
        >
          <p
            className="font-bebas leading-tight"
            style={{
              fontSize: "clamp(1.6rem, 4vw, 3.2rem)",
              color: "rgba(255,255,255,0.95)",
              letterSpacing: "0.04em",
              lineHeight: 1.2,
            }}
          >
            I am{" "}
            <span
              style={{
                color: "var(--red-bright)",
                textShadow:
                  "0 0 16px rgba(225,0,0,0.7), 0 0 40px rgba(225,0,0,0.3)",
              }}
            >
              Rupesh Thakur.
            </span>{" "}
            Focused on building something{" "}
            <span
              style={{
                color: "var(--red-bright)",
                textShadow:
                  "0 0 16px rgba(225,0,0,0.7), 0 0 40px rgba(225,0,0,0.3)",
              }}
            >
              powerful
            </span>{" "}
            from nothing.
          </p>
        </div>
      </div>
    </section>
  );
}

// ── About Section ─────────────────────────────────────────────────────────────
function AboutSection() {
  const revealRef = useScrollReveal();
  const revealLeftRef = useScrollReveal();
  const revealRightRef = useScrollReveal();
  const storyRef = useScrollReveal(0.15);

  return (
    <section
      id="about"
      data-ocid="about.section"
      className="relative py-24 md:py-36"
      style={{ background: "#000" }}
    >
      {/* Subtle red gradient on left side */}
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: 400,
          height: 600,
          background:
            "radial-gradient(ellipse at left center, rgba(225,0,0,0.05) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        {/* Section header */}
        <div
          ref={revealRef as React.RefObject<HTMLDivElement>}
          className="scroll-reveal mb-16"
        >
          {/* Official website badge */}
          <div className="inline-flex items-center gap-2 mb-5">
            <span
              className="inline-block w-6 h-px"
              style={{ background: "var(--red-bright)" }}
            />
            <span
              className="font-display text-xs font-semibold tracking-widest uppercase"
              style={{ color: "var(--red-bright)" }}
            >
              Official Personal Website
            </span>
            <span
              className="inline-block w-6 h-px"
              style={{ background: "var(--red-bright)" }}
            />
          </div>
          <h2 className="font-bebas text-5xl md:text-6xl lg:text-7xl tracking-wider text-white red-underline">
            ABOUT ME
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-start">
          {/* Left: Bio text */}
          <div
            ref={revealLeftRef as React.RefObject<HTMLDivElement>}
            className="scroll-reveal-left"
          >
            <p
              className="font-body leading-relaxed mb-6"
              style={{
                fontSize: "clamp(1.05rem, 1.5vw, 1.2rem)",
                color: "rgba(255,255,255,0.85)",
                lineHeight: 1.9,
              }}
            >
              <span style={{ color: "var(--red-bright)", fontWeight: 700 }}>
                Rupesh Thakur
              </span>{" "}
              is a digital creator, brand builder, and visionary focused on
              turning bold ideas into real-world impact. With a relentless drive
              to create, he has built his presence from the ground up — one
              step, one project, one connection at a time.
            </p>
            <p
              className="font-body leading-relaxed mb-6"
              style={{
                fontSize: "clamp(1.05rem, 1.5vw, 1.2rem)",
                color: "rgba(255,255,255,0.7)",
                lineHeight: 1.9,
              }}
            >
              This is the{" "}
              <span style={{ color: "var(--red-bright)", fontWeight: 700 }}>
                official personal website of Rupesh Thakur
              </span>{" "}
              — the one place where you can explore his work, vision, skills,
              and get in touch directly.
            </p>
            <p
              className="font-body leading-relaxed mb-8"
              style={{
                fontSize: "clamp(1.05rem, 1.5vw, 1.2rem)",
                color: "rgba(255,255,255,0.6)",
                lineHeight: 1.9,
              }}
            >
              He believes that every big empire starts with a single decision —
              the decision to{" "}
              <span style={{ color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>
                begin
              </span>
              . And he began.
            </p>

            {/* Stats row */}
            <div className="flex gap-8 mt-10">
              {[
                { num: "10+", label: "Years" },
                { num: "50+", label: "Projects" },
                { num: "∞", label: "Ambition" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div
                    className="font-bebas text-4xl"
                    style={{
                      color: "var(--red-bright)",
                      textShadow: "0 0 20px rgba(225,0,0,0.4)",
                    }}
                  >
                    {stat.num}
                  </div>
                  <div
                    className="font-body text-xs tracking-widest uppercase mt-1"
                    style={{ color: "rgba(255,255,255,0.45)" }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Quote card */}
          <div
            ref={revealRightRef as React.RefObject<HTMLDivElement>}
            className="scroll-reveal-right"
          >
            <div
              className="relative p-8 md:p-10"
              style={{
                background: "rgba(8,8,8,0.97)",
                border: "1px solid rgba(225,0,0,0.25)",
                boxShadow:
                  "0 0 30px rgba(225,0,0,0.12), 0 0 80px rgba(225,0,0,0.05), inset 0 0 60px rgba(0,0,0,0.6), inset 0 1px 0 rgba(225,0,0,0.08)",
              }}
            >
              {/* Red corner accent */}
              <div
                className="absolute top-0 left-0 w-12 h-12"
                style={{
                  borderTop: "3px solid var(--red-bright)",
                  borderLeft: "3px solid var(--red-bright)",
                  boxShadow: "0 0 12px rgba(225,0,0,0.4)",
                }}
              />
              <div
                className="absolute bottom-0 right-0 w-12 h-12"
                style={{
                  borderBottom: "3px solid var(--red-bright)",
                  borderRight: "3px solid var(--red-bright)",
                  boxShadow: "0 0 12px rgba(225,0,0,0.4)",
                }}
              />

              <div
                className="font-bebas text-7xl leading-none mb-4"
                style={{
                  color: "var(--red-bright)",
                  opacity: 0.3,
                  lineHeight: 0.8,
                }}
              >
                "
              </div>
              <p
                className="font-display font-semibold leading-relaxed"
                style={{
                  fontSize: "clamp(1.1rem, 2vw, 1.35rem)",
                  color: "rgba(255,255,255,0.9)",
                  lineHeight: 1.7,
                  fontStyle: "italic",
                }}
              >
                The difference between ordinary and extraordinary is that little
                extra. I give everything.
              </p>
              <div
                className="mt-6 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, var(--red-bright), transparent)",
                }}
              />
              <p
                className="mt-4 font-body text-sm tracking-widest uppercase"
                style={{ color: "rgba(255,255,255,0.4)" }}
              >
                — Rupesh Thakur
              </p>
            </div>
          </div>
        </div>

        {/* Inspiring Story Block */}
        <div
          ref={storyRef as React.RefObject<HTMLDivElement>}
          className="scroll-reveal mt-20 md:mt-28"
        >
          {/* Story label */}
          <div className="flex items-center gap-4 mb-8">
            <span
              className="h-px flex-1 max-w-12"
              style={{ background: "rgba(225,0,0,0.4)" }}
            />
            <span
              className="font-display text-xs font-semibold tracking-widest uppercase"
              style={{ color: "rgba(225,0,0,0.8)" }}
            >
              The Story
            </span>
            <span
              className="h-px flex-1"
              style={{
                background:
                  "linear-gradient(90deg, rgba(225,0,0,0.4), transparent)",
              }}
            />
          </div>

          <div
            className="relative p-8 md:p-12"
            style={{
              background:
                "linear-gradient(135deg, rgba(15,0,0,0.9) 0%, rgba(5,5,5,0.98) 100%)",
              border: "1px solid rgba(225,0,0,0.15)",
              boxShadow:
                "0 0 60px rgba(225,0,0,0.06), inset 0 0 80px rgba(0,0,0,0.5)",
            }}
          >
            {/* Decorative vertical red line */}
            <div
              className="absolute left-0 top-8 bottom-8 w-1"
              style={{
                background:
                  "linear-gradient(to bottom, transparent, var(--red-bright), transparent)",
                boxShadow: "0 0 12px rgba(225,0,0,0.5)",
              }}
            />

            <h3
              className="font-bebas text-3xl md:text-4xl tracking-wider mb-6 pl-6"
              style={{
                color: "#fff",
                textShadow: "0 0 20px rgba(225,0,0,0.2)",
              }}
            >
              BUILDING SOMETHING BIG FROM{" "}
              <span
                style={{
                  color: "var(--red-bright)",
                  textShadow:
                    "0 0 16px rgba(225,0,0,0.7), 0 0 40px rgba(225,0,0,0.3)",
                }}
              >
                NOTHING
              </span>
            </h3>

            <div className="pl-6 space-y-5">
              <p
                className="font-body leading-relaxed"
                style={{
                  fontSize: "clamp(1rem, 1.4vw, 1.15rem)",
                  color: "rgba(255,255,255,0.75)",
                  lineHeight: 1.95,
                }}
              >
                There was no blueprint. No wealthy background. No shortcut. Just
                a person with a fire inside and an unshakeable belief that
                things could be different. That{" "}
                <span
                  style={{ color: "rgba(255,255,255,0.95)", fontWeight: 600 }}
                >
                  he
                </span>{" "}
                could be different.
              </p>
              <p
                className="font-body leading-relaxed"
                style={{
                  fontSize: "clamp(1rem, 1.4vw, 1.15rem)",
                  color: "rgba(255,255,255,0.65)",
                  lineHeight: 1.95,
                }}
              >
                Rupesh started with nothing but ambition — navigating
                uncertainty, learning from every failure, and refusing to let
                doubt become a destination. While others waited for the perfect
                moment, he worked in the silence, building brick by brick when
                no one was watching.
              </p>
              <p
                className="font-body leading-relaxed"
                style={{
                  fontSize: "clamp(1rem, 1.4vw, 1.15rem)",
                  color: "rgba(255,255,255,0.65)",
                  lineHeight: 1.95,
                }}
              >
                Every skill, every project, every connection was earned — not
                given. And the journey is far from over. This website is a
                living proof that{" "}
                <span
                  style={{
                    color: "var(--red-bright)",
                    fontWeight: 700,
                    textShadow: "0 0 12px rgba(225,0,0,0.4)",
                  }}
                >
                  something big is being built here.
                </span>
              </p>
              <p
                className="font-bebas text-xl md:text-2xl tracking-wider pt-2"
                style={{
                  color: "rgba(255,255,255,0.5)",
                  letterSpacing: "0.08em",
                }}
              >
                The foundation is laid. The rise has begun.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Skills Section ───────────────────────────────────────────────────────────
function SkillsSection() {
  const headerRef = useScrollReveal();
  const gridRef = useStaggerReveal(0.05);

  return (
    <section
      id="skills"
      data-ocid="skills.section"
      className="relative py-24 md:py-36"
      style={{ background: "#000" }}
    >
      {/* FIX 3 — Top bleed vignette for seamless transition */}
      <div
        className="absolute top-0 left-0 right-0 h-24 pointer-events-none z-10"
        style={{
          background: "linear-gradient(to bottom, #000, transparent)",
        }}
      />
      {/* Red divider line beneath the vignette */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(225,0,0,0.35), transparent)",
        }}
      />

      <div className="max-w-6xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div
          ref={headerRef as React.RefObject<HTMLDivElement>}
          className="scroll-reveal text-center mb-16"
        >
          <h2 className="font-bebas text-5xl md:text-6xl lg:text-7xl tracking-wider text-white red-underline-center">
            SKILLS &amp; EXPERTISE
          </h2>
          <p
            className="mt-8 font-body max-w-lg mx-auto"
            style={{ color: "rgba(255,255,255,0.5)", fontSize: "1rem" }}
          >
            A diverse toolkit forged through years of relentless execution and
            continuous growth.
          </p>
        </div>

        {/* Skills grid */}
        <div
          ref={gridRef as React.RefObject<HTMLDivElement>}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {skills.map((skill, idx) => {
            const Icon = skill.icon;
            return (
              <div
                key={skill.name}
                data-ocid={`skills.item.${idx + 1}`}
                className="skill-card p-6 group cursor-default"
                style={{ borderRadius: 4 }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex-shrink-0 w-12 h-12 flex items-center justify-center"
                    style={{
                      background: "rgba(225,0,0,0.08)",
                      border: "1px solid rgba(225,0,0,0.2)",
                      borderRadius: 4,
                      transition: "background 0.3s ease, box-shadow 0.3s ease",
                    }}
                  >
                    <Icon
                      size={22}
                      style={{ color: "var(--red-bright)" }}
                      className="transition-all duration-300 group-hover:scale-110"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3
                      className="font-display font-bold text-base mb-1"
                      style={{ color: "#fff", letterSpacing: "0.03em" }}
                    >
                      {skill.name}
                    </h3>
                    <p
                      className="font-body text-sm leading-relaxed"
                      style={{ color: "rgba(255,255,255,0.45)" }}
                    >
                      {skill.desc}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FIX 3 — Bottom bleed into Vision */}
      <div
        className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-10"
        style={{
          background: "linear-gradient(to top, #000, transparent)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(225,0,0,0.35), transparent)",
        }}
      />
    </section>
  );
}

// ── Vision Section ───────────────────────────────────────────────────────────
function VisionSection() {
  const revealRef = useScrollReveal(0.2);

  return (
    <section
      id="vision"
      data-ocid="vision.section"
      className="relative py-28 md:py-44 overflow-hidden"
      style={{ background: "#000" }}
    >
      {/* FIX 2+3 — Vision: deep layered atmospheric red bloom */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 50%, rgba(160,0,0,0.22) 0%, rgba(100,0,0,0.12) 35%, rgba(50,0,0,0.05) 60%, transparent 80%)",
          filter: "blur(2px)",
        }}
      />
      {/* Outer dark vignette to keep edges pure black */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.7) 100%)",
        }}
      />

      {/* Horizontal red lines */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(225,0,0,0.5), transparent)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(225,0,0,0.5), transparent)",
        }}
      />

      {/* Large decorative quote mark */}
      <div
        className="absolute top-8 left-1/2 -translate-x-1/2 pointer-events-none select-none"
        style={{
          fontFamily: "Georgia, serif",
          fontSize: "clamp(15rem, 30vw, 30rem)",
          color: "rgba(225,0,0,0.04)",
          lineHeight: 0.7,
          fontWeight: 900,
        }}
      >
        "
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 lg:px-12 text-center">
        <div
          ref={revealRef as React.RefObject<HTMLDivElement>}
          className="scroll-reveal"
        >
          {/* Label */}
          <div className="inline-flex items-center gap-3 mb-10">
            <span
              className="h-px w-12"
              style={{
                background: "var(--red-bright)",
                boxShadow: "0 0 8px rgba(225,0,0,0.5)",
              }}
            />
            <span
              className="font-display text-xs font-semibold tracking-widest uppercase"
              style={{ color: "var(--red-bright)" }}
            >
              My Vision
            </span>
            <span
              className="h-px w-12"
              style={{
                background: "var(--red-bright)",
                boxShadow: "0 0 8px rgba(225,0,0,0.5)",
              }}
            />
          </div>

          {/* Vision quote */}
          <h2
            className="font-bebas leading-tight mb-8"
            style={{
              fontSize: "clamp(2rem, 5.5vw, 5rem)",
              color: "#fff",
              letterSpacing: "0.04em",
              textShadow:
                "0 0 30px rgba(225,0,0,0.25), 0 0 80px rgba(225,0,0,0.08)",
            }}
          >
            This is just the beginning.
            <br />
            <span
              style={{
                color: "var(--red-bright)",
                textShadow:
                  "0 0 20px rgba(225,0,0,0.9), 0 0 60px rgba(225,0,0,0.45), 0 0 120px rgba(225,0,0,0.18), 0 0 200px rgba(225,0,0,0.06)",
              }}
            >
              The goal is to build something legendary.
            </span>
          </h2>

          {/* Sub-text */}
          <p
            className="font-display font-light mx-auto"
            style={{
              fontSize: "clamp(0.95rem, 1.8vw, 1.2rem)",
              color: "rgba(255,255,255,0.5)",
              letterSpacing: "0.05em",
              maxWidth: "500px",
            }}
          >
            Building a legacy of impact, one bold move at a time.
          </p>
        </div>
      </div>
    </section>
  );
}

// ── Visitor Counter Section ───────────────────────────────────────────────────
function VisitorCounterSection() {
  const { data: visitorCount, isLoading } = useGetVisitorCount();
  const [displayCount, setDisplayCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const revealRef = useScrollReveal(0.2);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (
          entry.isIntersecting &&
          !hasAnimated &&
          !isLoading &&
          visitorCount !== undefined
        ) {
          setHasAnimated(true);
          const target = Number(visitorCount);
          const duration = 1500;
          const startTime = performance.now();

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic
            const eased = 1 - (1 - progress) ** 3;
            setDisplayCount(Math.floor(eased * target));
            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setDisplayCount(target);
            }
          };

          requestAnimationFrame(animate);
          observer.unobserve(section);
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [isLoading, visitorCount, hasAnimated]);

  const formatNumber = (n: number) => n.toLocaleString("en-US");

  return (
    <section
      id="visitors"
      ref={sectionRef}
      data-ocid="visitors.section"
      className="relative py-24 md:py-36 overflow-hidden"
      style={{ background: "#000" }}
    >
      {/* Top divider line */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(225,0,0,0.4), transparent)",
        }}
      />
      {/* Bottom divider line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(225,0,0,0.4), transparent)",
        }}
      />

      {/* Ambient glow behind counter */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: 700,
          height: 400,
          background:
            "radial-gradient(circle, rgba(225,0,0,0.15) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Outer dark vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.7) 100%)",
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-12 text-center">
        <div
          ref={revealRef as React.RefObject<HTMLDivElement>}
          className="scroll-reveal"
        >
          {/* Section label */}
          <div className="inline-flex items-center gap-3 mb-10">
            <span
              className="h-px w-12"
              style={{
                background: "var(--red-bright)",
                boxShadow: "0 0 8px rgba(225,0,0,0.5)",
              }}
            />
            <span
              className="font-display text-xs font-semibold tracking-widest uppercase"
              style={{ color: "var(--red-bright)" }}
            >
              Global Reach
            </span>
            <span
              className="h-px w-12"
              style={{
                background: "var(--red-bright)",
                boxShadow: "0 0 8px rgba(225,0,0,0.5)",
              }}
            />
          </div>

          {/* Counter number */}
          <div className="relative inline-block">
            {/* Pulsing glow behind number */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle, rgba(225,0,0,0.2) 0%, transparent 70%)",
                filter: "blur(30px)",
                animation: "profile-glow-pulse 3s ease-in-out infinite",
              }}
            />
            <div
              data-ocid="visitors.counter"
              className="font-bebas relative"
              style={{
                fontSize: "clamp(5rem, 15vw, 10rem)",
                lineHeight: 0.9,
                color: "var(--red-bright)",
                textShadow:
                  "0 0 30px rgba(225,0,0,0.9), 0 0 80px rgba(225,0,0,0.5), 0 0 160px rgba(225,0,0,0.18)",
                letterSpacing: "0.02em",
              }}
            >
              {isLoading ? "---" : formatNumber(displayCount)}
            </div>
          </div>

          {/* TOTAL VISITORS label */}
          <p
            className="font-bebas tracking-widest mt-4"
            style={{
              fontSize: "clamp(1rem, 2.5vw, 1.6rem)",
              color: "rgba(255,255,255,0.75)",
              letterSpacing: "0.2em",
            }}
          >
            TOTAL VISITORS
          </p>

          {/* Subline */}
          <p
            className="font-body mt-3 mx-auto"
            style={{
              fontSize: "clamp(0.85rem, 1.4vw, 1rem)",
              color: "rgba(255,255,255,0.38)",
              letterSpacing: "0.05em",
              maxWidth: "320px",
            }}
          >
            People who have discovered this site
          </p>

          {/* Decorative bottom line */}
          <div
            className="mt-10 mx-auto h-px"
            style={{
              maxWidth: "200px",
              background:
                "linear-gradient(90deg, transparent, rgba(225,0,0,0.6), transparent)",
              boxShadow: "0 0 8px rgba(225,0,0,0.3)",
            }}
          />
        </div>
      </div>
    </section>
  );
}

// ── Achievements Section ──────────────────────────────────────────────────────
interface AchievementStat {
  target: number;
  suffix: string;
  label: string;
  sublabel: string;
}

const achievementStats: AchievementStat[] = [
  {
    target: 10000,
    suffix: "+",
    label: "Website Visitors",
    sublabel: "People who discovered this world",
  },
  {
    target: 150,
    suffix: "+",
    label: "Creative Projects",
    sublabel: "Ideas turned into reality",
  },
  {
    target: 0,
    suffix: "",
    label: "Growing Digital Presence",
    sublabel: "Expanding every single day",
  },
];

function useCountUp(target: number, duration = 2000, enabled = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!enabled || target === 0) return;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(animate);
      else setCount(target);
    };

    requestAnimationFrame(animate);
  }, [target, duration, enabled]);

  return count;
}

function AchievementCard({
  stat,
  index,
  animate,
}: {
  stat: AchievementStat;
  index: number;
  animate: boolean;
}) {
  const count = useCountUp(stat.target, 2000 + index * 200, animate);
  const isGrowth = stat.target === 0;

  const displayValue = isGrowth ? "∞" : count.toLocaleString("en-US");

  return (
    <div
      data-ocid={`achievements.item.${index + 1}`}
      className="relative flex flex-col items-center justify-center text-center p-8 md:p-10 group"
      style={{
        background: "rgba(8,8,8,0.97)",
        border: "1px solid rgba(225,0,0,0.18)",
        boxShadow:
          "0 0 30px rgba(225,0,0,0.06), inset 0 0 40px rgba(225,0,0,0.02)",
        borderRadius: 4,
        transition: "border-color 0.3s, box-shadow 0.3s, transform 0.3s",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "rgba(225,0,0,0.65)";
        el.style.boxShadow =
          "0 0 50px rgba(225,0,0,0.35), 0 0 100px rgba(225,0,0,0.12), inset 0 0 60px rgba(225,0,0,0.05)";
        el.style.transform = "translateY(-5px)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.borderColor = "rgba(225,0,0,0.18)";
        el.style.boxShadow =
          "0 0 30px rgba(225,0,0,0.06), inset 0 0 40px rgba(225,0,0,0.02)";
        el.style.transform = "translateY(0)";
      }}
    >
      {/* Corner accents */}
      <div
        className="absolute top-0 left-0 w-8 h-8 pointer-events-none"
        style={{
          borderTop: "2px solid rgba(225,0,0,0.5)",
          borderLeft: "2px solid rgba(225,0,0,0.5)",
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-8 h-8 pointer-events-none"
        style={{
          borderBottom: "2px solid rgba(225,0,0,0.5)",
          borderRight: "2px solid rgba(225,0,0,0.5)",
        }}
      />

      {/* Ambient glow blob */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(225,0,0,0.08) 0%, transparent 70%)",
          filter: "blur(20px)",
          animation: "profile-glow-pulse 3s ease-in-out infinite",
          animationDelay: `${index * 0.7}s`,
        }}
      />

      {/* Stat number */}
      <div className="relative">
        <div
          className="font-bebas leading-none"
          style={{
            fontSize: isGrowth
              ? "clamp(3rem, 9vw, 7rem)"
              : "clamp(3.5rem, 10vw, 8rem)",
            color: "var(--red-bright)",
            textShadow:
              "0 0 30px rgba(225,0,0,0.9), 0 0 80px rgba(225,0,0,0.5), 0 0 160px rgba(225,0,0,0.18)",
            letterSpacing: "0.02em",
          }}
        >
          {displayValue}
          {!isGrowth && (
            <span
              style={{
                fontSize: "0.55em",
                verticalAlign: "super",
                color: "var(--red-bright)",
              }}
            >
              {stat.suffix}
            </span>
          )}
        </div>
      </div>

      {/* Label */}
      <p
        className="font-bebas tracking-widest mt-3"
        style={{
          fontSize: "clamp(0.95rem, 2vw, 1.4rem)",
          color: "rgba(255,255,255,0.9)",
          letterSpacing: "0.12em",
        }}
      >
        {stat.label}
      </p>

      {/* Sublabel */}
      <p
        className="font-body text-xs mt-2"
        style={{
          color: "rgba(255,255,255,0.35)",
          letterSpacing: "0.08em",
          maxWidth: 200,
        }}
      >
        {stat.sublabel}
      </p>

      {/* Bottom accent line */}
      <div
        className="mt-5 h-px w-12 group-hover:w-24 transition-all duration-500"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(225,0,0,0.7), transparent)",
          boxShadow: "0 0 6px rgba(225,0,0,0.3)",
        }}
      />
    </div>
  );
}

function AchievementsSection() {
  const headerRef = useScrollReveal(0.15);
  const sectionRef = useRef<HTMLElement>(null);
  const [animateStats, setAnimateStats] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimateStats(true);
          observer.unobserve(section);
        }
      },
      { threshold: 0.2 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="achievements"
      ref={sectionRef}
      data-ocid="achievements.section"
      className="relative py-24 md:py-36 overflow-hidden"
      style={{ background: "#000" }}
    >
      {/* Top divider */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(225,0,0,0.45), transparent)",
        }}
      />
      {/* Bottom divider */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(225,0,0,0.45), transparent)",
        }}
      />

      {/* Atmospheric red radial behind stats */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: 900,
          height: 500,
          background:
            "radial-gradient(ellipse, rgba(225,0,0,0.12) 0%, transparent 70%)",
          filter: "blur(50px)",
        }}
      />
      {/* Outer dark vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.75) 100%)",
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div
          ref={headerRef as React.RefObject<HTMLDivElement>}
          className="scroll-reveal text-center mb-16"
        >
          <div className="inline-flex items-center gap-3 mb-6">
            <span
              className="h-px w-12"
              style={{
                background: "var(--red-bright)",
                boxShadow: "0 0 8px rgba(225,0,0,0.5)",
              }}
            />
            <span
              className="font-display text-xs font-semibold tracking-widest uppercase"
              style={{ color: "var(--red-bright)" }}
            >
              Milestones
            </span>
            <span
              className="h-px w-12"
              style={{
                background: "var(--red-bright)",
                boxShadow: "0 0 8px rgba(225,0,0,0.5)",
              }}
            />
          </div>
          <h2 className="font-bebas text-5xl md:text-6xl lg:text-7xl tracking-wider text-white red-underline-center">
            ACHIEVEMENTS
          </h2>
          <p
            className="mt-6 font-body max-w-md mx-auto"
            style={{ color: "rgba(255,255,255,0.45)", fontSize: "1rem" }}
          >
            Numbers that mark the journey — every one of them earned.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {achievementStats.map((stat, i) => (
            <AchievementCard
              key={stat.label}
              stat={stat}
              index={i}
              animate={animateStats}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Visitor Map Section ───────────────────────────────────────────────────────
function VisitorMapSection() {
  const revealRef = useScrollReveal(0.1);
  const [hoveredCity, setHoveredCity] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const svgRef = useRef<SVGSVGElement>(null);

  const handleCityMouseEnter = (
    city: CityMarker,
    e: React.MouseEvent<SVGCircleElement>,
  ) => {
    setHoveredCity(city.name);
    const rect = (
      e.currentTarget.closest("svg") as SVGSVGElement
    ).getBoundingClientRect();
    const svgPt = latLngToSvg(city.lat, city.lng);
    // Convert SVG coords to screen coords
    const scaleX = rect.width / 1000;
    const scaleY = rect.height / 500;
    setTooltipPos({
      x: rect.left + svgPt.x * scaleX,
      y: rect.top + svgPt.y * scaleY,
    });
  };

  const handleCityMouseLeave = () => {
    setHoveredCity(null);
  };

  return (
    <section
      id="visitor-map"
      data-ocid="visitor-map.section"
      className="relative py-24 md:py-36 overflow-hidden"
      style={{ background: "#000" }}
    >
      {/* CSS for map-ping animation */}
      <style>{`
        @keyframes map-ping {
          0% { r: 3; opacity: 0.9; }
          100% { r: 14; opacity: 0; }
        }
        @keyframes map-ping-inner {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        .map-city-ring {
          animation: map-ping 2.2s ease-out infinite;
        }
        .map-city-dot {
          animation: map-ping-inner 2.2s ease-in-out infinite;
        }
      `}</style>

      {/* Top divider */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(225,0,0,0.45), transparent)",
        }}
      />
      {/* Bottom divider */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(225,0,0,0.45), transparent)",
        }}
      />

      {/* Atmospheric red radial glow behind map */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          width: 900,
          height: 600,
          background:
            "radial-gradient(ellipse, rgba(225,0,0,0.1) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      {/* Outer dark vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.75) 100%)",
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 lg:px-12">
        {/* Header */}
        <div
          ref={revealRef as React.RefObject<HTMLDivElement>}
          className="scroll-reveal text-center mb-14"
        >
          <div className="inline-flex items-center gap-3 mb-6">
            <span
              className="h-px w-12"
              style={{
                background: "var(--red-bright)",
                boxShadow: "0 0 8px rgba(225,0,0,0.5)",
              }}
            />
            <span
              className="font-display text-xs font-semibold tracking-widest uppercase"
              style={{ color: "var(--red-bright)" }}
            >
              Global Visitors
            </span>
            <span
              className="h-px w-12"
              style={{
                background: "var(--red-bright)",
                boxShadow: "0 0 8px rgba(225,0,0,0.5)",
              }}
            />
          </div>
          <h2 className="font-bebas text-5xl md:text-6xl lg:text-7xl tracking-wider text-white red-underline-center">
            WHERE YOU'RE FROM
          </h2>
          <p
            className="mt-6 font-body mx-auto"
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: "1rem",
              maxWidth: "420px",
            }}
          >
            People discovering this world from every corner of the globe.
          </p>
        </div>

        {/* Map container */}
        <div
          className="relative w-full"
          style={{
            background: "rgba(8,8,8,0.97)",
            border: "1px solid rgba(225,0,0,0.15)",
            borderRadius: 4,
            boxShadow:
              "0 0 40px rgba(225,0,0,0.08), 0 0 100px rgba(225,0,0,0.03), inset 0 0 80px rgba(0,0,0,0.6)",
            overflow: "hidden",
          }}
        >
          {/* Corner accents */}
          <div
            className="absolute top-0 left-0 w-16 h-16 pointer-events-none z-10"
            style={{
              borderTop: "2px solid rgba(225,0,0,0.6)",
              borderLeft: "2px solid rgba(225,0,0,0.6)",
              boxShadow: "0 0 10px rgba(225,0,0,0.3)",
            }}
          />
          <div
            className="absolute top-0 right-0 w-16 h-16 pointer-events-none z-10"
            style={{
              borderTop: "2px solid rgba(225,0,0,0.6)",
              borderRight: "2px solid rgba(225,0,0,0.6)",
              boxShadow: "0 0 10px rgba(225,0,0,0.3)",
            }}
          />
          <div
            className="absolute bottom-0 left-0 w-16 h-16 pointer-events-none z-10"
            style={{
              borderBottom: "2px solid rgba(225,0,0,0.6)",
              borderLeft: "2px solid rgba(225,0,0,0.6)",
              boxShadow: "0 0 10px rgba(225,0,0,0.3)",
            }}
          />
          <div
            className="absolute bottom-0 right-0 w-16 h-16 pointer-events-none z-10"
            style={{
              borderBottom: "2px solid rgba(225,0,0,0.6)",
              borderRight: "2px solid rgba(225,0,0,0.6)",
              boxShadow: "0 0 10px rgba(225,0,0,0.3)",
            }}
          />

          {/* SVG World Map */}
          <svg
            ref={svgRef}
            role="img"
            aria-labelledby="visitor-map-title"
            viewBox="0 0 1000 500"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              width: "100%",
              height: "auto",
              display: "block",
            }}
          >
            <title id="visitor-map-title">
              World map showing visitor locations
            </title>
            {/* Map background */}
            <rect width="1000" height="500" fill="#060606" />

            {/* Subtle grid lines */}
            {[-60, -30, 0, 30, 60].map((lat) => {
              const y = ((90 - lat) / 180) * 500;
              return (
                <line
                  key={`lat-${lat}`}
                  x1="0"
                  y1={y}
                  x2="1000"
                  y2={y}
                  stroke="rgba(225,0,0,0.05)"
                  strokeWidth="0.5"
                />
              );
            })}
            {[-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150].map((lng) => {
              const x = ((lng + 180) / 360) * 1000;
              return (
                <line
                  key={`lng-${lng}`}
                  x1={x}
                  y1="0"
                  x2={x}
                  y2="500"
                  stroke="rgba(225,0,0,0.05)"
                  strokeWidth="0.5"
                />
              );
            })}

            {/* Land dot-matrix */}
            {LAND_DOTS.map((dot) => (
              <circle
                key={`land-${dot.cx.toFixed(1)}-${dot.cy.toFixed(1)}`}
                cx={dot.cx}
                cy={dot.cy}
                r="2.8"
                fill="rgba(100,20,20,0.55)"
              />
            ))}

            {/* Equator line */}
            <line
              x1="0"
              y1="250"
              x2="1000"
              y2="250"
              stroke="rgba(225,0,0,0.12)"
              strokeWidth="0.8"
              strokeDasharray="4 6"
            />

            {/* City visitor dots with pulsing rings */}
            {CITY_MARKERS.map((city, i) => {
              const { x, y } = latLngToSvg(city.lat, city.lng);
              const delay = `${(i * 0.18) % 2.2}s`;
              return (
                <g key={city.name}>
                  {/* Outer pulsing ring */}
                  <circle
                    cx={x}
                    cy={y}
                    r="3"
                    fill="none"
                    stroke="#e10000"
                    strokeWidth="1.5"
                    opacity="0.9"
                    className="map-city-ring"
                    style={{ animationDelay: delay }}
                  />
                  {/* Second ring for depth */}
                  <circle
                    cx={x}
                    cy={y}
                    r="3"
                    fill="none"
                    stroke="rgba(225,0,0,0.4)"
                    strokeWidth="1"
                    opacity="0.5"
                    className="map-city-ring"
                    style={{ animationDelay: `${(i * 0.18 + 0.6) % 2.2}s` }}
                  />
                  {/* Core dot — always visible, interactive */}
                  <circle
                    cx={x}
                    cy={y}
                    r="3.5"
                    fill="#e10000"
                    className="map-city-dot"
                    style={{
                      animationDelay: delay,
                      cursor: "pointer",
                      filter: "drop-shadow(0 0 4px rgba(225,0,0,0.9))",
                    }}
                    onMouseEnter={(e) => handleCityMouseEnter(city, e)}
                    onMouseLeave={handleCityMouseLeave}
                  >
                    <title>{city.name}</title>
                  </circle>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Tooltip */}
        {hoveredCity && (
          <div
            style={{
              position: "fixed",
              left: tooltipPos.x + 12,
              top: tooltipPos.y - 32,
              background: "rgba(10,0,0,0.95)",
              border: "1px solid rgba(225,0,0,0.5)",
              color: "#fff",
              padding: "4px 12px",
              borderRadius: 2,
              fontSize: "0.75rem",
              fontFamily: "var(--font-display)",
              letterSpacing: "0.08em",
              pointerEvents: "none",
              zIndex: 9999,
              boxShadow: "0 0 12px rgba(225,0,0,0.4)",
              whiteSpace: "nowrap",
            }}
          >
            <span style={{ color: "var(--red-bright)" }}>●</span> {hoveredCity}
          </div>
        )}

        {/* Stats bar */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
          {[
            { value: "26", label: "Countries" },
            { value: "6", label: "Continents" },
            { value: "∞", label: "Always Growing" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3 px-6 py-3"
              style={{
                background: "rgba(8,8,8,0.8)",
                border: "1px solid rgba(225,0,0,0.15)",
                borderRadius: 2,
              }}
            >
              <span
                className="font-bebas text-2xl"
                style={{
                  color: "var(--red-bright)",
                  textShadow: "0 0 12px rgba(225,0,0,0.6)",
                  lineHeight: 1,
                }}
              >
                {stat.value}
              </span>
              <span
                className="font-display text-xs font-semibold tracking-widest uppercase"
                style={{ color: "rgba(255,255,255,0.45)" }}
              >
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── WhatsApp SVG Icon ─────────────────────────────────────────────────────────
function WhatsAppIcon({ size = 22 }: { size?: number }) {
  return (
    <svg
      role="img"
      aria-label="WhatsApp"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>WhatsApp</title>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// ── Contact Section ───────────────────────────────────────────────────────────
function ContactSection() {
  const headerRef = useScrollReveal();
  const buttonsRef = useScrollReveal();

  const contactChannels = [
    {
      id: "whatsapp",
      label: "WhatsApp",
      sublabel: "Message directly",
      icon: <WhatsAppIcon size={32} />,
      href: "https://wa.me/917902152365",
    },
    {
      id: "instagram",
      label: "Instagram",
      sublabel: "Follow & DM",
      icon: <Instagram size={32} />,
      href: "https://instagram.com/rup.esh_thakur",
    },
    {
      id: "email",
      label: "Email",
      sublabel: "Send a message",
      icon: <Mail size={32} />,
      href: "mailto:rupeshthakur7179@gmail.com",
    },
  ];

  return (
    <section
      id="contact"
      data-ocid="contact.section"
      className="relative py-24 md:py-36"
      style={{ background: "#000" }}
    >
      {/* Top bleed vignette */}
      <div
        className="absolute top-0 left-0 right-0 h-24 pointer-events-none z-10"
        style={{
          background: "linear-gradient(to bottom, #000, transparent)",
        }}
      />
      {/* Red divider */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(225,0,0,0.4), transparent)",
        }}
      />

      {/* Ambient glow — centered */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(225,0,0,0.07) 0%, transparent 70%)",
        }}
      />

      <div className="max-w-3xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div
          ref={headerRef as React.RefObject<HTMLDivElement>}
          className="scroll-reveal text-center mb-14"
        >
          <h2 className="font-bebas text-5xl md:text-6xl lg:text-7xl tracking-wider text-white red-underline-center">
            LET'S CONNECT
          </h2>
          <p
            className="mt-8 font-body max-w-md mx-auto"
            style={{ color: "rgba(255,255,255,0.5)", fontSize: "1rem" }}
          >
            Reach out directly — choose your preferred channel below.
          </p>
        </div>

        {/* Contact buttons */}
        <div
          ref={buttonsRef as React.RefObject<HTMLDivElement>}
          className="scroll-reveal flex flex-col sm:flex-row gap-6 justify-center items-stretch"
        >
          {contactChannels.map((ch) => (
            <a
              key={ch.id}
              href={ch.href}
              target="_blank"
              rel="noopener noreferrer"
              data-ocid={`contact.${ch.id}.button`}
              className="group flex-1 flex flex-col items-center justify-center gap-4 py-12 px-8 transition-all duration-300 cursor-pointer"
              style={{
                background: "rgba(8,8,8,0.97)",
                border: "1px solid rgba(225,0,0,0.18)",
                borderRadius: 2,
                boxShadow:
                  "0 0 24px rgba(225,0,0,0.04), inset 0 0 40px rgba(225,0,0,0.02)",
                textDecoration: "none",
                minHeight: 220,
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.border = "1px solid rgba(225,0,0,0.75)";
                el.style.boxShadow =
                  "0 0 40px rgba(225,0,0,0.45), 0 0 90px rgba(225,0,0,0.18), inset 0 0 60px rgba(225,0,0,0.06)";
                el.style.transform = "translateY(-6px)";
                const iconWrap = el.querySelector(
                  ".contact-icon-wrap",
                ) as HTMLElement;
                if (iconWrap) {
                  iconWrap.style.background = "rgba(225,0,0,0.18)";
                  iconWrap.style.borderColor = "rgba(225,0,0,0.7)";
                  iconWrap.style.boxShadow = "0 0 24px rgba(225,0,0,0.5)";
                }
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.border = "1px solid rgba(225,0,0,0.18)";
                el.style.boxShadow =
                  "0 0 24px rgba(225,0,0,0.04), inset 0 0 40px rgba(225,0,0,0.02)";
                el.style.transform = "translateY(0)";
                const iconWrap = el.querySelector(
                  ".contact-icon-wrap",
                ) as HTMLElement;
                if (iconWrap) {
                  iconWrap.style.background = "rgba(225,0,0,0.08)";
                  iconWrap.style.borderColor = "rgba(225,0,0,0.2)";
                  iconWrap.style.boxShadow = "none";
                }
              }}
            >
              {/* Icon circle */}
              <div
                className="contact-icon-wrap flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300"
                style={{
                  background: "rgba(225,0,0,0.08)",
                  border: "1px solid rgba(225,0,0,0.2)",
                  color: "var(--red-bright)",
                  boxShadow: "none",
                }}
              >
                {ch.icon}
              </div>

              {/* Label */}
              <div className="text-center">
                <p
                  className="font-bebas text-3xl tracking-widest"
                  style={{
                    color: "#fff",
                    textShadow: "0 0 20px rgba(225,0,0,0.0)",
                    transition: "text-shadow 0.3s",
                  }}
                >
                  {ch.label}
                </p>
                <p
                  className="font-body text-xs tracking-widest uppercase mt-1"
                  style={{
                    color: "rgba(255,255,255,0.35)",
                    letterSpacing: "0.15em",
                  }}
                >
                  {ch.sublabel}
                </p>
              </div>

              {/* Bottom red accent line */}
              <div
                className="w-10 transition-all duration-300 group-hover:w-20"
                style={{
                  height: 2,
                  background:
                    "linear-gradient(90deg, transparent, rgba(225,0,0,0.7), transparent)",
                  borderRadius: 9999,
                }}
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative py-12 px-6" style={{ background: "#000" }}>
      {/* Red top divider */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(225,0,0,0.6), transparent)",
          boxShadow: "0 0 8px rgba(225,0,0,0.3)",
        }}
      />

      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div
            className="font-bebas text-xl tracking-widest"
            style={{
              color: "var(--red-bright)",
              textShadow: "0 0 16px rgba(225,0,0,0.4)",
            }}
          >
            RUPESH THAKUR
          </div>

          {/* Social icons */}
          <div className="flex items-center gap-5">
            {[
              { icon: Github, label: "GitHub" },
              { icon: Linkedin, label: "LinkedIn" },
              { icon: Twitter, label: "Twitter" },
              { icon: Instagram, label: "Instagram" },
            ].map(({ icon: Icon, label }) => (
              <a
                key={label}
                href="https://rupeshthakur.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="transition-all duration-300 hover:scale-110"
                style={{
                  color: "rgba(255,255,255,0.4)",
                  padding: "6px",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.color = "var(--red-bright)";
                  el.style.textShadow = "0 0 12px rgba(225,0,0,0.5)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.color = "rgba(255,255,255,0.4)";
                  el.style.textShadow = "none";
                }}
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>

        {/* Bottom row */}
        <div
          className="mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p
            className="font-body text-xs tracking-wide"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            © {year} Rupesh Thakur. All rights reserved.
          </p>
          <p
            className="font-body text-xs"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            Built with <span style={{ color: "var(--red-bright)" }}>♥</span>{" "}
            using{" "}
            <a
              href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors duration-200 hover:underline"
              style={{ color: "rgba(255,255,255,0.35)" }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color =
                  "var(--red-bright)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color =
                  "rgba(255,255,255,0.35)";
              }}
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

// ── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <div className="min-h-screen" style={{ background: "#000", color: "#fff" }}>
      <SmokeCanvas />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#111",
            color: "#fff",
            border: "1px solid rgba(225,0,0,0.3)",
          },
        }}
      />
      <Navigation />
      <main style={{ position: "relative", zIndex: 1 }}>
        <HeroSection />
        <IntroSection />
        <AboutSection />
        <SkillsSection />
        <VisionSection />
        <AchievementsSection />
        <VisitorMapSection />
        <VisitorCounterSection />
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}
