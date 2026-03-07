import { useState, useRef, useEffect } from 'react';
import { apiFetch } from '@services/api';

interface FaqItem {
  _id: string;
  question: string;
  answer: string;
  category: string;
  keywords: string[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
}

const GREETINGS = ['hi', 'hello', 'hey', 'help'];
const GREETING_RESPONSE = "Hi! I'm the SmartHostel assistant. Ask me about leaves, complaints, fees, rooms, or anything else!";

function findBestMatch(query: string, faqs: FaqItem[]): string | null {
  const lower = query.toLowerCase();

  // Check greetings
  if (GREETINGS.some((g) => lower.includes(g)) && lower.length < 20) {
    return GREETING_RESPONSE;
  }

  // Score each FAQ by keyword overlap
  let bestScore = 0;
  let bestAnswer = '';

  for (const faq of faqs) {
    let score = 0;
    const words = lower.split(/\s+/);
    const faqText = `${faq.question} ${faq.keywords.join(' ')}`.toLowerCase();

    for (const word of words) {
      if (word.length > 2 && faqText.includes(word)) {
        score += 1;
      }
    }

    // Bonus for exact substring match in question
    if (faq.question.toLowerCase().includes(lower)) {
      score += 3;
    }

    if (score > bestScore) {
      bestScore = score;
      bestAnswer = faq.answer;
    }
  }

  if (bestScore >= 1) return bestAnswer;
  return null;
}

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', role: 'bot', text: GREETING_RESPONSE },
  ]);
  const [input, setInput] = useState('');
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiFetch<{ faqs: FaqItem[] }>('/assistant/faq')
      .then((res) => setFaqs(res.data.faqs))
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function handleSend() {
    const text = input.trim();
    if (!text) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    // Find answer
    const answer = findBestMatch(text, faqs);
    const botMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'bot',
      text: answer || "I'm not sure about that. Try asking about leaves, complaints, fees, or hostel rules. You can also contact your warden for help.",
    };

    setTimeout(() => {
      setMessages((prev) => [...prev, botMsg]);
    }, 300);
  }

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-teal-600 text-white shadow-lg hover:bg-teal-700 flex items-center justify-center"
        aria-label="Toggle chatbot"
      >
        {isOpen ? (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-36 right-4 z-50 w-80 h-96 bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-teal-600 text-white px-4 py-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full" />
            <span className="font-medium text-sm">SmartHostel Assistant</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-teal-600 text-white rounded-br-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-2 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask a question..."
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <button
              onClick={handleSend}
              className="px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
