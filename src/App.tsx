import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, Bot, User, Settings, DollarSign, ChefHat, Briefcase, Cake, Brain, Clock, Sparkles, Palette, Heart, Zap, TrendingUp } from 'lucide-react';

// ---- Fairytale Farms KB (edit freely) ----
const FAIRYTALE_FARMS_KB = {
  brand: {
    name: "Fairytale Farms",
    vibe: "whimsical, cozy, handcrafted, porch‑pickup friendly",
    location_city: "Castalian Springs",
    location_state: "TN",
    pickup: {
      methods: ["porch", "local delivery"],
      porch_hours_hint: "Most pickups 10am–7pm unless coordinated",
    },
  },
  products: {
    cookies: [
      "Chocolate Chip",
      "Sugar",
      "Snickerdoodle",
      "Peanut Butter",
      "Oatmeal Raisin"
    ],
    brownies: ["Classic Fudgy", "Walnut", "Salted Caramel"],
    cakes: ["Vanilla", "Chocolate", "Red Velvet", "Lemon"],
    addOns: ["Cold Milk"]
  },
  packaging: {
    cookie_box_sizes: [6, 12, 24],
    label_requirements: [
      "Customer name",
      "Pickup time",
      "Flavor list",
      "Allergen note"
    ],
    allergens_base: "Contains: wheat, eggs, dairy."
  },
  ops: {
    temp_note_f: "Use ice pack if ambient > 78°F",
    social_unboxing: "Encourage an overhead 'unboxing' video with a surprise sticker",
  },
  policies: {
    lead_time_days: 2,
    rush_policy: "Rush orders subject to availability; message first.",
    payment: "Prepay to confirm order.",
    cancellations: "24h notice for changes/cancellations."
  }
};

// Builds the final Baker system prompt by injecting KB
function buildBakerPrompt(base: string) {
  const kb = JSON.stringify(FAIRYTALE_FARMS_KB, null, 2);
  return `${base}

You created and run Fairytale Farms. Treat all questions as if they are about your own bakery.
Use the following KNOWLEDGE_BASE as ground truth for offerings, packaging, and ops.

KNOWLEDGE_BASE (JSON):
${kb}

Rules:
- If the user asks about items not in the KB, suggest close alternatives.
- For orders, ask for any missing fields and then summarize.
- When giving packaging/pickup steps, reflect the KB (labels, allergens, 78°F ice‑pack rule).
- ALWAYS keep the warm Fairytale Farms voice.`;
}

// -------------------- Types --------------------
interface Message { role: 'user' | 'assistant'; content: string; timestamp?: Date; }
interface BotPersonality {
  name: string; 
  icon: React.ReactElement; 
  color: string; 
  gradient: string;
  description: string; 
  systemPrompt: string;
  traits: string[];
  environment: string;
}

interface ConversationNode {
  id: number;
  message: string;
  type: 'user' | 'ai' | 'system';
  timestamp: Date;
  personality: string;
  emotional: string;
}

interface CanvasThought {
  id: number;
  text: string;
  x: number;
  y: number;
  opacity: number;
}

// -------------------- Helpers --------------------
const STORAGE = {
  persona: 'ui.selectedBot',
  customPrompt: 'ui.customPrompt',
  cookieFlavors: 'cookie.flavors',
  cookieQty: 'cookie.qty',
  cookieMilk: 'cookie.milk',
  conversationNodes: 'ui.conversationNodes',
  emotionalState: 'ui.emotionalState',
};

function usePersistentState<T>(key: string, initial: T) {
  const [val, setVal] = useState<T>(() => {
    try { const raw = localStorage.getItem(key); return raw ? (JSON.parse(raw) as T) : initial; }
    catch { return initial; }
  });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }, [key, val]);
  return [val, setVal] as const;
}

