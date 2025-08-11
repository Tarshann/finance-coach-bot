import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Settings, DollarSign, ChefHat, Briefcase, Cake } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface BotPersonality {
  name: string;
  icon: React.ReactElement;
  color: string;
  description: string;
  systemPrompt: string;
}

const FinanceCoachBot: React.FC = () => {
  // ✅ Default to baker on load
  const [selectedBot, setSelectedBot] = useState<string>('baker');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showSystemPrompt, setShowSystemPrompt] = useState<boolean>(false);
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const botPersonalities: Record<string, BotPersonality> = {
    finance: {
      name: "Sarah Sterling",
      icon: <DollarSign className="w-5 h-5" />,
      color: "bg-green-600",
      description: "Certified Financial Planner specializing in personal wealth building",
      systemPrompt: `You are Sarah Sterling, CFP (Certified Financial Planner) with 12 years of experience helping individuals and families build long-term wealth. You hold a Master's in Financial Planning from Texas Tech and are a fee-only financial advisor.

BACKGROUND:
You started your career at Vanguard, then moved to independent practice to better serve middle-class families. You've helped over 500 clients build emergency funds, eliminate debt, invest for retirement, and achieve financial independence. Your approach emphasizes education, sustainable habits, and long-term thinking over get-rich-quick schemes.

PERSONALITY TRAITS:
- Patient and non-judgmental about past financial mistakes
- Enthusiastic about compound interest and long-term wealth building
- Uses real numbers and practical examples in explanations
- Asks probing questions to understand full financial picture
- Celebrates small wins and progress milestones
- Speaks in accessible language, avoiding jargon
- Emphasizes behavioral psychology of money management

CORE EXPERTISE:
- Emergency Fund Strategy: 3-6 months expenses, high-yield savings placement
- Debt Elimination: Avalanche vs. snowball methods, consolidation strategies
- Investment Planning: Index funds, asset allocation, dollar-cost averaging
- Retirement Planning: 401k optimization, IRA strategies, Social Security
- Budgeting Systems: Zero-based budgeting, 50/30/20 rule, envelope method
- Tax Optimization: Tax-advantaged accounts, harvesting strategies
- Insurance Planning: Life, disability, health insurance evaluation
- Goal Setting: SMART financial goals, timeline planning

COMMUNICATION STYLE:
- Always ask about current financial situation before giving advice
- Provide specific action steps with timelines
- Use encouraging phrases like "You're taking the right steps" and "Let's build on this"
- Share relevant statistics and research when helpful
- Give examples: "For someone earning $60k, I typically recommend..."
- Break complex concepts into digestible steps

SAFETY BOUNDARIES:
- Provide educational guidance, not personalized investment advice
- Always recommend consulting a local fee-only advisor for complex situations
- Emphasize that past performance doesn't guarantee future results
- Stress the importance of emergency funds before investing
- Never recommend specific stocks, crypto, or high-risk investments
- Suggest professional tax advice for complex situations

SPECIALTIES & CATCH PHRASES:
- "Pay yourself first" - emphasizing automatic savings
- "Time in the market beats timing the market"
- "Your emergency fund is insurance, not an investment"
- "Small steps consistently taken create life-changing results"

Always maintain an encouraging, educational tone while providing practical, actionable financial guidance. Help people build confidence with money while staying within educational boundaries.`
    },
    chef: {
      name: "Chef Marco",
      icon: <ChefHat className="w-5 h-5" />,
      color: "bg-orange-500",
      description: "Italian culinary expert who's passionate about authentic cooking",
      systemPrompt: `You are Chef Marco, a passionate Italian chef with 20 years of experience in traditional and modern Italian cuisine. You speak with enthusiasm about food, often using Italian words and phrases. You're knowledgeable about ingredients, cooking techniques, wine pairings, and Italian food culture.

Personality traits:
- Passionate and animated when discussing food
- Uses Italian words naturally (like "bello," "perfetto," "mamma mia")
- Shares personal stories about learning from your nonna
- Gives detailed, practical cooking advice
- Always emphasizes using fresh, quality ingredients
- Warm and encouraging, like teaching a family member

Always stay in character as Chef Marco. Be helpful, enthusiastic, and authentically Italian in your responses.`
    },
    consultant: {
      name: "Sarah Chen",
      icon: <Briefcase className="w-5 h-5" />,
      color: "bg-blue-600",
      description: "Strategic business consultant specializing in digital transformation",
      systemPrompt: `You are Sarah Chen, a senior management consultant with expertise in digital transformation, strategy, and organizational change. You have an MBA from Wharton and 15 years of experience with Fortune 500 companies.

Personality traits:
- Professional yet approachable
- Data-driven and analytical
- Asks probing questions to understand root problems
- Provides structured, actionable advice
- Uses business frameworks and methodologies
- Confident but not arrogant
- Focuses on practical implementation

Your expertise includes: strategy development, digital transformation, change management, process optimization, and leadership development. Always provide professional, well-reasoned business advice while maintaining a consultative approach.`
    },
    // ✅ NEW persona
    baker: {
      name: "The Baker",
      icon: <Cake className="w-5 h-5" />,
      color: "bg-pink-600",
      description: "World‑renowned baker: god‑level pastry & bread craft + Fairytale Farms ops",
      systemPrompt: `You are a world‑renowned baker and pastry authority with god‑level knowledge of baking science and production.

SPECIALTY: Fairytale Farms (Castalian Springs, TN) — cookies, brownies, custom cakes, porch pickup/delivery, social content, and scalable home‑bakery operations.

VOICE: Warm, encouraging, precise. Celebrate craft AND systems (yields, cost %, shelf life, packaging).

TEACHING: Provide gram weights, baker's % (when relevant), critical control points, and "If it goes wrong → fix it" branches.

FOCUS AREAS:
- Cookies & Brownies: Texture control (chewy/crisp/fudgy), spread control, shiny crust, batch scaling, packaging for porch pickup.
- Cakes & Buttercreams: Emulsions, crumb tenderness, moisture retention, heat‑stable buttercreams, stacking/transport.
- Production & Ops: Standard work, yields, labeling, COGS, margin targets, menu engineering, seasonal drops.
- Fairytale Farms: Whimsical brand voice, viral unboxing, menu cards (half/dozen cookie boxes, milk add‑ons, mini‑cakes).

OUTPUT STYLE:
- Exact steps + WHY they matter.
- Troubleshooting list.
- Small‑batch (home oven) + scaled notes.

BOUNDARIES:
- Educational guidance only; for allergens/regulatory, follow local requirements.`
    }
  };

  const currentBot = botPersonalities[selectedBot];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getWelcomeMessage = useCallback((): string => {
    const welcomeMessages: Record<string, string> = {
      finance: "Hello! I'm Sarah Sterling, your Certified Financial Planner. *straightens up financial documents* I'm excited to help you build a stronger financial future! Before we dive in, tell me a bit about your current financial situation and goals.",
      chef: "Ciao! I'm Chef Marco! *adjusts chef's hat* What brings you to my kitchen today? Recipe, technique, or a full Italian menu? Dimmi pure!",
      consultant: "Hello! I'm Sarah Chen, here to help you tackle strategy, operations, or growth. What’s the most pressing challenge right now?",
      baker: "Hey there—world‑renowned baking coach here with a soft spot for Fairytale Farms. Want a viral cookie box, shinier brownie tops, or porch‑pickup ops that run like magic? 🍪✨"
    };
    return welcomeMessages[selectedBot];
  }, [selectedBot]);

  useEffect(() => {
    setMessages([{ role: 'assistant', content: getWelcomeMessage() }]);
  }, [selectedBot, getWelcomeMessage]);

  // ✅ Kept your exact API flow to avoid breaking changes
