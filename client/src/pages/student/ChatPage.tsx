import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Reveal } from '@/components/motion/Reveal';
import { StaggerContainer, StaggerItem } from '@/components/motion/Stagger';
import PageHeader from '@components/ui/PageHeader';
import { PageSkeleton } from '@components/Skeleton';
import { apiFetch } from '@services/api';
import { showError, showSuccess } from '@/utils/toast';
import { useAuth } from '@hooks/useAuth';
import { usePageTitle } from '@hooks/usePageTitle';
import {
  MessageCircle,
  Send,
  CheckCheck,
  Check,
  ArrowLeft,
  Circle,
} from 'lucide-react';

const spring = { type: 'spring' as const, stiffness: 400, damping: 28 };

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  timestamp: string;
  read: boolean;
}

interface Conversation {
  id: string;
  partnerName: string;
  partnerAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  online: boolean;
  typing: boolean;
}

export default function ChatPage() {
  usePageTitle('Chat');
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  async function fetchConversations() {
    try {
      setLoading(true);
      const res = await apiFetch('/assistant/conversations');
      setConversations(res.data ?? []);
    } catch {
      showError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages(conversationId: string) {
    try {
      setMessagesLoading(true);
      const res = await apiFetch(`/assistant/conversations/${conversationId}/messages`);
      setMessages(res.data ?? []);
    } catch {
      showError('Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  }

  function handleSelectConversation(conv: Conversation) {
    setSelectedConversation(conv);
    fetchMessages(conv.id);
  }

  function handleBack() {
    setSelectedConversation(null);
    setMessages([]);
  }

  async function handleSend() {
    if (!inputValue.trim() || !selectedConversation || sending) return;

    const text = inputValue.trim();
    setInputValue('');
    setSending(true);

    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`,
      conversationId: selectedConversation.id,
      senderId: user?.id ?? '',
      text,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      await apiFetch(`/assistant/conversations/${selectedConversation.id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      showSuccess('Message sent');
    } catch {
      showError('Failed to send message');
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id));
      setInputValue(text);
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function formatTime(timestamp: string) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  if (loading) return <PageSkeleton />;

  const isOwnMessage = (msg: Message) => msg.senderId === user?.id;

  /* ---- Conversation List ---- */
  const conversationList = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-[hsl(var(--border))]">
        <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">Messages</h2>
      </div>

      {conversations.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={spring}
            className="w-16 h-16 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center"
          >
            <MessageCircle className="w-8 h-8 text-[hsl(var(--muted-foreground))]" />
          </motion.div>
          <p className="text-[hsl(var(--muted-foreground))]">No conversations yet</p>
        </div>
      ) : (
        <StaggerContainer className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <StaggerItem key={conv.id}>
              <motion.button
                whileHover={{ backgroundColor: 'hsl(var(--accent) / 0.06)' }}
                whileTap={{ scale: 0.98 }}
                transition={spring}
                onClick={() => handleSelectConversation(conv)}
                className={`w-full flex items-center gap-3 p-4 text-left border-b border-[hsl(var(--border))] transition-colors ${
                  selectedConversation?.id === conv.id
                    ? 'bg-[hsl(var(--accent))]/10'
                    : ''
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-full bg-[hsl(var(--accent))]/20 flex items-center justify-center text-[hsl(var(--accent-foreground))] font-semibold text-sm">
                    {conv.partnerName.charAt(0).toUpperCase()}
                  </div>
                  {conv.online && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[hsl(var(--card))]" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm text-[hsl(var(--foreground))] truncate">
                      {conv.partnerName}
                    </span>
                    <span className="text-xs text-[hsl(var(--muted-foreground))] flex-shrink-0 ml-2">
                      {formatTime(conv.lastMessageTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                      {conv.lastMessage}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className="ml-2 flex-shrink-0 w-5 h-5 rounded-full bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] text-[10px] font-bold flex items-center justify-center">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}
    </div>
  );

  /* ---- Typing Indicator ---- */
  const typingIndicator = (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="flex items-center gap-2 px-4 py-2"
    >
      <div className="flex items-center gap-1 px-3 py-2 rounded-2xl bg-[hsl(var(--card))] border border-[hsl(var(--border))]">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full bg-[hsl(var(--muted-foreground))]"
            animate={{ y: [0, -4, 0] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
            }}
          />
        ))}
      </div>
    </motion.div>
  );

  /* ---- Message Thread ---- */
  const messageThread = selectedConversation ? (
    <div className="flex flex-col h-full">
      {/* Thread Header */}
      <div className="flex items-center gap-3 p-4 border-b border-[hsl(var(--border))]">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={spring}
          onClick={handleBack}
          className="lg:hidden p-1 rounded-lg hover:bg-[hsl(var(--muted))]"
        >
          <ArrowLeft className="w-5 h-5 text-[hsl(var(--foreground))]" />
        </motion.button>
        <div className="w-9 h-9 rounded-full bg-[hsl(var(--accent))]/20 flex items-center justify-center text-[hsl(var(--accent-foreground))] font-semibold text-sm">
          {selectedConversation.partnerName.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-medium text-sm text-[hsl(var(--foreground))]">
            {selectedConversation.partnerName}
          </p>
          <div className="flex items-center gap-1.5">
            <Circle
              className={`w-2 h-2 fill-current ${
                selectedConversation.online
                  ? 'text-emerald-500'
                  : 'text-[hsl(var(--muted-foreground))]'
              }`}
            />
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              {selectedConversation.online ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messagesLoading ? (
          <div className="flex items-center justify-center h-full">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-6 h-6 border-2 border-[hsl(var(--accent))] border-t-transparent rounded-full"
            />
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const own = isOwnMessage(msg);
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={spring}
                  className={`flex ${own ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                      own
                        ? 'bg-[hsl(var(--accent))]/10 border border-[hsl(var(--accent))]/30 rounded-br-md'
                        : 'bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm text-[hsl(var(--foreground))] whitespace-pre-wrap break-words">
                      {msg.text}
                    </p>
                    <div
                      className={`flex items-center gap-1 mt-1 ${
                        own ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <span className="text-[10px] text-[hsl(var(--muted-foreground))]">
                        {formatTime(msg.timestamp)}
                      </span>
                      {own && (
                        msg.read ? (
                          <CheckCheck className="w-3.5 h-3.5 text-[hsl(var(--accent))]" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-[hsl(var(--muted-foreground))]" />
                        )
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        <AnimatePresence>
          {selectedConversation.typing && typingIndicator}
        </AnimatePresence>

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-[hsl(var(--border))]">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2.5 text-sm text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--accent))]/40 max-h-32"
            style={{ minHeight: '2.5rem' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${Math.min(target.scrollHeight, 128)}px`;
            }}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            transition={spring}
            onClick={handleSend}
            disabled={!inputValue.trim() || sending}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </motion.button>
        </div>
        <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-1.5 ml-1">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  ) : (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={spring}
        className="w-20 h-20 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center"
      >
        <MessageCircle className="w-10 h-10 text-[hsl(var(--muted-foreground))]" />
      </motion.div>
      <p className="text-[hsl(var(--muted-foreground))]">
        Select a conversation to start chatting
      </p>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <Reveal>
        <PageHeader
          title="Messages"
          subtitle="Chat with your hostel warden"
          icon={<MessageCircle className="w-6 h-6" />}
        />
      </Reveal>

      <Reveal>
        <div className="flex-1 mx-auto w-full max-w-6xl px-4 pb-6">
          <div className="card-glow rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden h-[calc(100vh-14rem)]">
            {/* Desktop: side by side */}
            <div className="hidden lg:grid lg:grid-cols-[340px_1fr] h-full">
              <div className="border-r border-[hsl(var(--border))] overflow-hidden">
                {conversationList}
              </div>
              <div className="overflow-hidden">{messageThread}</div>
            </div>

            {/* Mobile: toggle between list and thread */}
            <div className="lg:hidden h-full">
              <AnimatePresence mode="wait">
                {selectedConversation ? (
                  <motion.div
                    key="thread"
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={spring}
                    className="h-full"
                  >
                    {messageThread}
                  </motion.div>
                ) : (
                  <motion.div
                    key="list"
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '-100%' }}
                    transition={spring}
                    className="h-full"
                  >
                    {conversationList}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
