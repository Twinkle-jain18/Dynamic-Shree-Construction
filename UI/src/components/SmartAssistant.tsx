import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles } from 'lucide-react';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  suggestions?: string[];
}

interface SmartAssistantProps {
  onAction?: (message: string, service?: string) => void;
}

// ─────────────────────────────────────────────────────────────
//  BOT RULES — ordered from most-specific to most-generic.
//  Each rule has:
//    exact   : phrases that must appear as whole words/phrases
//    partial : single keywords matched only if no exact rule wins
// ─────────────────────────────────────────────────────────────
interface BotRule {
  exact: string[];      // matched with word-boundary regex — high score (+3 each)
  partial?: string[];   // plain includes — low score (+1 each)
  reply: string;
  suggestions: string[];
}

const BOT_RULES: BotRule[] = [
  // ── GREETING ──────────────────────────────────────────────
  {
    exact: ['hello', 'hi', 'hey', 'good morning', 'good evening', 'good afternoon', 'namaste', 'hii', 'helo'],
    reply: "👋 Hello! Welcome to **Shree Constructions**! I'm your virtual assistant.\n\nHow can I help you today?",
    suggestions: ['What services do you provide?', 'Estimate construction cost', 'Contact your team'],
  },

  // ── INTERIOR DESIGN (before services so "interior" doesn't match "services" first) ──
  {
    exact: ['interior', 'interior design', 'semi modular', 'full interior', 'modular kitchen', 'home decor', 'decoration', 'inside design', 'inner design'],
    partial: ['modular', 'decor'],
    reply: "🎨 Yes! We provide **Interior Design** services:\n\n• **Semi-Modular**: Kitchen & Hall focus — adds ~8% to base cost.\n• **Full Interior**: Complete whole house interior — adds ~20% to base cost.\n\nOur designs are tailored to your lifestyle and budget preferences.\n\nWould you like to request a free consultation?",
    suggestions: ['Request consultation', 'Estimate cost with interior', 'Contact team'],
  },

  // ── EXTERIOR DESIGN ────────────────────────────────────────
  {
    exact: ['exterior', 'facade', 'elevation', 'landscape', 'outdoor design', 'outside design', 'compound wall'],
    partial: ['outdoor', 'elevation'],
    reply: "🌿 Our **Exterior & Facade** services include:\n\n• Premium facade design\n• Exterior wall texture & paint\n• Landscape planning\n• Compound wall & gate design\n\nExterior finishing adds approximately **5%** to the base construction cost.\n\nInterested in a design consultation?",
    suggestions: ['Request consultation', 'Estimate cost', 'Contact team'],
  },

  // ── COST ESTIMATION ────────────────────────────────────────
  {
    exact: ['cost', 'estimate', 'estimation', 'how much', 'calculator', 'calculate cost', 'construction cost', 'building cost', 'house cost', 'price', 'budget', 'rate per sqft', 'rate per sq ft'],
    partial: ['sqft', 'sq ft', 'square feet'],
    reply: "💰 You can use our **Cost Estimation Calculator** on this page!\n\nSimply enter:\n• 📍 Location (Rural / Urban / Metropolitan)\n• 📐 Built-up Area (in Sq.Ft)\n• 🏠 Number of Floors\n• 🪵 Material Quality (Standard / Premium / Luxury)\n• 🎨 Finishing Options\n\nYou will get an instant estimate based on real Indian market rates.\n\n⚠️ Note: This is an approximate estimate. Final pricing depends on materials and design.",
    suggestions: ['View all base rates', 'Request consultation', 'Contact expert team'],
  },

  // ── CONSTRUCTION MATERIALS ─────────────────────────────────
  {
    exact: ['material', 'materials', 'cement', 'steel', 'tmt', 'tmt steel', 'opc cement', 'concrete', 'bricks', 'quality tier', 'construction quality'],
    partial: ['reinforcement'],
    reply: "🪵 We use **3 quality tiers** for construction materials:\n\n• **Standard**: Budget-friendly, ISI-certified materials\n• **Premium**: High-grade TMT steel & OPC cement blends\n• **Luxury**: Top-tier imported materials & premium fittings\n\nThe quality tier directly affects the cost per sq.ft. Use our **Cost Calculator** to compare estimates!",
    suggestions: ['Estimate construction cost', 'View base rates', 'Contact team'],
  },

  // ── LOCATION / RATES ───────────────────────────────────────
  {
    exact: ['location', 'rural', 'urban', 'metropolitan', 'base rate', 'rate by location', 'region', 'city rate', 'village rate', 'all rates', 'view base rates'],
    reply: "📍 Our construction costs vary by **location type**:\n\n• 🏘️ **Rural**: ₹1,700 – ₹3,200 per sq.ft\n• 🏙️ **Urban**: ₹2,100 – ₹4,200 per sq.ft\n• 🌆 **Metropolitan**: ₹2,800 – ₹5,500 per sq.ft\n\nRates depend on material quality and local labor costs.\n\nTry our **Cost Calculator** for a detailed estimate!",
    suggestions: ['Estimate construction cost', 'Request consultation', 'Contact team'],
  },

  // ── FLOOR TYPES ────────────────────────────────────────────
  {
    exact: ['floor', 'floors', 'duplex', 'ground floor', 'g+1', 'g+2', 'g+3', 'storey', 'multi floor', 'multi storey', 'single floor', 'double floor'],
    reply: "🏠 We build all types of structures:\n\n• **Ground Floor**: Single-storey home — no extra charge\n• **Duplex (G+1)**: Two-floor home — adds 15% to base rate\n• **G+2 & above**: Multi-floor buildings — adds 10% per extra floor\n\nFor an accurate cost estimate, please use our **Cost Calculator** on this page!",
    suggestions: ['Estimate construction cost', 'Request consultation', 'Contact team'],
  },

  // ── TIMELINE / DURATION ────────────────────────────────────
  {
    exact: ['how long', 'timeline', 'duration', 'construction time', 'time to build', 'how many days', 'how many months', 'completion time', 'project duration'],
    partial: ['when will', 'how soon'],
    reply: "⏱️ Construction timelines depend on the project size:\n\n• 🏠 **Ground Floor Home**: 6–9 months\n• 🏠 **Duplex (G+1)**: 10–15 months\n• 🏢 **Commercial Buildings**: 12–24 months\n\nFor a precise timeline, our team will assess your project during the consultation.",
    suggestions: ['Request consultation', 'Estimate cost', 'Contact team'],
  },

  // ── EXACT QUOTE / GUARANTEE ────────────────────────────────
  {
    exact: ['exact price', 'fixed price', 'final price', 'exact cost', 'exact quote', 'guaranteed price', 'commitment', 'is estimate final', 'accurate estimate', 'precise estimate'],
    reply: "⚠️ Please note: Our calculator provides an **approximate estimate only**.\n\nFinal pricing may vary based on:\n• Actual material procurement costs\n• Site-specific conditions\n• Custom design requirements\n• Labour availability\n\nFor an exact quotation, please **contact our admin team** for a site visit.",
    suggestions: ['Contact team for exact quote', 'Request consultation', 'Estimate again'],
  },

  // ── CONTACT ────────────────────────────────────────────────
  {
    exact: ['contact', 'call us', 'phone number', 'whatsapp', 'email address', 'how to reach', 'get in touch', 'contact form', 'contact team', 'reach you', 'talk to someone'],
    reply: "📞 You can contact our team through the **Contact Section** on this page!\n\nOur team will respond within **24 hours** with:\n• Free initial consultation\n• Project feasibility assessment\n• Customized budget planning\n\nPlease scroll down to the **Contact Form** and submit your inquiry.",
    suggestions: ['Estimate cost first', 'What services do you provide?', 'View projects'],
  },

  // ── CONSULTATION ───────────────────────────────────────────
  {
    exact: ['consultation', 'free consultation', 'book appointment', 'schedule meeting', 'book meeting', 'consult expert', 'discuss project', 'book visit', 'site visit'],
    partial: ['appointment', 'schedule'],
    reply: "📅 We offer **Free Initial Consultations**!\n\nDuring the consultation, our experts will:\n• Assess your project requirements\n• Suggest suitable construction plans\n• Provide a customized budget estimate\n\nPlease fill out the **Contact Form** below to book your appointment.",
    suggestions: ['Go to Contact Form', 'Estimate cost', 'What services do you provide?'],
  },

  // ── PROJECT PORTFOLIO ──────────────────────────────────────
  {
    exact: ['portfolio', 'completed projects', 'past projects', 'your work', 'show projects', 'project gallery', 'projects done', 'what have you built', 'previous work'],
    reply: "📁 You can explore our **Project Portfolio** on this website!\n\nWe have completed:\n• 🏠 50+ Residential Bungalows\n• 🏢 Commercial Complexes\n• 🔨 Major Renovation Projects\n• 🏗️ Multi-floor Structures\n\nScroll up to the **Services** section to browse by category.",
    suggestions: ['Estimate my project cost', 'Contact team', 'Request consultation'],
  },

  // ── SERVICES (generic — last resort before fallback) ───────
  {
    exact: ['services', 'what services', 'what do you offer', 'what do you provide', 'what do you do', 'list of services'],
    partial: ['service'],
    reply: "🏗️ We provide the following services:\n\n• 🏠 Residential Construction\n• 🏢 Commercial Construction\n• 🎨 Interior Design (Semi & Full Modular)\n• 🌿 Exterior & Facade Design\n• 🔨 Renovation & Remodelling\n• 📐 Architectural Planning\n\nWould you like to know more about any specific service?",
    suggestions: ['Interior design details', 'Estimate construction cost', 'Contact for consultation'],
  },

  // ── THANK YOU / ACKNOWLEDGEMENT ────────────────────────────
  {
    exact: ['thank you', 'thanks', 'thank u', 'many thanks', 'got it', 'understood', 'makes sense'],
    reply: "😊 You're welcome! We're glad we could help.\n\nFeel free to ask anything else about **Shree Constructions**!\n\nReady to take the next step?",
    suggestions: ['Estimate construction cost', 'Contact team', 'View services'],
  },
];

