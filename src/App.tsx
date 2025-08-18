// ================= Imports MUST be first =================
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo
} from "react";
import {
  Send,
  Settings,
  DollarSign,
  ChefHat,
  Briefcase,
  Cake,
  Brain,
  Clock,
  Sparkles,
  Palette,
  Heart,
  Zap
} from "lucide-react";

// ---- Fairytale Farms KB (edit freely) ----
const FAIRYTALE_FARMS_KB = {
  brand: {
    name: "Fairytale Farms",
    vibe: "whimsical, cozy, handcrafted, porch-pickup friendly",
    location_city: "Castalian Springs",
    location_state: "TN",
    pickup: {
      methods: ["porch", "local delivery"],
      porch_hours_hint: "Most pickups 10am–7pm unless coordinated"
    }
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
    social_unboxing:
      "Encourage an overhead 'unboxing' video with a surprise sticker"
  },
  policies: {
    lead_time_days: 2,
    rush_policy: "Rush orders subject to availability; message first.",
    payment: "Prepay to confirm order.",
    cancellations: "24h notice for changes/cancellations."
  }
};

// Build Baker system prompt with KB
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
- When giving packaging/pickup steps, reflect the KB (labels, allergens, 78°F ice-pack rule).
- ALWAYS keep the warm Fairytale Farms voice.`;
}

// ==========================================================
// Landing Page (sectioned)
// ==========================================================
const LandingPage: React.FC<{ onEnter: () => void }> = ({ onEnter }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white text-gray-800">
      {/* Nav */}
      <header className="sticky top-0 z-30 bg-amber-50/80 backdrop-blur border-b border-amber-100">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-200 flex items-center justify-center shadow-sm">
              <span className="text-amber-900 text-xl">🍪</span>
            </div>
            <div>
              <div className="font-bold text-amber-900 text-lg">
                Fairytale Farms
              </div>
              <p className="text-xs text-amber-700/80">Castalian Springs, TN</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#menu" className="hover:text-amber-900">
              Menu
            </a>
            <a href="#how" className="hover:text-amber-900">
              How it works
            </a>
            <a href="#love" className="hover:text-amber-900">
              Love notes
            </a>
          </nav>

          <button
            onClick={onEnter}
            className="px-4 py-2 rounded-lg bg-amber-600 text-white hover:bg-amber-700 shadow-sm"
          >
            Open the Bakery App
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative">
        <div className="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-amber-900 leading-tight">
              Whimsical bakes, porch-pickup ease.
            </h1>
            <p className="mt-4 text-lg text-amber-900/80">
              Small-batch cookies, shiny-top brownies, and celebration cakes
              made with love. Order online, swing by the porch, and enjoy the
              magic ✨
            </p>
            <div className="mt-6 flex gap-3">
              <a
                href="#menu"
                className="px-5 py-3 rounded-lg bg-amber-700 text-white hover:bg-amber-800 shadow"
              >
                Explore Menu
              </a>
              <button
                onClick={onEnter}
                className="px-5 py-3 rounded-lg bg-white border border-amber-200 text-amber-900 hover:bg-amber-50"
              >
                Start an Order
              </button>
            </div>
            <div className="mt-6 text-sm text-amber-700/80">
              Porch pickups most days 10am–7pm • Local delivery available
            </div>
          </div>

          {/* Hero card */}
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-6">
            <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-7xl">
              🧁
            </div>
            <div className="mt-4">
              <h3 className="font-semibold text-amber-900">Seasonal Cookie Box</h3>
              <p className="text-sm text-amber-800/80">
                Choose 6 or 12. Mix & match flavors. Optional cold-milk add-on 🥛
              </p>
            </div>
            <div className="mt-4 flex gap-2">
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs">
                Chocolate Chip
              </span>
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs">
                Snickerdoodle
              </span>
              <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-xs">
                Sugar
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Menu */}
      <section id="menu" className="max-w-7xl mx-auto px-6 py-14">
        <h2 className="text-3xl font-bold text-amber-900">Our favorites</h2>
        <p className="text-amber-900/80 mt-2">Small-batch. Real butter. Always fresh.</p>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { emoji: "🍪", title: "Cookie Box", desc: "6/12/24 mix & match, custom cards" },
            { emoji: "🍫", title: "Fudgy Brownies", desc: "Classic, Walnut, Salted Caramel" },
            { emoji: "🎂", title: "Celebration Cakes", desc: "Vanilla, Chocolate, Lemon, Red Velvet" },
            { emoji: "🥛", title: "Cold Milk Add-on", desc: "Single-serve glass bottle" },
            { emoji: "🎁", title: "Gift Wrap", desc: "Ribbon, sticker, handwritten card" },
            { emoji: "🚗", title: "Porch Pickup/Delivery", desc: "10am–7pm most days" }
          ].map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-amber-100 p-5 shadow-sm hover:shadow-md transition"
            >
              <div className="text-4xl">{item.emoji}</div>
              <div className="mt-3 font-semibold text-amber-900">{item.title}</div>
              <p className="text-sm text-amber-900/80">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section id="how" className="max-w-7xl mx-auto px-6 py-14">
        <div className="bg-white rounded-2xl border border-amber-100 p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-amber-900">How it works</h2>
          <div className="grid md:grid-cols-3 gap-6 mt-6">
            {[
              { n: "1", h: "Build your box", d: "Pick flavors and qty. Add milk if you like." },
              { n: "2", h: "Choose pickup time", d: "Most pickups 10–7. We’ll label with your name." },
              { n: "3", h: "Enjoy & share", d: "Unbox on camera for a surprise sticker 💫" }
            ].map((s) => (
              <div key={s.n} className="rounded-xl border border-amber-100 p-5">
                <div className="h-8 w-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold">
                  {s.n}
                </div>
                <div className="mt-3 font-semibold text-amber-900">{s.h}</div>
                <p className="text-sm text-amber-900/80">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <button
              onClick={onEnter}
              className="px-5 py-3 rounded-lg bg-amber-700 text-white hover:bg-amber-800 shadow"
            >
              Start your order
            </button>
          </div>
        </div>
      </section>

      {/* Love Notes */}
      <section id="love" className="max-w-7xl mx-auto px-6 py-14">
        <h2 className="text-2xl font-bold text-amber-900">Love notes from happy humans</h2>
        <div className="mt-6 grid md:grid-cols-3 gap-6">
          {[
            "The brownie tops are literally shiny ✨ and so fudgy!",
            "Cookie box unboxing was a hit—kids loved the sticker surprise.",
            "Pickup was a breeze. Everything labeled and picture-perfect."
          ].map((t, i) => (
            <div key={i} className="bg-white rounded-xl border border-amber-100 p-5 shadow-sm">
              <div className="text-amber-900/90">“{t}”</div>
              <div className="text-sm text-amber-700 mt-3">— Local Customer</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-amber-100 bg-amber-50">
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-amber-900/80">
            © {new Date().getFullYear()} Fairytale Farms • Castalian Springs, TN
          </p>
          <div className="text-sm text-amber-900/80">
            Porch-pickup best for freshness • <span className="font-medium">Prepay to confirm</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

// -------------------- Types --------------------
interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}
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
  type: "user" | "ai" | "system";
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
  persona: "ui.selectedBot",
  customPrompt: "ui.customPrompt",
  cookieFlavors: "cookie.flavors",
  cookieQty: "cookie.qty",
  cookieMilk: "cookie.milk",
  conversationNodes: "ui.conversationNodes",
  emotionalState: "ui.emotionalState"
};

function usePersistentState<T>(key: string, initial: T) {
  const [val, setVal] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {}
  }, [key, val]);
  return [val, setVal] as const;
}

// super-light markdown: code fences, lists, **bold**, *italics*
function Markdown({ text }: { text: string }) {
  const blocks = useMemo(() => text.split("```"), [text]);

  const renderInline = (t: string, idx: number) => {
    // Lists
    if (/^\s*[-*]\s+/m.test(t)) {
      const lines = t.split("\n");
      const els: React.ReactNode[] = [];
      let buf: string[] = [];
      const flush = () => {
        if (buf.length) {
          els.push(
            <ul key={`ul-${els.length}`} className="list-disc pl-5 my-2">
              {buf.map((li, i) => (
                <li key={i} className="my-0.5">
                  {li.replace(/^\s*[-*]\s+/, "")}
                </li>
              ))}
            </ul>
          );
          buf = [];
        }
      };
      lines.forEach((l) => {
        if (/^\s*[-*]\s+/.test(l)) buf.push(l);
        else {
          flush();
          if (l.trim())
            els.push(
              <p key={`p-${els.length}`} className="my-2 whitespace-pre-wrap">
                {l}
              </p>
            );
        }
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
        out.push(
          <em key={`${idx}-i-${start}`} className="italic">
            {inner}
          </em>
        );
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
      parts.push(
        <strong key={`${idx}-b-${start}`} className="font-semibold">
          {inner}
        </strong>
      );
      last = start + full.length;
    }
    if (last < t.length) parts.push(...applyItalics(t.slice(last)));

    return <p className="whitespace-pre-wrap leading-relaxed my-2">{parts}</p>;
  };

  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none text-sm">
      {blocks.map((b, i) =>
        i % 2 === 1 ? (
          <pre key={i} className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs overflow-x-auto dark:border-gray-800 dark:bg-neutral-900/60">
            <code>{b}</code>
          </pre>
        ) : (
          <div key={i}>{renderInline(b, i)}</div>
        )
      )}
    </div>
  );
}

