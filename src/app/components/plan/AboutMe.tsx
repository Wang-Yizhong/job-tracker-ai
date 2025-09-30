"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import {
  Mail,
  FileText,
  Github,
  Linkedin,
  MapPin,
  CheckCircle2,
  Rocket,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const profile = {
  name: "Wang Yizhong",
  title: "Fullstack Developer",
  location: "Eislingen / Region Stuttgart",
  summary:
    "Creator first — Code as a tool. Ich baue pragmatisch nutzerzentrierte Web-Apps mit React/Node, mehrsprachiger UX und sauberen API-Schnitten.",
  email: "wangyizhong-jennifer@outlook.com",
  cvUrl: "/Lebenslauf_Wang_Yizhong_Fullstack-Entwickler.pdf",
  github: "https://github.com/Wang-Yizhong/job-tracker-ai",
  linkedin: "https://www.linkedin.com/in/jennifer-wang-55b484364/",
};

const highlights = [
  "Internationale Webprojekte (Vue/React/Node) mit Mehrsprachigkeit & Zeitzonen-Logik",
  "Agile Zusammenarbeit (Daily/Ownership), saubere APIs, messbare Ergebnisse",
  "Qualität: Testing (Jest), CI (GitLab), stabile Deployments",
  "Fokus auf Produktwert & Delivery: schlanke Lösungen, klare Kommunikation",
];

/** ▶️ Banner-Liste */
const projectBanners = [
  {
    src: "/img/projects/job-tracker1.png",
    alt: "Job Tracker – Chat/Q&A",
    title: "Job Tracker",
    caption:
      "Matching, AI-Fragen & CV-Empfehlungen. Next.js + Supabase + OpenAI.",
  },
  {
    src: "/img/projects/job-tracker2.png",
    alt: "Job Tracker – Analyse",
    title: "Job Tracker (Analyse)",
    caption: "Skill-Matrix & Vorschläge, schlanke UX.",
  },
  {
    src: "/img/projects/tele-medizin1.png",
    alt: "Telemedizin – Dashboard",
    title: "Telemedizin (USA)",
    caption:
      "US-Telemedizin-Projekt: Klinik-Dashboard, Statistik & Patientenkommunikation.",
  },
  {
    src: "/img/projects/tele-medizin2.png",
    alt: "Telemedizin – Kalender",
    title: "Telemedizin – Terminplanung",
    caption: "Ressourcenplanung & Workflows, sichere Datenflüsse.",
  },
  {
    src: "/img/projects/web-app1.png",
    alt: "Patienten Web-App – Start",
    title: "Patienten Web-App",
    caption:
      "Patientenseitige App: Vitalwerte, Ziele, Erinnerungen.",
  },
  {
    src: "/img/projects/web-app2.jpg",
    alt: "Patienten Web-App – Ergebnisse",
    title: "Patienten Web-App – Ergebnisse",
    caption: "Ergebnisansicht & Verlauf – strukturierte Messwerte.",
  },
];

const skills = [
  "HTML",
  "CSS",
  "Sass",
  "JavaScript (ES6+)",
  "TypeScript",
  "React",
  "Next.js",
  "Vue.js",
  "Nuxt.js",
  "Tailwind CSS",
  "Angular",
  "Node.js",
  "Express",
  "Nest.js",
  "REST API",
  "MongoDB",
  "PostgreSQL",
  "Jest",
  "CI/CD",
  "Git",
  "Jira",
  "Vercel",
  "Deutsch (B2+)",
  "Englisch (C1)",
  "Chinesisch (Muttersprache)",
];

const Chip: React.FC<React.PropsWithChildren> = ({ children }) => (
  <span className="inline-flex items-center rounded-full border border-[#E5E7EB] bg-white px-3 py-1 text-sm leading-tight text-[#111827] print:bg-transparent">
    {children}
  </span>
);

const Card: React.FC<React.PropsWithChildren> = ({ children }) => (
  <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-sm transition-shadow hover:shadow-md print:shadow-none print:bg-transparent">
    {children}
  </div>
);

