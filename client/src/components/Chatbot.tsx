import { useState, useRef, useEffect } from 'react';
import { apiFetch } from '@services/api';
import { motion, AnimatePresence } from 'motion/react';

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
const GREETING_RESPONSE = "Hi! I'm the SmartHostel assistant. Ask me about leaves, complaints, fees, rooms, laundry, mess menu, visitors, or anything else!";

const FALLBACK_FAQS: FaqItem[] = [
  { _id: 'f1', question: 'How do I apply for leave?', answer: 'Go to Actions > Request Leave. Select the leave type (day outing or overnight), pick your dates, and submit. Your warden will approve or reject it.', category: 'Leaves', keywords: ['leave', 'outing', 'permission', 'apply', 'request', 'absent', 'go home'] },
  { _id: 'f2', question: 'How do I file a complaint?', answer: 'Go to Actions > Report Issue. Select a category (electrical, plumbing, furniture, etc.), describe the issue, and submit. You can track the status on the Status page.', category: 'Complaints', keywords: ['complaint', 'issue', 'report', 'problem', 'maintenance', 'broken', 'fix', 'repair'] },
  { _id: 'f3', question: 'How do I check my gate pass?', answer: 'Once your leave is approved, go to Actions > Show QR to view your gate pass QR code. The guard will scan it when you exit and return.', category: 'Gate Pass', keywords: ['gate', 'pass', 'qr', 'scan', 'exit', 'entry', 'guard', 'show'] },
  { _id: 'f4', question: 'How do I book a laundry slot?', answer: 'Go to the Laundry tab. Select a date, find an available slot on the machine grid, and click "Book". You can have up to 2 active bookings at a time.', category: 'Laundry', keywords: ['laundry', 'wash', 'washing', 'machine', 'clothes', 'book', 'slot', 'booking'] },
  { _id: 'f5', question: 'Where can I see the mess menu?', answer: 'Go to the Menu tab to see today\'s menu and the full weekly schedule. You can rate each meal with thumbs up/down.', category: 'Mess', keywords: ['mess', 'menu', 'food', 'breakfast', 'lunch', 'dinner', 'snacks', 'meal', 'eat', 'canteen'] },
  { _id: 'f6', question: 'How do I request a room change?', answer: 'Go to Actions > Room Change. Browse available rooms filtered by your gender, select one, provide a reason, and submit your request. The warden will review it.', category: 'Rooms', keywords: ['room', 'change', 'transfer', 'shift', 'swap', 'roommate', 'move'] },
  { _id: 'f7', question: 'How do I register a visitor?', answer: 'Go to Actions > Register Visitor. Enter your visitor\'s name, phone number, relationship, and expected visit date. The warden will approve or reject the visit.', category: 'Visitors', keywords: ['visitor', 'visit', 'guest', 'parent', 'friend', 'register', 'coming'] },
  { _id: 'f8', question: 'What are the hostel timings?', answer: 'General hostel timings: In-time is 9:00 PM on weekdays and 10:00 PM on weekends. Day outings must return by 7:00 PM. Late entry requires warden approval.', category: 'Rules', keywords: ['timing', 'time', 'curfew', 'late', 'rule', 'entry', 'in-time', 'when', 'close'] },
  { _id: 'f9', question: 'How do I check my fee status?', answer: 'Your room fee details are visible on your profile. Hostel fees are charged per semester and vary by room type (Deluxe/Normal) and AC/Non-AC.', category: 'Fees', keywords: ['fee', 'fees', 'payment', 'pay', 'charge', 'cost', 'price', 'money', 'amount', 'semester'] },
  { _id: 'f10', question: 'How do I report a lost item?', answer: 'Go to Actions > Lost & Found. Click "New Post", select "Lost", describe your item with category and location, and post it. Other students can see it and help you find it.', category: 'Lost & Found', keywords: ['lost', 'found', 'missing', 'item', 'find', 'search', 'stolen', 'misplace'] },
  { _id: 'f11', question: 'How do I contact the warden?', answer: 'You can reach your warden through the hostel office during office hours (9 AM - 5 PM). For emergencies, use the SOS feature on the Status page.', category: 'General', keywords: ['warden', 'contact', 'reach', 'call', 'office', 'emergency', 'sos'] },
  { _id: 'f12', question: 'Can I change my room?', answer: 'Yes! Go to Actions > Room Change to request a transfer. Rooms are allocated based on gender and you\'ll be matched with students of the same academic year.', category: 'Rooms', keywords: ['room', 'allocation', 'allot', 'assign', 'bed', 'hostel', 'accommodation'] },
];

function findBestMatch(query: string, faqs: FaqItem[]): string | null {
  const lower = query.toLowerCase();

  if (GREETINGS.some((g) => lower.includes(g)) && lower.length < 20) {
    return GREETING_RESPONSE;
  }

  const allFaqs = [...faqs, ...FALLBACK_FAQS];

  let bestScore = 0;
  let bestAnswer = '';

  for (const faq of allFaqs) {
    let score = 0;
    const words = lower.split(/\s+/);
    const faqText = `${faq.question} ${faq.keywords.join(' ')}`.toLowerCase();

    for (const word of words) {
      if (word.length > 2 && faqText.includes(word)) {
        score += 1;
      }
    }

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
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full bg-teal-600 text-white shadow-lg hover:bg-teal-700 flex items-center justify-center"
        aria-label="Toggle chatbot"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.svg
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </motion.svg>
          ) : (
            <motion.svg
              key="chat"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </motion.svg>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-36 right-4 z-50 w-80 h-96 bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-teal-600 text-white px-4 py-3 flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 bg-green-400 rounded-full"
              />
              <span className="font-medium text-sm">SmartHostel Assistant</span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.2 }}
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
                </motion.div>
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
                className="flex-1 px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 transition-shadow"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleSend}
                className="px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