// ==========================================================
// Main App (renders after LandingPage)
// ==========================================================
const App: React.FC = () => {
  const [showLanding, setShowLanding] = React.useState(true);
  return showLanding
    ? <LandingPage onEnter={() => setShowLanding(false)} />
    : <MainApp />;
};

export default App;

// Core state
const [selectedBot, setSelectedBot] = usePersistentState<string>(
  STORAGE.persona,
  "baker"
);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSystemPrompt, setShowSystemPrompt] = useState<boolean>(false);
  const [customPrompt, setCustomPrompt] = usePersistentState<string>(
    STORAGE.customPrompt,
    ""
  );

  // Neural AI features
  const [conversationNodes, setConversationNodes] = usePersistentState<
    ConversationNode[]
  >(STORAGE.conversationNodes, []);
  const [predictiveResponses, setPredictiveResponses] = useState<string[]>([]);
  const [emotionalState, setEmotionalState] = usePersistentState<string>(
    STORAGE.emotionalState,
    "neutral"
  );
  const [canvasData, setCanvasData] = useState<CanvasThought[]>([]);

  // Cookie Box Builder state
  const [cookieFlavors, setCookieFlavors] = usePersistentState<string[]>(
    STORAGE.cookieFlavors,
    []
  );
  const [cookieQty, setCookieQty] = usePersistentState<number>(
    STORAGE.cookieQty,
    6
  );
  const [includeMilk, setIncludeMilk] = usePersistentState<boolean>(
    STORAGE.cookieMilk,
    false
  );

  // ---- Customer & Pickup form state ----
  const [custName, setCustName] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custInsta, setCustInsta] = useState("");

  // YYYY-MM-DD and HH:MM
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [pickupMethod, setPickupMethod] = useState<"porch" | "delivery">(
    "porch"
  );
  const [pickupAddress, setPickupAddress] = useState(""); // delivery only

  // ---- Order compilation + sending state ----
  const [orderDraft, setOrderDraft] = useState<any | null>(null);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<null | {
    ok: boolean;
    msg: string;
  }>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const botPersonalities: Record<string, BotPersonality> = useMemo(
    () => ({
      finance: {
        name: "Sarah Sterling",
        icon: <DollarSign className="w-5 h-5" />,
        color: "bg-green-600",
        gradient: "from-green-500 to-emerald-600",
        description:
          "Certified Financial Planner specializing in personal wealth building",
        traits: ["analytical", "trustworthy", "strategic"],
        environment: "Modern financial office with city skyline",
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
        traits: ["passionate", "authentic", "creative"],
        environment: "Rustic Italian kitchen with copper pots",
        systemPrompt: `You are Chef Marco, a passionate Italian chef with 20 years of experience in traditional and modern Italian cuisine. Use warm Italian flair and practical, detailed technique.`
      },
      consultant: {
        name: "Sarah Chen",
        icon: <Briefcase className="w-5 h-5" />,
        color: "bg-blue-600",
        gradient: "from-blue-500 to-indigo-600",
        description:
          "Strategic business consultant specializing in digital transformation",
        traits: ["innovative", "decisive", "visionary"],
        environment: "Executive boardroom with glass walls",
        systemPrompt: `You are Sarah Chen, a senior consultant (MBA/Wharton). Be structured, actionable, and pragmatic.`
      },
      baker: {
        name: "The Baker",
        icon: <Cake className="w-5 h-5" />,
        color: "bg-pink-600",
        gradient: "from-purple-500 to-pink-600",
        description:
          "World-renowned baker: god-level pastry & bread craft + Fairytale Farms ops",
        traits: ["whimsical", "precise", "nurturing"],
        environment: "Enchanted bakery with magical ingredients",
        systemPrompt: `You are a world-renowned baker and pastry authority with god-level knowledge of baking science and production. Focus on Fairytale Farms cookies/brownies/cakes, porch pickup, yields, cost %, shelf life, packaging. Provide gram weights when useful and troubleshooting. Educational guidance only.`
      }
    }),
    []
  );

  const currentBot = botPersonalities[selectedBot];

  // Emotional state colors
  const emotionalColors = {
    neutral: "from-gray-100 to-gray-200",
    excited: "from-yellow-100 to-orange-200",
    focused: "from-blue-100 to-indigo-200",
    creative: "from-purple-100 to-pink-200",
    analytical: "from-green-100 to-emerald-200"
  };

  // Predictive responses
  const generatePredictiveResponses = useCallback(
    (personality: string, _last?: string): string[] => {
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
    },
    []
  );

  // Conversation timeline node
  const addConversationNode = useCallback(
    (message: string, type: "user" | "ai" | "system") => {
      const node: ConversationNode = {
        id: Date.now(),
        message: message.substring(0, 50) + (message.length > 50 ? "..." : ""),
        type,
        timestamp: new Date(),
        personality: selectedBot,
        emotional: emotionalState
      };
      setConversationNodes((prev) => [...prev.slice(-20), node]);
    },
    [selectedBot, emotionalState, setConversationNodes]
  );

  // Simulate AI thinking canvas
  const simulateAIThinking = useCallback(() => {
    const steps = [
      "Analyzing your question...",
      "Accessing knowledge base...",
      "Considering personality context...",
      "Formulating response..."
    ];
    steps.forEach((step, i) => {
      setTimeout(() => {
        setCanvasData((prev) => [
          ...prev,
          { id: Date.now() + i, text: step, x: Math.random() * 200, y: Math.random() * 60, opacity: 1 }
        ]);
      }, i * 400);
    });
    setTimeout(() => setCanvasData([]), 2800);
  }, []);

  // Scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Welcome on persona change
  const getWelcomeMessage = useCallback((): string => {
    const welcome: Record<string, string> = {
      finance:
        "Hello! I'm Sarah Sterling, your Certified Financial Planner. *straightens up financial documents* Tell me about your current financial situation and goals.",
      chef:
        "Ciao! I'm Chef Marco! Recipe, technique, or a full Italian menu? Dimmi pure!",
      consultant:
        "Hi, I'm Sarah Chen. What's your most pressing strategy or operations challenge right now?",
      baker:
        "Hey—baking coach here with a soft spot for Fairytale Farms. Viral cookie box, shinier brownie tops, or porch-pickup ops that run like magic? 🍪✨"
    };
    return welcome[selectedBot];
  }, [selectedBot]);

  useEffect(() => {
    const welcomeMsg = {
      role: "assistant" as const,
      content: getWelcomeMessage(),
      timestamp: new Date()
    };
    setMessages([welcomeMsg]);
    addConversationNode(welcomeMsg.content, "ai");
    setPredictiveResponses(generatePredictiveResponses(selectedBot));
  }, [selectedBot, getWelcomeMessage, addConversationNode, generatePredictiveResponses]);

  // Shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && ["1", "2", "3", "4"].includes(e.key)) {
        e.preventDefault();
        const map = ["finance", "chef", "consultant", "baker"] as const;
        setSelectedBot(map[parseInt(e.key, 10) - 1] as unknown as string);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setSelectedBot]);

  // API call (Claude first, OpenAI fallback on function)
  const callClaude = useCallback(
    async (msgs: Message[]): Promise<string> => {
      const basePrompt = customPrompt || currentBot.systemPrompt;
      const systemPrompt =
        selectedBot === "baker" ? buildBakerPrompt(basePrompt) : basePrompt;

      const res = await fetch("/.netlify/functions/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs, systemPrompt })
      });
      if (!res.ok) throw new Error(`API request failed: ${res.status}`);
      const data = await res.json();
      return data.content[0].text;
    },
    [customPrompt, currentBot.systemPrompt, selectedBot]
  );

  // Switch personality
  const switchPersonality = useCallback(
    (newPersonality: string) => {
      if (newPersonality === selectedBot) return;
      const transitionMessage: Message = {
        role: "assistant",
        content: `✨ Switching to ${botPersonalities[newPersonality].name}...`,
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, transitionMessage]);
      addConversationNode(
        `Switched to ${botPersonalities[newPersonality].name}`,
        "system"
      );
      setTimeout(() => setSelectedBot(newPersonality), 600);
    },
    [selectedBot, botPersonalities, addConversationNode, setSelectedBot]
  );

  async function sendMessage(messageText: string = inputMessage): Promise<void> {
    if (!messageText.trim() || isLoading) return;
    const userMessage: Message = {
      role: "user",
      content: messageText.trim(),
      timestamp: new Date()
    };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    addConversationNode(messageText, "user");
    setInputMessage("");
    setIsLoading(true);
    simulateAIThinking();

    // Light emotional heuristic
    const lc = messageText.toLowerCase();
    if (lc.includes("excited") || lc.includes("amazing")) setEmotionalState("excited");
    else if (lc.includes("analyze") || lc.includes("calculate")) setEmotionalState("analytical");
    else if (lc.includes("create") || lc.includes("design")) setEmotionalState("creative");
    else setEmotionalState("focused");

    try {
      const reply = await callClaude(newMessages);
      const aiMessage: Message = {
        role: "assistant",
        content: reply,
        timestamp: new Date()
      };
      setMessages([...newMessages, aiMessage]);
      addConversationNode(reply, "ai");
      setPredictiveResponses(generatePredictiveResponses(selectedBot, messageText));
    } catch {
      const errorMessage: Message = {
        role: "assistant",
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
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Cookie Box Builder helpers
  const toggleFlavor = (flavor: string) => {
    setCookieFlavors((prev) =>
      prev.includes(flavor) ? prev.filter((f) => f !== flavor) : [...prev, flavor]
    );
  };

  const buildCookieBoxDetails = (): string => {
    const flavors = cookieFlavors.length ? cookieFlavors.join(", ") : "No flavors selected";
    const allergensBase = "Contains: wheat, eggs, dairy.";
    const peanutNote = cookieFlavors.includes("Peanut Butter") ? " Contains peanuts." : "";
    const allergens = allergensBase + peanutNote;
    return `FAIRYTALE FARMS — COOKIE BOX
Quantity: ${cookieQty}
Flavors: ${flavors}
Add-on: ${includeMilk ? "Cold Milk" : "None"}

Allergens: ${allergens}

Packaging & Pickup Steps:
1) Line box with parchment; arrange ${cookieQty} cookies to prevent shifting.
2) Place flavor card on top; seal with Fairytale Farms sticker.
3) ${includeMilk ? "Add sealed milk bottle in an insulated pouch; include straw/napkin kit." : "No milk add-on."}
4) Label: Customer name • pickup time • flavor list • allergen note.
5) Stage in porch pickup bin; add ice pack if ambient > 78°F.
6) Send ready-for-pickup message with unboxing cue ("Open on camera for a surprise sticker!").

Notes:
• Photo tip: overhead shot on a light surface; add a few crumbs for texture.
• AOV boost: mini-card—"Add 2 brownies next time" + QR code.`;
  };

  const sendCookieBoxToChat = () => {
    const details = buildCookieBoxDetails();
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: details, timestamp: new Date() }
    ]);
    addConversationNode("Cookie box details generated", "system");
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 0);
  };

  // Compile order from chat + builder + form
  async function compileOrderFromChat() {
    const builderContext = {
      cookieFlavors,
      cookieQty,
      includeMilk,
      form: {
        customer: {
          name: custName,
          email: custEmail,
          phone: custPhone,
          instagram: custInsta
        },
        pickup: {
          date: pickupDate,
          time: pickupTime,
          method: pickupMethod,
          address: pickupAddress
        }
      }
    };

    const extractorSystem = `
You are OrderExtractor for Fairytale Farms. From the conversation PLUS the provided context, extract a single customer order in STRICT JSON (no markdown, no commentary).

JSON schema:
{
  "customer": { "name": "", "email": "", "phone": "", "instagram": "" },
  "pickup": { "date": "", "time": "", "method": "porch|delivery", "address": "" },
  "items": [
    { "type": "cookie", "flavor": "Chocolate Chip", "qty": 6 }
  ],
  "add_ons": { "milk": false },
  "notes": ""
}

Rules:
- Prefer explicit values from the provided context (form + builder) when present.
- If chat mentions a cookie box (6/12/24) with flavors, expand into per-flavor items (split qty evenly if needed).
- If items are missing, default to Cookie Builder: cookieQty + cookieFlavors split evenly.
- add_ons.milk = includeMilk.
- Use 24h time if possible (e.g., "15:00"). Output ONLY valid JSON.`;

    const extractorMessages: Message[] = [
      ...messages,
      { role: "assistant", content: `Context: ${JSON.stringify(builderContext)}` }
    ];

    try {
      const res = await fetch("/.netlify/functions/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: extractorMessages,
          systemPrompt: extractorSystem
        })
      });
      if (!res.ok) throw new Error(`Extractor error ${res.status}`);
      const data = await res.json();
      let text = (data.content[0].text as string) || "";

      // Strip accidental code fences
      text = text
        .replace(/```json\s*([\s\S]*?)```/i, "$1")
        .replace(/```([\s\S]*?)```/g, "$1")
        .trim();

      const parsed = JSON.parse(text);

      // Ensure form values override if they exist
      parsed.customer = {
        name: custName || parsed?.customer?.name || "",
        email: custEmail || parsed?.customer?.email || "",
        phone: custPhone || parsed?.customer?.phone || "",
        instagram: custInsta || parsed?.customer?.instagram || ""
      };
      parsed.pickup = {
        date: pickupDate || parsed?.pickup?.date || "",
        time: pickupTime || parsed?.pickup?.time || "",
        method: pickupMethod || parsed?.pickup?.method || "porch",
        address:
          pickupMethod === "delivery"
            ? pickupAddress || parsed?.pickup?.address || ""
            : ""
      };

      setOrderDraft(parsed);
      setSendResult(null);
    } catch (e) {
      setOrderDraft(null);
      setSendResult({
        ok: false,
        msg: "Could not compile order from chat. Add missing details and try again."
      });
    }
  }

  // Send order email (Netlify function with Resend)
  async function sendOrderEmail() {
    if (!orderDraft) return;
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch("/.netlify/functions/send-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: "fairytalefarms.net@gmail.com",
          order: orderDraft
        })
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || "Send failed");
      setSendResult({
        ok: true,
        msg: "Order email sent to fairytalefarms.net@gmail.com!"
      });
    } catch (err: any) {
      setSendResult({ ok: false, msg: err?.message || "Failed to send email" });
    } finally {
      setSending(false);
    }
  }

  // auto-resize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [inputMessage]);

  return (
    <div className="min-h-screen bg-amber-50 [background-image:radial-gradient(#fef3c7_1px,transparent_1px)] [background-size:20px_20px]">
      <div className="relative z-10 container mx-auto min-h-screen flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-amber-200/60 bg-amber-50/80 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-r ${currentBot.gradient} flex items-center justify-center text-2xl`}
              >
                {currentBot.icon}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-amber-900 flex items-center">
                  <Brain className="w-6 h-6 mr-2 text-amber-600" />
                  Fairytale Farms Assistant
                </h1>
                <p className="text-amber-800 text-sm">
                  Currently: {currentBot.name} • {currentBot.description}
                </p>
              </div>
            </div>

            {/* Emotional State Indicator */}
            <div
              className={`px-4 py-2 rounded-full bg-gradient-to-r ${emotionalColors[emotionalState as keyof typeof emotionalColors]} border border-amber-200/60`}
            >
              <div className="flex items-center space-x-2">
                <Heart className="w-4 h-4 text-amber-800" />
                <span className="text-sm text-amber-900 capitalize">
                  {emotionalState}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex">
          {/* Sidebar */}
          <div className="w-80 bg-white/70 backdrop-blur border-r border-amber-200/60 p-4 overflow-y-auto">
            {/* Conversation Timeline */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-amber-900 mb-3 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-amber-600" />
                Conversation Timeline
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {conversationNodes.slice(-10).map((node) => (
                  <div key={node.id} className="flex items-start space-x-2">
                    <div
                      className={`w-3 h-3 rounded-full bg-gradient-to-r ${
                        botPersonalities[node.personality]?.gradient ||
                        "from-gray-400 to-gray-600"
                      } flex-shrink-0 mt-2`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-amber-900 truncate">
                        {node.message}
                      </p>
                      <p className="text-xs text-amber-700">
                        {new Date(node.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Personality Switcher */}
            <div className="mb-6">
              <h4 className="text-md font-semibold text-amber-900 mb-3 flex items-center">
                <Palette className="w-4 h-4 mr-2 text-amber-600" />
                Expert Personalities
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(botPersonalities).map(([key, personality]) => (
                  <button
                    key={key}
                    onClick={() => switchPersonality(key)}
                    className={`p-3 rounded-lg border transition-all duration-300 text-left ${
                      selectedBot === key
                        ? `bg-gradient-to-r ${personality.gradient} border-amber-300 text-white`
                        : "bg-white border-amber-200 hover:border-amber-300 hover:bg-amber-50 text-amber-900"
                    }`}
                  >
                    <div className="text-lg mb-1">{personality.icon}</div>
                    <div
                      className={`text-xs font-medium ${
                        selectedBot === key ? "text-white" : "text-amber-900"
                      }`}
                    >
                      {personality.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* AI Thinking Canvas */}
            <div className="mb-6 bg-white rounded-lg p-3 border border-amber-200">
              <h4 className="text-sm font-semibold text-amber-900 mb-2 flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-amber-600" />
                AI Thinking Canvas
              </h4>
              <div className="relative h-20 rounded border border-amber-100 overflow-hidden bg-amber-50">
                {canvasData.map((item) => (
                  <div
                    key={item.id}
                    className="absolute text-xs text-amber-800"
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
                      <div className="w-2 h-2 bg-amber-600 rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-amber-600 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 bg-amber-600 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cookie Box Builder */}
            {selectedBot === "baker" && (
              <div className="mb-6 border border-amber-200 rounded-lg p-3 bg-white">
                <h4 className="font-medium mb-2 text-amber-900">
                  🍪 Cookie Box Builder
                </h4>

                <div className="mb-3">
                  <label className="text-sm font-medium block mb-1 text-amber-900">
                    Flavors
                  </label>
                  {[
                    "Chocolate Chip",
                    "Sugar",
                    "Snickerdoodle",
                    "Peanut Butter",
                    "Oatmeal Raisin"
                  ].map((flavor) => (
                    <label key={flavor} className="block text-sm text-amber-900">
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

                {/* —— Customer & Pickup Form —— */}
                <div className="mb-6 border rounded-lg p-3 border-amber-200 bg-amber-50">
                  <h4 className="font-medium mb-2 text-amber-900">
                    🧑‍🍳 Customer & Pickup
                  </h4>

                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div>
                      <label className="block mb-1 font-medium text-amber-900">
                        Customer Name
                      </label>
                      <input
                        value={custName}
                        onChange={(e) => setCustName(e.target.value)}
                        className="w-full p-2 border rounded bg-white text-amber-900 border-amber-200"
                        placeholder="e.g., Sarah Johnson"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-medium text-amber-900">
                        Email
                      </label>
                      <input
                        type="email"
                        value={custEmail}
                        onChange={(e) => setCustEmail(e.target.value)}
                        className="w-full p-2 border rounded bg-white text-amber-900 border-amber-200"
                        placeholder="name@email.com"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block mb-1 font-medium text-amber-900">
                          Phone
                        </label>
                        <input
                          value={custPhone}
                          onChange={(e) => setCustPhone(e.target.value)}
                          className="w-full p-2 border rounded bg-white text-amber-900 border-amber-200"
                          placeholder="(555) 555-5555"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 font-medium text-amber-900">
                          Instagram (opt)
                        </label>
                        <input
                          value={custInsta}
                          onChange={(e) => setCustInsta(e.target.value)}
                          className="w-full p-2 border rounded bg-white text-amber-900 border-amber-200"
                          placeholder="@handle"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block mb-1 font-medium text-amber-900">
                          Pickup Date
                        </label>
                        <input
                          type="date"
                          value={pickupDate}
                          onChange={(e) => setPickupDate(e.target.value)}
                          className="w-full p-2 border rounded bg-white text-amber-900 border-amber-200"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 font-medium text-amber-900">
                          Pickup Time
                        </label>
                        <input
                          type="time"
                          value={pickupTime}
                          onChange={(e) => setPickupTime(e.target.value)}
                          className="w-full p-2 border rounded bg-white text-amber-900 border-amber-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block mb-1 font-medium text-amber-900">
                        Method
                      </label>
                      <div className="flex items-center gap-3 text-amber-900">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="method"
                            className="mr-2"
                            checked={pickupMethod === "porch"}
                            onChange={() => setPickupMethod("porch")}
                          />
                          Porch Pickup
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="method"
                            className="mr-2"
                            checked={pickupMethod === "delivery"}
                            onChange={() => setPickupMethod("delivery")}
                          />
                          Delivery
                        </label>
                      </div>
                    </div>

                    {pickupMethod === "delivery" && (
                      <div>
                        <label className="block mb-1 font-medium text-amber-900">
                          Delivery Address
                        </label>
                        <input
                          value={pickupAddress}
                          onChange={(e) => setPickupAddress(e.target.value)}
                          className="w-full p-2 border rounded bg-white text-amber-900 border-amber-200"
                          placeholder="Street, City, Zip"
                        />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => {
                        if (!custName || !pickupDate || !pickupTime) {
                          setSendResult({
                            ok: false,
                            msg: "Please add at least customer name, pickup date, and time."
                          });
                          return;
                        }
                        compileOrderFromChat();
                      }}
                      className="flex-1 bg-amber-600 text-white rounded px-3 py-2 hover:bg-amber-700 text-sm"
                    >
                      🧾 Compile Order from Chat
                    </button>
                    <button
                      onClick={sendOrderEmail}
                      disabled={!orderDraft || sending}
                      className="flex-1 bg-emerald-600 text-white rounded px-3 py-2 hover:bg-emerald-700 disabled:bg-gray-400 text-sm"
                    >
                      ✉️ Send Order Email
                    </button>
                  </div>

                  {/* Results */}
                  {orderDraft && (
                    <div className="mt-3 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm">
                      <div className="font-medium text-emerald-900 mb-1">
                        Order Preview
                      </div>
                      <pre className="text-xs overflow-auto bg-white border border-emerald-200 rounded p-2 text-emerald-900">
                        {JSON.stringify(orderDraft, null, 2)}
                      </pre>
                      <p className="mt-2 text-emerald-900">
                        Confirm name, pickup time, and items. Then click “Send
                        Order Email”.
                      </p>
                    </div>
                  )}
                  {sendResult && (
                    <div
                      className={`mt-2 rounded p-2 text-sm ${
                        sendResult.ok
                          ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                          : "bg-rose-50 text-rose-900 border border-rose-200"
                      }`}
                    >
                      {sendResult.msg}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="text-sm font-medium block mb-1 text-amber-900">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={cookieQty}
                    onChange={(e) => setCookieQty(Number(e.target.value))}
                    className="w-full p-2 border rounded bg-white text-amber-900 border-amber-200"
                  />
                </div>

                <div className="mb-3">
                  <label className="text-sm text-amber-900">
                    <input
                      type="checkbox"
                      className="mr-2 align-middle"
                      checked={includeMilk}
                      onChange={(e) => setIncludeMilk(e.target.checked)}
                    />
                    Include Milk Add-on
                  </label>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={sendCookieBoxToChat}
                    className="flex-1 bg-pink-600 text-white rounded px-3 py-2 hover:bg-pink-700 text-sm"
                  >
                    Send to Chat
                  </button>
                  <button
                    onClick={() => {
                      setCookieFlavors([]);
                      setCookieQty(6);
                      setIncludeMilk(false);
                    }}
                    className="flex-1 bg-amber-200 text-amber-900 rounded px-3 py-2 hover:bg-amber-300 text-sm"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}

            {/* System Prompt Toggle */}
            <div>
              <button
                onClick={() => setShowSystemPrompt(!showSystemPrompt)}
                className="flex items-center gap-2 text-sm text-amber-800 hover:text-amber-900 transition-colors"
                aria-expanded={showSystemPrompt}
                aria-controls="system-prompt-editor"
              >
                <Settings className="w-4 h-4" />
                {showSystemPrompt ? "Hide" : "Show"} System Prompt
              </button>
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md xl:max-w-lg px-4 py-3 rounded-2xl ${
                      message.role === "user"
                        ? "bg-amber-200 text-amber-900"
                        : `bg-gradient-to-r ${currentBot.gradient} text-white`
                    } shadow-lg border border-white/10`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex items-center mb-2">
                        <span className="text-lg mr-2">{currentBot.icon}</span>
                        <span className="text-sm font-medium opacity-90">
                          {currentBot.name}
                        </span>
                      </div>
                    )}
                    {message.role === "assistant" ? (
                      <Markdown text={message.content} />
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    )}
                    {message.timestamp && (
                      <p className="text-xs mt-2 opacity-70">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div
                    className={`bg-gradient-to-r ${currentBot.gradient} text-white px-4 py-3 rounded-2xl shadow-lg border border-white/10`}
                  >
                    <div className="flex items-center mb-2">
                      <span className="text-lg mr-2">{currentBot.icon}</span>
                      <span className="text-sm font-medium opacity-90">
                        {currentBot.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce" />
                        <div
                          className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <div
                          className="w-2 h-2 bg-white/60 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
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
              <div className="px-6 py-3 border-t border-amber-200/60 bg-white/70">
                <p className="text-sm text-amber-900 mb-2 flex items-center">
                  <Zap className="w-4 h-4 mr-2 text-amber-600" />
                  Suggested Questions:
                </p>
                <div className="flex flex-wrap gap-2">
                  {predictiveResponses.slice(0, 4).map((response, index) => (
                    <button
                      key={index}
                      onClick={() => sendMessage(response)}
                      className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs rounded-full border border-amber-200 transition-all duration-200"
                    >
                      {response}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="p-6 border-t border-amber-200/60 bg-white/80 backdrop-blur">
              <div className="flex space-x-4">
                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={`Ask ${currentBot.name} about ${
                    selectedBot === "finance"
                      ? "budgeting, investing, debt, retirement…"
                      : selectedBot === "baker"
                      ? "recipes, ops, packaging…"
                      : "their expertise…"
                  }`}
                  className="flex-1 bg-white border border-amber-200 rounded-xl px-4 py-3 text-amber-900 placeholder-amber-600 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 resize-none"
                  rows={1}
                  disabled={isLoading}
                />
                <button
                  onClick={() => sendMessage()}
                  disabled={isLoading || !inputMessage.trim()}
                  className={`px-6 py-3 rounded-xl transition-all duration-200 ${
                    isLoading || !inputMessage.trim()
                      ? "bg-amber-300 cursor-not-allowed text-white"
                      : `bg-amber-700 hover:bg-amber-800 shadow text-white`
                  } flex items-center space-x-2`}
                >
                  <Send className="w-4 h-4" />
                  <span>{isLoading ? "Thinking..." : "Send"}</span>
                </button>
              </div>
              <div className="pt-2 text-[11px] text-amber-700">
                ⌘/Ctrl+K to focus • Enter to send • Shift+Enter for newline •
                ⌘/Ctrl+1…4 to switch personas
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Prompt Editor */}
      {showSystemPrompt && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl border border-amber-200 w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="bg-amber-50 px-6 py-4 border-b border-amber-200">
              <h3 className="text-xl font-semibold text-amber-900">
                System Prompt — {currentBot.name}
              </h3>
              <p className="text-sm text-amber-800">
                Adjust the AI's personality and expertise
              </p>
            </div>
            <div className="p-6">
              <textarea
                value={customPrompt || currentBot.systemPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="w-full h-80 p-4 bg-white border border-amber-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-sm font-mono text-amber-900 placeholder-amber-600"
                placeholder="Enter custom system prompt..."
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setCustomPrompt("")}
                  className="px-4 py-2 bg-amber-200 text-amber-900 rounded-lg text-sm hover:bg-amber-300 transition-colors"
                >
                  Reset to Default
                </button>
                <button
                  onClick={() => {
                    setMessages([
                      {
                        role: "assistant",
                        content: getWelcomeMessage(),
                        timestamp: new Date()
                      }
                    ]);
                    setShowSystemPrompt(false);
                  }}
                  className="px-4 py-2 bg-amber-700 text-white rounded-lg text-sm hover:bg-amber-800 transition-colors"
                >
                  Apply & Reset Chat
                </button>
                <button
                  onClick={() => setShowSystemPrompt(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg text-sm hover:bg-gray-300 transition-colors ml-auto"
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