import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@hooks/useAuth';

/* ── Types ────────────────────────────────────────────────────── */

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

/* ── Suggested prompts ────────────────────────────────────────── */

const STUDENT_SUGGESTIONS = [
  { label: '📋 My Leaves', prompt: 'What is the status of my recent leave requests?' },
  { label: '🔧 My Complaints', prompt: 'Show me the status of my recent complaints' },
  { label: '💰 Fee Status', prompt: 'What are my pending fees?' },
  { label: '👕 Laundry', prompt: 'How do I book a laundry slot?' },
  { label: '🍽️ Mess Menu', prompt: "Where can I see today's mess menu?" },
  { label: '🏠 Room Change', prompt: 'How do I request a room change?' },
];

const MAINTENANCE_SUGGESTIONS = [
  { label: '📋 My Tasks', prompt: 'What are my assigned tasks?' },
  { label: '📦 Low Stock', prompt: 'Any low stock items?' },
  { label: '🔄 Update Status', prompt: 'How do I update task status?' },
  { label: '🔧 Repairs', prompt: 'Assets needing repair?' },
  { label: '⏱️ SLA Policy', prompt: "What's the SLA policy?" },
  { label: '🚨 Emergency', prompt: 'Emergency maintenance help' },
];

const GUARD_SUGGESTIONS = [
  { label: '🚪 Gate Status', prompt: 'Show me today\'s gate scan summary' },
  { label: '📋 Pending Passes', prompt: 'How many active gate passes are there right now?' },
  { label: '🔍 Verify Student', prompt: 'How do I verify a student\'s gate pass?' },
  { label: '👥 Visitors Today', prompt: 'How many visitors are expected today?' },
  { label: '🚨 Denied Entries', prompt: 'Show me recent denied gate entries' },
  { label: '⚙️ Override Help', prompt: 'When and how should I use the gate override?' },
];

const WARDEN_SUGGESTIONS = [
  { label: '📊 Overview', prompt: 'Give me a quick overview of the hostel status' },
  { label: '📋 Pending Leaves', prompt: 'How many leave requests are pending approval?' },
  { label: '🔧 Open Complaints', prompt: 'Show me the open complaints summary' },
  { label: '🏠 Occupancy', prompt: 'What is the current room occupancy?' },
  { label: '🚨 Emergencies', prompt: 'Any active emergency alerts?' },
  { label: '📢 Notices', prompt: 'What are the recent notices?' },
];

/* ── Streaming fetch helper ───────────────────────────────────── */

async function streamChat(
  message: string,
  history: { role: 'user' | 'assistant'; content: string }[],
  onChunk: (text: string) => void,
  onDone: () => void,
  onError: (err: string) => void,
) {
  try {
    const res = await fetch('/api/assistant/chat/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ message, history }),
    });

    if (!res.ok || !res.body) {
      onError('Failed to connect to AI assistant');
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();

        if (data === '[DONE]') {
          onDone();
          return;
        }

        try {
          const parsed = JSON.parse(data) as { content?: string; error?: string };
          if (parsed.error) {
            onError(parsed.error);
            return;
          }
          if (parsed.content) {
            onChunk(parsed.content);
          }
        } catch {
          // skip malformed chunks
        }
      }
    }

    onDone();
  } catch {
    onError('Connection lost. Please try again.');
  }
}

/* ── Typing indicator ─────────────────────────────────────────── */

const THINKING_PHASES = [
  'Searching your data...',
  'Analyzing context...',
  'Crafting response...',
];

