import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, Bot, User, Settings, DollarSign, ChefHat, Briefcase, Cake } from 'lucide-react';

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
    social_unboxing: "Encourage an overhead ‘unboxing’ video with a surprise sticker",
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
interface Message { role: 'user' | 'assistant'; content: string; }
interface BotPersonality {
  name: string; icon: React.ReactElement; color: string; description: string; systemPrompt: string;
}

// -------------------- Helpers --------------------
const STORAGE = {
  persona: 'ui.selectedBot',
  customPrompt: 'ui.customPrompt',
  cookieFlavors: 'cookie.flavors',
  cookieQty: 'cookie.qty',
  cookieMilk: 'cookie.milk',
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
  // Default to baker, then persist
  const [selectedBot, setSelectedBot] = usePersistentState<string>(STORAGE.persona, 'baker');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSystemPrompt, setShowSystemPrompt] = useState<boolean>(false);
  const [customPrompt, setCustomPrompt] = usePersistentState<string>(STORAGE.customPrompt, '');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const botPersonalities: Record<string, BotPersonality> = useMemo(() => ({
    finance: {
      name: "Sarah Sterling",
      icon: <DollarSign className="w-5 h-5" />,
      color: "bg-green-600",
      description: "Certified Financial Planner specializing in personal wealth building",
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
      description: "Italian culinary expert who's passionate about authentic cooking",
      systemPrompt: `You are Chef Marco, a passionate Italian chef with 20 years of experience in traditional and modern Italian cuisine. Use warm Italian flair and practical, detailed technique.`
    },
    consultant: {
      name: "Sarah Chen",
      icon: <Briefcase className="w-5 h-5" />,
      color: "bg-blue-600",
      description: "Strategic business consultant specializing in digital transformation",
      systemPrompt: `You are Sarah Chen, a senior consultant (MBA/Wharton). Be structured, actionable, and pragmatic.`
    },
    baker: {
      name: "The Baker",
      icon: <Cake className="w-5 h-5" />,
      color: "bg-pink-600",
      description: "World‑renowned baker: god‑level pastry & bread craft + Fairytale Farms ops",
      systemPrompt: `You are a world‑renowned baker and pastry authority with god‑level knowledge of baking science and production. Focus on Fairytale Farms cookies/brownies/cakes, porch pickup, yields, cost %, shelf life, packaging. Provide gram weights when useful and troubleshooting. Educational guidance only.`
    }
  }), []);

  const currentBot = botPersonalities[selectedBot];

  // scroll on new messages
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // welcome on persona change
  const getWelcomeMessage = useCallback((): string => {
    const welcome: Record<string, string> = {
      finance: "Hello! I'm Sarah Sterling, your Certified Financial Planner. *straightens up financial documents* Tell me about your current financial situation and goals.",
      chef: "Ciao! I'm Chef Marco! Recipe, technique, or a full Italian menu? Dimmi pure!",
      consultant: "Hi, I’m Sarah Chen. What’s your most pressing strategy or operations challenge right now?",
      baker: "Hey—baking coach here with a soft spot for Fairytale Farms. Viral cookie box, shinier brownie tops, or porch‑pickup ops that run like magic? 🍪✨"
    };
    return welcome[selectedBot];
  }, [selectedBot]);

  useEffect(() => {
    setMessages([{ role: 'assistant', content: getWelcomeMessage() }]);
  }, [selectedBot, getWelcomeMessage]);

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


  async function sendMessage(): Promise<void> {
    if (!inputMessage.trim() || isLoading) return;
    const userMessage: Message = { role: 'user', content: inputMessage.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputMessage('');
    setIsLoading(true);
    try {
      const reply = await callClaude(newMessages);
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
    } catch {
      setMessages([...newMessages, { role: 'assistant', content: "I’m having trouble responding right now. Please try again in a moment." }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const financeQuickStarts = [
    "I'm 25 and just started my first job. Where should I begin with my finances?",
    "I have $5,000 in credit card debt. What's the best way to pay it off?",
    "Should I invest in my 401k or pay off student loans first?",
    "How much should I have in my emergency fund?",
    "I want to buy a house in 3 years. How should I save for it?",
    "What's the difference between a Roth IRA and traditional IRA?"
  ];

  // Cookie Box Builder (only with Baker)
  const [cookieFlavors, setCookieFlavors] = usePersistentState<string[]>(STORAGE.cookieFlavors, []);
  const [cookieQty, setCookieQty] = usePersistentState<number>(STORAGE.cookieQty, 6);
  const [includeMilk, setIncludeMilk] = usePersistentState<boolean>(STORAGE.cookieMilk, false);

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
6) Send ready‑for‑pickup message with unboxing cue (“Open on camera for a surprise sticker!”).

Notes:
• Photo tip: overhead shot on a light surface; add a few crumbs for texture.
• AOV boost: mini‑card—“Add 2 brownies next time” + QR code.`;
  };

  const sendCookieBoxToChat = () => {
    setMessages(prev => [...prev, { role: 'assistant', content: buildCookieBoxDetails() }]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
  };

  // auto-resize textarea
  useEffect(() => {
    const el = inputRef.current; if (!el) return;
    el.style.height = '0px';
    el.style.height = Math.min(el.scrollHeight, 200) + 'px';
  }, [inputMessage]);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="mx-auto max-w-6xl p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Personal Finance Coach</h1>
          <p className="text-gray-600">Get personalized guidance from certified experts</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <h3 className="font-semibold mb-3">Choose Your Expert</h3>
            <div className="space-y-2">
              {Object.entries(botPersonalities).map(([key, bot]) => (
                <button
                  key={key}
                  onClick={() => setSelectedBot(key)}
                  className={`w-full p-3 rounded-lg text-left transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    selectedBot === key ? `${bot.color} text-white` : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                  }`}
                  aria-pressed={selectedBot === key}
                >
                  <div className="flex items-center gap-3 mb-1">
                    {bot.icon}
                    <span className="font-medium">{bot.name}</span>
                  </div>
                  <p className={`text-xs ${selectedBot === key ? 'opacity-90' : 'text-gray-700'}`}>{bot.description}</p>
                </button>
              ))}
            </div>

            {/* Quick starts */}
            {selectedBot === 'finance' && (
              <div className="mt-6">
                <h4 className="font-medium mb-2">Quick Start Questions</h4>
                <div className="space-y-2">
                  {financeQuickStarts.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => setInputMessage(q)}
                      className="w-full text-left p-2 text-xs bg-green-50 hover:bg-green-100 rounded border text-green-800"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Cookie Box Builder */}
            {selectedBot === 'baker' && (
              <div className="mt-6 border border-pink-200 rounded-lg p-3">
                <h4 className="font-medium mb-2">🍪 Cookie Box Builder</h4>

                <div className="mb-3">
                  <label className="text-sm font-medium block mb-1">Flavors</label>
                  {["Chocolate Chip", "Sugar", "Snickerdoodle", "Peanut Butter", "Oatmeal Raisin"].map(flavor => (
                    <label key={flavor} className="block text-sm">
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
                  <label className="text-sm font-medium block mb-1">Quantity</label>
                  <input
                    type="number"
                    min={1}
                    value={cookieQty}
                    onChange={(e) => setCookieQty(Number(e.target.value))}
                    className="w-full p-2 border rounded"
                  />
                </div>

                <div className="mb-3">
                  <label className="text-sm">
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
                  <button onClick={sendCookieBoxToChat} className="flex-1 bg-pink-600 text-white rounded px-3 py-2 hover:bg-pink-700">
                    Send Details to Chat
                  </button>
                  <button onClick={() => { setCookieFlavors([]); setCookieQty(6); setIncludeMilk(false); }} className="flex-1 bg-gray-100 text-gray-900 rounded px-3 py-2 hover:bg-gray-200">
                    Reset
                  </button>
                </div>
              </div>
            )}

            {/* System Prompt Toggle */}
            <div className="mt-6">
              <button
                onClick={() => setShowSystemPrompt(!showSystemPrompt)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                aria-expanded={showSystemPrompt}
                aria-controls="system-prompt-editor"
              >
                <Settings className="w-4 h-4" />
                {showSystemPrompt ? 'Hide' : 'Show'} System Prompt
              </button>
            </div>
          </div>

          {/* Chat */}
          <div className="lg:col-span-3">
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              {/* Header */}
              <div className={`${currentBot.color} text-white p-4`}>
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-lg">{currentBot.icon}</div>
                  <div>
                    <h2 className="font-semibold">{currentBot.name}</h2>
                    <p className="text-sm opacity-90">{currentBot.description}</p>
                  </div>
                  {selectedBot === 'finance' && (
                    <div className="ml-auto text-right text-xs opacity-90">
                      <div>CFP • 12 years experience</div>
                      <div>Fee-only advisor</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="h-[520px] overflow-y-auto p-4 bg-gray-50" role="log" aria-live="polite" aria-relevant="additions">
                {messages.map((m, i) => (
                  <div key={i} className={`mb-3 flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[72ch] px-4 py-3 rounded-2xl ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 shadow-sm border'}`}>
                      <div className="flex items-center gap-2 mb-1 text-xs opacity-75">
                        {m.role === 'assistant' ? (<><Bot className="w-4 h-4 text-gray-500"/><span>{currentBot.name}</span></>) : (<><User className="w-4 h-4 text-blue-200"/><span>You</span></>)}
                      </div>
                      {m.role === 'assistant' ? <Markdown text={m.content}/> : <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.content}</p>}
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start mb-3">
                    <div className="bg-white text-gray-900 shadow-sm border px-4 py-3 rounded-2xl">
                      <div className="flex items-center gap-2">
                        <Bot className="w-4 h-4 text-gray-500" />
                        <div className="flex space-x-1" aria-label="Assistant is typing">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder={`Ask ${currentBot.name} about ${selectedBot === 'finance' ? 'budgeting, investing, debt, retirement…' : selectedBot === 'baker' ? 'recipes, ops, packaging…' : 'their expertise…'}`}
                    className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={1}
                    disabled={isLoading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!inputMessage.trim() || isLoading}
                    className="bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    aria-label="Send message"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <div className="pt-2 text-[11px] text-gray-500">
                  ⌘/Ctrl+K to focus • Enter to send • Shift+Enter for newline • ⌘/Ctrl+1…4 to switch personas
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* System Prompt Editor */}
        {showSystemPrompt && (
          <div id="system-prompt-editor" className="mt-6 border border-gray-300 rounded-lg">
            <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
              <h3 className="font-semibold">System Prompt — {currentBot.name}</h3>
              <p className="text-sm text-gray-600">Adjust the AI’s personality and expertise</p>
            </div>
            <div className="p-4">
              <textarea
                value={customPrompt || currentBot.systemPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="w-full h-40 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
                placeholder="Enter custom system prompt..."
              />
              <div className="flex gap-2 mt-2">
                <button onClick={() => setCustomPrompt('')} className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300">
                  Reset to Default
                </button>
                <button onClick={() => setMessages([{ role: 'assistant', content: getWelcomeMessage() }])} className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                  Apply & Reset Chat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Finance Tips */}
        {selectedBot === 'finance' && (
          <div className="mt-6 bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-2">Financial Planning Made Simple</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
              <div><h4 className="font-medium mb-1">Emergency Fund</h4><p>Start with $1,000, then build to 3–6 months of expenses.</p></div>
              <div><h4 className="font-medium mb-1">Debt Strategy</h4><p>Pay minimums on all debts; put extra on highest interest rate.</p></div>
              <div><h4 className="font-medium mb-1">Investing Basics</h4><p>Start with low‑cost index funds; invest consistently.</p></div>
              <div><h4 className="font-medium mb-1">Retirement Rule</h4><p>Save 15% of income; capture full employer match first.</p></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