/** ▶️ Banner mit Auto-Slide */
function ProjectCarousel() {
  const [idx, setIdx] = useState(0);
  const total = projectBanners.length;

  const next = useCallback(() => setIdx((i) => (i + 1) % total), [total]);
  const prev = useCallback(() => setIdx((i) => (i - 1 + total) % total), [total]);

  // Auto-Slide alle 5 Sekunden
  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const item = projectBanners[idx];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white">
      <div className="relative flex h-[320px] w-full items-center justify-center bg-gray-100 md:h-[400px]">
        <Image
          src={item.src}
          alt={item.alt}
          fill
          priority
          className="object-contain p-4"
          sizes="(max-width: 768px) 100vw, 800px"
        />
        <div className="absolute bottom-3 right-3 max-w-[75%] rounded-lg bg-white/80 px-3 py-2 shadow-sm ring-1 ring-[#E5E7EB]">
          <div className="text-xs font-semibold text-[#111827]">{item.title}</div>
          <div className="mt-0.5 text-[11px] leading-snug text-[#374151]">
            {item.caption}
          </div>
        </div>
      </div>

      {/* Pfeile */}
      <button
        aria-label="Vorheriges Bild"
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow ring-1 ring-[#E5E7EB] hover:bg-white"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        aria-label="Nächstes Bild"
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow ring-1 ring-[#E5E7EB] hover:bg-white"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Punkte */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
        {projectBanners.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`h-2 w-2 rounded-full ring-1 ring-[#E5E7EB] ${i === idx ? "bg-[#4F46E5]" : "bg-white/80"}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function AboutPage() {
  const [showChanceInfo, setShowChanceInfo] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#111827]">
      <main id="about-print" className="mx-auto max-w-3xl px-6 py-10 print:py-0">
        {/* Hero */}
        <section className="mb-12 text-center">
        <div className="mx-auto mb-5 h-20 w-20 overflow-hidden rounded-2xl ring-1 ring-[#E5E7EB] bg-white">
  <Image
    src="/img/projects/me.jpg"
    alt="Wang Yizhong"
    width={120}
    height={120}
    className="h-full w-full object-cover"
    priority
  />
</div>
          <h1 className="text-4xl font-extrabold tracking-tight">{profile.name}</h1>
          <p className="mt-1 text-lg text-[#6B7280]">{profile.title}</p>

          <div className="mt-3 flex flex-wrap justify-center gap-3 text-sm text-[#6B7280]">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {profile.location}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#FEF3C7] px-2.5 py-1 text-[#92400E]">
              🌐 Deutsch B2+ · Englisch C1 · Chinesisch
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#E0E7FF] px-2.5 py-1 text-[#3730A3]">
              Offen für Arbeit / Umzugsbereitschaft
            </span>
            <div
              className="relative inline-flex items-center gap-1 rounded-full bg-[#D1FAE5] px-2.5 py-1 text-[#065F46]"
              onMouseEnter={() => setShowChanceInfo(true)}
              onMouseLeave={() => setShowChanceInfo(false)}
            >
              <CheckCircle2 className="h-4 w-4" />
              Chancenkarte
              {showChanceInfo && (
                <div className="absolute left-1/2 top-full z-10 mt-2 w-[260px] -translate-x-1/2 rounded-xl border border-[#E5E7EB] bg-white p-3 text-left text-[12px] leading-relaxed text-[#065F46] shadow-lg">
                  <div className="mb-1 font-semibold text-[#065F46]">
                    Chancenkarte – Kurzinfo
                  </div>
                  <ul className="list-disc pl-4 text-[#065F46]/90">
                    <li>Teilzeit bis 20 Std./Woche sofort möglich</li>
                    <li>Vollzeit mit Arbeitsvertrag möglich</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-[#374151]">
            {profile.summary}
          </p>

          <div className="print:hidden mt-6 flex flex-wrap justify-center gap-3">
            <a
              href={`mailto:${profile.email}`}
              className="inline-flex items-center gap-2 rounded-xl bg-[#4F46E5] px-4 py-2 text-white shadow-sm hover:shadow"
            >
              <Mail className="h-4 w-4" /> Kontakt
            </a>
            <a
              href={profile.cvUrl}
              target="_blank"
              className="inline-flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-4 py-2 text-[#111827] shadow-sm hover:shadow"
            >
              <FileText className="h-4 w-4" /> Lebenslauf herunterladen
            </a>
          </div>
        </section>

        {/* Skills */}
        <section id="skills" className="mb-12">
          <h2 className="mb-4 border-l-4 border-[#4F46E5] pl-3 text-lg font-semibold">
            Skills
          </h2>
          <div className="flex flex-wrap gap-2 print:gap-1">
            {skills.map((s) => (
              <Chip key={s}>{s}</Chip>
            ))}
          </div>
        </section>

        {/* Kurzprofil */}
        <section className="mb-12">
          <h2 className="mb-4 border-l-4 border-[#4F46E5] pl-3 text-lg font-semibold">
            Kurzprofil
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {highlights.map((t, i) => (
              <Card key={i}>
                <div className="flex items-start gap-3">
                  <Rocket className="mt-0.5 h-5 w-5 text-[#4F46E5]" />
                  <p className="text-[15px] leading-relaxed text-[#1F2937]">
                    {t}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Projekte */}
        <section id="projects" className="mb-12">
          <h2 className="mb-4 border-l-4 border-[#4F46E5] pl-3 text-lg font-semibold">
            Projekte
          </h2>
          <ProjectCarousel />
        </section>

        {/* Kontakt */}
        <section id="contact" className="mb-16">
          <h2 className="mb-4 border-l-4 border-[#4F46E5] pl-3 text-lg font-semibold">
            Kontakt
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-[#4F46E5]" />
                <a
                  href={`mailto:${profile.email}`}
                  className="text-[15px] font-medium text-[#111827] underline"
                >
                  {profile.email}
                </a>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <Linkedin className="h-5 w-5 text-[#4F46E5]" />
                <a
                  href={profile.linkedin}
                  target="_blank"
                  className="text-[15px] font-medium text-[#111827] underline"
                >
                  LinkedIn
                </a>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <Github className="h-5 w-5 text-[#4F46E5]" />
                <a
                  href={profile.github}
                  target="_blank"
                  className="text-[15px] font-medium text-[#111827] underline"
                >
                  GitHub
                </a>
              </div>
            </Card>
          </div>
        </section>

        <footer className="print:hidden pb-16 text-center text-sm text-[#9CA3AF]">
          © {new Date().getFullYear()} Wang Yizhong · Built with Next.js & Tailwind
        </footer>
      </main>
    </div>
  );
}