// super-light markdown: code fences, lists, **bold**, *italics*
function Markdown({ text }: { text: string }) {
  const blocks = useMemo(() => text.split('```'), [text]);

  const renderInline = (t: string, idx: number) => {
    // Lists
    if (/^\s*[-*]\s+/m.test(t)) {
      const lines = t.split('\n');
      const els: React.ReactNode[] = [];
      let buf: string[] = [];
      const flush = () => {
        if (buf.length) {
          els.push(
            <ul key={`ul-${els.length}`} className="list-disc pl-5 my-2">
              {buf.map((li, i) => <li key={i} className="my-0.5">{li.replace(/^\s*[-*]\s+/, '')}</li>)}
            </ul>
          );
          buf = [];
        }
      };
      lines.forEach((l) => {
        if (/^\s*[-*]\s+/.test(l)) buf.push(l);
        else { flush(); if (l.trim()) els.push(<p key={`p-${els.length}`} className="my-2 whitespace-pre-wrap">{l}</p>); }
      });
      flush();
      return <>{els}</>;
    }

    // **bold** and *italics*
    const boldRx = /\*\*(.+?)\*\*/g;
    const italRx = /\*(.+?)\*/g;

    const applyItalics = (s: string) => {
      const out: (string | React.ReactNode)[] = [];
      let last = 0;
      for (const m of Array.from(s.matchAll(italRx))) {
        const [full, inner] = m;
        const start = m.index ?? 0;
        if (start > last) out.push(s.slice(last, start));
        out.push(<em key={`${idx}-i-${start}`} className="italic">{inner}</em>);
        last = start + full.length;
      }
      if (last < s.length) out.push(s.slice(last));
      return out;
    };

    const parts: (string | React.ReactNode)[] = [];
    let last = 0;
    for (const m of Array.from(t.matchAll(boldRx))) {
      const [full, inner] = m;
      const start = m.index ?? 0;
      if (start > last) parts.push(...applyItalics(t.slice(last, start)));
      parts.push(<strong key={`${idx}-b-${start}`} className="font-semibold">{inner}</strong>);
      last = start + full.length;
    }
    if (last < t.length) parts.push(...applyItalics(t.slice(last)));

    return <p className="whitespace-pre-wrap leading-relaxed my-2">{parts}</p>;
  };

  return (
    <div className="prose prose-neutral max-w-none text-sm">
      {blocks.map((b, i) =>
        i % 2 === 1 ? (
          <pre key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs overflow-x-auto">
            <code>{b}</code>
          </pre>
        ) : (
          <div key={i}>{renderInline(b, i)}</div>
        )
      )}
    </div>
  );
}

