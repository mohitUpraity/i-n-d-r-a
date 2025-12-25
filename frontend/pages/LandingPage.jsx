import React, { useState, useEffect, useRef } from 'react';
import { Shield, AlertTriangle, Users, Building2, Radio, Heart, Lock, Menu, X, ChevronRight, CheckCircle, Database, MapPin, TrendingUp, Bell, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

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

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className={`bg-white sticky top-0 z-50 transition-all duration-300 ${
        scrolled ? 'shadow-xl' : 'shadow-md'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 group cursor-pointer">
              <div className="p-2 bg-blue-900 rounded-lg group-hover:shadow-lg transition-all">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-900">INDRA</span>
                <p className="text-xs text-gray-500 font-medium">Disaster Management</p>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-6 text-sm">
              {['problem', 'solution', 'how-it-works', 'features'].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item)}
                  className="text-gray-700 hover:text-blue-900 font-medium transition-colors relative group"
                >
                  {item.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-900 transition-all group-hover:w-full" />
                </button>
              ))}
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

            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-4 py-3 space-y-2">
              {['problem', 'solution', 'how-it-works', 'features'].map((item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item)}
                  className="block w-full text-left text-gray-700 py-2 px-4 hover:bg-gray-50 rounded transition-colors"
                >
                  {item.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </button>
              ))}
               <Link to="/auth">
               <button className="w-full bg-blue-900 text-white px-4 py-2 font-medium rounded hover:bg-blue-800 transition-colors">
                Access Platform
              </button> </Link>
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

      {/* CTA */}
      <CTASection scrollToSection={scrollToSection} />

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
          <p>© 2024 INDRA Platform. Built for public purpose technology and disaster resilience.</p>
        </div>
      </footer>
    </div>
  );
}

function HeroSection({ scrollToSection }) {
  return (
    <section className="bg-gradient-to-b from-slate-900 via-blue-900 to-blue-50 py-32 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-400 to-blue-900 rounded-2xl mb-6 shadow-2xl">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-6xl lg:text-7xl font-black text-white mb-6 leading-tight drop-shadow-lg">INDRA</h1>
          <p className="text-3xl text-blue-200 font-bold mb-6">
            Intelligent National Disaster, Resource & Action Platform
          </p>
          <p className="text-xl text-blue-100 mb-10 leading-relaxed max-w-2xl mx-auto">
            Real-time incident reporting, AI-powered risk assessment, and coordinated disaster response. Securing Himalayan communities with modern technology.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth/citizen">
              <button className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-4 text-lg font-bold hover:shadow-2xl transition-all hover:scale-105 rounded-lg group shadow-lg">
                Report Incident
                <ChevronRight className="inline-block ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
            <Link to="/auth/operator">
              <button className="w-full sm:w-auto bg-gradient-to-r from-yellow-500 to-orange-600 text-white px-8 py-4 text-lg font-bold hover:shadow-2xl transition-all hover:scale-105 rounded-lg group shadow-lg">
                Command Center
                <ChevronRight className="inline-block ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
            <button 
              onClick={() => scrollToSection('how-it-works')}
              className="w-full sm:w-auto border-2 border-white text-white px-8 py-4 text-lg font-bold hover:bg-white hover:text-blue-900 transition-all rounded-lg hover:shadow-lg"
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
        <div className={`max-w-3xl mx-auto text-center mb-12 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Disaster Management Challenges in Himalayan Regions
          </h2>
          <p className="text-lg text-gray-600">
            The Himalayan states face recurring disasters that strain response capacity and endanger lives.
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
            <strong>The Core Problem:</strong> Current systems operate in silos. Departments maintain separate databases, 
            citizens have no standardized reporting mechanism, and authorities lack unified risk intelligence to prioritize 
            resources effectively.
          </p>
        </div>
      </div>
    </section>
  );
}