function TypingIndicator() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setPhase((p) => (p + 1) % THINKING_PHASES.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col gap-2 px-4 py-3.5">
      <div className="flex items-center gap-2.5">
        {/* Animated sparkle icon with pulse */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="relative"
        >
          <svg
            className="w-4 h-4 text-[hsl(var(--accent))]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
          </svg>
          <motion.div
            className="absolute inset-0 rounded-full bg-[hsl(var(--accent))]"
            animate={{ opacity: [0, 0.2, 0], scale: [0.8, 1.5, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
        <AnimatePresence mode="wait">
          <motion.span
            key={phase}
            initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={{ duration: 0.25 }}
            className="text-[11px] text-[hsl(var(--muted-foreground))] font-medium tracking-wide"
          >
            {THINKING_PHASES[phase]}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="flex items-center gap-1.5 pl-0.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-[7px] h-[7px] rounded-full bg-[hsl(var(--accent))]"
            animate={{
              y: [0, -8, 0],
              opacity: [0.3, 1, 0.3],
              scale: [0.85, 1.1, 0.85],
            }}
            transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Message bubble ───────────────────────────────────────────── */

function MessageBubble({ msg, isStreaming, isWarden }: { msg: ChatMessage; isStreaming?: boolean; isWarden?: boolean }) {
  const isUser = msg.role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div
        className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
          isUser
            ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
            : isWarden
            ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white'
            : 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]'
        }`}
      >
        {isUser ? 'You' : isWarden ? 'WA' : 'AI'}
      </div>

      {/* Content */}
      <div className={`flex-1 min-w-0 ${isUser ? 'flex flex-col items-end' : ''}`}>
        <div
          className={`inline-block px-4 py-2.5 rounded-2xl text-sm leading-relaxed max-w-[90%] ${
            isUser
              ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-br-md'
              : 'bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] rounded-bl-md'
          }`}
        >
          {isUser ? (
            <span>{msg.content}</span>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_strong]:text-inherit [&_a]:text-[hsl(var(--accent))]">
              <ReactMarkdown>{msg.content || ' '}</ReactMarkdown>
              {isStreaming && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="inline-block w-0.5 h-4 bg-current ml-0.5 align-text-bottom"
                />
              )}
            </div>
          )}
        </div>
        <span className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1 px-1">
          {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
}

/* ── Main Chatbot ─────────────────────────────────────────────── */

export default function Chatbot() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new content
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
  }, [isOpen]);

  const isWarden = user?.role === 'WARDEN_ADMIN';
  const isGuard = user?.role === 'GUARD';
  const isMaintenance = user?.role === 'MAINTENANCE';
  const greeting = user?.name ? `Hey ${user.name.split(' ')[0]}! ` : 'Hey! ';
  const suggestions = isWarden ? WARDEN_SUGGESTIONS : isGuard ? GUARD_SUGGESTIONS : isMaintenance ? MAINTENANCE_SUGGESTIONS : STUDENT_SUGGESTIONS;

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    const botId = (Date.now() + 1).toString();
    const botMsg: ChatMessage = {
      id: botId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput('');
    setIsStreaming(true);
    setStreamingId(botId);

    // Build history for context
    const history = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    await streamChat(
      text.trim(),
      history,
      (chunk) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botId ? { ...m, content: m.content + chunk } : m,
          ),
        );
      },
      () => {
        setIsStreaming(false);
        setStreamingId(null);
      },
      (err) => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botId
              ? { ...m, content: err || 'Sorry, something went wrong. Please try again.' }
              : m,
          ),
        );
        setIsStreaming(false);
        setStreamingId(null);
      },
    );
  }, [isStreaming, messages]);

  const handleSend = () => void sendMessage(input);

  const handleSuggestion = (prompt: string) => void sendMessage(prompt);

  const handleClear = () => {
    setMessages([]);
    setIsStreaming(false);
    setStreamingId(null);
  };

  return (
    <>
      {/* ── Floating Toggle Button ──────────────────────────────── */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`fixed bottom-20 right-4 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center ${
          isWarden
            ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white'
            : 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]'
        }`}
        aria-label="Toggle chatbot"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.svg key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }} className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </motion.svg>
          ) : isWarden ? (
            <motion.svg key="admin" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }} className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </motion.svg>
          ) : (
            <motion.svg key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }} className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </motion.svg>
          )}
        </AnimatePresence>

        {/* Unread indicator when closed */}
        {!isOpen && messages.length === 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-[hsl(var(--background))] ${isWarden ? 'bg-amber-400' : 'bg-green-500'}`}
          />
        )}
      </motion.button>

      {/* ── Chat Panel ──────────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.92, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 20, scale: 0.92, filter: 'blur(8px)' }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className="fixed bottom-36 right-4 z-50 w-[360px] h-[32rem] sm:w-[400px] sm:h-[36rem] glass-strong rounded-2xl shadow-2xl flex flex-col overflow-hidden card-glow"
          >
            {/* ── Header ────────────────────────────────────────── */}
            <div className={`px-4 py-3 flex items-center gap-3 ${
              isWarden
                ? 'bg-gradient-to-r from-indigo-600 to-purple-700 text-white'
                : 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]'
            }`}>
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                {isWarden ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{isWarden ? 'Admin Command Center' : isGuard ? 'Gate Assistant' : isMaintenance ? 'Maintenance Hub' : 'SmartHostel AI'}</span>
                  <span className="text-[9px] bg-white/20 px-1.5 py-0.5 rounded-full font-medium">{isWarden ? 'Admin' : isGuard ? 'Guard' : isMaintenance ? 'Staff' : 'GPT-4o'}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isWarden ? 'bg-emerald-300' : 'bg-green-400'}`} />
                  <span className="text-[10px] opacity-80">{isWarden ? 'Online \u00b7 Full hostel access' : isGuard ? 'Online \u00b7 Gate & visitor data' : isMaintenance ? 'Online \u00b7 Tasks & inventory' : 'Online \u00b7 Knows your hostel data'}</span>
                </div>
              </div>
              {messages.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleClear}
                  className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
                  title="New conversation"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                  </svg>
                </motion.button>
              )}
            </div>

            {/* ── Messages ──────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scroll-smooth">
              {messages.length === 0 ? (
                /* ── Welcome screen ─────────────────────────────── */
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center justify-center h-full text-center px-2"
                >
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg ${
                      isWarden
                        ? 'bg-gradient-to-br from-indigo-600 to-purple-700'
                        : 'bg-[hsl(var(--accent))]'
                    }`}
                  >
                    {isWarden ? (
                      <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                      </svg>
                    ) : (
                      <svg className="w-8 h-8 text-[hsl(var(--accent-foreground))]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                      </svg>
                    )}
                  </motion.div>

                  <h3 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-1">
                    {isWarden ? `${greeting}What needs attention?` : isGuard ? `${greeting}Need gate help?` : isMaintenance ? `${greeting}What's on the board?` : `${greeting}How can I help?`}
                  </h3>
                  <p className="text-xs text-[hsl(var(--muted-foreground))] mb-5 max-w-[250px]">
                    {user?.role === 'WARDEN_ADMIN'
                      ? 'I can help you manage leaves, complaints, occupancy, notices, and the entire hostel.'
                      : user?.role === 'GUARD'
                      ? 'I can help with gate scans, pass verification, visitor info, and override procedures.'
                      : user?.role === 'MAINTENANCE'
                      ? 'I know about your tasks, inventory, assets, and everything in SmartHostel.'
                      : 'I know about your leaves, complaints, fees, and everything in SmartHostel.'}
                  </p>

                  {/* Suggestion chips */}
                  <div className="flex flex-wrap gap-2 justify-center">
                    {suggestions.map((s) => (
                      <motion.button
                        key={s.label}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSuggestion(s.prompt)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          isWarden
                            ? 'border-indigo-300/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950/30'
                            : 'border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
                        }`}
                      >
                        {s.label}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                /* ── Message list ───────────────────────────────── */
                messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    isStreaming={msg.id === streamingId}
                    isWarden={isWarden}
                  />
                ))
              )}

              {/* Typing indicator — only when waiting for first chunk */}
              {isStreaming && streamingId && messages.find((m) => m.id === streamingId)?.content === '' && (
                <div className="flex gap-3">
                  <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    isWarden
                      ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white'
                      : 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]'
                  }`}>
                    {isWarden ? 'WA' : 'AI'}
                  </div>
                  <div className="bg-[hsl(var(--muted))] rounded-2xl rounded-bl-md">
                    <TypingIndicator />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Input area ────────────────────────────────────── */}
            <div className="border-t border-[hsl(var(--border))] p-3">
              <div className="flex gap-2 items-end">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder={isStreaming ? 'AI is responding...' : isWarden ? 'Ask about hostel operations...' : isGuard ? 'Ask about gate ops, passes...' : isMaintenance ? 'Ask about tasks, inventory...' : 'Message SmartHostel AI...'}
                  disabled={isStreaming}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))]/50 focus:border-[hsl(var(--ring))] transition-all disabled:opacity-50 placeholder:text-[hsl(var(--muted-foreground))]"
                />
                <motion.button
                  whileHover={isStreaming ? {} : { scale: 1.05 }}
                  whileTap={isStreaming ? {} : { scale: 0.9 }}
                  onClick={handleSend}
                  disabled={isStreaming || !input.trim()}
                  className={`p-2.5 rounded-xl hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all ${
                    isWarden
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-700 text-white'
                      : 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
                </motion.button>
              </div>
              <p className="text-[9px] text-[hsl(var(--muted-foreground))] text-center mt-2 opacity-60">
                {isWarden ? 'AI assistant for hostel administration. Verify critical data in the dashboard.' : isGuard ? 'Gate assistant. Always verify passes before allowing entry.' : isMaintenance ? 'Maintenance assistant. Check task board for latest assignments.' : 'AI can make mistakes. Verify important info with your warden.'}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