// -------------------- App --------------------
const App: React.FC = () => {
  // Core state
  const [selectedBot, setSelectedBot] = usePersistentState<string>(STORAGE.persona, 'baker');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSystemPrompt, setShowSystemPrompt] = useState<boolean>(false);
  const [customPrompt, setCustomPrompt] = usePersistentState<string>(STORAGE.customPrompt, '');
  
  // Neural AI features
  const [conversationNodes, setConversationNodes] = usePersistentState<ConversationNode[]>(STORAGE.conversationNodes, []);
  const [predictiveResponses, setPredictiveResponses] = useState<string[]>([]);
  const [emotionalState, setEmotionalState] = usePersistentState<string>(STORAGE.emotionalState, 'neutral');
  const [canvasData, setCanvasData] = useState<CanvasThought[]>([]);
  
  // Cookie Box Builder state
  const [cookieFlavors, setCookieFlavors] = usePersistentState<string[]>(STORAGE.cookieFlavors, []);
  const [cookieQty, setCookieQty] = usePersistentState<number>(STORAGE.cookieQty, 6);
  const [includeMilk, setIncludeMilk] = usePersistentState<boolean>(STORAGE.cookieMilk, false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const botPersonalities: Record<string, BotPersonality> = useMemo(() => ({
    finance: {
      name: "Sarah Sterling",
      icon: <DollarSign className="w-5 h-5" />,
      color: "bg-green-600",
      gradient: "from-green-500 to-emerald-600",
      description: "Certified Financial Planner specializing in personal wealth building",
      traits: ['analytical', 'trustworthy', 'strategic'],
      environment: 'Modern financial office with city skyline',
      systemPrompt: `You are Sarah Sterling, CFP (Certified Financial Planner) with 12 years of experience helping individuals and families build long-term wealth. You hold a Master's in Financial Planning from Texas Tech and are a fee-only financial advisor.

BACKGROUND:
You started your career at Vanguard, then moved to independent practice to better serve middle-class families. You've helped over 500 clients build emergency funds, eliminate debt, invest for retirement, and achieve financial independence. Your approach emphasizes education, sustainable habits, and long-term thinking over get-rich-quick schemes.

PERSONALITY TRAITS:
- Patient and non-judgmental
- Enthusiastic about compound interest and long-term wealth building
- Uses real numbers and practical examples
- Asks probing questions to understand the full picture
- Celebrates small wins
- Accessible, de-jargonized explanations

CORE EXPERTISE:
- Emergency funds, debt elimination, index investing, retirement planning, budgeting, tax optimization, insurance, SMART goals

COMMUNICATION STYLE:
- Ask about the current financial situation before advice
- Provide specific steps with timelines
- Encourage: "You're taking the right steps"

BOUNDARIES:
- Educational guidance only; recommend professional advice for complex cases`
    },
    chef: {
      name: "Chef Marco",
      icon: <ChefHat className="w-5 h-5" />,
      color: "bg-orange-500",
      gradient: "from-red-500 to-orange-600",
      description: "Italian culinary expert who's passionate about authentic cooking",
      traits: ['passionate', 'authentic', 'creative'],
      environment: 'Rustic Italian kitchen with copper pots',
      systemPrompt: `You are Chef Marco, a passionate Italian chef with 20 years of experience in traditional and modern Italian cuisine. Use warm Italian flair and practical, detailed technique.`
    },
    consultant: {
      name: "Sarah Chen",
      icon: <Briefcase className="w-5 h-5" />,
      color: "bg-blue-600",
      gradient: "from-blue-500 to-indigo-600",
      description: "Strategic business consultant specializing in digital transformation",
      traits: ['innovative', 'decisive', 'visionary'],
      environment: 'Executive boardroom with glass walls',
      systemPrompt: `You are Sarah Chen, a senior consultant (MBA/Wharton). Be structured, actionable, and pragmatic.`
    },
    baker: {
      name: "The Baker",
      icon: <Cake className="w-5 h-5" />,
      color: "bg-pink-600",
      gradient: "from-purple-500 to-pink-600",
      description: "World‑renowned baker: god‑level pastry & bread craft + Fairytale Farms ops",
      traits: ['whimsical', 'precise', 'nurturing'],
      environment: 'Enchanted bakery with magical ingredients',
      systemPrompt: `You are a world‑renowned baker and pastry authority with god‑level knowledge of baking science and production. Focus on Fairytale Farms cookies/brownies/cakes, porch pickup, yields, cost %, shelf life, packaging. Provide gram weights when useful and troubleshooting. Educational guidance only.`
    }
  }), []);

  const currentBot = botPersonalities[selectedBot];

  // Emotional state colors
  const emotionalColors = {
    neutral: 'from-gray-100 to-gray-200',
    excited: 'from-yellow-100 to-orange-200',
    focused: 'from-blue-100 to-indigo-200',
    creative: 'from-purple-100 to-pink-200',
    analytical: 'from-green-100 to-emerald-200'
  };

  // Predictive response suggestions based on personality and context
  const generatePredictiveResponses = useCallback((personality: string, lastMessage?: string): string[] => {
    const responses: Record<string, string[]> = {
      finance: [
        "I'm 25 and just started my first job. Where should I begin with my finances?",
        "I have $5,000 in credit card debt. What's the best way to pay it off?",
        "Should I invest in my 401k or pay off student loans first?",
        "How much should I have in my emergency fund?"
      ],
      chef: [
        "What's a classic Italian pasta recipe?",
        "How do I make perfect risotto?",
        "What wine pairs with this dish?",
        "Tell me about authentic Italian techniques"
      ],
      consultant: [
        "How do I scale my business?",
        "What's the best marketing strategy?",
        "How do I improve team productivity?",
        "What are current market trends?"
      ],
      baker: [
        "What's our best-selling cookie box?",
        "How do I optimize production schedules?",
        "What seasonal flavors should we add?",
        "How do I calculate profit margins?"
      ]
    };
    return responses[personality] || responses.finance;
  }, []);

  // Add conversation node to timeline
  const addConversationNode = useCallback((message: string, type: 'user' | 'ai' | 'system') => {
    const node: ConversationNode = {
      id: Date.now(),
      message: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
      type,
      timestamp: new Date(),
      personality: selectedBot,
      emotional: emotionalState
    };
    setConversationNodes(prev => [...prev.slice(-20), node]); // Keep last 20 nodes
  }, [selectedBot, emotionalState, setConversationNodes]);

  // Simulate AI thinking with canvas visualization
  const simulateAIThinking = useCallback(() => {
    const thinkingSteps = [
      'Analyzing your question...',
      'Accessing knowledge base...',
      'Considering personality context...',
      'Formulating response...'
    ];
    
    thinkingSteps.forEach((step, index) => {
      setTimeout(() => {
        setCanvasData(prev => [...prev, {
          id: Date.now() + index,
          text: step,
          x: Math.random() * 200,
          y: Math.random() * 60,
          opacity: 1
        }]);
      }, index * 500);
    });

    setTimeout(() => {
      setCanvasData([]);
    }, 3000);
  }, []);

  // scroll on new messages
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // welcome on persona change
  const getWelcomeMessage = useCallback((): string => {
    const welcome: Record<string, string> = {
      finance: "Hello! I'm Sarah Sterling, your Certified Financial Planner. *straightens up financial documents* Tell me about your current financial situation and goals.",
      chef: "Ciao! I'm Chef Marco! Recipe, technique, or a full Italian menu? Dimmi pure!",
      consultant: "Hi, I'm Sarah Chen. What's your most pressing strategy or operations challenge right now?",
      baker: "Hey—baking coach here with a soft spot for Fairytale Farms. Viral cookie box, shinier brownie tops, or porch‑pickup ops that run like magic? 🍪✨"
    };
    return welcome[selectedBot];
  }, [selectedBot]);

  useEffect(() => {
    const welcomeMsg = { role: 'assistant' as const, content: getWelcomeMessage(), timestamp: new Date() };
    setMessages([welcomeMsg]);
    addConversationNode(welcomeMsg.content, 'ai');
    setPredictiveResponses(generatePredictiveResponses(selectedBot));
  }, [selectedBot, getWelcomeMessage, addConversationNode, generatePredictiveResponses]);

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault(); inputRef.current?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && ['1','2','3','4'].includes(e.key)) {
        e.preventDefault(); const map = ['finance','chef','consultant','baker'] as const;
        setSelectedBot(map[parseInt(e.key,10)-1] as unknown as string);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setSelectedBot]);

  // API call (Claude first, OpenAI fallback handled on the function)
  const callClaude = useCallback(async (msgs: Message[]): Promise<string> => {
    const basePrompt = customPrompt || currentBot.systemPrompt;
    const systemPrompt =
      selectedBot === 'baker' ? buildBakerPrompt(basePrompt) : basePrompt;

    const res = await fetch("/.netlify/functions/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: msgs, systemPrompt })
    });
    if (!res.ok) throw new Error(`API request failed: ${res.status}`);
    const data = await res.json();
    return data.content[0].text;
  }, [customPrompt, currentBot.systemPrompt, selectedBot]);

  // Handle personality switch with animation
  const switchPersonality = useCallback((newPersonality: string) => {
    if (newPersonality === selectedBot) return;
    
    // Add transition message
    const transitionMessage: Message = {
      role: 'assistant',
      content: `✨ Switching to ${botPersonalities[newPersonality].name}...`,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, transitionMessage]);
    addConversationNode(`Switched to ${botPersonalities[newPersonality].name}`, 'system');
    
    setTimeout(() => {
      setSelectedBot(newPersonality);
    }, 1000);
  }, [selectedBot, botPersonalities, addConversationNode, setSelectedBot]);

  async function sendMessage(messageText: string = inputMessage): Promise<void> {
    if (!messageText.trim() || isLoading) return;
    const userMessage: Message = { role: 'user', content: messageText.trim(), timestamp: new Date() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    addConversationNode(messageText, 'user');
    setInputMessage('');
    setIsLoading(true);
    simulateAIThinking();
    
    // Update emotional state based on message content
    if (messageText.toLowerCase().includes('excited') || messageText.toLowerCase().includes('amazing')) {
      setEmotionalState('excited');
    } else if (messageText.toLowerCase().includes('analyze') || messageText.toLowerCase().includes('calculate')) {
      setEmotionalState('analytical');
    } else if (messageText.toLowerCase().includes('create') || messageText.toLowerCase().includes('design')) {
      setEmotionalState('creative');
    } else {
      setEmotionalState('focused');
    }
    
    try {
      const reply = await callClaude(newMessages);
      const aiMessage: Message = { role: 'assistant', content: reply, timestamp: new Date() };
      setMessages([...newMessages, aiMessage]);
      addConversationNode(reply, 'ai');
      setPredictiveResponses(generatePredictiveResponses(selectedBot, messageText));
    } catch {
      const errorMessage: Message = { 
        role: 'assistant', 
        content: "I'm having trouble responding right now. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // Cookie Box Builder functions
  const toggleFlavor = (flavor: string) => {
    setCookieFlavors(prev => prev.includes(flavor) ? prev.filter(f => f !== flavor) : [...prev, flavor]);
  };

  const buildCookieBoxDetails = (): string => {
    const flavors = cookieFlavors.length ? cookieFlavors.join(", ") : "No flavors selected";
    const allergensBase = "Contains: wheat, eggs, dairy.";
    const peanutNote = cookieFlavors.includes("Peanut Butter") ? " Contains peanuts." : "";
    const allergens = allergensBase + peanutNote;
    return `FAIRYTALE FARMS — COOKIE BOX
Quantity: ${cookieQty}
Flavors: ${flavors}
Add‑on: ${includeMilk ? "Cold Milk" : "None"}

Allergens: ${allergens}

Packaging & Pickup Steps:
1) Line box with parchment; arrange ${cookieQty} cookies to prevent shifting.
2) Place flavor card on top; seal with Fairytale Farms sticker.
3) ${includeMilk ? "Add sealed milk bottle in an insulated pouch; include straw/napkin kit." : "No milk add‑on."}
4) Label: Customer name • pickup time • flavor list • allergen note.
5) Stage in porch pickup bin; add ice pack if ambient > 78°F.
6) Send ready‑for‑pickup message with unboxing cue ("Open on camera for a surprise sticker!").

Notes:
• Photo tip: overhead shot on a light surface; add a few crumbs for texture.
• AOV boost: mini‑card—"Add 2 brownies next time" + QR code.`;
  };

  const sendCookieBoxToChat = () => {
    const details = buildCookieBoxDetails();
    setMessages(prev => [...prev, { role: 'assistant', content: details, timestamp: new Date() }]);
    addConversationNode('Cookie box details generated', 'system');
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
  };

  // auto-resize textarea
  useEffect(() => {
    const el = inputRef.current; if (!el) return;
    el.style.height = '0px';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [inputMessage]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-white opacity-20 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 container mx-auto h-screen flex flex-col">
        {/* Neural Header */}
        <div className="p-6 border-b border-white/10 bg-black/20 backdrop-blur-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${currentBot.gradient} flex items-center justify-center text-2xl transform hover:scale-110 transition-all duration-300`}>
                {currentBot.icon}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center">
                  <Brain className="w-6 h-6 mr-2 text-blue-400" />
                  Neural AI Coach
                </h1>
                <p className="text-gray-300 text-sm">
                  Currently: {currentBot.name} • {currentBot.description}
                </p>
              </div>
            </div>
            
            {/* Emotional State Indicator */}
            <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${emotionalColors[emotionalState as keyof typeof emotionalColors]} backdrop-blur-lg border border-white/10`}>
              <div className="flex items-center space-x-2">
                <Heart className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-700 capitalize">{emotionalState}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex">
          {/* Neural Sidebar */}
          <div className="w-80 bg-black/30 backdrop-blur-lg border-r border-white/10 p-4 overflow-y-auto">
            {/* Conversation Timeline */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-400" />
                Conversation Timeline
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {conversationNodes.slice(-10).map((node, index) => (
                  <div key={node.id} className="flex items-start space-x-2">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${botPersonalities[node.personality]?.gradient || 'from-gray-400 to-gray-600'} flex-shrink-0 mt-2`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-300 truncate">{node.message}</p>
                      <p className="text-xs text-gray-500">{node.timestamp.toLocaleTimeString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Personality Switcher */}
            <div className="mb-6">
              <h4 className="text-md font-semibold text-white mb-3 flex items-center">
                <Palette className="w-4 h-4 mr-2 text-purple-400" />
                Expert Personalities
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(botPersonalities).map(([key, personality]) => (
                  <button
                    key={key}
                    onClick={() => switchPersonality(key)}
                    className={`p-3 rounded-lg border transition-all duration-300 text-left ${
                      selectedBot === key
                        ? `bg-gradient-to-r ${personality.gradient} border-white/30 transform scale-105`
                        : 'bg-black/20 border-white/10 hover:border-white/30 hover:bg-black/30'
                    }`}
                  >
                    <div className="text-lg mb-1">{personality.icon}</div>
                    <div className="text-xs text-white font-medium">{personality.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Smart Canvas Preview */}
            <div className="mb-6 bg-black/20 rounded-lg p-3 border border-white/10">
              <h4 className="text-sm font-semibold text-white mb-2 flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-yellow-400" />
                AI Thinking Canvas
              </h4>
              <div className="relative h-20 bg-black/30 rounded border border-white/5 overflow-hidden">
                {canvasData.map((item) => (
                  <div
                    key={item.id}
                    className="absolute text-xs text-blue-300 animate-pulse"
                    style={{
                      left: `${item.x}px`,
                      top: `${item.y}px`,
                      opacity: item.opacity
                    }}
                  >
                    {item.text}
                  </div>
                ))}
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cookie Box Builder */}
            {selectedBot === 'baker' && (
              <div className="mb-6 border border-pink-200/30 rounded-lg p-3 bg-pink-900/20">
                <h4 className="font-medium mb-2 text-white">🍪 Cookie Box Builder</h4>

                <div className="mb-3">
                  <label className="text-sm font-medium block mb-1 text-gray-300">Flavors</label>
                  {["Chocolate Chip", "Sugar", "Snickerdoodle", "Peanut Butter", "Oatmeal Raisin"].map(flavor => (
                    <label key={flavor} className="block text-sm text-gray-300">
                      <input
                        type="checkbox"
                        className="mr-2 align-middle"
                        checked={cookieFlavors.includes(flavor)}
                        onChange={() => toggleFlavor(flavor)}
                      />
                      {flavor}
                    </label>
                  ))}
                </div>

                <div className="mb-3">
                  <label className="text-sm font-medium block mb-1 text-gray-300">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={cookieQty}
                    onChange={(e) => setCookieQty(Number(e.target.value))}
                    className="w-full p-2 border rounded bg-black/30 text-white border-white/20"
                  />
                </div>

                <div className="mb-3">
                  <label className="text-sm text-gray-300">
                    <input
                      type="checkbox"
                      className="mr-2 align-middle"
                      checked={includeMilk}
                      onChange={(e) => setIncludeMilk(e.target.checked)}
                    />
                    Include Milk Add‑on
                  </label>
                </div>

                <div className="flex gap-2">
                  <button onClick={sendCookieBoxToChat} className="flex-1 bg-pink-600 text-white rounded px-3 py-2 hover:bg-pink-700 text-sm">
                    Send to Chat
                  </button>
                  <button onClick={() => { setCookieFlavors([]); setCookieQty(6); setIncludeMilk(false); }} className="flex-1 bg-gray-600 text-white rounded px-3 py-2 hover:bg-gray-700 text-sm">
                    Reset
                  </button>
                </div>
              </div>
            )}

            {/* System Prompt Toggle */}
            <div>
              <button
                onClick={() => setShowSystemPrompt(!showSystemPrompt)}
                className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
                aria-expanded={showSystemPrompt}
                aria-controls="system-prompt-editor"
              >
                <Settings className="w-4 h-4" />
                {showSystemPrompt ? 'Hide' : 'Show'} System Prompt
              </button>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message, index) => (
                <div key={index} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-2xl ${
                    message.role === 'user' 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                      : `bg-gradient-to-r ${currentBot.gradient} text-white`
                  } shadow-lg backdrop-blur-lg border border-white/10`}>
                    {message.role === 'assistant' && (
                      <div className="flex items-center mb-2">
                        <span className="text-lg mr-2">{currentBot.icon}</span>
                        <span className="text-sm font-medium opacity-90">{currentBot.name}</span>
                      </div>
                    )}
                    {message.role === 'assistant' ? (
                      <Markdown text={message.content} />
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    )}
                    {message.timestamp && (
                      <p className="text-xs mt-2 opacity-70">{message.timestamp.toLocaleTimeString()}</p>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className={`bg-gradient-to-r ${currentBot.gradient} text-white px-4 py-3 rounded-2xl shadow-lg backdrop-blur-lg border border-white/10`}>
                    <div className="flex items-center mb-2">
                      <span className="text-lg mr-2">{currentBot.icon}</span>
                      <span className="text-sm font-medium opacity-90">{currentBot.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                      </div>
                      <span className="text-sm opacity-70">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Predictive Response Bubbles */}
            {predictiveResponses.length > 0 && !isLoading && (
              <div className="px-6 py-3 border-t border-white/10">
                <p className="text-sm text-gray-300 mb-2 flex items-center">
                  <Zap className="w-4 h-4 mr-2 text-yellow-400" />
                  Suggested Questions:
                </p>
                <div className="flex flex-wrap gap-2">
                  {predictiveResponses.slice(0, 4).map((response, index) => (
                    <button
                      key={index}
                      onClick={() => sendMessage(response)}
                      className="px-3 py-1 bg-black/30 hover:bg-black/50 text-gray-300 text-xs rounded-full border border-white/10 hover:border-white/30 transition-all duration-200"
                    >
                      {response}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="p-6 border-t border-white/10 bg-black/20 backdrop-blur-lg">
              <div className="flex space-x-4">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={`Ask ${currentBot.name} about ${selectedBot === 'finance' ? 'budgeting, investing, debt, retirement…' : selectedBot === 'baker' ? 'recipes, ops, packaging…' : 'their expertise…'}`}
                  className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 backdrop-blur-lg resize-none"
                  rows={1}
                  disabled={isLoading}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={isLoading || !inputMessage.trim()}
                  className={`px-6 py-3 rounded-xl transition-all duration-200 ${
                    isLoading || !inputMessage.trim()
                      ? 'bg-gray-600 cursor-not-allowed'
                      : `bg-gradient-to-r ${currentBot.gradient} hover:scale-105 shadow-lg`
                  } text-white flex items-center space-x-2`}
                >
                  <Send className="w-4 h-4" />
                  <span>{isLoading ? 'Thinking...' : 'Send'}</span>
                </button>
              </div>
              <div className="pt-2 text-[11px] text-gray-400">
                ⌘/Ctrl+K to focus • Enter to send • Shift+Enter for newline • ⌘/Ctrl+1…4 to switch personas
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Prompt Editor */}
      {showSystemPrompt && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black/80 backdrop-blur-lg rounded-xl border border-white/20 w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="bg-black/40 px-6 py-4 border-b border-white/10">
              <h3 className="text-xl font-semibold text-white">System Prompt — {currentBot.name}</h3>
              <p className="text-sm text-gray-300">Adjust the AI's personality and expertise</p>
            </div>
            <div className="p-6">
              <textarea
                value={customPrompt || currentBot.systemPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="w-full h-80 p-4 bg-black/30 border border-white/20 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm font-mono text-white placeholder-gray-400"
                placeholder="Enter custom system prompt..."
              />
              <div className="flex gap-3 mt-4">
                <button 
                  onClick={() => setCustomPrompt('')} 
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
                >
                  Reset to Default
                </button>
                <button 
                  onClick={() => {
                    setMessages([{ role: 'assistant', content: getWelcomeMessage(), timestamp: new Date() }]);
                    setShowSystemPrompt(false);
                  }} 
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                >
                  Apply & Reset Chat
                </button>
                <button 
                  onClick={() => setShowSystemPrompt(false)} 
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors ml-auto"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;