function SolutionSection() {
  const [ref, isVisible] = useInView();

  const solutions = [
    { icon: Database, title: 'Unified Data Layer', desc: 'All incidents, risks, and actions aggregated in one system.' },
    { icon: MapPin, title: 'Grid-Based Location', desc: 'Precise identification without storing personal addresses.' },
    { icon: Users, title: 'Human-in-the-Loop', desc: 'All decisions remain under human authority.' },
    { icon: Lock, title: 'Role-Based Access', desc: 'Different views based on role and clearance level.' }
  ];

  return (
    <section id="solution" ref={ref} className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`max-w-3xl mx-auto text-center mb-12 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <CheckCircle className="w-12 h-12 text-blue-900 mx-auto mb-4" />
          <h2 className="text-4xl font-bold text-gray-900 mb-4">What is INDRA?</h2>
          <p className="text-lg text-gray-600">
            A decision-support platform that unifies disaster risk intelligence, incident reporting, and response coordination.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-8">
          {solutions.map((sol, i) => (
            <div key={i} className="bg-white border-2 border-gray-200 p-6 rounded-lg hover:border-blue-300 hover:shadow-lg transition-all group">
              <sol.icon className="w-10 h-10 text-blue-900 mb-4 group-hover:scale-110 transition-transform" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">{sol.title}</h3>
              <p className="text-gray-700">{sol.desc}</p>
            </div>
          ))}
        </div>

        <div className="max-w-3xl mx-auto bg-blue-50 border-2 border-blue-300 p-6 rounded-lg">
          <p className="text-gray-800 text-center">
            <strong>Inspired by Digital Public Infrastructure:</strong> Built on principles similar to India's UPI and 
            Aadhaar systems—open architecture, interoperability, and public purpose technology.
          </p>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  const [ref, isVisible] = useInView();

  const steps = [
    { title: 'Ground-Level Data Collection', desc: 'Citizens and field personnel report incidents through intuitive interface with photos & location data.' },
    { title: 'Smart Location Encoding', desc: 'Geographic coordinates converted to privacy-preserving grid codes for precise geographic identification.' },
    { title: 'Intelligent Risk Analysis', desc: 'AI systems aggregate reports by region, severity, hazard type, and temporal patterns.' },
    { title: 'Decision Command Center', desc: 'Authorities access unified dashboard showing regional risk heatmaps and actionable intelligence.' },
    { title: 'Coordinated Response', desc: 'Authorities assign responders with real-time tracking, status updates, and resource management.' }
  ];

  return (
    <section id="how-it-works" ref={ref} className="py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`max-w-3xl mx-auto text-center mb-16 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">How INDRA Works</h2>
          <p className="text-xl text-gray-600">From incident to coordinated response</p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {steps.map((step, i) => (
            <div key={i} className="relative">
              {/* Timeline line */}
              {i < steps.length - 1 && (
                <div className="absolute left-6 top-20 w-1 h-16 bg-gradient-to-b from-blue-500 to-transparent hidden md:block"></div>
              )}
              
              <div className="flex gap-6 items-start group hover:translate-x-2 transition-transform bg-white p-6 rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-xl">
                {/* Step number */}
                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-700 text-white rounded-full flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform shadow-lg">
                  {i + 1}
                </div>
                
                {/* Content */}
                <div className="flex-1 pt-2">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h3>
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
    { icon: Users, title: 'Citizens', color: 'from-blue-500 to-cyan-500', items: ['Report incidents in real-time', 'Receive safety alerts & guidance', 'View community risk updates', 'Access evacuation routes'] },
    { icon: Building2, title: 'Government', color: 'from-purple-500 to-pink-500', items: ['Unified risk intelligence', 'Resource optimization', 'Incident tracking & analysis', 'Decision-making dashboards'] },
    { icon: Radio, title: 'First Responders', color: 'from-red-500 to-orange-500', items: ['Receive priority assignments', 'Access precise locations', 'Update incident status', 'Coordinate across teams'] },
    { icon: Heart, title: 'NGOs & Communities', color: 'from-green-500 to-emerald-500', items: ['Identify help areas', 'Prevent aid duplication', 'Collaborative response', 'Real-time impact tracking'] }
  ];

  return (
    <section ref={ref} className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`max-w-3xl mx-auto text-center mb-16 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">Who Uses INDRA</h2>
          <p className="text-xl text-gray-600">Unified platform for disaster response stakeholders</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stakeholders.map((sh, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-8 hover:shadow-2xl hover:scale-105 transition-all group relative overflow-hidden">
              {/* Gradient accent */}
              <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${sh.color} rounded-full blur-2xl opacity-10 group-hover:opacity-20 transition-all`}></div>
              
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br ${sh.color} text-white mb-4 shadow-lg`}>
                <sh.icon className="w-6 h-6" />
              </div>
              
              {/* Content */}
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{sh.title}</h3>
              <ul className="space-y-3 text-sm text-gray-700 relative z-10">
                {sh.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <span className={`inline-block w-2 h-2 rounded-full bg-gradient-to-br ${sh.color} mt-2 flex-shrink-0`}></span>
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
    { icon: TrendingUp, title: 'Risk Intelligence', color: 'from-red-500 to-orange-500', items: ['Grid-based risk assessment', 'Multi-hazard coverage', 'Trend pattern analysis', 'Real-time data aggregation'] },
    { icon: Radio, title: 'Incident Reporting', color: 'from-green-500 to-emerald-500', items: ['Intuitive mobile interface', 'Precise GPS location', 'Photo & video support', 'Voice reporting enabled'] },
    { icon: BarChart3, title: 'Command Dashboard', color: 'from-blue-500 to-indigo-500', items: ['Risk heatmaps & overlays', 'Intelligent prioritization', 'Resource allocation tools', 'Real-time monitoring'] },
    { icon: Bell, title: 'Smart Alerts', color: 'from-yellow-500 to-amber-500', items: ['Zone-based notifications', 'Role-specific messaging', '11 language support', 'SMS + App delivery'] },
    { icon: Lock, title: 'Security & Privacy', color: 'from-purple-500 to-pink-500', items: ['Grid-based location privacy', 'End-to-end encryption', 'Role-based access control', 'Complete audit logging'] },
    { icon: Database, title: 'Data Integration', color: 'from-teal-500 to-cyan-500', items: ['GIS data integration', 'Weather APIs', 'Seismic data feeds', 'Open data standards'] }
  ];

  return (
    <section id="features" ref={ref} className="py-20 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`max-w-3xl mx-auto text-center mb-16 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <h2 className="text-4xl lg:text-5xl font-black text-gray-900 mb-4">Powerful Features</h2>
          <p className="text-xl text-gray-600">Enterprise-grade capabilities for disaster management</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {features.map((feat, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-2xl hover:scale-105 transition-all group relative overflow-hidden">
              {/* Gradient background */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feat.color} rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-all`}></div>
              
              {/* Icon */}
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${feat.color} text-white mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                <feat.icon className="w-7 h-7" />
              </div>
              
              {/* Content */}
              <h3 className="text-2xl font-bold text-gray-900 mb-4">{feat.title}</h3>
              <ul className="space-y-3 text-gray-700">
                {feat.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
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
        <div className={`max-w-3xl mx-auto text-center mb-12 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <Lock className="w-12 h-12 text-blue-900 mx-auto mb-4" />
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Data, Privacy & Governance</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {[
            { title: 'Location Privacy', desc: 'Grid codes enable precise allocation while protecting individual privacy.' },
            { title: 'Role-Based Visibility', desc: 'Access controlled by role. All access is logged.' },
            { title: 'Human Authority', desc: 'System provides information. Decisions remain with officials.' },
            { title: 'Audit & Accountability', desc: 'All actions logged. Citizens can track report status.' }
          ].map((item, i) => (
            <div key={i} className="bg-white border-2 border-blue-200 p-6 rounded-lg hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
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
        <div className={`max-w-3xl mx-auto text-center mb-12 transition-all duration-700 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        }`}>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Current Scope & Future Expansion</h2>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-green-50 border-2 border-green-300 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Geographic Coverage</h3>
            <p className="text-gray-700">Uttarakhand and Himachal Pradesh</p>
          </div>

          <div className="bg-blue-50 border-2 border-blue-300 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Hazard Coverage</h3>
            <div className="grid sm:grid-cols-2 gap-2 text-gray-700">
              <div>• Landslides • Road/bridge damage • Flooding</div>
              <div>• Structural damage • Cold wave • Utility outages</div>
            </div>
          </div>

          <div className="bg-gray-50 border-2 border-gray-300 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Planned Expansion</h3>
            <p className="text-gray-700">
              Additional states • Meteorological integration • Expanded hazard types • Cross-state coordination • 
              Predictive modeling
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection({ scrollToSection }) {
  return (
    <section className="py-20 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-4xl font-bold mb-4">Access INDRA</h2>
        <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
          Choose your interface based on your role
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <button className="w-full sm:w-auto bg-white text-gray-900 px-8 py-4 text-lg font-medium hover:bg-gray-100 transition-colors">
            Citizen Interface
          </button>
          <button className="w-full sm:w-auto border-2 border-white text-white px-8 py-4 text-lg font-medium hover:bg-white hover:text-gray-900 transition-colors">
            Authority Dashboard
          </button>
          <button className="w-full sm:w-auto border-2 border-white text-white px-8 py-4 text-lg font-medium hover:bg-white hover:text-gray-900 transition-colors">
            Technical Overview
          </button>
        </div>

        <div className="border-t border-gray-700 pt-8 text-sm text-gray-400 space-y-2">
          <p><strong>For Inquiries:</strong> contact@indra.gov.in</p>
          <p><strong>Developed for:</strong> National Disaster Management Authority | Digital India Initiative</p>
          <p className="italic">This is a prototype system developed for demonstration and evaluation purposes.</p>
        </div>
      </div>
    </section>
  );
}