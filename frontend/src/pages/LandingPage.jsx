import React, { useState, useEffect, useRef } from "react";
import {
  Shield,
  AlertTriangle,
  Users,
  Building2,
  Radio,
  Heart,
  Lock,
  Menu,
  X,
  ChevronRight,
  CheckCircle,
  Database,
  MapPin,
  TrendingUp,
  Bell,
  BarChart3,
} from "lucide-react";
import { Link } from "react-router-dom";
import IndraLogoImg from "../assets/indra-logo-png.png";

function IndraLogo({ className = "w-6 h-6", rounded = "rounded-lg" }) {
  return (
    <img
      src={IndraLogoImg}
      alt="INDRA Logo"
      className={`${className} ${rounded} object-contain`}
    />
  );
}

// Hook for intersection observer
function useInView() {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return [ref, isVisible];
}

export default function IndraLanding() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showPrototypeModal, setShowPrototypeModal] = useState(true);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  const handleViewDetails = () => {
    setShowPrototypeModal(false);
    // small timeout so the modal close animation (if any) feels natural
    setTimeout(() => scrollToSection("prototype-status"), 50);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Prototype phase popup */}
      {showPrototypeModal && (
        <div
          className="
    fixed inset-0 z-50
    grid place-items-center
    bg-black/40 backdrop-blur-sm
    px-3
    pt-18
    md:pt-0
    md:mt-18
  "
        >
          <div
            className="
        w-full max-w-lg
        max-h-[calc(100vh-72px)]
        md:max-h-[90vh]
        overflow-y-auto
        bg-white
        rounded-2xl
        shadow-2xl
        border border-gray-200
        p-4 sm:p-6
        relative
      "
          >
            <button
              onClick={() => setShowPrototypeModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              aria-label="Close prototype notice"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-3 mb-4">
              <div className="mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-yellow-100">
                <AlertTriangle className="w-5 h-5 text-yellow-700" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                  Prototype phase – what’s live vs coming soon
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-gray-600 leading-relaxed">
                  You are viewing the{" "}
                  <span className="font-semibold">hackathon prototype</span> of
                  INDRA. Some features are fully wired in real time; others
                  (like the AI risk engine and advanced DIGIPIN grids) are
                  designed but not yet enabled in this build.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 text-sm">
              <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                <p className="flex items-center gap-2 font-semibold text-green-800 mb-1">
                  <CheckCircle className="w-4 h-4" />
                  Live in this prototype
                </p>
                <ul className="list-disc list-inside text-green-900 space-y-1 text-xs sm:text-sm">
                  <li><strong>24 Incident Categories:</strong> Emergency, Infrastructure, Natural Disasters, Utilities</li>
                  <li><strong>Community Verification:</strong> Citizens verify nearby incidents to help authorities prioritize</li>
                  <li><strong>Grid-wise Location:</strong> GPS + State/City for precise mapping</li>
                  <li><strong>Nearby Incident Tracking:</strong> See & verify reports around you in real-time</li>
                  <li><strong>Operator Dashboard:</strong> Advanced filtering, triage & status tracking</li>
                </ul>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <p className="flex items-center gap-2 font-semibold text-blue-800 mb-1">
                  <Bell className="w-4 h-4" />
                  Roadmap (Next Phase)
                </p>
                <ul className="list-disc list-inside text-blue-900 space-y-1 text-xs sm:text-sm">
                  <li>AI Risk Prediction & Grid Heatmaps</li>
                  <li>Integration with Emergency Services (112)</li>
                  <li>Offline/SMS reporting for remote areas</li>
                  <li>Multi-language support (Hindi/Regional)</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 text-sm">
              <button
                onClick={() => setShowPrototypeModal(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-lg border border-gray-300 text-gray-800 hover:bg-gray-50"
              >
                Continue to prototype
              </button>
              <button
                onClick={handleViewDetails}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-blue-900 text-white hover:bg-blue-800 flex items-center justify-center gap-1"
              >
                View details
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav
        className={`bg-white sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? "shadow-xl" : "shadow-md"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 group cursor-pointer">
              <IndraLogo className="w-16 h-16" />

              <div>
                <span className="text-2xl font-bold text-gray-900">INDRA</span>
                <p className="text-xs text-gray-500 font-medium">
                  Disaster Management
                </p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-6 text-sm">
              {["problem", "solution", "how-it-works", "features"].map(
                (item) => (
                  <button
                    key={item}
                    onClick={() => scrollToSection(item)}
                    className="text-gray-700 hover:text-blue-900 font-medium transition-colors relative group"
                  >
                    {item
                      .split("-")
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(" ")}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-900 transition-all group-hover:w-full" />
                  </button>
                )
              )}
              <div className="flex gap-3">
                <Link to="/auth/citizen">
                  <button className="bg-white text-blue-900 px-5 py-2 font-bold border-2 border-blue-900 rounded-lg hover:bg-blue-50 transition-all hover:shadow-md">
                    Citizen
                  </button>
                </Link>
                <Link to="/auth/operator">
                  <button className="bg-blue-900 text-white px-5 py-2 font-bold rounded-lg hover:bg-blue-800 transition-all hover:shadow-lg">
                    Operator
                  </button>
                </Link>
              </div>
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-2">
              {["problem", "solution", "how-it-works", "features"].map(
                (item) => (
                  <button
                    key={item}
                    onClick={() => scrollToSection(item)}
                    className="block w-full text-left text-gray-700 py-2 px-4 hover:bg-gray-50 rounded transition-colors"
                  >
                    {item
                      .split("-")
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(" ")}
                  </button>
                )
              )}
              <div className="flex gap-2">
                <Link to="/auth/citizen" className="flex-1">
                  <button className="w-full bg-green-600 text-white px-4 py-2 font-medium rounded hover:bg-green-700 transition-colors">
                    Citizen
                  </button>
                </Link>
                <Link to="/auth/operator" className="flex-1">
                  <button className="w-full border-2 border-gray-300 text-gray-900 px-4 py-2 font-medium rounded hover:bg-gray-50 transition-colors">
                    Operator
                  </button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <HeroSection scrollToSection={scrollToSection} />

      {/* Problem Section */}
      <ProblemSection />

      {/* Solution Section */}
      <SolutionSection />

      {/* How It Works */}
      <HowItWorksSection />

      {/* Who Uses INDRA */}
      <StakeholdersSection />

      {/* Features */}
      <FeaturesSection />

      {/* Data Privacy */}
      <PrivacySection />

      {/* Current Scope */}
      <ScopeSection />

      {/* Prototype status & roadmap */}
      <PrototypeStatusSection />

      {/* CTA */}
      <CTASection scrollToSection={scrollToSection} />

      {/* Footer */}
      <footer className="bg-slate-50 text-gray-700 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 items-start">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 w-28 h-28  rounded-lg">
                  <IndraLogo className="w-full h-full" />{" "}
                </div>
                <div>
                  <div className="text-lg font-bold">INDRA</div>
                  <div className="text-sm text-gray-500">
                    Disaster Management Platform
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Real-time incident reporting and coordinated response for
                Himalayan regions.
              </p>
            </div>

            <div className="md:col-span-1">
              <h4 className="font-semibold mb-2">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/" className="hover:underline">
                    Home
                  </Link>
                </li>
                <li>
                  <a href="#features" className="hover:underline">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="hover:underline">
                    How It Works
                  </a>
                </li>
                <li>
                  <Link to="/auth/citizen" className="hover:underline">
                    Citizen Portal
                  </Link>
                </li>
              </ul>
            </div>

            <div className="md:col-span-1">
              <h4 className="font-semibold mb-2">Contact</h4>
              <p className="text-sm text-gray-600">
                support@indra.example (placeholder)
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Govt. of Uttarakhand & HP initiative
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-6 text-sm text-gray-500 flex flex-col md:flex-row md:justify-between gap-4">
            <div>© 2024 INDRA Platform. All rights reserved.</div>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:underline">
                Privacy
              </a>
              <a href="#" className="hover:underline">
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HeroSection({ scrollToSection }) {
  return (
    <section className="bg-linear-to-b from-blue-50 to-white py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center w-1/2 h-1/2 rounded-2xl mb-4 shadow">
            <IndraLogo className="w-full h-full" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-3 leading-tight">
            INDRA
          </h1>
          <p className="text-2xl text-gray-700 font-semibold mb-4">
            Intelligent National Disaster, Resource & Action Platform
          </p>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto">
            Real-time incident reporting, risk assessment, and coordinated
            response to keep Himalayan communities safer.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/auth/citizen">
              <button className="w-full sm:w-auto bg-linear-to-r from-green-500 to-green-600 text-white px-6 py-3 text-base font-semibold rounded-lg hover:shadow-md transition-transform">
                Report Incident
              </button>
            </Link>
            <Link to="/auth/operator">
              <button className="w-full sm:w-auto bg-linear-to-r from-blue-600 to-blue-700 text-white px-6 py-3 text-base font-semibold rounded-lg hover:shadow-md transition-transform">
                Command Center
              </button>
            </Link>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="w-full sm:w-auto bg-white border border-gray-200 text-gray-800 px-6 py-3 text-base font-semibold rounded-lg hover:shadow hover:bg-gray-50 transition-all"
            >
              Learn More
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function ProblemSection() {
  const [ref, isVisible] = useInView();

  return (
    <section id="problem" ref={ref} className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`max-w-3xl mx-auto text-center mb-12 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Disaster Management Challenges in Himalayan Regions
          </h2>
          <p className="text-lg text-gray-600">
            The Himalayan states face recurring disasters that strain response
            capacity and endanger lives.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-red-50 border-2 border-red-200 p-6 rounded-lg hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-600 rounded-full"></span>
              Critical Hazards
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li>• Landslides blocking critical infrastructure</li>
              <li>• Road and bridge damage isolating communities</li>
              <li>• Flash floods during monsoon season</li>
              <li>• Cold waves in high-altitude areas</li>
              <li>• Seismic activity and structural risks</li>
            </ul>
          </div>

          <div className="bg-gray-50 border-2 border-gray-200 p-6 rounded-lg hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-gray-600 rounded-full"></span>
              Systemic Challenges
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li>• Delayed incident reporting from remote areas</li>
              <li>• Fragmented data across departments and agencies</li>
              <li>• Reactive rather than preventive response models</li>
              <li>• Poor location accuracy in mountainous terrain</li>
              <li>• Duplication of relief efforts</li>
              <li>• Limited visibility into ground conditions</li>
            </ul>
          </div>
        </div>

        <div className="max-w-3xl mx-auto bg-yellow-50 border-2 border-yellow-300 p-6 rounded-lg">
          <p className="text-gray-800 font-medium">
            <strong>The Core Problem:</strong> Current systems operate in silos.
            Departments maintain separate databases, citizens have no
            standardized reporting mechanism, and authorities lack unified risk
            intelligence to prioritize resources effectively.
          </p>
        </div>
      </div>
    </section>
  );
}

function SolutionSection() {
  const [ref, isVisible] = useInView();

  const solutions = [
    {
      icon: Database,
      title: "Unified Data Layer",
      desc: "All incidents, risks, and actions aggregated in one system.",
    },
    {
      icon: MapPin,
      title: "Grid-Based Location",
      desc: "Precise identification without storing personal addresses.",
    },
    {
      icon: Users,
      title: "Human-in-the-Loop",
      desc: "All decisions remain under human authority.",
    },
    {
      icon: Lock,
      title: "Role-Based Access",
      desc: "Different views based on role and clearance level.",
    },
  ];

  return (
    <section id="solution" ref={ref} className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`max-w-3xl mx-auto text-center mb-12 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <CheckCircle className="w-12 h-12 text-blue-900 mx-auto mb-4" />
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            What is INDRA?
          </h2>
          <p className="text-lg text-gray-600">
            A decision-support platform that unifies disaster risk intelligence,
            incident reporting, and response coordination.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-8">
          {solutions.map((sol, i) => (
            <div
              key={i}
              className="bg-white border-2 border-gray-200 p-6 rounded-lg hover:border-blue-300 hover:shadow-lg transition-all group"
            >
              <sol.icon className="w-10 h-10 text-blue-900 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {sol.title}
              </h3>
              <p className="text-gray-700">{sol.desc}</p>
            </div>
          ))}
        </div>

        <div className="max-w-3xl mx-auto bg-blue-50 border-2 border-blue-300 p-6 rounded-lg">
          <p className="text-gray-800 text-center">
            <strong>Inspired by Digital Public Infrastructure:</strong> Built on
            principles similar to India's UPI and Aadhaar systems—open
            architecture, interoperability, and public purpose technology.
          </p>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const [ref, isVisible] = useInView();

  const steps = [
    {
      title: "Ground-Level Data Collection",
      desc: "Citizens report incidents across 24 categories (emergencies, infrastructure, natural disasters) with GPS location and photos.",
    },
    {
      title: "Community Verification",
      desc: "Nearby citizens verify reports through crowd-sourced voting, generating confidence scores to help prioritize genuine incidents.",
    },
    {
      title: "Smart Location Encoding",
      desc: "GPS coordinates and State/City data converted to privacy-preserving grid codes for precise geographic identification.",
    },
    {
      title: "Decision Command Center",
      desc: "Operators access unified dashboard with confidence filters, location data, and real-time status updates for intelligent triage.",
    },
    {
      title: "Coordinated Response",
      desc: "Authorities assign responders with real-time tracking, status updates, and resource management across all incident types.",
    },
  ];

  return (
    <section id="how-it-works" ref={ref} className="py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`max-w-3xl mx-auto text-center mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">
            How INDRA Works
          </h2>
          <p className="text-xl text-gray-600">
            From incident to coordinated response
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {steps.map((step, i) => (
            <div key={i} className="relative">
              {/* Timeline line */}
              {i < steps.length - 1 && (
                <div className="absolute left-6 top-20 w-1 h-16 bg-linear-to-b from-blue-500 to-transparent hidden md:block"></div>
              )}

              <div className="flex gap-6 items-start group hover:translate-x-2 transition-transform bg-white p-6 rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-xl">
                {/* Step number */}
                <div className="shrink-0 w-12 h-12 bg-linear-to-br from-blue-500 to-blue-700 text-white rounded-full flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform shadow-lg">
                  {i + 1}
                </div>

                {/* Content */}
                <div className="flex-1 pt-2">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-700 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StakeholdersSection() {
  const [ref, isVisible] = useInView();

  const stakeholders = [
    {
      icon: Users,
      title: "Citizens",
      color: "from-blue-500 to-cyan-500",
      items: [
        "Report incidents in real-time",
        "Receive safety alerts & guidance",
        "View community risk updates",
        "Access evacuation routes",
      ],
    },
    {
      icon: Building2,
      title: "Government",
      color: "from-purple-500 to-pink-500",
      items: [
        "Unified risk intelligence",
        "Nearby alerts for rapid response",
        "Incident tracking & analysis",
        "Decision-making dashboards",
      ],
    },
    {
      icon: Radio,
      title: "First Responders",
      color: "from-red-500 to-orange-500",
      items: [
        "Nearby incident alerts in real-time",
        "Access precise GPS locations",
        "Update incident status on-ground",
        "Coordinate across teams",
      ],
    },
    {
      icon: Heart,
      title: "NGOs & Communities",
      color: "from-green-500 to-emerald-500",
      items: [
        "Identify help areas",
        "Prevent aid duplication",
        "Collaborative response",
        "Real-time impact tracking",
      ],
    },
  ];

  return (
    <section ref={ref} className="py-20 bg-linear-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`max-w-3xl mx-auto text-center mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">
            Who Uses INDRA
          </h2>
          <p className="text-xl text-gray-600">
            Unified platform for disaster response stakeholders
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stakeholders.map((sh, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-2xl hover:scale-105 transition-all group relative overflow-hidden"
            >
              {/* Gradient accent */}
              <div
                className={`absolute top-0 right-0 w-24 h-24 bg-linear-to-br ${sh.color} rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-all`}
              ></div>

              {/* Icon */}
              <div
                className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-linear-to-br ${sh.color} text-white mb-4 shadow-lg`}
              >
                <sh.icon className="w-6 h-6" />
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {sh.title}
              </h3>
              <ul className="space-y-3 text-sm text-gray-700 relative z-10">
                {sh.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <span
                      className={`inline-block w-2 h-2 rounded-full bg-linear-to-br ${sh.color} mt-2 shrink-0`}
                    ></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  const [ref, isVisible] = useInView();

  const features = [
    {
      icon: TrendingUp,
      title: "Risk Intelligence",
      color: "from-red-500 to-orange-500",
      items: [
        "Grid-based risk assessment",
        "Multi-hazard coverage",
        "Trend pattern analysis",
        "Real-time data aggregation",
      ],
    },
    {
      icon: Radio,
      title: "Incident Reporting",
      color: "from-green-500 to-emerald-500",
      items: [
        "24 incident categories (Emergency, Infrastructure, Natural Disasters)",
        "GPS location + State/City selection",
        "Himalayan hazards (Landslides, Avalanches, Cloudbursts)",
        "Community verification & confidence scoring",
      ],
    },
    {
      icon: BarChart3,
      title: "Command Dashboard",
      color: "from-blue-500 to-indigo-500",
      items: [
        "Risk heatmaps & overlays",
        "Intelligent prioritization",
        "Resource allocation tools",
        "Real-time monitoring",
      ],
    },
    {
      icon: Bell,
      title: "Smart Alerts",
      color: "from-yellow-500 to-amber-500",
      items: [
        "Nearby incident alerts for authorities",
        "Zone-based notifications",
        "Role-specific messaging",
        "SMS + App delivery",
      ],
    },
    {
      icon: Lock,
      title: "Security & Privacy",
      color: "from-purple-500 to-pink-500",
      items: [
        "Grid-based location privacy",
        "End-to-end encryption",
        "Role-based access control",
        "Complete audit logging",
      ],
    },
    {
      icon: Database,
      title: "Data Integration",
      color: "from-teal-500 to-cyan-500",
      items: [
        "GIS data integration",
        "Weather APIs",
        "Seismic data feeds",
        "Open data standards",
      ],
    },
  ];

  return (
    <section id="features" ref={ref} className="py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`max-w-3xl mx-auto text-center mb-16 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">
            Powerful Features
          </h2>
          <p className="text-xl text-gray-600">
            Enterprise-grade capabilities for disaster management
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {features.map((feat, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-2xl hover:scale-105 transition-all group relative overflow-hidden"
            >
              {/* Gradient background */}
              <div
                className={`absolute top-0 right-0 w-32 h-32 bg-linear-to-br ${feat.color} rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-all`}
              ></div>

              {/* Icon */}
              <div
                className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-linear-to-br ${feat.color} text-white mb-4 group-hover:scale-110 transition-transform shadow-lg`}
              >
                <feat.icon className="w-7 h-7" />
              </div>

              {/* Content */}
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {feat.title}
              </h3>
              <ul className="space-y-3 text-gray-700">
                {feat.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PrivacySection() {
  const [ref, isVisible] = useInView();

  return (
    <section ref={ref} className="py-20 bg-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`max-w-3xl mx-auto text-center mb-12 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <Lock className="w-12 h-12 text-blue-900 mx-auto mb-4" />
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Data, Privacy & Governance
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {[
            {
              title: "Location Privacy",
              desc: "Grid codes enable precise allocation while protecting individual privacy.",
            },
            {
              title: "Role-Based Visibility",
              desc: "Access controlled by role. All access is logged.",
            },
            {
              title: "Human Authority",
              desc: "System provides information. Decisions remain with officials.",
            },
            {
              title: "Audit & Accountability",
              desc: "All actions logged. Citizens can track report status.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white border-2 border-blue-200 p-6 rounded-lg hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {item.title}
              </h3>
              <p className="text-gray-700">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ScopeSection() {
  const [ref, isVisible] = useInView();

  return (
    <section ref={ref} className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`max-w-3xl mx-auto text-center mb-12 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Current Scope & Future Expansion
          </h2>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-green-50 border-2 border-green-300 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Geographic Coverage
            </h3>
            <p className="text-gray-700">Uttarakhand and Himachal Pradesh</p>
          </div>

          <div className="bg-blue-50 border-2 border-blue-300 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Hazard Coverage (24 Categories)
            </h3>
            <div className="grid sm:grid-cols-2 gap-2 text-sm text-gray-700">
              <div>• <strong>Natural Disasters:</strong> Landslides, Avalanches, Earthquakes, Cloudbursts, Rockfall</div>
              <div>• <strong>Emergencies:</strong> Fire, Flood, Accidents, Building Collapse, Injuries</div>
              <div>• <strong>Infrastructure:</strong> Road Damage, Water Leakage, Drainage, Street Lights</div>
              <div>• <strong>Utilities:</strong> Power Outage, Water Supply, Gas Leaks</div>
              <div>• <strong>Environment:</strong> Fallen Trees, Garbage, Stray Animals</div>
            </div>
          </div>

          <div className="bg-gray-50 border-2 border-gray-300 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Planned Expansion
            </h3>
            <p className="text-gray-700">
              Additional states • Meteorological integration • Expanded hazard
              types • Cross-state coordination • Predictive modeling
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function PrototypeStatusSection() {
  const [ref, isVisible] = useInView();

  return (
    <section
      id="prototype-status"
      ref={ref}
      className="py-20 bg-slate-50 border-t border-slate-200"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className={`max-w-3xl mx-auto text-center mb-10 transition-all duration-700 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Prototype phase: what’s live vs coming soon
          </h2>
          <p className="text-sm md:text-base text-gray-600 max-w-2xl mx-auto">
            This deployment is a{" "}
            <span className="font-semibold">prototype build</span> for the
            hackathon. It shows the full end-to-end wiring, while some backend
            automation and AI pieces are intentionally disabled until Round 2.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          <div className="bg-white border border-green-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-9 w-9 flex items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="w-5 h-5 text-green-700" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Available now in this prototype
              </h3>
            </div>
            <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
              <li>
                <strong>Grid-wise Technology:</strong> DIGIPIN-inspired spatial grids for high-precision location accuracy
              </li>
              <li>
                <strong>24 Incident Categories:</strong> Covering emergencies, infrastructure, natural disasters, utilities & environment
              </li>
              <li>
                <strong>Nearby Incident Tracking:</strong> Citizens can discover and verify reports around them to help authorities respond
              </li>
              <li>
                <strong>Community Verification:</strong> Confidence scoring system - citizens vote to validate incidents
              </li>
              <li>
                <strong>Operator Dashboard:</strong> Advanced filtering, confidence-based triage & status management
              </li>
            </ul>
          </div>

          <div className="bg-white border border-blue-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-9 w-9 flex items-center justify-center rounded-full bg-blue-100">
                <Radio className="w-5 h-5 text-blue-700" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Under development / coming in Next Phase
              </h3>
            </div>
            <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
              <li>
                <strong>AI Grid Analysis:</strong> Predictive modeling for landslide/flood risks at grid level
              </li>
              <li>
                Automated alerting pipeline for high-risk grids
              </li>
              <li>Interactive grid heatmaps and map overlays for operators</li>
              <li>
                SMS / low-connectivity reporting for remote Himalayan areas
              </li>
            </ul>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-9 w-9 flex items-center justify-center rounded-full bg-slate-100">
                <Shield className="w-5 h-5 text-slate-700" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Planned production hardening (post-hackathon)
              </h3>
            </div>
            <ul className="list-disc list-inside text-sm text-gray-800 space-y-1">
              <li>
                Stricter Firestore security rules and end-to-end audit logging
              </li>
              <li>
                Load and cost testing of Cloud Functions + Firestore read/write
                patterns
              </li>
              <li>
                Operational dashboards and monitoring for incident volume and
                system health
              </li>
            </ul>
          </div>
        </div>

        <p className="mt-8 text-xs md:text-sm text-gray-500 max-w-3xl mx-auto text-center">
          The goal of this prototype is to demonstrate the originality of the
          architecture, real-time wiring between citizen, operator, and admin
          apps, and how the DIGIPIN-inspired grid + AI risk engine will work
          once fully enabled.
        </p>
      </div>
    </section>
  );
}

function CTASection({ scrollToSection }) {
  return (
    <section className="py-20 bg-white text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-bold mb-4">Access INDRA</h2>
        <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
          Choose the interface that matches your role — Citizen or Operator
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <a
            href="/auth/citizen"
            className="w-full sm:w-auto bg-green-600 text-white px-8 py-4 text-lg font-medium rounded-md hover:bg-green-700 transition-colors"
          >
            Citizen Portal
          </a>
          <a
            href="/auth/operator"
            className="w-full sm:w-auto border-2 border-gray-300 text-gray-900 px-8 py-4 text-lg font-medium rounded-md hover:bg-gray-50 transition-colors"
          >
            Operator Portal
          </a>
          <a
            href="/docs/technical"
            className="w-full sm:w-auto border-2 border-gray-300 text-gray-900 px-8 py-4 text-lg font-medium rounded-md hover:bg-gray-50 transition-colors"
          >
            Technical Overview
          </a>
        </div>

        <div className="border-t border-gray-100 pt-8 text-sm text-gray-600 space-y-2">
          <p>
            <strong>For Inquiries:</strong> contact@indra.gov.in
          </p>
          <p>
            <strong>Developed for:</strong> National Disaster Management
            Authority | Digital India Initiative
          </p>
          <p className="italic">
            Prototype system for demonstration and evaluation purposes.
          </p>
        </div>
      </div>
    </section>
  );
}
