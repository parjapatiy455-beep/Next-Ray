import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Code, 
  Copy, 
  RotateCcw, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  Palette, 
  LayoutGrid, 
  Download, 
  Maximize2, 
  Minimize2, 
  Sparkles, 
  Layers, 
  FileCode, 
  Monitor, 
  Video, 
  Presentation,
  BookOpen,
  PieChart,
  ArrowRight,
  Eye,
  Settings
} from 'lucide-react';

// --- Types for Slides ---
export interface SlideItem {
  id: string;
  title: string;
  subtitle: string;
  bullets: string[];
  layout: 'title' | 'split' | 'bento' | 'quote' | 'metrics';
  quoteAuthor?: string;
  metricValue?: string;
  metricLabel?: string;
}

// --- HTML Sandbox Demo Templates ---
const HTML_TEMPLATES = [
  {
    name: "🚀 SaaS Landing Page",
    description: "Responsive dark SaaS landing page layout with custom cards and smooth gradient backgrounds.",
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;450;600;800&display=swap');
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col justify-between">
  <!-- Glowing effects -->
  <div class="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
  <div class="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none"></div>

  <!-- Header -->
  <header class="border-b border-slate-900/80 backdrop-blur-md sticky top-0 z-50">
    <div class="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <div class="h-8 w-8 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-lg flex items-center justify-center font-bold text-slate-950 tracking-wider">NR</div>
        <span class="text-lg font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">NextRay Sales</span>
      </div>
      <nav class="hidden md:flex items-center gap-6 text-sm text-slate-400">
        <a href="#" class="hover:text-emerald-400 transition-colors">Features</a>
        <a href="#" class="hover:text-emerald-400 transition-colors">Pricing</a>
        <a href="#" class="hover:text-emerald-400 transition-colors">Enterprise</a>
      </nav>
      <button class="bg-emerald-500 text-slate-950 border border-emerald-400/20 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10 transition-all">Get Started</button>
    </div>
  </header>

  <!-- Hero -->
  <main class="flex-1 max-w-5xl mx-auto px-6 py-12 flex flex-col items-center justify-center text-center">
    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[10px] uppercase tracking-widest font-extrabold mb-6 animate-pulse">
      ✨ Introducing NextRay Intelligence
    </div>
    <h1 class="text-4xl md:text-5xl font-black text-white tracking-tight leading-none max-w-3xl mb-6">
      Transforming Ideas into Real-Time <br />
      <span class="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">Business Intelligence</span>
    </h1>
    <p class="text-slate-400 text-sm md:text-base max-w-xl mb-8 leading-relaxed">
      Unlock instant analytics presentation decks, responsive app models, and professional marketing strategies from a single platform.
    </p>

    <!-- CTAs -->
    <div class="flex flex-wrap gap-4 justify-center mb-16">
      <button class="bg-white text-slate-950 px-6 py-3 rounded-xl text-sm font-semibold hover:bg-slate-100 transition-all shadow-xl shadow-white/5">Start Free Trial</button>
      <button class="bg-slate-900 border border-slate-800 text-slate-350 hover:text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-slate-850 transition-all">Watch Interactive Demo</button>
    </div>

    <!-- Features Bento Grid -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
      <div class="p-6 rounded-2xl border border-slate-900 bg-slate-900/40 backdrop-blur-sm shadow-xs">
        <div class="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold mb-4">📈</div>
        <h3 class="text-base font-bold text-white mb-2">Instant Deck Creator</h3>
        <p class="text-slate-400 text-xs leading-relaxed">Type your marketing guidelines and instantly render slides ready for board reviews.</p>
      </div>

      <div class="p-6 rounded-2xl border border-slate-900 bg-slate-900/40 backdrop-blur-sm shadow-xs">
        <div class="h-10 w-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 font-bold mb-4">⚡</div>
        <h3 class="text-base font-bold text-white mb-2">Automated Sandbox</h3>
        <p class="text-slate-400 text-xs leading-relaxed">Generate front-end layout codes, edit components visually, and run HTML structures on the cloud.</p>
      </div>

      <div class="p-6 rounded-2xl border border-slate-900 bg-slate-900/40 backdrop-blur-sm shadow-xs">
        <div class="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold mb-4">🛡️</div>
        <h3 class="text-base font-bold text-white mb-2">Secure Cloud Nodes</h3>
        <p class="text-slate-400 text-xs leading-relaxed">Every document execution is locked within secure container environments for enterprise compliance.</p>
      </div>
    </div>
  </main>

  <!-- Footer -->
  <footer class="border-t border-slate-900/80 bg-slate-950/80 py-6">
    <div class="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
      <p>&copy; 2026 NextRay Inc. Empowering local business structures across nodes.</p>
      <div class="flex gap-4">
        <a href="#" class="hover:text-emerald-400">Terms</a>
        <a href="#" class="hover:text-emerald-400">Privacy Policy</a>
      </div>
    </div>
  </footer>
</body>
</html>`
  },
  {
    name: "🕒 Animated Clock Widget",
    description: "An elegant interactive full screen analog & digital clock showcasing real-time system updates.",
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 text-white min-h-screen flex flex-col justify-center items-center p-6">
  <div class="max-w-md w-full bg-slate-900/80 border border-indigo-500/20 p-8 rounded-3xl text-center shadow-2xl backdrop-blur-lg">
    
    <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-400 text-[11px] font-bold uppercase tracking-wider mb-8">
       ✨ NextRay Time Reactor
    </div>
    
    <!-- Time Projection -->
    <div class="space-y-1 mb-8">
      <div id="digital" class="text-5xl font-extrabold tracking-widest font-mono bg-gradient-to-r from-indigo-300 via-sky-200 to-indigo-400 bg-clip-text text-transparent">
        00:00:00 AM
      </div>
      <div id="date-label" class="text-slate-400 text-xs uppercase tracking-widest font-semibold mt-2">
        Monday, January 1, 2026
      </div>
    </div>

    <!-- Micro interactions -->
    <div class="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/15 text-left space-y-2">
      <p class="text-indigo-300 font-bold text-xs uppercase tracking-tight">Active Node Telemetry</p>
      <div class="flex justify-between text-[11px] text-slate-400 font-mono">
        <span>Zone Reference:</span>
        <span class="text-emerald-400 font-semibold" id="timezone-ref">Asia/Kolkata</span>
      </div>
      <div class="flex justify-between text-[11px] text-slate-400 font-mono">
        <span>Execution Engine:</span>
        <span class="text-sky-400 font-semibold">Native Browser JS Loop</span>
      </div>
    </div>

    <p class="text-[10px] text-slate-500 mt-6 tracking-wide uppercase">Press any key in this window to test responsiveness.</p>
  </div>

  <script>
    // Timezone setup
    document.getElementById('timezone-ref').textContent = Intl.DateTimeFormat().resolvedOptions().timeZone;

    function updateTime() {
      const now = new Date();
      
      // Digital
      let hours = now.getHours();
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // safety 0 hour correction
      const formattedHours = String(hours).padStart(2, '0');
      
      document.getElementById('digital').textContent = \`\${formattedHours}:\${mins}:\${secs} \${ampm}\`;

      // Date
      document.getElementById('date-label').textContent = now.toLocaleDateString(undefined, { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }

    // Refresh every second
    setInterval(updateTime, 1000);
    updateTime();

    // Responsive trigger key code
    window.addEventListener('keydown', (e) => {
      const parent = document.querySelector('.max-w-md');
      parent.classList.add('border-emerald-500/50', 'scale-[1.02]');
      setTimeout(() => {
        parent.classList.remove('border-emerald-500/50', 'scale-[1.02]');
      }, 200);
    });
  </script>
</body>
</html>`
  },
  {
    name: "📊 Business Finance Card",
    description: "Responsive billing, invoice data layout, with clean metric gauges and micro-interaction buttons.",
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-50 text-slate-900 min-h-screen flex items-center justify-center p-6">
  <div class="max-w-lg w-full bg-white border border-slate-200 shadow-xl rounded-3xl overflow-hidden">
    
    {/* Bill Card Header */}
    <div class="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white text-left flex justify-between items-start">
      <div>
        <p class="text-[11px] uppercase tracking-wider font-extrabold opacity-80">NextRay Enterprise Billing</p>
        <h2 class="text-2xl font-extrabold tracking-tight">Invoice #X-9042</h2>
      </div>
      <span class="bg-emerald-500/20 border border-emerald-400/40 text-emerald-100 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
        Paid Success
      </span>
    </div>

    {/* Details Section */}
    <div class="p-6 space-y-6">
      
      {/* Primary Metrics */}
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-slate-50 border border-slate-100 p-4 rounded-xl text-left">
          <p class="text-slate-400 text-[11px] font-bold uppercase tracking-wide">Grand Total</p>
          <p class="text-xl font-bold text-slate-800 tracking-tight">$4,190.50</p>
        </div>
        <div class="bg-slate-50 border border-slate-100 p-4 rounded-xl text-left">
          <p class="text-slate-400 text-[11px] font-bold uppercase tracking-wide">Due Date</p>
          <p class="text-sm font-semibold text-slate-700 mt-1">June 30, 2026</p>
        </div>
      </div>

      {/* List items */}
      <div class="space-y-3">
        <p class="text-xs font-bold text-slate-400 uppercase tracking-widest text-left">Itemized Elements</p>
        
        <div class="flex justify-between items-center text-xs py-2 border-b border-slate-100">
          <div class="text-left">
            <p class="font-bold text-slate-700">Dedicated Cloud Ingress Nodes</p>
            <p class="text-slate-400 text-[10px]">10 instances operating globally</p>
          </div>
          <span class="font-bold text-slate-850">$2,400.00</span>
        </div>

        <div class="flex justify-between items-center text-xs py-2 border-b border-slate-100">
          <div class="text-left">
            <p class="font-bold text-slate-700">Presentation Plan Synthesizer Engine</p>
            <p class="text-slate-400 text-[10px]">Unlimited slide decks generated</p>
          </div>
          <span class="font-bold text-slate-850">$1,500.00</span>
        </div>

        <div class="flex justify-between items-center text-xs py-2 border-b border-slate-100">
          <div class="text-left">
            <p class="font-bold text-slate-700">VAT & Cloud Compliance Tax</p>
            <p class="text-slate-400 text-[10px]">Flat percentage rate index</p>
          </div>
          <span class="font-bold text-slate-850">$290.50</span>
        </div>
      </div>

      <!-- Quick Action Slider Interactive Panel -->
      <button onclick="alert('PDF Generated! Saving record to user logs.')" class="w-full bg-slate-900 text-white rounded-xl py-3 text-xs font-bold hover:bg-slate-800 transition-colors shadow-lg active:scale-[0.99] transition-all">
        Download PDF Invoice
      </button>

    </div>
  </div>
</body>
</html>`
  }
];

// --- Slideshow Demo Datasets ---
const DEMO_DECKS: { name: string; description: string; slides: SlideItem[] }[] = [
  {
    name: "🎯 Startup Pitch Deck (Problem-Solution)",
    description: "Standard model used by teams to outline market gaps, product solution, and traction charts.",
    slides: [
      {
        id: "s1-1",
        title: "NextRay SaaS Solutions",
        subtitle: "Unlocking seamless client-to-machine intelligent collaboration",
        bullets: [
          "Presenter: Startup Founding Core Node Team",
          "Concept: Real-Time automated business modeling",
          "Target Audience: Cloud Developers and SMEs looking for interactive sandboxes"
        ],
        layout: "title"
      },
      {
        id: "s1-2",
        title: "The Problem We Solve",
        subtitle: "Existing cloud frameworks are incredibly laggy and slow down developer workflows",
        bullets: [
          "Typing lags and browser rendering crashes degrade team efficiencies",
          "Setting up sandbox servers with appropriate permissions takes hours of engineering",
          "Developing slides and sales deck layout scripts is tedious and manual"
        ],
        layout: "split"
      },
      {
        id: "s1-3",
        title: "The Market Opportunity",
        subtitle: "$75B addressable market scope covering real-time software deployment",
        bullets: [
          "No available standard platforms offer both local storage fallbacks + direct cloud firestore sync",
          "High demand for lightweight, 60fps streaming interfaces",
          "Enterprises require sandboxed HTML testbeds for instant prototyping checks"
        ],
        layout: "metrics",
        metricValue: "75 Billion",
        metricLabel: "Total Addressable Market (TAM) by 2028"
      },
      {
        id: "s1-4",
        title: "Core Values & Execution",
        subtitle: "Designed to run with direct instant previews",
        bullets: [
          "Zero-lag decoupled front-end states prioritizing direct user input",
          "Safe background client execution limits with automatic rule deployments",
          "High fidelity templates pre-generated for immediate live operations"
        ],
        layout: "bento"
      },
      {
        id: "s1-5",
        title: "Closing Commitment",
        subtitle: "Partner with NextRay to supercharge your prototyping output.",
        bullets: [
          "Reach out to parjapatiy455@gmail.com for early beta access keys",
          "Dedicated priority support handles instant developer node allocations",
          "Start creating slides and testing layouts on standard free tiers today"
        ],
        layout: "quote",
        quoteAuthor: "- The NextRay Core Builders"
      }
    ]
  },
  {
    name: "📊 Business Strategy Proposal",
    description: "A framework outlining roadmaps, metrics tracking, and product deployment milestones.",
    slides: [
      {
        id: "s2-1",
        title: "Strategic Business Expansion Plan",
        subtitle: "A roadmap detailing scale, distribution, and engineering outputs",
        bullets: [
          "Focus: Enhancing front-end performance indexes",
          "Target Timeline: Q3 - Q4 2026",
          "Milestones: Decoupled stream layers, sandbox integration, and presentation controllers"
        ],
        layout: "title"
      },
      {
        id: "s2-2",
        title: "Operational Efficiency Focus",
        subtitle: "Solving stream bottlenecks to protect visual feedback loops",
        bullets: [
          "State Updates: Throttled to 80ms increments to shield render loops",
          "Component Memoization: Prevents historic messages from re-parsing markdown on key typing",
          "Input Decoupling: Complete elimination of text field stuttering with local state containment"
        ],
        layout: "split"
      },
      {
        id: "s2-3",
        title: "Target Performance Objectives",
        subtitle: "Measured on native sandbox nodes and local testing machines",
        bullets: [
          "Typing Responsiveness: Raised from 12fps up to a solid 60fps",
          "API Payload Speed Latency: Reduced with direct SSE token streams",
          "User Satisfaction Rating: Overwhelmingly improved across early beta cohorts"
        ],
        layout: "metrics",
        metricValue: "60 FPS",
        metricLabel: "Typing and UI Response Speed Guarantee"
      }
    ]
  }
];

// --- Slide Theme Definitions ---
const ACCENT_THEMES = [
  { name: "Slate Charcoal", bg: "bg-slate-900", border: "border-slate-800", text: "text-slate-100", accentText: "text-indigo-400", cardBg: "bg-slate-950" },
  { name: "Deep Emerald", bg: "bg-slate-950", border: "border-emerald-900/40", text: "text-slate-100", accentText: "text-emerald-400", cardBg: "bg-emerald-950/20" },
  { name: "Royal Blue", bg: "bg-gradient-to-br from-indigo-950 to-slate-900", border: "border-indigo-900/40", text: "text-indigo-50", accentText: "text-sky-300", cardBg: "bg-indigo-950/40" },
  { name: "Corporate Amber", bg: "bg-zinc-900", border: "border-amber-900/30", text: "text-zinc-100", accentText: "text-amber-400", cardBg: "bg-amber-950/15" },
];

export default function InteractiveWorkbench({
  onClose,
  onPasteToChat
}: {
  onClose: () => void;
  onPasteToChat: (text: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<'html-sandbox' | 'slide-builder'>('html-sandbox');
  
  // HTML Sandbox States
  const [sandboxCode, setSandboxCode] = useState(HTML_TEMPLATES[0].code);
  const [copiedCode, setCopiedCode] = useState(false);
  const [srcDoc, setSrcDoc] = useState('');
  
  // Slide Builder States
  const [currentDeckName, setCurrentDeckName] = useState(DEMO_DECKS[0].name);
  const [slides, setSlides] = useState<SlideItem[]>(DEMO_DECKS[0].slides);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [activeThemeIndex, setActiveThemeIndex] = useState(0);
  const [isFullscreenSlide, setIsFullscreenSlide] = useState(false);
  
  // Edit forms inside Sidebar
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editBullets, setEditBullets] = useState<string[]>([]);
  const [editLayout, setEditLayout] = useState<'title' | 'split' | 'bento' | 'quote' | 'metrics'>('title');
  const [editMetricValue, setEditMetricValue] = useState('');
  const [editMetricLabel, setEditMetricLabel] = useState('');
  const [editQuoteAuthor, setEditQuoteAuthor] = useState('');
  const [aiEditPrompt, setAiEditPrompt] = useState('');

  // Synchronize dynamic preview run on load & capture AI-generated updates
  useEffect(() => {
    runCodeInSandbox();

    const handleSlideshowUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && Array.isArray(customEvent.detail.slides)) {
        setCurrentDeckName(customEvent.detail.name || "AI Generated presentation");
        setSlides(customEvent.detail.slides);
        setCurrentSlideIndex(0);
        setActiveTab('slide-builder');
      }
    };

    const handleHtmlUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && typeof customEvent.detail.code === 'string') {
        setSandboxCode(customEvent.detail.code);
        setSrcDoc(customEvent.detail.code);
        setActiveTab('html-sandbox');
      }
    };

    window.addEventListener('update-slideshow-deck', handleSlideshowUpdate);
    window.addEventListener('update-html-sandbox', handleHtmlUpdate);
    return () => {
      window.removeEventListener('update-slideshow-deck', handleSlideshowUpdate);
      window.removeEventListener('update-html-sandbox', handleHtmlUpdate);
    };
  }, []);

  // Listen for keyboard controls inside fullscreen slide view
  useEffect(() => {
    if (!isFullscreenSlide) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreenSlide(false);
      } else if (e.key === 'ArrowRight' || e.key === ' ') {
        if (currentSlideIndex < slides.length - 1) {
          setCurrentSlideIndex(prev => prev + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentSlideIndex > 0) {
          setCurrentSlideIndex(prev => prev - 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreenSlide, currentSlideIndex, slides.length]);

  // Update edit form values when selected slide changes
  useEffect(() => {
    if (slides[currentSlideIndex]) {
      const slide = slides[currentSlideIndex];
      setEditTitle(slide.title);
      setEditSubtitle(slide.subtitle);
      setEditBullets(slide.bullets);
      setEditLayout(slide.layout);
      setEditMetricValue(slide.metricValue || '');
      setEditMetricLabel(slide.metricLabel || '');
      setEditQuoteAuthor(slide.quoteAuthor || '');
    }
  }, [currentSlideIndex, slides]);

  const runCodeInSandbox = () => {
    setSrcDoc(sandboxCode);
  };

  const loadHtmlTemplate = (code: string) => {
    setSandboxCode(code);
    setSrcDoc(code);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(sandboxCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleResetCode = () => {
    setSandboxCode(HTML_TEMPLATES[0].code);
    setSrcDoc(HTML_TEMPLATES[0].code);
  };

  // Slideshow Actions
  const handleLoadDeck = (deck: typeof DEMO_DECKS[0]) => {
    setCurrentDeckName(deck.name);
    setSlides(deck.slides);
    setCurrentSlideIndex(0);
  };

  const handleDownloadDeckAsJson = () => {
    const deckObj = {
      type: 'slideshow_deck',
      name: currentDeckName,
      slides: slides
    };
    const blob = new Blob([JSON.stringify(deckObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentDeckName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_slides.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleDownloadDeckAsHtml = () => {
    const htmlStyles = `
      body {
        font-family: system-ui, -apple-system, sans-serif;
        background-color: #020617;
        color: #f8fafc;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        overflow: hidden;
      }
      .slide-container {
        width: 90%;
        max-width: 960px;
        aspect-ratio: 16/9;
        background-color: #0f172a;
        border: 1px solid #1e293b;
        border-radius: 24px;
        box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        padding: 48px;
        display: none;
        flex-direction: column;
        justify-content: space-between;
        position: relative;
        box-sizing: border-box;
      }
      .slide-container.active {
        display: flex;
      }
      .btn {
        background-color: #1e293b;
        border: 1px solid #334155;
        color: white;
        padding: 10px 20px;
        border-radius: 12px;
        cursor: pointer;
        font-weight: 600;
        font-size: 13px;
        transition: all 0.15s;
      }
      .btn:hover {
        background-color: #334155;
      }
      .btn:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
    `;

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${currentDeckName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>${htmlStyles}</style>
</head>
<body>
  <div class="mb-4 text-xs font-mono text-slate-500 uppercase tracking-widest">${currentDeckName}</div>

  ${slides.map((slide, idx) => {
    return `
    <div id="slide-${idx}" class="slide-container ${idx === 0 ? 'active' : ''} bg-slate-900 border border-slate-800 p-12 rounded-3xl w-full max-w-4xl aspect-[16/9] shadow-2xl flex flex-col justify-between">
      <div class="text-[10px] uppercase font-mono opacity-40">Slide ${idx + 1} of ${slides.length}</div>
      
      <div class="my-auto flex-1 flex flex-col justify-center">
        ${slide.layout === 'title' ? `
          <div class="text-center space-y-4">
            <h1 class="text-4xl font-extrabold uppercase text-emerald-400 tracking-tight">${slide.title}</h1>
            <p class="text-slate-400 text-lg">${slide.subtitle}</p>
          </div>
        ` : slide.layout === 'quote' ? `
          <div class="text-center italic text-xl px-12 leading-relaxed text-indigo-200">
            "${slide.title}"
            <div class="text-xs font-mono text-emerald-400 tracking-wide uppercase mt-4 not-italic">${slide.quoteAuthor || ''}</div>
          </div>
        ` : slide.layout === 'metrics' ? `
          <div class="grid grid-cols-5 gap-8 items-center">
            <div class="col-span-2 text-center border-r border-white/10 pr-4">
              <div class="text-5xl font-black text-emerald-400 leading-none">${slide.metricValue || ''}</div>
              <div class="text-[10px] font-mono uppercase text-slate-400 mt-2">${slide.metricLabel || ''}</div>
            </div>
            <div class="col-span-3 text-left">
              <h2 class="text-2xl font-bold uppercase tracking-tight text-white">${slide.title}</h2>
              <p class="text-slate-400 text-sm mt-2 leading-relaxed">${slide.subtitle}</p>
            </div>
          </div>
        ` : `
          <div class="grid grid-cols-2 gap-8 items-start">
            <div class="text-left space-y-3">
              <h2 class="text-2xl font-black uppercase text-teal-300 leading-snug">${slide.title}</h2>
              <p class="text-slate-400 text-sm">${slide.subtitle}</p>
            </div>
            <ul class="text-left space-y-3 bg-white/[0.02] p-4 rounded-2xl border border-white/[0.04]">
              ${slide.bullets.map(bullet => `
                <li class="flex gap-2 text-xs text-slate-300">
                  <span class="text-emerald-400">•</span>
                  <span>${bullet}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        `}
      </div>

      <div class="flex justify-between items-center text-[10px] opacity-35 border-t border-white/10 pt-4">
        <span>Generated with NextRay Systems</span>
        <span class="font-mono">Node Index Reference: 00${idx + 1}</span>
      </div>
    </div>
    `;
  }).join('')}

  <div class="controls mt-8 flex gap-4 select-none">
    <button onclick="prevSlide()" class="btn">Previous</button>
    <span class="text-sm font-mono self-center text-slate-400" id="indicator">Slide 1 of ${slides.length}</span>
    <button onclick="nextSlide()" class="btn">Next</button>
    <button onclick="toggleFullscreen()" class="btn">Fullscreen Present</button>
  </div>

  <script>
    let currentSlide = 0;
    const totalSlides = ${slides.length};

    function showSlide(idx) {
      document.querySelectorAll('.slide-container').forEach(el => el.classList.remove('active'));
      const activeEl = document.getElementById('slide-' + idx);
      if (activeEl) {
        activeEl.classList.add('active');
        currentSlide = idx;
        document.getElementById('indicator').textContent = 'Slide ' + (idx + 1) + ' of ' + totalSlides;
      }
    }

    function nextSlide() {
      if (currentSlide < totalSlides - 1) {
        showSlide(currentSlide + 1);
      }
    }

    function prevSlide() {
      if (currentSlide > 0) {
        showSlide(currentSlide - 1);
      }
    }

    function toggleFullscreen() {
      const activeSlideEl = document.getElementById('slide-' + currentSlide);
      if (activeSlideEl.requestFullscreen) {
        activeSlideEl.requestFullscreen();
      } else if (activeSlideEl.webkitRequestFullscreen) {
        activeSlideEl.webkitRequestFullscreen();
      }
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      }
    });
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentDeckName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_presentation.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleAiEdit = () => {
    if (!aiEditPrompt.trim()) return;
    const activeSlide = slides[currentSlideIndex];
    const prompt = `Can you edit or improve this slide from our presentation?
Current Slide Index: ${currentSlideIndex}
Current Slide Title: "${activeSlide?.title || ''}"
Current Slide Subtitle: "${activeSlide?.subtitle || ''}"
Current Slide Layout: "${activeSlide?.layout || ''}"
Current Slide Bullets: ${JSON.stringify(activeSlide?.bullets || [])}

User Change Directives: "${aiEditPrompt}"

Please re-generate the entire slide deck incorporating these exact directives into the slide at index ${currentSlideIndex}. Respond to me in Chat with your response AND ALWAYS embed the complete JSON slide deck inside your response formatted inside a \`\`\`json markdown block, looking like this:
\`\`\`json
{
  "type": "slideshow_deck",
  "name": "${currentDeckName}",
  "slides": [
    ...
  ]
}
\`\`\``;
    onPasteToChat(prompt);
    setAiEditPrompt('');
  };

  const handleUpdateSlide = () => {
    if (!slides[currentSlideIndex]) return;
    
    const updated = [...slides];
    updated[currentSlideIndex] = {
      ...updated[currentSlideIndex],
      title: editTitle,
      subtitle: editSubtitle,
      bullets: editBullets,
      layout: editLayout,
      metricValue: editMetricValue || undefined,
      metricLabel: editMetricLabel || undefined,
      quoteAuthor: editQuoteAuthor || undefined,
    };
    setSlides(updated);
  };

  const handleAddSlide = () => {
    const newSlide: SlideItem = {
      id: `custom-slide-${Date.now()}`,
      title: "New Presentation Slide",
      subtitle: "Add a compelling subtitle describing this section",
      bullets: [
        "Detail item points for your business pitch here",
        "Add secondary metrics to expand on slides layout",
        "Introduce corporate parameters or technical targets"
      ],
      layout: "split"
    };
    setSlides([...slides, newSlide]);
    setCurrentSlideIndex(slides.length);
  };

  const handleDeleteSlide = () => {
    if (slides.length <= 1) return; // Prevent deleting the sole slide
    const updated = slides.filter((_, idx) => idx !== currentSlideIndex);
    setSlides(updated);
    setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1));
  };

  const handleBulletChange = (idx: number, newVal: string) => {
    const nextB = [...editBullets];
    nextB[idx] = newVal;
    setEditBullets(nextB);
  };

  const handleAddBulletLine = () => {
    setEditBullets([...editBullets, "New bullet detail criteria line"]);
  };

  const handleDeleteBulletLine = (idx: number) => {
    if (editBullets.length <= 1) return;
    setEditBullets(editBullets.filter((_, i) => i !== idx));
  };

  const theme = ACCENT_THEMES[activeThemeIndex];

  return (
    <div className="w-full lg:w-[500px] xl:w-[600px] border-l border-slate-200 bg-white flex flex-col h-full overflow-hidden shadow-2xl relative z-40 transition-all duration-300">
      
      {/* Workbench Header Tab Panel */}
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4.5 w-4.5 text-emerald-400" />
          <h3 className="text-xs font-bold tracking-wider uppercase font-mono">Creative Workbench</h3>
        </div>
        
        {/* Toggle Controls */}
        <div className="flex gap-1 bg-slate-800 p-0.5 rounded-lg border border-slate-700/60">
          <button
            onClick={() => setActiveTab('html-sandbox')}
            className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'html-sandbox'
                ? 'bg-slate-900 text-emerald-400 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            <span>HTML Sandbox</span>
          </button>
          <button
            onClick={() => setActiveTab('slide-builder')}
            className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all flex items-center gap-1.5 ${
              activeTab === 'slide-builder'
                ? 'bg-slate-900 text-emerald-400 shadow-xs'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Presentation className="h-3.5 w-3.5" />
            <span>PPT Slides Creator</span>
          </button>
        </div>

        {/* Close Handle Button */}
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors p-1"
          title="Minimize Panel"
        >
          <Minimize2 className="h-4 w-4" />
        </button>
      </div>

      {/* --- WORKSPACE CONTENT --- */}
      <div className="flex-1 overflow-y-auto flex flex-col min-h-0 bg-slate-50/50">
        
        {/* TAB 1: HTML LIVE PREVIEW RUNNER (SANDBOX) */}
        {activeTab === 'html-sandbox' && (
          <div className="flex-1 flex flex-col min-h-0">
            
            {/* Quick Presets row */}
            <div className="p-3 border-b border-slate-200 bg-white space-y-2">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 font-sans block text-left">
                ⚡ Native HTML Sandbox Templates:
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {HTML_TEMPLATES.map((tpl, i) => (
                  <button
                    key={i}
                    onClick={() => loadHtmlTemplate(tpl.code)}
                    className="flex-shrink-0 text-[11px] font-semibold border border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded-lg px-2.5 py-1.5 transition-all text-left"
                  >
                    <div className="font-bold text-slate-900">{tpl.name}</div>
                    <div className="text-[9px] text-slate-405 font-medium truncate max-w-[140px]">{tpl.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Split Editor / Previewer Container */}
            <div className="flex-1 flex flex-col min-h-0 select-text">
              
              {/* Core Code Textarea Editor */}
              <div className="flex-1 flex flex-col min-h-[180px] border-b border-slate-200">
                <div className="bg-slate-900 px-4 py-2 flex items-center justify-between text-slate-300 font-mono text-[10px]">
                  <span className="flex items-center gap-1.5">
                    <FileCode className="h-3.5 w-3.5 text-emerald-400" />
                    <span>SANDBOX_WORKSPACE_MAIN.HTML</span>
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyCode}
                      className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {copiedCode ? <Check className="h-3 w-3 text-emerald-400 font-bold" /> : <Copy className="h-3 w-3" />}
                      <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={handleResetCode}
                      className="hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                      title="Reset editor contents"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>

                <textarea
                  value={sandboxCode}
                  onChange={(e) => setSandboxCode(e.target.value)}
                  className="flex-1 p-4 bg-slate-950 text-slate-100 text-xs font-mono focus:outline-none resize-none border-0 leading-relaxed font-normal selection:bg-emerald-500/20"
                  placeholder="Paste or write HTML code with inline CSS/Tailwind here..."
                />
              </div>

              {/* Sandbox Control Header */}
              <div className="bg-slate-200 border-y border-slate-300 px-4 py-2 flex items-center justify-between select-none">
                <div className="flex items-center gap-2">
                  <div className="flex space-x-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 ml-2 tracking-tight">Cloud Simulation Window Preview</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onPasteToChat(`Run this HTML dynamic code and help me improve it:\n\`\`\`html\n${sandboxCode}\n\`\`\``);
                    }}
                    className="px-2.5 py-1 hover:bg-slate-300/80 rounded border border-slate-300 text-[10px] font-bold text-slate-700 transition-colors cursor-pointer"
                  >
                    Discuss in Chat
                  </button>
                  <button
                    onClick={runCodeInSandbox}
                    className="bg-emerald-600 hover:bg-emerald-505 text-white px-3 py-1 rounded inline-flex items-center gap-1 text-[10px] font-extrabold tracking-wide uppercase transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <Play className="h-3 w-3 fill-white" />
                    <span>Execute Sandbox API</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Iframe Sandbox Rendering Window */}
              <div className="flex-1 bg-white relative min-h-[220px]">
                {srcDoc ? (
                  <iframe
                    title="HTML Runner Sandbox Live Preview"
                    srcDoc={srcDoc}
                    sandbox="allow-scripts"
                    className="w-full h-full border-0 absolute inset-0 bg-white"
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-slate-400 text-center select-none space-y-2 bg-slate-50">
                    <Monitor className="h-8 w-8 text-slate-300 animate-pulse" />
                    <p className="text-xs font-semibold text-slate-500">Live preview environment pending compile...</p>
                    <p className="text-[10px] text-slate-400">Click the green Execute button to run compilation sequence.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {/* TAB 2: PPT BUSINESS PRESENTATION SLIDES CREATOR */}
        {activeTab === 'slide-builder' && (
          <div className="flex-1 flex flex-col overflow-hidden min-h-0 select-none">
            
            {/* Template select option */}
            <div className="p-3 border-b border-slate-200 bg-white">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 font-sans block text-left mb-2">
                📂 Initialize Presentation Deck Theme:
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {DEMO_DECKS.map((deck, i) => (
                  <button
                    key={i}
                    onClick={() => handleLoadDeck(deck)}
                    className="flex-shrink-0 text-[11px] font-semibold border border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100 rounded-lg px-3 py-1.5 transition-all text-left max-w-[200px]"
                  >
                    <div className="font-extrabold text-slate-900 truncate">{deck.name}</div>
                    <div className="text-[9px] text-slate-450 truncate">{deck.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Split layout: Top Presentation Viewer / Bottom Slide Editor Toolbar */}
            <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-6">
              
              {/* Slideshow Presentation Viewer Panel */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                  <span className="font-bold flex items-center gap-1">
                    <Layers className="h-4 w-4 text-emerald-500" />
                    <span>{currentDeckName.toUpperCase()}</span>
                  </span>
                  <span>Slide {currentSlideIndex + 1} of {slides.length}</span>
                </div>

                {/* THE PROFESSIONAL PROJECTION SCREEN */}
                <div className={`relative aspect-video rounded-3xl border shadow-xl flex flex-col justify-between overflow-hidden p-6 md:p-8 transition-all duration-300 select-text ${theme.bg} ${theme.border} ${theme.text}`}>
                  {/* Decorative ambient background circle */}
                  <div className="absolute top-[-20%] right-[-10%] w-60 h-60 rounded-full bg-white/[0.03] blur-3xl pointer-events-none" />
                  
                  {/* Projected Slide Header */}
                  {slides[currentSlideIndex]?.layout !== 'title' && (
                    <header className="flex justify-between items-center text-left border-b border-white/[0.08] pb-3 mb-2">
                      <span className="text-[10px] font-extrabold tracking-widest uppercase opacity-75">{currentDeckName}</span>
                      <span className="text-[10px] font-mono opacity-50">Slide_0{currentSlideIndex + 1}</span>
                    </header>
                  )}

                  {/* Render based on selected layout */}
                  <div className="flex-1 flex flex-col justify-center my-auto">
                    {slides[currentSlideIndex]?.layout === 'title' ? (
                      // 1. TITLE LAYOUT
                      <div className="text-center space-y-4 py-4">
                        <span className="inline-block h-1 w-12 bg-emerald-500 rounded-full mb-1" />
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight uppercase font-sans">
                          {slides[currentSlideIndex].title}
                        </h1>
                        <p className={`text-xs md:text-sm max-w-md mx-auto opacity-80 leading-relaxed font-sans`}>
                          {slides[currentSlideIndex].subtitle}
                        </p>
                      </div>
                    ) : slides[currentSlideIndex]?.layout === 'quote' ? (
                      // 2. QUOTE LAYOUT
                      <div className="text-center md:px-8 space-y-4">
                        <p className="text-sm md:text-base italic font-serif leading-relaxed opacity-90">
                          "{slides[currentSlideIndex].title}"
                        </p>
                        <p className={`text-[11px] font-mono tracking-widest uppercase ${theme.accentText} font-bold`}>
                          {slides[currentSlideIndex].quoteAuthor || "- Author Profile"}
                        </p>
                      </div>
                    ) : slides[currentSlideIndex]?.layout === 'metrics' ? (
                      // 3. METRICS CALLOUT
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
                        <div className="md:col-span-2 text-center md:text-left py-2">
                          <p className="text-4xl md:text-5xl font-black tracking-tighter text-emerald-400 bg-clip-text text-transparent bg-gradient-to-tr from-emerald-400 to-teal-300">
                            {slides[currentSlideIndex].metricValue || "100%"}
                          </p>
                          <p className="text-[10px] font-mono uppercase tracking-widest text-slate-400 mt-1">
                            {slides[currentSlideIndex].metricLabel || "Metric Label Reference"}
                          </p>
                        </div>
                        <div className="md:col-span-3 text-left space-y-2">
                          <h2 className="text-base font-bold uppercase tracking-tight">{slides[currentSlideIndex].title}</h2>
                          <p className="text-[11px] opacity-75 leading-relaxed">{slides[currentSlideIndex].subtitle}</p>
                        </div>
                      </div>
                    ) : (
                      // 4. SPLIT / BENTO STANDARDS WITH BULLETS
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start py-2">
                        <div className="text-left space-y-2">
                          <h2 className="text-base md:text-lg font-black tracking-tight uppercase leading-snug">
                            {slides[currentSlideIndex]?.title}
                          </h2>
                          <p className="text-[11px] opacity-75 font-sans leading-normal">
                            {slides[currentSlideIndex]?.subtitle}
                          </p>
                        </div>

                        {/* Bullets List Panel */}
                        <ul className="text-left space-y-2 bg-white/[0.02] p-3 rounded-2xl border border-white/[0.04]">
                          {slides[currentSlideIndex]?.bullets.map((bullet, bidx) => (
                            <li key={bidx} className="flex gap-2 text-xs leading-relaxed opacity-90 items-start select-text">
                              <span className={`h-1 w-1 bg-emerald-400 rounded-full mt-1.5 shrink-0`} />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Projected Slide Footer */}
                  <footer className="flex justify-between items-center text-[9px] opacity-50 pt-2 border-t border-white/[0.05]">
                    <span>&copy; NextRay Intelligence System</span>
                    <span className="font-mono">Node Index Reference: 00{currentSlideIndex + 1}</span>
                  </footer>
                </div>

                {/* Slideshow Player Controllers Grid */}
                <div className="flex flex-col gap-2.5 bg-white p-3.5 rounded-2xl border border-slate-205 shadow-xs">
                  <div className="flex justify-between items-center w-full">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        onClick={() => {
                          const nextidx = (activeThemeIndex + 1) % ACCENT_THEMES.length;
                          setActiveThemeIndex(nextidx);
                        }}
                        className="p-1 px-2 hover:bg-slate-50 text-slate-500 rounded border border-slate-200 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                        title="Cycles background projection themes"
                      >
                        <Palette className="h-3.5 w-3.5" />
                        <span>Switch Theme</span>
                      </button>
                      <button
                        onClick={() => setIsFullscreenSlide(true)}
                        className="p-1 px-2.5 bg-slate-900 border border-slate-900 text-emerald-400 hover:text-emerald-300 rounded text-[10px] font-extrabold inline-flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                        title="Open Fullscreen Presenter Mode"
                      >
                        <Maximize2 className="h-3.5 w-3.5" />
                        <span>View Fullscreen</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        disabled={currentSlideIndex === 0}
                        onClick={() => setCurrentSlideIndex(currentSlideIndex - 1)}
                        className="p-1 px-2 border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-40 rounded transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-[11px] font-bold font-mono px-2">0{currentSlideIndex + 1} / 0{slides.length}</span>
                      <button
                        disabled={currentSlideIndex === slides.length - 1}
                        onClick={() => setCurrentSlideIndex(currentSlideIndex + 1)}
                        className="p-1 px-2 border border-slate-200 hover:bg-slate-50 text-slate-700 disabled:opacity-40 rounded transition-colors cursor-pointer"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2.5 border-t border-slate-100 w-full">
                    <div className="flex gap-2">
                      <button
                        onClick={handleDownloadDeckAsHtml}
                        className="p-1 px-2 border border-slate-200 hover:bg-slate-50 text-slate-650 hover:text-slate-900 rounded text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                        title="Download standard standalone presentation page"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download HTML Deck</span>
                      </button>
                      <button
                        onClick={handleDownloadDeckAsJson}
                        className="p-1 px-2 border border-slate-200 hover:bg-slate-50 text-slate-650 hover:text-slate-900 rounded text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                        title="Download JSON schema deck representation"
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>Download JSON</span>
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        onPasteToChat(`Here is our Business PPT presentation plan:\n\n${slides.map((s, idx) => `**Slide ${idx+1}: ${s.title}**\nSubtitle: ${s.subtitle}\nBullets:\n${s.bullets.map(b => `- ${b}`).join('\n')}`).join('\n\n')}`);
                      }}
                      className="p-1 px-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-800 rounded text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer"
                      title="Send slides text representation to prompt AI next"
                    >
                      <span>Forward to AI Chat</span>
                    </button>
                  </div>
                </div>

                {/* SLIDE VISUAL INTELLIGENCE: QUICK AI EDIT BOARD */}
                <div className="bg-gradient-to-r from-emerald-50/40 to-teal-50/40 rounded-2xl border border-emerald-100 p-4 space-y-2 text-left">
                  <div className="flex items-center gap-1.5 text-emerald-800 text-xs font-bold">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Quick Edit Slide with AI</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Enter directives to customize this specific slide (e.g., "Add a metric for user experience rating 98%" or "Add bullets describing security protocols"). Let AI modify it immediately!
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiEditPrompt}
                      onChange={(e) => setAiEditPrompt(e.target.value)}
                      placeholder="e.g. Change layout to metrics and add bullet details..."
                      className="flex-1 bg-white px-3 py-1.5 border border-emerald-200/60 rounded-xl text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-emerald-400"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAiEdit();
                      }}
                    />
                    <button
                      onClick={handleAiEdit}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-4 py-1.5 text-xs font-bold transition-all active:scale-[0.97] cursor-pointer"
                    >
                      Apply AI Edit
                    </button>
                  </div>
                </div>
              </div>


              {/* SLIDE VISUAL BUILDER MODULE EDITOR */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 text-left select-text">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-tight">Active Slide Editor Workbench</span>
                    <p className="text-[10px] text-slate-400">Modify typography, layouts, bullets and metrics live.</p>
                  </div>
                  
                  <div className="flex gap-1.5">
                    <button
                      onClick={handleAddSlide}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] uppercase tracking-wide px-3 py-1.5 h-8 rounded-lg inline-flex items-center gap-1 transition-all active:scale-95 shadow-md cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Slide</span>
                    </button>
                    <button
                      disabled={slides.length <= 1}
                      onClick={handleDeleteSlide}
                      className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 h-8 font-bold text-[10px] uppercase tracking-wide px-3 rounded-lg inline-flex items-center gap-1 disabled:opacity-40 transition-all cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Drop Slide</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Title & Subtitle Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block">Slide Title Text</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => { setEditTitle(e.target.value); }}
                      className="w-full px-3 py-2 border border-slate-210 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-200 text-slate-700 bg-slate-50"
                      placeholder="e.g. Solution pitch overview"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block">Slide Subtitle or Caption</label>
                    <input
                      type="text"
                      value={editSubtitle}
                      onChange={(e) => { setEditSubtitle(e.target.value); }}
                      className="w-full px-3 py-2 border border-slate-210 rounded-xl text-xs focus:outline-none focus:border-indigo-200 text-slate-700 bg-slate-50"
                      placeholder="e.g. Explaining architectural layouts"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Select Layout */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block">Visual slide layout model</label>
                    <select
                      value={editLayout}
                      onChange={(e: any) => { setEditLayout(e.target.value); }}
                      className="w-full px-3 py-2 border border-slate-210 rounded-xl text-xs font-semibold bg-slate-50 text-slate-600 focus:outline-none cursor-pointer"
                    >
                      <option value="title">📌 Title layout (Centered banner)</option>
                      <option value="split">📖 Bullet columns (Dual pane splitting)</option>
                      <option value="bento">🍱 Bento parameters grid showcase</option>
                      <option value="quote">💬 Large quotes highlights panel</option>
                      <option value="metrics">⚡ Large Stat Metrics Callout</option>
                    </select>
                  </div>

                  {/* Theme Accent status line */}
                  <div className="space-y-1 select-none">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block">Theme Visual Frame Preset</label>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {ACCENT_THEMES.map((th, tidx) => (
                        <button
                          key={tidx}
                          type="button"
                          onClick={() => setActiveThemeIndex(tidx)}
                          className={`text-[9px] font-bold px-2 py-1 rounded border capitalize transition-all select-none cursor-pointer ${
                            activeThemeIndex === tidx
                              ? 'bg-slate-900 border-slate-900 text-emerald-400 font-extrabold shadow-sm'
                              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-500'
                          }`}
                        >
                          {th.name.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Optional Metric Form details */}
                {editLayout === 'metrics' && (
                  <div className="grid grid-cols-2 gap-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-400 block">Metric Output value</label>
                      <input
                        type="text"
                        value={editMetricValue}
                        onChange={(e) => setEditMetricValue(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs font-bold text-indigo-700 focus:outline-none"
                        placeholder="e.g. 99.8%"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-400 block">Metric descriptive label</label>
                      <input
                        type="text"
                        value={editMetricLabel}
                        onChange={(e) => setEditMetricLabel(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs text-slate-600 focus:outline-none"
                        placeholder="e.g. Average Server Uptime Nodes"
                      />
                    </div>
                  </div>
                )}

                {/* Optional Author text for quote layout */}
                {editLayout === 'quote' && (
                  <div className="p-3 bg-amber-50/30 border border-amber-100 rounded-2xl space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-400 block">Quote Author Profile Name</label>
                    <input
                      type="text"
                      value={editQuoteAuthor}
                      onChange={(e) => setEditQuoteAuthor(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 bg-white rounded-lg text-xs text-slate-700 focus:outline-none font-bold"
                      placeholder="e.g. Steve Jobs, Apple Founder"
                    />
                  </div>
                )}

                {/* Bullets Management block */}
                {editLayout !== 'title' && editLayout !== 'quote' && (
                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase font-bold text-slate-400 block">Slide Bullet Points / Highlighting Parameters</label>
                      <button
                        onClick={handleAddBulletLine}
                        className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        + Add Detail Point Row
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1 scrollbar-thin">
                      {editBullets.map((bullet, idx) => (
                        <div key={idx} className="flex gap-2 items-center">
                          <span className="text-[10px] font-mono text-slate-350">{idx+1}.</span>
                          <input
                            type="text"
                            value={bullet}
                            onChange={(e) => handleBulletChange(idx, e.target.value)}
                            className="flex-1 px-2.5 py-1.5 border border-slate-200 bg-slate-50/50 rounded-lg text-xs text-slate-700 focus:outline-none focus:bg-white"
                          />
                          <button
                            disabled={editBullets.length <= 1}
                            onClick={() => handleDeleteBulletLine(idx)}
                            className="p-1 hover:bg-red-50 text-slate-350 hover:text-red-500 rounded disabled:opacity-40"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Apply Button */}
                <button
                  type="button"
                  onClick={handleUpdateSlide}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3.5 rounded-xl uppercase tracking-wider shadow-lg active:scale-[0.99] transition-all cursor-pointer text-center"
                >
                  Apply & Render Updates Live
                </button>
              </div>

            </div>
          </div>
        )}

      </div>

      {/* FULLSCREEN PRESENTATION MODE OVERLAY */}
      {isFullscreenSlide && (
        <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col justify-between p-6 md:p-12 text-slate-100 select-text font-sans">
          {/* Background Ambient Orbs */}
          <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

          {/* Fullscreen Header */}
          <header className="flex justify-between items-center border-b border-white/[0.08] pb-4 z-10 select-none">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <div className="text-sm font-black tracking-tight uppercase bg-gradient-to-r from-emerald-400 to-teal-200 bg-clip-text text-transparent">
                {currentDeckName}
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-xs">
              <span className="text-slate-500 font-mono">Presenting Slide {currentSlideIndex + 1} of {slides.length}</span>
              <button
                onClick={() => setIsFullscreenSlide(false)}
                className="bg-white/10 hover:bg-white/15 text-white active:scale-95 px-3.5 py-1.5 rounded-xl font-bold tracking-wide uppercase transition-all flex items-center gap-1.5 cursor-pointer border border-white/5"
                title="Press Esc to exit presenter"
              >
                <Minimize2 className="h-3.5 w-3.5" />
                <span>Exit Presenter</span>
              </button>
            </div>
          </header>

          {/* Large Projection Screen */}
          <div className="flex-1 flex flex-col justify-center max-w-5xl mx-auto w-full py-8 md:py-16">
            {slides[currentSlideIndex]?.layout === 'title' ? (
              <div className="text-center space-y-6">
                <span className="inline-block h-1.5 w-20 bg-emerald-400 rounded-full mb-2" />
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-none uppercase bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                  {slides[currentSlideIndex].title}
                </h1>
                <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
                  {slides[currentSlideIndex].subtitle}
                </p>
              </div>
            ) : slides[currentSlideIndex]?.layout === 'quote' ? (
              <div className="text-center max-w-4xl mx-auto space-y-6">
                <p className="text-2xl md:text-4xl italic font-serif leading-relaxed text-slate-105">
                  "{slides[currentSlideIndex].title}"
                </p>
                <p className="text-sm md:text-base font-mono tracking-widest uppercase text-emerald-400 font-bold">
                  {slides[currentSlideIndex].quoteAuthor || "- Author Profile"}
                </p>
              </div>
            ) : slides[currentSlideIndex]?.layout === 'metrics' ? (
              <div className="grid grid-cols-1 md:grid-cols-5 gap-8 items-center">
                <div className="md:col-span-2 text-center md:text-left py-4 border-r border-white/5 pr-4">
                  <p className="text-6xl md:text-8xl font-black bg-gradient-to-tr from-emerald-400 to-teal-300 bg-clip-text text-transparent tracking-tighter">
                    {slides[currentSlideIndex].metricValue || "100%"}
                  </p>
                  <p className="text-xs font-mono uppercase tracking-widest text-emerald-300 mt-2">
                    {slides[currentSlideIndex].metricLabel || "Metric Label Reference"}
                  </p>
                </div>
                <div className="md:col-span-3 text-left space-y-4">
                  <h2 className="text-2xl md:text-4xl font-bold uppercase tracking-tight text-white">{slides[currentSlideIndex].title}</h2>
                  <p className="text-sm md:text-base text-slate-400 leading-relaxed">{slides[currentSlideIndex].subtitle}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                <div className="text-left space-y-4">
                  <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white leading-tight">
                    {slides[currentSlideIndex]?.title}
                  </h2>
                  <p className="text-sm md:text-base text-slate-400 leading-relaxed">
                    {slides[currentSlideIndex]?.subtitle}
                  </p>
                </div>

                <ul className="text-left space-y-4 bg-white/[0.02] p-8 rounded-3xl border border-white/[0.04]">
                  {slides[currentSlideIndex]?.bullets.map((bullet, bidx) => (
                    <li key={bidx} className="flex gap-3 text-sm md:text-base leading-relaxed text-slate-300 items-start">
                      <span className="h-2 w-2 bg-emerald-400 rounded-full mt-2 shrink-0" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Fullscreen Navigation Footer Bar */}
          <footer className="flex justify-between items-center border-t border-white/[0.08] pt-6 z-10 select-none">
            <span className="text-[11px] text-slate-650 uppercase tracking-widest font-mono">Presenting Mode • Use Keypad Arrows (← and →) / Spacebar</span>
            
            <div className="flex gap-3 items-center font-sans">
              <button
                disabled={currentSlideIndex === 0}
                onClick={() => setCurrentSlideIndex(currentSlideIndex - 1)}
                className="bg-white/5 hover:bg-white/10 text-white disabled:opacity-20 px-4 py-2 rounded-xl border border-white/10 cursor-pointer text-xs font-bold"
              >
                Previous
              </button>
              <span className="text-xs font-bold font-mono px-2 text-slate-400">Slide {currentSlideIndex + 1} / {slides.length}</span>
              <button
                disabled={currentSlideIndex === slides.length - 1}
                onClick={() => setCurrentSlideIndex(currentSlideIndex + 1)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-20 px-5 py-2 rounded-xl font-extrabold cursor-pointer transition-all active:scale-95 text-xs"
              >
                Next Slide
              </button>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}
