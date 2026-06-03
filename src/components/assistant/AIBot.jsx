import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  Compass,
  Lock,
  LogOut,
  MessageCircle,
  Send,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { NAV_ITEMS, getAllowedNavItems } from '../../config/navigation';

const normalize = value =>
  value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s/-]/g, ' ')
    .replace(/[/-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const fillerWords = new Set([
  'a',
  'an',
  'and',
  'can',
  'could',
  'do',
  'for',
  'go',
  'i',
  'me',
  'my',
  'navigate',
  'need',
  'open',
  'page',
  'please',
  'section',
  'show',
  'take',
  'the',
  'to',
  'view',
  'want',
]);

const compactQuery = value =>
  normalize(value)
    .split(' ')
    .filter(word => word && !fillerWords.has(word))
    .join(' ');

const makeAction = item => ({
  label: item.label,
  path: item.path,
  icon: item.icon,
});

const getRouteScore = (item, query) => {
  const raw = normalize(query);
  const compact = compactQuery(query);
  const terms = [
    item.label,
    item.path.replace('/', ''),
    item.group,
    ...(item.keywords || []),
  ].map(normalize);
  const compactWords = new Set(compact.split(' ').filter(Boolean));

  return terms.reduce((score, term) => {
    if (!term) return score;
    let nextScore = score;

    if (raw === term || compact === term) nextScore += 80;
    if (raw.includes(term)) nextScore += term.length > 6 ? 36 : 18;
    if (compact && term.includes(compact)) nextScore += compact.length > 4 ? 22 : 8;

    const termWords = term.split(' ').filter(Boolean);
    termWords.forEach(word => {
      if (word.length > 2 && compactWords.has(word)) nextScore += 8;
    });

    return nextScore;
  }, 0);
};

const findBestRoute = query => {
  const scoredItems = NAV_ITEMS
    .map(item => ({ item, score: getRouteScore(item, query) }))
    .sort((a, b) => b.score - a.score);

  return scoredItems[0]?.score > 12 ? scoredItems[0].item : null;
};

const AIBot = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, hasRole, logout, getRoleDisplayName } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      author: 'bot',
      text: 'Hi, I can help you move around Lekope FIS and find the right page for a task.',
      actions: [],
    },
  ]);
  const messagesEndRef = useRef(null);

  const allowedItems = useMemo(() => getAllowedNavItems(hasRole), [hasRole, user?.role]);
  const currentItem = NAV_ITEMS.find(item => item.path === pathname);
  const userRole = getRoleDisplayName(user?.role);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  const isAllowed = item => item.roles.some(role => hasRole(role));

  const addBotMessage = message => {
    setMessages(prev => [
      ...prev,
      {
        id: `bot-${Date.now()}-${prev.length}`,
        author: 'bot',
        ...message,
      },
    ]);
  };

  const buildAllowedMessage = () => {
    const pageList = allowedItems.map(item => item.label).join(', ');

    return {
      text: pageList
        ? `Your ${userRole} role can access: ${pageList}.`
        : `I cannot find any pages for your ${userRole} role yet.`,
      actions: allowedItems.slice(0, 6).map(makeAction),
    };
  };

  const handleBotResult = query => {
    const trimmed = query.trim();
    const lower = normalize(trimmed);

    if (/\b(log out|logout|sign out|exit account)\b/.test(lower)) {
      addBotMessage({ text: 'Signing you out now.', actions: [] });
      window.setTimeout(() => {
        logout();
        navigate('/login');
      }, 350);
      return;
    }

    if (/\b(where am i|current page|this page)\b/.test(lower)) {
      addBotMessage({
        text: currentItem
          ? `You are on ${currentItem.label}. ${currentItem.description}`
          : 'You are in the Lekope FIS workspace.',
        actions: currentItem ? [makeAction(currentItem)] : [],
      });
      return;
    }

    const target = findBestRoute(trimmed);
    const asksForList = /\b(access|allowed|available|menu|modules|pages|permissions|where can|what can)\b/.test(lower);
    const asksForDetails = /\b(explain|help with|tell me about|what is|what does|where do i)\b/.test(lower);
    const wantsNavigation = /\b(go|open|navigate|show|take|view|launch)\b/.test(lower);

    if (target) {
      if (!isAllowed(target)) {
        addBotMessage({
          text: `${target.label} is restricted for your ${userRole} role. I can only take you to pages your account is allowed to access.`,
          actions: allowedItems.slice(0, 5).map(makeAction),
        });
        return;
      }

      if (asksForDetails && !wantsNavigation) {
        addBotMessage({
          text: `${target.label}: ${target.description}`,
          actions: [makeAction(target)],
        });
        return;
      }

      navigate(target.path);
      addBotMessage({
        text: `Opening ${target.label}.`,
        actions: [],
      });
      return;
    }

    if (asksForList) {
      addBotMessage(buildAllowedMessage());
      return;
    }

    addBotMessage({
      text: 'I can help with navigation, page access, and finding where a task belongs. Try asking for invoices, bookings, reports, users, payroll, or allowed pages.',
      actions: allowedItems.slice(0, 6).map(makeAction),
    });
  };

  const handleSubmit = event => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}-${prev.length}`,
        author: 'user',
        text: trimmed,
        actions: [],
      },
    ]);
    setInput('');
    handleBotResult(trimmed);
  };

  const handleAction = action => {
    if (!action.path) return;
    const item = NAV_ITEMS.find(navItem => navItem.path === action.path);

    if (item && isAllowed(item)) {
      navigate(item.path);
      addBotMessage({
        text: `Opening ${item.label}.`,
        actions: [],
      });
      return;
    }

    addBotMessage({
      text: 'That page is not available for your current role.',
      actions: allowedItems.slice(0, 5).map(makeAction),
    });
  };

  return (
    <div className="ai-assistant" aria-live="polite">
      {isOpen && (
        <section className="ai-assistant__panel" aria-label="AI assistant">
          <header className="ai-assistant__header">
            <div className="ai-assistant__identity">
              <span className="ai-assistant__avatar">
                <Bot size={18} />
              </span>
              <div>
                <strong>Lekope AI</strong>
                <span>{userRole || 'Assistant'}</span>
              </div>
            </div>
            <button
              type="button"
              className="ai-assistant__icon"
              onClick={() => setIsOpen(false)}
              aria-label="Close assistant"
              title="Close assistant"
            >
              <X size={16} />
            </button>
          </header>

          <div className="ai-assistant__quickbar">
            <button type="button" onClick={() => handleBotResult('what can I access')}>
              <Compass size={14} />
              My pages
            </button>
            <button type="button" onClick={() => handleBotResult('where am I')}>
              <Sparkles size={14} />
              Current page
            </button>
            <button type="button" onClick={() => handleBotResult('logout')}>
              <LogOut size={14} />
              Logout
            </button>
          </div>

          <div className="ai-assistant__messages">
            {messages.map(message => (
              <div
                key={message.id}
                className={`ai-assistant__message ai-assistant__message--${message.author}`}
              >
                {message.author === 'bot' && (
                  <span className="ai-assistant__message-icon">
                    <Bot size={14} />
                  </span>
                )}
                <div className="ai-assistant__bubble">
                  <p>{message.text}</p>
                  {message.actions?.length > 0 && (
                    <div className="ai-assistant__actions">
                      {message.actions.map(action => {
                        const ActionIcon = action.icon || ArrowRight;
                        return (
                          <button
                            type="button"
                            key={`${message.id}-${action.path || action.label}`}
                            onClick={() => handleAction(action)}
                          >
                            <ActionIcon size={13} />
                            {action.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form className="ai-assistant__form" onSubmit={handleSubmit}>
            <Lock size={14} />
            <input
              value={input}
              onChange={event => setInput(event.target.value)}
              placeholder="Ask to open invoices, bookings, reports..."
              aria-label="Ask Lekope AI"
            />
            <button type="submit" aria-label="Send message" title="Send message">
              <Send size={15} />
            </button>
          </form>
        </section>
      )}

      {!isOpen && (
        <button
          type="button"
          className="ai-assistant__launcher"
          onClick={() => setIsOpen(true)}
          aria-label="Open AI assistant"
          title="Open AI assistant"
        >
          <MessageCircle size={22} />
        </button>
      )}
    </div>
  );
};

export default AIBot;