// ─────────────────────────────────────────────
//  Fallback response for unrecognized input
// ─────────────────────────────────────────────
const FALLBACK_RESPONSE = {
  reply: "🤔 I'm sorry, I didn't quite understand that.\n\nI'm specialized in **construction-related queries**. Here's what I can help with:",
  suggestions: ['What services do you provide?', 'Estimate construction cost', 'Contact your team'],
};

const WELCOME_MESSAGE: Message = {
  id: 'init-1',
  sender: 'bot',
  text: "👋 Hello! Welcome to **Shree Constructions**!\n\nI'm your virtual assistant. I can help you with:\n\n🏗️ Construction services\n💰 Cost estimation guidance\n📁 Project portfolio\n📅 Consultation requests\n📞 Contact & support\n\nHow can I assist you today?",
  suggestions: ['What services do you provide?', 'Estimate construction cost', 'Contact your team'],
};

// ─────────────────────────────────────────────
//  Simple bold text renderer
// ─────────────────────────────────────────────
function RenderText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
//  Bot Response Engine — Scoring-based matcher
//
//  How it works:
//   • Each "exact" keyword is matched using \b word-boundary regex → +3 score
//   • Each "partial" keyword is matched using plain includes → +1 score
//   • The rule with the HIGHEST score wins (not just the first match)
//   • Ties broken by rule order (more specific rules are listed first)
// ─────────────────────────────────────────────────────────────
function getBotResponse(userText: string): { reply: string; suggestions: string[] } {
  const lower = userText.toLowerCase().trim();

  let bestScore = 0;
  let bestRule: BotRule | null = null;

  for (const rule of BOT_RULES) {
    let score = 0;

    // Exact/phrase match — word boundary aware — high weight
    for (const kw of rule.exact) {
      // Escape regex special chars in the keyword
      const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Use word boundary if kw is a single word, otherwise plain phrase match
      const pattern = kw.includes(' ')
        ? new RegExp(escaped, 'i')
        : new RegExp(`\\b${escaped}\\b`, 'i');
      if (pattern.test(lower)) score += 3;
    }

    // Partial match — plain includes — low weight
    if (rule.partial) {
      for (const kw of rule.partial) {
        if (lower.includes(kw)) score += 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestRule = rule;
    }
  }

  if (bestRule && bestScore > 0) {
    return { reply: bestRule.reply, suggestions: bestRule.suggestions };
  }

  return { reply: FALLBACK_RESPONSE.reply, suggestions: FALLBACK_RESPONSE.suggestions };
}

// ─────────────────────────────────────────────
//  Main Component
// ─────────────────────────────────────────────
export function SmartAssistant({ onAction }: SmartAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Add user message
    const userMsg: Message = { id: Date.now().toString(), sender: 'user', text: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Handle scroll actions for suggestions like "Contact Form" or "Calculator"
    const lower = trimmed.toLowerCase();
    if (lower.includes('contact') || lower.includes('form') || lower.includes('consultation')) {
      const contactSection = document.getElementById('contact');
      if (contactSection) {
        setTimeout(() => contactSection.scrollIntoView({ behavior: 'smooth' }), 800);
      }
      if (onAction) onAction(trimmed);
    }
    if (lower.includes('calculator') || lower.includes('estimate') || lower.includes('cost')) {
      const calcSection = document.getElementById('calculator');
      if (calcSection) {
        setTimeout(() => calcSection.scrollIntoView({ behavior: 'smooth' }), 800);
      }
    }

    // Generate bot reply with typing delay
    setTimeout(() => {
      const { reply, suggestions } = getBotResponse(trimmed);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: reply,
        suggestions,
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 900);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 md:bottom-8 md:right-8 w-14 h-14 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all duration-300 z-50 group ${
          isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'
        }`}
        aria-label="Open Smart Assistant"
      >
        <span className="absolute inset-0 w-full h-full bg-white opacity-0 group-hover:opacity-20 transition-opacity rounded-full" />
        <MessageSquare className="w-6 h-6" />
        {/* Ping indicator */}
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white animate-ping" />
        <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
      </button>

      {/* Chat Window */}
      <div
        className={`fixed bottom-4 right-4 md:bottom-8 md:right-8 w-[calc(100vw-32px)] md:w-[390px] h-[600px] max-h-[88vh] bg-card border border-border shadow-2xl rounded-2xl flex flex-col z-50 transition-all duration-300 transform origin-bottom-right ${
          isOpen ? 'scale-100 opacity-100' : 'scale-75 opacity-0 pointer-events-none'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-primary/5 rounded-t-2xl shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-display font-bold text-foreground text-sm">Shree Assistant</h3>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                  Online • Always available
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 font-body text-sm bg-muted/10">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col w-full ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className={`flex gap-2 max-w-[90%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                <div
                  className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center mt-1 ${
                    msg.sender === 'user'
                      ? 'bg-muted border border-border'
                      : 'bg-primary/10 border border-primary/30 text-primary'
                  }`}
                >
                  {msg.sender === 'user' ? (
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                  ) : (
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-primary text-white rounded-tr-sm shadow-md'
                      : 'bg-background border border-border text-foreground rounded-tl-sm shadow-sm'
                  }`}
                >
                  <RenderText text={msg.text} />
                </div>
              </div>

              {/* Quick Suggestion Chips */}
              {msg.sender === 'bot' && msg.suggestions && msg.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 ml-8 max-w-[90%]">
                  {msg.suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => sendMessage(s)}
                      className="px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-[11px] font-semibold hover:bg-primary hover:text-white transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 shrink-0 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="bg-background border border-border rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center h-4">
                  <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-background border-t border-border rounded-b-2xl shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            className="flex items-center gap-2 bg-muted/40 rounded-xl border border-border p-1 focus-within:ring-2 focus-within:ring-primary/20 transition-all"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about services, cost, projects..."
              className="flex-1 bg-transparent px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-9 h-9 shrink-0 flex items-center justify-center bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-40 transition-all shadow-md shadow-primary/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <p className="text-center mt-2 text-[9px] text-muted-foreground/50 uppercase tracking-widest font-bold">
            Shree Constructions Virtual Assistant
          </p>
        </div>
      </div>
    </>
  );
}