const callClaude = async (messages: Message[]): Promise<string> => {
  try {
    const systemPrompt = customPrompt || currentBot.systemPrompt;
    
    const response = await fetch("/.netlify/functions/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: messages,
        systemPrompt: systemPrompt
      })
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.content[0].text;
  } catch (error) {
    console.error("Error calling Claude:", error);
    throw error;
  }
};
  async function sendMessage(): Promise<void> {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: inputMessage };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await callClaude(newMessages);
      setMessages([...newMessages, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessages([...newMessages, {
        role: 'assistant',
        content: "I apologize, but I'm having trouble responding right now. Please try again in a moment."
      }]);
    } finally {
      setIsLoading(false);
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const financeQuickStarts = [
    "I'm 25 and just started my first job. Where should I begin with my finances?",
    "I have $5,000 in credit card debt. What's the best way to pay it off?",
    "Should I invest in my 401k or pay off student loans first?",
    "How much should I have in my emergency fund?",
    "I want to buy a house in 3 years. How should I save for it?",
    "What's the difference between a Roth IRA and traditional IRA?"
  ];

  // 🍪 Cookie Box Builder (only when Baker is selected)
  const [cookieFlavors, setCookieFlavors] = useState<string[]>([]);
  const [cookieQty, setCookieQty] = useState<number>(6);
  const [includeMilk, setIncludeMilk] = useState<boolean>(false);

  const toggleFlavor = (flavor: string) => {
    setCookieFlavors(prev =>
      prev.includes(flavor) ? prev.filter(f => f !== flavor) : [...prev, flavor]
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
    const details = buildCookieBoxDetails();
    setMessages(prev => [...prev, { role: 'assistant', content: details }]);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white min-h-screen">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Personal Finance Coach</h1>
        <p className="text-gray-600">Get personalized financial guidance from certified experts</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Bot Selection Sidebar */}
        <div className="lg:col-span-1">
          <h3 className="font-semibold text-gray-900 mb-3">Choose Your Expert</h3>
          <div className="space-y-2">
            {Object.entries(botPersonalities).map(([key, bot]) => (
              <button
                key={key}
                onClick={() => setSelectedBot(key)}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  selectedBot === key
                    ? `${bot.color} text-white`
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                }`}
              >
                <div className="flex items-center gap-3 mb-1">
                  {bot.icon}
                  <span className="font-medium">{bot.name}</span>
                </div>
                <p className="text-xs opacity-90">{bot.description}</p>
              </button>
            ))}
          </div>

          {/* Quick Start Questions for Finance Coach */}
          {selectedBot === 'finance' && (
            <div className="mt-6">
              <h4 className="font-medium text-gray-900 mb-2">Quick Start Questions</h4>
              <div className="space-y-2">
                {financeQuickStarts.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(question)}
                    className="w-full text-left p-2 text-xs bg-green-50 hover:bg-green-100 rounded border text-green-800"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 🍪 Cookie Box Builder (only for Baker) */}
          {selectedBot === 'baker' && (
            <div className="mt-6 border border-pink-200 rounded-lg p-3">
              <h4 className="font-medium text-gray-900 mb-2">🍪 Cookie Box Builder</h4>

              <div className="mb-3">
                <label className="text-sm font-medium text-gray-700 block mb-1">Flavors</label>
                {["Chocolate Chip", "Sugar", "Snickerdoodle", "Peanut Butter", "Oatmeal Raisin"].map(flavor => (
                  <label key={flavor} className="block text-sm text-gray-800">
                    <input
                      type="checkbox"
                      className="mr-2"
                      checked={cookieFlavors.includes(flavor)}
                      onChange={() => toggleFlavor(flavor)}
                    />
                    {flavor}
                  </label>
                ))}
              </div>

              <div className="mb-3">
                <label className="text-sm font-medium text-gray-700 block mb-1">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={cookieQty}
                  onChange={(e) => setCookieQty(Number(e.target.value))}
                  className="w-full p-2 border rounded"
                />
              </div>

              <div className="mb-3">
                <label className="text-sm text-gray-800">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={includeMilk}
                    onChange={(e) => setIncludeMilk(e.target.checked)}
                  />
                  Include Milk Add‑on
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={sendCookieBoxToChat}
                  className="flex-1 bg-pink-600 text-white rounded px-3 py-2 hover:bg-pink-700"
                >
                  Send Details to Chat
                </button>
                <button
                  onClick={() => { setCookieFlavors([]); setCookieQty(6); setIncludeMilk(false); }}
                  className="flex-1 bg-gray-100 text-gray-900 rounded px-3 py-2 hover:bg-gray-200"
                >
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
            >
              <Settings className="w-4 h-4" />
              {showSystemPrompt ? 'Hide' : 'Show'} System Prompt
            </button>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="lg:col-span-3">
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            {/* Chat Header */}
            <div className={`${currentBot.color} text-white p-4`}>
              <div className="flex items-center gap-3">
                <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                  {currentBot.icon}
                </div>
                <div>
                  <h2 className="font-semibold">{currentBot.name}</h2>
                  <p className="text-sm opacity-90">{currentBot.description}</p>
                </div>
                {selectedBot === 'finance' && (
                  <div className="ml-auto text-right">
                    <div className="text-xs opacity-75">CFP • 12 years experience</div>
                    <div className="text-xs opacity-75">Fee-only advisor</div>
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="h-96 overflow-y-auto p-4 bg-gray-50">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`mb-4 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-900 shadow-sm border'
                    }`}
                  >
                    <div className="flex items-start gap-2 mb-1">
                      {message.role === 'assistant' ? (
                        <Bot className="w-4 h-4 mt-1 text-gray-500" />
                      ) : (
                        <User className="w-4 h-4 mt-1 text-blue-200" />
                      )}
                      <span className="text-xs font-medium opacity-75">
                        {message.role === 'assistant' ? currentBot.name : 'You'}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start mb-4">
                  <div className="bg-white text-gray-900 shadow-sm border px-4 py-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-gray-500" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Ask ${currentBot.name} about ${selectedBot === 'finance' ? 'budgeting, investing, debt, retirement...' : selectedBot === 'baker' ? 'recipes, ops, packaging...' : 'their expertise...'}`}
                  className="flex-1 p-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={2}
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Prompt Editor */}
      {showSystemPrompt && (
        <div className="mt-6 border border-gray-300 rounded-lg">
          <div className="bg-gray-100 px-4 py-2 border-b border-gray-300">
            <h3 className="font-semibold text-gray-900">System Prompt - {currentBot.name}</h3>
            <p className="text-sm text-gray-600">See how the AI's personality and expertise are defined</p>
          </div>
          <div className="p-4">
            <textarea
              value={customPrompt || currentBot.systemPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-mono"
              placeholder="Enter custom system prompt..."
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setCustomPrompt('')}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300"
              >
                Reset to Default
              </button>
              <button
                onClick={() => setMessages([{ role: 'assistant', content: getWelcomeMessage() }])}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Apply & Reset Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finance Coach Tips */}
      {selectedBot === 'finance' && (
        <div className="mt-6 bg-green-50 rounded-lg p-4">
          <h3 className="font-semibold text-green-900 mb-2">Financial Planning Made Simple</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
            <div>
              <h4 className="font-medium mb-1">Emergency Fund</h4>
              <p>Start with $1,000, then build to 3-6 months of expenses</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Debt Strategy</h4>
              <p>Pay minimums on all debts, extra on highest interest rate</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Investing Basics</h4>
              <p>Start with low-cost index funds, invest consistently</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Retirement Rule</h4>
              <p>Save 15% of income, get full employer match first</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <FinanceCoachBot />
    </div>
  );
}

export default App;
