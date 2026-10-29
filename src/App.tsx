import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from './api';
import pptxgen from 'pptxgenjs';
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Atom,
  AudioLines,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  Code2,
  Copy,
  FileText,
  Globe2,
  ImagePlus,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  SquarePen,
  Sun,
  Trash2,
  X,
  Zap,
} from 'lucide-react';

type Attachment = {
  name: string;
  type: string;
  data?: string;
  text?: string;
  size: number;
};
type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: Attachment[];
  image?: string;
  sources?: { title: string; url: string }[];
  feedback?: 'up' | 'down';
  presentation?: { title: string; slides: Array<{ title: string; bullets: string[] }> };
  quiz?: { title: string; instructions?: string; questions: Array<{ question: string; options: string[]; answer: number; explanation?: string }> };
  time: number;
};
type Chat = {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
  pinned?: boolean;
};
const MODELS = [
  {
    id: '3.2',
    name: 'Lokizenith 3.2 Ostring',
    desc: 'Steady, lightweight responses',
    color: 'mint',
  },
  {
    id: '3.5',
    name: 'Lokizenith 3.5 Feranite',
    desc: 'Advanced reasoning, web sources and image creation',
    color: 'violet',
  },
];
const initialChat = (): Chat => ({
  id: crypto.randomUUID(),
  title: 'New conversation',
  messages: [],
  updatedAt: Date.now(),
});
const readStore = <T,>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
};

function App() {
  const [chats, setChats] = useState<Chat[]>(() =>
    readStore('lokizenith.chats', [])
  );
  const [activeId, setActiveId] = useState<string>(() =>
    ''
  );
  const [model, setModel] = useState(() =>
    readStore('lokizenith.model', '3.2')
  );
  const [modelOpen, setModelOpen] = useState(false);
  const [codePage, setCodePage] = useState(false);
  const [codePrompt, setCodePrompt] = useState('');
  const [codeLanguage, setCodeLanguage] = useState('LSL');
  const [codeResult, setCodeResult] = useState('');
  const [codeMode, setCodeMode] = useState<'new' | 'edit'>('new');
  const [codeBusy, setCodeBusy] = useState(false);
  const [thinkingLevel, setThinkingLevel] = useState(() => readStore('lokizenith.thinkingLevel', 'Medium'));
  const [thinkingOpen, setThinkingOpen] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('Not tested');
  const [connectionBusy, setConnectionBusy] = useState(false);
  const [apiKeyDraft, setApiKeyDraft] = useState(() => readStore('lokizenith.api', { key: '', provider: 'groq', model: 'llama-3.3-70b-versatile', baseUrl: '' }).key);
  const [activeApiKey, setActiveApiKey] = useState(() => readStore('lokizenith.api', { key: '', provider: 'groq', model: 'llama-3.3-70b-versatile', baseUrl: '' }).key);
  const [apiProvider, setApiProvider] = useState(() => readStore('lokizenith.api', { key: '', provider: 'groq', model: 'llama-3.3-70b-versatile', baseUrl: '' }).provider);
  const [apiModel, setApiModel] = useState(() => readStore('lokizenith.api', { key: '', provider: 'groq', model: 'llama-3.3-70b-versatile', baseUrl: '' }).model);
  const [apiBaseUrl, setApiBaseUrl] = useState(() => readStore('lokizenith.api', { key: '', provider: 'groq', model: 'llama-3.3-70b-versatile', baseUrl: '' }).baseUrl);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [chatSearch, setChatSearch] = useState('');
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState('Appearance');
  const [query, setQuery] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [prefs, setPrefs] = useState(() =>
    readStore('lokizenith.prefs', {
      theme: 'Emerald glow',
      fontSize: 'Comfortable',
      animations: true,
      sound: false,
      enterToSend: true,
      showSources: true,
      saveHistory: true,
      memory: true,
      compact: false,
      accent: 'Emerald',
      responseStyle: 'Balanced',
      responseLength: 'Standard',
      language: 'English',
      thinking: true,
      autoTitle: true,
      codeTheme: 'Midnight',
      imageQuality: 'High',
    })
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const current = chats.find(c => c.id === activeId) || null;
  const activeModel = MODELS.find(m => m.id === model) || MODELS[0];
  useEffect(() => {
    localStorage.setItem('lokizenith.chats', JSON.stringify(chats));
  }, [chats]);
  useEffect(() => {
    localStorage.setItem('lokizenith.active', JSON.stringify(activeId));
  }, [activeId]);
  useEffect(() => {
    localStorage.setItem('lokizenith.thinkingLevel', JSON.stringify(thinkingLevel));
  }, [thinkingLevel]);
  useEffect(() => {
    localStorage.setItem('lokizenith.model', JSON.stringify(model));
  }, [model]);
  useEffect(() => {
    localStorage.setItem('lokizenith.prefs', JSON.stringify(prefs));
  }, [prefs]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [current?.messages.length, busy, status]);
  useEffect(() => {
    if (toast) {
      const t = window.setTimeout(() => setToast(''), 2600);
      return () => window.clearTimeout(t);
    }
  }, [toast]);

  const updateChat = (id: string, fn: (chat: Chat) => Chat) =>
    setChats(old => old.map(c => (c.id === id ? fn(c) : c)));
  const newChat = () => {
    const c = initialChat();
    setChats(old => [c, ...old]);
    setActiveId(c.id);
    setQuery('');
    setAttachments([]);
    setSidebarOpen(false);
  };
  const ensureChat = () => {
    if (current) return current;
    const c = initialChat();
    setChats(old => [c, ...old]);
    setActiveId(c.id);
    return c;
  };
  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const next: Attachment[] = [];
    for (const file of Array.from(files).slice(0, 5)) {
      if (file.size > 6 * 1024 * 1024) {
        setToast(file.name + ' is larger than 6 MB');
        continue;
      }
      if (file.type.startsWith('image/')) {
        const data = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result));
          r.onerror = reject;
          r.readAsDataURL(file);
        });
        next.push({ name: file.name, type: file.type, data, size: file.size });
      } else if (
        file.type.startsWith('text/') ||
        /\.(txt|md|csv|json|js|ts|tsx|jsx|html|css|py|xml|yaml|yml|log)$/i.test(
          file.name
        )
      ) {
        const text = await file.text();
        next.push({
          name: file.name,
          type: file.type || 'text/plain',
          text: text.slice(0, 45000),
          size: file.size,
        });
      } else {
        next.push({
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
        });
      }
    }
    setAttachments(old => [...old, ...next].slice(0, 5));
  };
  const send = async () => {
    const prompt = query.trim();
    if ((!prompt && attachments.length === 0) || busy) return;
    const chat = ensureChat();
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: prompt,
      attachments: [...attachments],
      time: Date.now(),
    };
    const nextMessages = [...chat.messages, userMessage];
    updateChat(chat.id, c => ({
      ...c,
      title: c.messages.length
        ? c.title
        : prompt.slice(0, 42) || 'Attachment conversation',
      messages: nextMessages,
      updatedAt: Date.now(),
    }));
    setQuery('');
    setAttachments([]);
    setBusy(true);
    setStatus(model === '3.5' ? 'Thinking deeply…' : 'Thinking…');
    try {
      const context = nextMessages
        .slice(-12)
        .map(m => ({
          role: m.role,
          content: m.content,
          attachments: m.attachments?.map(a => ({
            name: a.name,
            type: a.type,
            text: a.text,
          })),
        }));
      const imageInputs =
        userMessage.attachments
          ?.filter(a => a.data)
          .map(a => ({ data: a.data!.split(',')[1], mimeType: a.type })) || [];
      if (/\b(powerpoint|presentation|pptx|slide deck)\b/i.test(prompt)) {
        setStatus('Designing your PowerPoint presentation…');
        const response = await api.post('/api/presentation', { prompt, language: prefs.language || 'English', apiKey: activeApiKey || undefined, provider: apiProvider, apiModel, apiBaseUrl });
        const deck = response.data as { title: string; slides: Array<{ title: string; bullets: string[] }> };
        const assistant: Message = { id: crypto.randomUUID(), role: 'assistant', content: 'Your PowerPoint is ready. Use the download button below to save the editable .pptx presentation.', presentation: deck, time: Date.now() };
        updateChat(chat.id, c => ({ ...c, messages: [...c.messages, assistant], updatedAt: Date.now() }));
      } else if (
        model === '3.5' &&
        /\b(generate|create|draw|make|paint|illustrate)\b.{0,50}\b(image|picture|art|illustration|wallpaper|logo|photo)\b/i.test(
          prompt
        )
      ) {
        setStatus('Painting your idea…');
        const response = await api.post('/api/image', {
          prompt,
          images: imageInputs,
          apiKey: activeApiKey || undefined,
          provider: apiProvider, apiModel, apiBaseUrl,
        });
        const assistant: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.data.text || 'Here is your image.',
          image: response.data.image,
          time: Date.now(),
        };
        updateChat(chat.id, c => ({
          ...c,
          messages: [...c.messages, assistant],
          updatedAt: Date.now(),
        }));
      } else {
        setStatus(
          model === '3.5'
            ? 'Exploring ideas and sources…'
            : 'Putting the answer together…'
        );
        const response = await api.post('/api/chat', {
          apiKey: activeApiKey || undefined,
          provider: apiProvider, apiModel, apiBaseUrl,
          model,
          prompt,
          responseMode: /\b(quiz|quizzes|test me|practice test|multiple choice|knowledge test|flashcards)\b/i.test(prompt) ? 'quiz' : 'chat',
          history: context,
          images: imageInputs,
          files: userMessage.attachments
            ?.filter(a => a.text)
            .map(a => ({ name: a.name, text: a.text })),
          preferences: {
            responseStyle: prefs.responseStyle,
            language: prefs.language,
            showSources: prefs.showSources,
            thinkingLevel,
          },
        });
        const assistant: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content:
            response.data.text ||
            'I could not create a response. Please try again.',
          sources: response.data.sources || [],
          quiz: response.data.quiz || undefined,
          time: Date.now(),
        };
        updateChat(chat.id, c => ({
          ...c,
          messages: [...c.messages, assistant],
          updatedAt: Date.now(),
        }));
      }
      if (prefs.autoTitle && nextMessages.length === 1)
        updateChat(chat.id, c => ({
          ...c,
          title: (prompt || 'Attachment chat').slice(0, 42),
        }));
    } catch (e) {
      const assistant: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content:
          'I hit a connection issue while generating that response. Please try again. Your message is still saved in this conversation.',
        time: Date.now(),
      };
      updateChat(chat.id, c => ({
        ...c,
        messages: [...c.messages, assistant],
        updatedAt: Date.now(),
      }));
    } finally {
      setBusy(false);
      setStatus('');
    }
  };
  const runCode = async () => {
    if (!codePrompt.trim() || codeBusy) return;
    setCodeBusy(true);
    setStatus(codeMode === 'edit' ? 'Reviewing and improving your code…' : 'Planning, writing and checking your code…');
    try {
      const response = await api.post('/api/code', { apiKey: activeApiKey || undefined, provider: apiProvider, apiModel, apiBaseUrl, prompt: codePrompt.trim(), language: codeLanguage, mode: codeMode, existingCode: codeMode === 'edit' ? codeResult : '' });
      setCodeResult(response.data.code || ''); setCodePrompt(''); setToast('Code checked and ready to edit');
    } catch { setToast('LokiCode could not connect. Check Settings → API & connection.'); }
    finally { setCodeBusy(false); setStatus(''); }
  };
  const regenerateAnswer = async (messageId: string, mode: 'regenerate' | 'continue' = 'regenerate') => {
    if (!current || busy) return;
    const index = current.messages.findIndex(m => m.id === messageId);
    if (index < 0) return;
    const previousUser = [...current.messages.slice(0, index)].reverse().find(m => m.role === 'user');
    if (!previousUser) { setToast('No user prompt found for this answer'); return; }
    setBusy(true);
    setStatus(mode === 'continue' ? 'Continuing the answer…' : 'Regenerating the answer…');
    try {
      const history = current.messages.slice(0, index).map(m => ({ role: m.role, content: m.content }));
      const response = await api.post('/api/chat', {
        apiKey: activeApiKey || undefined,
        provider: apiProvider, apiModel, apiBaseUrl,
        model, prompt: mode === 'continue' ? 'Continue the previous answer with any remaining useful details. Do not repeat what has already been said.' : previousUser.content,
        history, preferences: { responseStyle: prefs.responseStyle, responseLength: prefs.responseLength || 'Standard', language: prefs.language, showSources: prefs.showSources, thinkingLevel }
      });
      const replacement: Message = { id: mode === 'continue' ? crypto.randomUUID() : messageId, role: 'assistant', content: response.data.text || 'No response returned.', sources: response.data.sources || [], time: Date.now() };
      updateChat(current.id, c => ({ ...c, messages: mode === 'continue' ? [...c.messages, replacement] : c.messages.map(m => m.id === messageId ? replacement : m), updatedAt: Date.now() }));
      setToast(mode === 'continue' ? 'Answer continued' : 'Answer regenerated');
    } catch { setToast('Could not update the answer. Check your API connection.'); }
    finally { setBusy(false); setStatus(''); }
  };
  const exportConversation = () => {
    if (!current) { setToast('Open a conversation first'); return; }
    const body = '# ' + current.title + '\\n\\n' + current.messages.map(m => '## ' + (m.role === 'user' ? 'You' : 'Lokizenith') + '\\n\\n' + m.content).join('\\n\\n---\\n\\n');
    downloadFile((current.title || 'lokizenith-chat').replace(/[^a-z0-9-_ ]/gi, '').trim().replace(/\\s+/g, '-') + '.md', body, 'text/markdown;charset=utf-8');
    setToast('Conversation exported');
  };
  const summarizeConversation = () => {
    if (!current || current.messages.length < 2) { setToast('Add a few messages before summarizing'); return; }
    setQuery('Summarize this conversation into the key points, decisions, and next steps. Keep it simple and accurate.');
    setToast('Summary prompt added to the composer');
  };
  const markFeedback = (messageId: string, feedback: 'up' | 'down') => {
    if (!current) return;
    updateChat(current.id, c => ({ ...c, messages: c.messages.map(m => m.id === messageId ? { ...m, feedback } : m) }));
    setToast(feedback === 'up' ? 'Thanks for the positive feedback' : 'Feedback saved');
  };
  const saveCustomApiKey = () => {
    const nextKey = apiKeyDraft.trim();
    if (!nextKey) { setToast('Paste an API key before submitting'); return; }
    if (apiProvider === 'custom' && !apiBaseUrl.trim()) { setToast('Enter the API base URL for your custom provider'); return; }
    if (!apiModel.trim()) { setToast('Enter a model ID'); return; }
    setActiveApiKey(nextKey);
    localStorage.setItem('lokizenith.api', JSON.stringify({ key: nextKey, provider: apiProvider, model: apiModel.trim(), baseUrl: apiBaseUrl.trim() }));
    setConnectionStatus('Your ' + apiProvider + ' key and model are saved on this device. Test the connection.');
    setToast('Provider settings saved for your next visit');
  };
  const clearCustomApiKey = () => {
    setActiveApiKey('');
    setApiKeyDraft('');
    setApiProvider('gemini');
    setApiModel('gemini-2.5-flash');
    setApiBaseUrl('');
    localStorage.setItem('lokizenith.api', JSON.stringify({ key: '', provider: 'gemini', model: 'gemini-2.5-flash', baseUrl: '' }));
    setConnectionStatus('Using the app-configured Gemini key');
    setToast('Returned to the configured Gemini key');
  };
  const testConnection = async () => {
    setConnectionBusy(true); setConnectionStatus('Testing ' + apiProvider + ' connection…');
    try {
      const response = await api.post('/api/test-connection', { apiKey: activeApiKey || undefined, provider: apiProvider, apiModel, apiBaseUrl });
      setConnectionStatus(response.data.message || 'Connection successful');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Check the key and try again.';
      setConnectionStatus('Connection failed: ' + message);
    } finally { setConnectionBusy(false); }
  };
  const createPowerPoint = async (deck: { title: string; slides: Array<{ title: string; bullets: string[] }> }) => {
    try {
      const pptx = new pptxgen();
      pptx.layout = 'LAYOUT_WIDE';
      pptx.author = 'Lokizenith AI';
      pptx.subject = 'AI-generated presentation';
      pptx.title = deck.title;
      pptx.theme = { headFontFace: 'Aptos Display', bodyFontFace: 'Aptos' };
      deck.slides.forEach((item, index) => {
        const slide = pptx.addSlide();
        slide.background = { color: index === 0 ? '08140F' : '10251A' };
        slide.addShape(pptx.ShapeType.ellipse, { x: 10.4, y: -0.5, w: 3.4, h: 3.4, line: { color: '25C978', transparency: 100 }, fill: { color: '25C978', transparency: 72 } });
        slide.addText(item.title || deck.title, { x: 0.75, y: 0.55, w: 11.5, h: 0.8, fontFace: 'Aptos Display', fontSize: index === 0 ? 32 : 27, bold: true, color: '6CF5A5', breakLine: false, margin: 0.04 });
        if (item.bullets?.length) {
          slide.addText(item.bullets.map(text => ({ text, options: { bullet: { indent: 18 }, hanging: 4, breakLine: true } })), { x: 0.9, y: 1.8, w: 10.9, h: 4.7, fontFace: 'Aptos', fontSize: 20, color: 'EAF8F0', paraSpaceAfter: 15, valign: 'middle', margin: 0.08, breakLine: false });
        }
        slide.addText(String(index + 1).padStart(2, '0'), { x: 11.8, y: 6.8, w: 0.7, h: 0.3, fontSize: 10, color: '91AA9A', align: 'right' });
      });
      const safeName = (deck.title || 'Lokizenith-Presentation').replace(/[^a-z0-9-_ ]/gi, '').trim().replace(/\s+/g, '-') || 'Lokizenith-Presentation';
      await pptx.writeFile({ fileName: safeName + '.pptx' });
      setToast('PowerPoint downloaded');
    } catch {
      setToast('Could not create the PowerPoint file. Please try again.');
    }
  };
  const downloadFile = (filename: string, content: string, type = 'text/plain;charset=utf-8') => {
    const url = URL.createObjectURL(new Blob([content], { type })); const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click(); URL.revokeObjectURL(url);
  };
  const copyText = (text: string) => {
    navigator.clipboard?.writeText(text);
    setToast('Copied to clipboard');
  };
  const deleteChat = (id: string) => {
    setChats(old => old.filter(c => c.id !== id));
    if (activeId === id) setActiveId('');
    setToast('Conversation deleted');
  };
  const grouped = useMemo(() => {
    const list = chats.filter(c =>
      c.title.toLowerCase().includes(search.toLowerCase())
    );
    return [...list].sort((a, b) => Number(Boolean(b.pinned)) - Number(Boolean(a.pinned)) || b.updatedAt - a.updatedAt);
  }, [chats, search]);
  const settingsNames = [
    'Appearance',
    'Personalization',
    'Memory',
    'Privacy',
    'Chat & history',
    'Models',
    'API & connection',
    'Voice & sound',
    'Files & uploads',
    'Accessibility',
    'About',
  ];
  const togglePref = (key: string) =>
    setPrefs((p: any) => ({ ...p, [key]: !p[key] }));
  const pref = (key: string) => (prefs as Record<string, unknown>)[key] as boolean;
  const renderContent = (text: string) =>
    text
      .split(/(\*\*.*?\*\*|`[^`]+`)/g)
      .map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : part.startsWith('`') && part.endsWith('`') ? (
          <code key={i}>{part.slice(1, -1)}</code>
        ) : (
          part
        )
      );

  return (
    <div
      className={
        'app-shell ' +
        (prefs.animations ? 'animations ' : '') +
        (prefs.compact ? 'compact ' : '') +
        'accent-' + String(prefs.accent || 'Emerald').replace(/\s+/g, '-') + ' ' +
        'font-' + String(prefs.fontSize || 'Comfortable').replace(/\s+/g, '-') + ' ' +
        'theme-' + String(prefs.theme || 'Emerald-glow').replace(/\s+/g, '-')
      }
    >
      <aside className={'sidebar ' + (sidebarOpen ? 'sidebar-open' : '')}>
        <div className="brand-row">
          <div className="brand-mark">
            <Sparkles size={20} />
          </div>
          <div className="brand-copy">
            <b>
              Lokizenith <span>AI</span>
            </b>
            <small>INTELLIGENCE, IN BLOOM</small>
          </div>
          <button
            className="icon-btn mobile-only"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>
        <button className="new-chat" onClick={newChat}>
          <SquarePen size={17} />
          <span>New conversation</span>
          <span className="shortcut">⌘ K</span>
        </button>
        <button
          className="nav-link"
          onClick={() => {
            setSettingsTab('Memory');
            setSettingsOpen(true);
          }}
        >
          <Sparkles size={17} /> Memory vault{' '}
          <span className="nav-pill">LIVE</span>
        </button>
        <button
          className="nav-link"
          onClick={() => {
            setSettingsTab('Models');
            setSettingsOpen(true);
          }}
        >
          <Atom size={17} /> Model studio
        </button>
        <div className="history-head">
          <span>YOUR CONVERSATIONS</span>
          <button
            className="icon-btn tiny"
            onClick={() => setSearch(v => (v ? '' : ' '))}
            aria-label="Search history"
          >
            <Search size={15} />
          </button>
        </div>
        <button className="nav-link" onClick={() => { setCodePage(true); setSidebarOpen(false); }}><Code2 size={17} /> LokiCode <span className="nav-pill">3.5</span></button>
        {search !== '' && (
          <div className="history-search">
            <Search size={14} />
            <input
              placeholder="Search chats..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button onClick={() => setSearch('')}>
              <X size={13} />
            </button>
          </div>
        )}
        <div className="chat-list">
          {grouped.map(c => (
            <div
              className={'chat-item ' + (c.id === activeId ? 'selected' : '')}
              key={c.id}
            >
              <button
                className="chat-title"
                onClick={() => {
                  setActiveId(c.id);
                  setSidebarOpen(false);
                }}
              >
                <MessageCircle size={15} />
                <span>{c.title}</span>
              </button>
              <button className="delete-chat" onClick={() => updateChat(c.id, chat => ({ ...chat, pinned: !chat.pinned }))} aria-label={c.pinned ? 'Unpin conversation' : 'Pin conversation'} title={c.pinned ? 'Unpin' : 'Pin'}>{c.pinned ? '📌' : '⌖'}</button>
              <button
                className="delete-chat"
                onClick={() => deleteChat(c.id)}
                aria-label="Delete conversation"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="sidebar-bottom">
          <div className="memory-card">
            <div className="memory-icon">
              <Sparkles size={16} />
            </div>
            <div>
              <b>Memory is ready</b>
              <small>Your chats stay on this device</small>
            </div>
            <span className="online-dot" />
          </div>
          <button
            className="profile-button"
            onClick={() => setSettingsOpen(true)}
          >
            <div className="avatar">L</div>
            <div>
              <b>Lokizenith space</b>
              <small>Personal workspace</small>
            </div>
            <MoreHorizontal size={18} />
          </button>
        </div>
      </aside>
      {sidebarOpen && (
        <button
          className="mobile-scrim"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        />
      )}
      <main className="main-area">
        <header className="topbar">
          <div className="top-left">
            <button
              className="icon-btn mobile-only"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div className="model-wrap">
              <button
                className="model-select"
                onClick={() => setModelOpen(v => !v)}
              >
                <span
                  className={
                    'model-orb ' + (model === '3.5' ? 'orb-violet' : '')
                  }
                >
                  <Sparkles size={15} />
                </span>
                <span className="model-label">
                  <b>{activeModel.name}</b>
                  <small>
                    {model === '3.2'
                      ? 'Ostring · Core model'
                      : 'Feranite · Advanced model'}
                  </small>
                </span>
                <ChevronDown size={16} />
              </button>
              {modelOpen && (
                <div className="model-menu">
                  {MODELS.map(m => (
                    <button
                      key={m.id}
                      className={
                        'model-option ' + (model === m.id ? 'chosen' : '')
                      }
                      onClick={() => {
                        setModel(m.id);
                        setModelOpen(false);
                        setToast(m.name + ' selected');
                      }}
                    >
                      <span
                        className={
                          'model-orb ' + (m.id === '3.5' ? 'orb-violet' : '')
                        }
                      >
                        <Sparkles size={15} />
                      </span>
                      <span>
                        <b>{m.name}</b>
                        <small>{m.desc}</small>
                      </span>
                      {model === m.id && <Check size={17} />}
                    </button>
                  ))}
                  <div className="model-note">
                    <ShieldCheck size={14} /> Model choice is saved on this
                    device
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="top-actions">
            {current && current.messages.length > 0 && <div className="chat-quick-actions">
              <button className="icon-btn" title="Search in chat" onClick={() => setShowChatSearch(v => !v)}><Search size={16} /></button>
              <button className="icon-btn" title="Export conversation" onClick={exportConversation}><ArrowDown size={16} /></button>
              <button className="icon-btn" title="Summarize conversation" onClick={summarizeConversation}><FileText size={16} /></button>
              <button className="icon-btn" title="Clear conversation" onClick={() => { if (confirm('Clear all messages from this conversation?')) { updateChat(current.id, c => ({ ...c, messages: [], title: 'New conversation', updatedAt: Date.now() })); setChatSearch(''); setToast('Conversation cleared'); } }}><Trash2 size={16} /></button>
            </div>}
            {model === '3.5' && (
              <div className="thinking-level-wrap">
                <button className="icon-btn thinking-level-button" onClick={() => setThinkingOpen(v => !v)} title="Thinking level">
                  <Atom size={16} /><span>{thinkingLevel}</span><ChevronDown size={13} />
                </button>
                {thinkingOpen && (
                  <select aria-label="Thinking level" value={thinkingLevel} onChange={e => { setThinkingLevel(e.target.value); setThinkingOpen(false); }}>
                    {['Medium', 'High', 'Extra High', 'Ultra'].map(level => <option key={level}>{level}</option>)}
                  </select>
                )}
              </div>
            )}
            <div className="status-chip">
              <span className="online-dot" />
              <span>Systems online</span>
            </div>
            <button
              className="icon-btn"
              onClick={() => {
                setSettingsTab('Appearance');
                setSettingsOpen(true);
              }}
              aria-label="Settings"
            >
              <Settings2 size={19} />
            </button>
          </div>
        </header>
        {!codePage ? <>
        {showChatSearch && current && <div className="chat-search-bar"><Search size={16} /><input autoFocus value={chatSearch} onChange={e => setChatSearch(e.target.value)} placeholder="Search messages in this conversation…" /><button onClick={() => { setChatSearch(''); setShowChatSearch(false); }}><X size={15} /></button></div>}
        <section
          className={
            'conversation ' +
            (!current || current.messages.length === 0
              ? 'empty-conversation'
              : '')
          }
        >
          {!current || current.messages.length === 0 ? (
            <div className="welcome">
              <div className="welcome-glow">
                <div className="welcome-logo">
                  <Sparkles size={32} />
                </div>
                <span className="orbit orbit-one" />
                <span className="orbit orbit-two" />
              </div>
              <div className="eyebrow">
                <span className="eyebrow-dot" /> YOUR PERSONAL AI, REIMAGINED
              </div>
              <h1>
                Ideas grow <span>here.</span>
              </h1>
              <p>
                A little curiosity can turn into something extraordinary.
                <br />
                What shall we explore today?
              </p>
              <div className="suggestion-grid">
                <button
                  onClick={() =>
                    setQuery(
                      'Explain a fascinating science discovery in a fun way'
                    )
                  }
                >
                  <span className="suggestion-icon mint">
                    <Atom size={19} />
                  </span>
                  <span>
                    <b>Explore something</b>
                    <small>Make a complex idea feel simple</small>
                  </span>
                  <ArrowUp size={15} />
                </button>
                <button
                  onClick={() => {
                    setModel('3.5');
                    setQuery(
                      'Generate an image of a glowing emerald forest under a starry sky'
                    );
                  }}
                >
                  <span className="suggestion-icon rainbow">
                    <ImagePlus size={19} />
                  </span>
                  <span>
                    <b>Imagine it visually</b>
                    <small>Turn a thought into artwork</small>
                  </span>
                  <ArrowUp size={15} />
                </button>
                <button
                  onClick={() =>
                    setQuery('Help me build a small interactive project')
                  }
                >
                  <span className="suggestion-icon blue">
                    <Code2 size={19} />
                  </span>
                  <span>
                    <b>Build something</b>
                    <small>From idea to working prototype</small>
                  </span>
                  <ArrowUp size={15} />
                </button>
                <button
                  onClick={() =>
                    setQuery(
                      'Give me a thoughtful plan for learning a new skill'
                    )
                  }
                >
                  <span className="suggestion-icon gold">
                    <Zap size={19} />
                  </span>
                  <span>
                    <b>Plan your next move</b>
                    <small>Make progress, one step at a time</small>
                  </span>
                  <ArrowUp size={15} />
                </button>
              </div>
              <div className="welcome-foot">
                <span>
                  <ShieldCheck size={13} /> Private by design
                </span>
                <span>
                  <Sparkles size={13} /> Powered by imagination
                </span>
              </div>
            </div>
          ) : (
            <div className="message-stack">
              {current.messages.filter(m => !chatSearch || m.content.toLowerCase().includes(chatSearch.toLowerCase())).map(m => (
                <article key={m.id} className={'message ' + m.role}>
                  <div className="message-avatar">
                    {m.role === 'assistant' ? (
                      <Sparkles size={17} />
                    ) : (
                      <span>Y</span>
                    )}
                  </div>
                  <div className="message-main">
                    <div className="message-meta">
                      <b>{m.role === 'assistant' ? 'Lokizenith' : 'You'}</b>
                      {m.role === 'assistant' && (
                        <span className="answer-model">{activeModel.name}</span>
                      )}
                      <time>
                        {new Date(m.time).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </time>
                    </div>
                    {m.content && (
                      <div className="message-content">
                        {renderContent(m.content)}
                      </div>
                    )}
                    {m.attachments?.map((a, i) => (
                      <div className="sent-attachment" key={i}>
                        {a.data ? (
                          <img src={a.data} alt={a.name} />
                        ) : (
                          <FileText size={17} />
                        )}
                        <span>{a.name}</span>
                      </div>
                    ))}
                    {m.presentation && (
                      <div className="presentation-download">
                        <div><FileText size={22} /><span><b>{m.presentation.title}</b><small>{m.presentation.slides.length} slides · Editable PowerPoint</small></span></div>
                        <button className="primary-small" onClick={() => void createPowerPoint(m.presentation!)}><ArrowDown size={15} /> Download .pptx</button>
                      </div>
                    )}
                    {m.quiz && (
                      <div className="quiz-card">
                        <div className="quiz-card-top"><span className="quiz-card-icon"><CircleHelp size={19} /></span><div><small>INTERACTIVE PRACTICE</small><h3>{m.quiz.title}</h3></div><span className="quiz-count">{m.quiz.questions.length} questions</span></div>
                        {m.quiz.instructions && <p className="quiz-instructions">{m.quiz.instructions}</p>}
                        {m.quiz.questions.map((question, qi) => {
                          const selected = quizAnswers[m.id + '-' + qi];
                          const answered = selected !== undefined;
                          return <div className="quiz-question" key={qi}><b><span>{qi + 1}</span>{question.question}</b><div className="quiz-options">{question.options.map((option, oi) => <button key={oi} className={'quiz-option ' + (answered && oi === question.answer ? 'correct' : '') + (answered && selected === oi && oi !== question.answer ? 'incorrect' : '')} onClick={() => setQuizAnswers(old => ({ ...old, [m.id + '-' + qi]: oi }))} disabled={answered}>{String.fromCharCode(65 + oi)}. {option}</button>)}</div>{answered && <div className={'quiz-feedback ' + (selected === question.answer ? 'right' : 'wrong')}>{selected === question.answer ? 'Correct!' : 'Not quite.'} {question.explanation || ''}</div>}</div>;
                        })}
                        <div className="quiz-score">Score: {m.quiz.questions.filter((q, qi) => quizAnswers[m.id + '-' + qi] === q.answer).length} / {m.quiz.questions.filter((q, qi) => quizAnswers[m.id + '-' + qi] !== undefined).length} answered</div>
                      </div>
                    )}
                    {m.image && (
                      <div className="generated-image">
                        <img
                          src={
                            m.image.startsWith('data:')
                              ? m.image
                              : 'data:image/png;base64,' + m.image
                          }
                          alt="AI generated artwork"
                        />
                        <button onClick={() => copyText(m.image || '')}>
                          <Copy size={14} /> Copy image data
                        </button>
                      </div>
                    )}
                    {m.sources &&
                      m.sources.length > 0 &&
                      pref('showSources') && (
                        <div className="sources-panel">
                          <div className="sources-heading">
                            <Globe2 size={15} /> Sources{' '}
                            <span>{m.sources.length} references</span>
                          </div>
                          {m.sources.map((s, i) => (
                            <a
                              href={s.url}
                              target="_blank"
                              rel="noreferrer"
                              key={i}
                            >
                              <span className="source-num">{i + 1}</span>
                              <span>
                                <b>{s.title}</b>
                                <small>{s.url}</small>
                              </span>
                              <ChevronRight size={14} />
                            </a>
                          ))}
                        </div>
                      )}
                    {m.role === 'assistant' && (
                      <div className="message-tools">
                        <button onClick={() => copyText(m.content)}>
                          <Copy size={14} /> Copy
                        </button>
                        <button onClick={() => downloadFile('lokizenith-answer.txt', m.content)}><ArrowDown size={14} /> Download .txt</button>
                        <button
                          onClick={() => setToast('Thanks for the feedback')}
                        >
                          <Activity size={14} /> Helpful
                        </button>
                        <button onClick={() => setToast('Feedback noted')}>
                          <MoreHorizontal size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
              {busy && (
                <article className="message assistant">
                  <div className="message-avatar">
                    <Sparkles size={17} />
                  </div>
                  <div className="message-main">
                    <div className="message-meta">
                      <b>Lokizenith</b>
                      <span className="answer-model">{activeModel.name}</span>
                    </div>
                    <div className="thinking-bubble">
                      <span className="thinking-pulse">
                        <i />
                        <i />
                        <i />
                      </span>
                      <span>{status}</span>
                      <span className="thinking-spark">
                        <Sparkles size={14} />
                      </span>
                    </div>
                  </div>
                </article>
              )}
              <div ref={endRef} />
            </div>
          )}
        </section>
        <footer className="composer-wrap">
          <div className="composer-shell">
            <div className="attachment-strip">
              {attachments.map((a, i) => (
                <div className="attachment-chip" key={i}>
                  {a.data ? (
                    <img src={a.data} alt="" />
                  ) : (
                    <FileText size={16} />
                  )}
                  <span>{a.name}</span>
                  <button
                    onClick={() =>
                      setAttachments(old => old.filter((_, n) => n !== i))
                    }
                    aria-label="Remove attachment"
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
            <textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey && prefs.enterToSend) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder={
                model === '3.5'
                  ? 'Ask anything, imagine anything…'
                  : 'Message Lokizenith…'
              }
              rows={2}
              aria-label="Message composer"
            />
            <div className="composer-actions">
              <div className="composer-left">
                <button
                  className="composer-tool"
                  onClick={() => fileRef.current?.click()}
                >
                  <Paperclip size={17} />
                  <span>Attach</span>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  multiple
                  accept="image/*,.txt,.md,.csv,.json,.js,.ts,.tsx,.jsx,.html,.css,.py,.xml,.yaml,.yml,.log,.pdf"
                  hidden
                  onChange={e => {
                    void handleFiles(e.target.files);
                    e.currentTarget.value = '';
                  }}
                />
                <button
                  className={
                    'composer-tool ' + (model === '3.5' ? 'tool-glow' : '')
                  }
                  onClick={() => {
                    if (model !== '3.5') {
                      setToast(
                        'Image creation is available with Lokizenith 3.5 Feranite'
                      );
                      setModelOpen(true);
                    } else
                      setQuery(q => q + (q ? ' ' : '') + 'Create an image of ');
                  }}
                >
                  <ImagePlus size={17} />
                  <span>Imagine</span>
                </button>
                <span className="composer-divider" />
                <span className="composer-model">
                  <span className="online-dot" />
                  {model === '3.5' ? 'Advanced mode' : 'Core mode'}
                </span>
              </div>
              <div className="composer-right">
                <span className="enter-hint">↵ to send</span>
                <button
                  className="send-btn"
                  onClick={() => void send()}
                  disabled={busy || (!query.trim() && !attachments.length)}
                  aria-label="Send message"
                >
                  {busy ? (
                    <span className="send-spinner" />
                  ) : (
                    <Send size={17} />
                  )}
                </button>
              </div>
            </div>
          </div>
          <div className="composer-disclaimer">
            Lokizenith can make mistakes. Check important information.{' '}
            <span>·</span> Your history stays in this browser.
          </div>
        </footer>
        </> : <section className="lokicode-page">
          <div className="codepage-heading"><div><span className="settings-kicker">LOKIZENITH 3.5 FERANITE</span><h1>LokiCode Studio</h1><p>Describe the code you need. LokiCode checks its output before you edit or copy it.</p></div><button className="outline-action" onClick={() => setCodePage(false)}><MessageCircle size={16} /> Back to chat</button></div>
          <div className="code-prompt-panel"><label>What should I build or change?</label><textarea value={codePrompt} onChange={e => setCodePrompt(e.target.value)} placeholder="Describe the script, feature, fix, or project…" rows={3} /><div className="code-prompt-actions"><label>Programming language<select value={codeLanguage} onChange={e => setCodeLanguage(e.target.value)}>{['LSL', 'C++ (Arduino)', 'Python', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'Java', 'C#', 'Lua', 'Rust', 'Go', 'SQL', 'Bash'].map(language => <option key={language}>{language}</option>)}</select></label><label>Action<select value={codeMode} onChange={e => setCodeMode(e.target.value as 'new' | 'edit')}><option value="new">New code (replace previous)</option><option value="edit">Edit existing code</option></select></label><button className="primary-small code-generate" onClick={() => void runCode()} disabled={codeBusy || !codePrompt.trim()}>{codeBusy ? 'Working…' : codeMode === 'edit' ? 'Review and edit code' : 'Generate code'} <Sparkles size={15} /></button></div></div>
          {codeBusy && <div className="code-working"><div className="code-working-orb"><Code2 size={30} /></div><h2>{status || 'Building your solution'}</h2><p>Planning the solution, writing the selected language, then checking and correcting the result.</p><div className="code-working-bars"><i /><i /><i /><i /><i /></div></div>}
          {codeResult && !codeBusy && <div className="code-editor-card"><div className="code-editor-toolbar"><div><span className="online-dot" /> <b>Editable script</b><small>{codeLanguage} · Lokizenith 3.5 Feranite</small></div><div><button className="outline-action" onClick={() => copyText(codeResult)}><Copy size={15} /> Copy code</button><button className="primary-small" onClick={() => downloadFile('lokicode-script.' + ({LSL:'lsl','C++ (Arduino)':'ino',Python:'py',JavaScript:'js',TypeScript:'ts',HTML:'html',CSS:'css',Java:'java','C#':'cs',Lua:'lua',Rust:'rs',Go:'go',SQL:'sql',Bash:'sh'} as Record<string,string>)[codeLanguage], codeResult)}><ArrowDown size={15} /> Download</button></div></div><textarea className="code-editor" value={codeResult} onChange={e => setCodeResult(e.target.value)} spellCheck={false} aria-label="Editable generated code" /><div className="code-editor-footer"><span>Review the script before running it. Output is not executed automatically.</span><button className="outline-action" onClick={() => setCodeMode('edit')}>Edit with AI</button></div></div>}
          {!codeResult && !codeBusy && <div className="code-empty-state"><Code2 size={34} /><h2>Your next script starts here</h2><p>Choose a language, describe the result, and LokiCode will generate a complete script.</p></div>}
        </section>}
      </main>
      {settingsOpen && (
        <div className="modal-backdrop" onClick={() => setSettingsOpen(false)}>
          <section
            className="settings-modal"
            onClick={e => e.stopPropagation()}
          >
            <div className="settings-head">
              <div>
                <span className="settings-kicker">MAKE IT YOURS</span>
                <h2>Settings</h2>
                <p>A little space to shape your AI experience.</p>
              </div>
              <button
                className="icon-btn"
                onClick={() => setSettingsOpen(false)}
                aria-label="Close settings"
              >
                <X size={19} />
              </button>
            </div>
            <div className="settings-body">
              <nav className="settings-nav">
                {settingsNames.map((s, i) => (
                  <button
                    key={s}
                    className={settingsTab === s ? 'active' : ''}
                    onClick={() => setSettingsTab(s)}
                  >
                    {
                      [
                        <Sun size={16} />,
                        <Sparkles size={16} />,
                        <Atom size={16} />,
                        <ShieldCheck size={16} />,
                        <Clock3 size={16} />,
                        <Zap size={16} />,
                        <ShieldCheck size={16} />,
                        <AudioLines size={16} />,
                        <Paperclip size={16} />,
                        <CircleHelp size={16} />,
                        <Globe2 size={16} />,
                      ][i]
                    }
                    {s}
                  </button>
                ))}
              </nav>
              <div className="settings-content">
                <h3>{settingsTab}</h3>
                {settingsTab === 'Appearance' ? (
                  <>
                    <p className="settings-intro">
                      Tune the look, feel and motion of your workspace.
                    </p>
                    <label className="setting-row">
                      <span>
                        <b>Theme</b>
                        <small>Choose your visual atmosphere</small>
                      </span>
                      <select
                        value={prefs.theme}
                        onChange={e =>
                          setPrefs((p: any) => ({
                            ...p,
                            theme: e.target.value,
                          }))
                        }
                      >
                        <option>Emerald glow</option>
                        <option>Forest night</option>
                        <option>Mint daylight</option>
                        <option>Midnight glass</option>
                      </select>
                    </label>
                    <label className="setting-row">
                      <span>
                        <b>Accent color</b>
                        <small>Buttons and highlights</small>
                      </span>
                      <select
                        value={prefs.accent}
                        onChange={e =>
                          setPrefs((p: any) => ({
                            ...p,
                            accent: e.target.value,
                          }))
                        }
                      >
                        <option>Emerald</option>
                        <option>Teal</option>
                        <option>Violet</option>
                        <option>Coral</option>
                      </select>
                    </label>
                    <label className="setting-row">
                      <span>
                        <b>Font size</b>
                        <small>Comfort of reading</small>
                      </span>
                      <select
                        value={prefs.fontSize}
                        onChange={e =>
                          setPrefs((p: any) => ({
                            ...p,
                            fontSize: e.target.value,
                          }))
                        }
                      >
                        <option>Compact</option>
                        <option>Comfortable</option>
                        <option>Large</option>
                      </select>
                    </label>
                    <SettingToggle
                      title="Animated interface"
                      detail="Glow, gradients and motion effects"
                      value={pref('animations')}
                      onChange={() => togglePref('animations')}
                    />
                    <SettingToggle
                      title="Compact layout"
                      detail="Fit more messages on screen"
                      value={pref('compact')}
                      onChange={() => togglePref('compact')}
                    />
                  </>
                ) : settingsTab === 'Personalization' ? (
                  <>
                    <p className="settings-intro">
                      Shape how Lokizenith communicates with you.
                    </p>
                    <label className="setting-row">
                      <span>
                        <b>Response style</b>
                        <small>How answers should feel</small>
                      </span>
                      <select
                        value={prefs.responseStyle}
                        onChange={e =>
                          setPrefs((p: any) => ({
                            ...p,
                            responseStyle: e.target.value,
                          }))
                        }
                      >
                        <option>Balanced</option>
                        <option>Concise</option>
                        <option>Detailed</option>
                        <option>Friendly</option>
                        <option>Step by step</option>
                      </select>
                    </label>
                    <label className="setting-row">
                      <span>
                        <b>Language</b>
                        <small>Preferred response language</small>
                      </span>
                      <select
                        value={prefs.language}
                        onChange={e =>
                          setPrefs((p: any) => ({
                            ...p,
                            language: e.target.value,
                          }))
                        }
                      >
                        <option>English</option>
                        <option>Hebrew</option>
                        <option>Spanish</option>
                        <option>French</option>
                        <option>Arabic</option>
                        <option>German</option>
                      </select>
                    </label>
                    <label className="setting-row">
                      <span><b>Answer length</b><small>Control how much detail responses include</small></span>
                      <select value={prefs.responseLength || 'Standard'} onChange={e => setPrefs((p: any) => ({ ...p, responseLength: e.target.value }))}><option>Short</option><option>Standard</option><option>Detailed</option></select>
                    </label>
                    <SettingToggle
                      title="Thinking status"
                      detail="Show animated progress bubbles"
                      value={pref('thinking')}
                      onChange={() => togglePref('thinking')}
                    />
                    <SettingToggle
                      title="Automatic conversation titles"
                      detail="Name chats from the first message"
                      value={pref('autoTitle')}
                      onChange={() => togglePref('autoTitle')}
                    />
                  </>
                ) : settingsTab === 'Memory' ? (
                  <>
                    <div className="memory-feature">
                      <div className="memory-feature-icon">
                        <Sparkles size={22} />
                      </div>
                      <div>
                        <b>Memory vault</b>
                        <p>
                          Keep useful context across conversations on this
                          device.
                        </p>
                        <span className="memory-status">
                          <span className="online-dot" />
                          {pref('memory') ? 'Memory enabled' : 'Memory paused'}
                        </span>
                      </div>
                    </div>
                    <SettingToggle
                      title="Use conversation memory"
                      detail="Use saved chat history as context in this browser"
                      value={pref('memory')}
                      onChange={() => togglePref('memory')}
                    />
                    <button
                      className="outline-action"
                      onClick={() =>
                        setToast(
                          'Your saved conversations are listed in the sidebar'
                        )
                      }
                    >
                      View saved conversations
                    </button>
                    <p className="small-note">
                      Memory is stored in this browser. It is not yet a synced
                      account-wide memory service.
                    </p>
                  </>
                ) : settingsTab === 'Privacy' ? (
                  <>
                    <p className="settings-intro">Your data, your choices.</p>
                    <SettingToggle
                      title="Save chat history"
                      detail="Keep conversations available after refresh"
                      value={pref('saveHistory')}
                      onChange={() => togglePref('saveHistory')}
                    />
                    <SettingToggle
                      title="Show source links"
                      detail="Display references attached to answers"
                      value={pref('showSources')}
                      onChange={() => togglePref('showSources')}
                    />
                    <button
                      className="outline-action danger-action"
                      onClick={() => {
                        if (
                          confirm(
                            'Delete all local conversations? This cannot be undone.'
                          )
                        ) {
                          setChats([]);
                          setActiveId('');
                          setToast('All conversations deleted');
                        }
                      }}
                    >
                      <Trash2 size={15} /> Delete all conversations
                    </button>
                    <p className="small-note">
                      Conversation data is kept in local browser storage on this
                      device.
                    </p>
                  </>
                ) : settingsTab === 'Chat & history' ? (
                  <>
                    <SettingToggle
                      title="Save chat history"
                      detail="Remember conversations on this device"
                      value={pref('saveHistory')}
                      onChange={() => togglePref('saveHistory')}
                    />
                    <SettingToggle
                      title="Enter sends message"
                      detail="Use Shift + Enter for a new line"
                      value={pref('enterToSend')}
                      onChange={() => togglePref('enterToSend')}
                    />
                    <button className="outline-action" onClick={newChat}>
                      <Plus size={15} /> Start a new conversation
                    </button>
                  </>
                ) : settingsTab === 'Models' ? (
                  <>
                    <p className="settings-intro">
                      Choose the personality and capability level for your next
                      answer.
                    </p>
                    {MODELS.map(m => (
                      <button
                        key={m.id}
                        className={
                          'settings-model ' + (model === m.id ? 'selected' : '')
                        }
                        onClick={() => setModel(m.id)}
                      >
                        <span
                          className={
                            'model-orb ' + (m.id === '3.5' ? 'orb-violet' : '')
                          }
                        >
                          <Sparkles size={16} />
                        </span>
                        <span>
                          <b>{m.name}</b>
                          <small>{m.desc}</small>
                        </span>
                        {model === m.id && <Check size={16} />}
                      </button>
                    ))}
                  </>
                ) : settingsTab === 'API & connection' ? (
                  <>
                    <p className="settings-intro">Choose your API provider and model, then paste your key. Groq, OpenRouter, Google Gemini, and custom OpenAI-compatible endpoints work for chat, LokiCode, and presentations.</p>
                    <label className="api-key-input-label" htmlFor="lokizenith-provider">API provider</label>
                    <select id="lokizenith-provider" className="api-key-input" value={apiProvider} onChange={e => { const p = e.target.value; setApiProvider(p); if (p === 'groq') { setApiModel('llama-3.3-70b-versatile'); setApiBaseUrl(''); } else if (p === 'openrouter') { setApiModel('openrouter/auto'); setApiBaseUrl(''); } else if (p === 'gemini') { setApiModel('gemini-2.5-flash'); setApiBaseUrl(''); } else { setApiModel(''); setApiBaseUrl(''); } }}><option value="groq">Groq</option><option value="openrouter">OpenRouter</option><option value="gemini">Google Gemini</option><option value="custom">Custom OpenAI-compatible API</option></select>
                    <label className="api-key-input-label" htmlFor="lokizenith-model">Model ID</label>
                    <input id="lokizenith-model" className="api-key-input" value={apiModel} onChange={e => setApiModel(e.target.value)} placeholder="Enter the model ID from your provider" />
                    {apiProvider === 'custom' && <><label className="api-key-input-label" htmlFor="lokizenith-base-url">API base URL</label><input id="lokizenith-base-url" className="api-key-input" value={apiBaseUrl} onChange={e => setApiBaseUrl(e.target.value)} placeholder="https://your-provider.example/v1" /></>}
                    <div className="api-key-card api-key-inline-card">
                      <div className="api-key-card-icon"><ShieldCheck size={22} /></div>
                      <div className="api-key-card-copy"><b>{activeApiKey ? 'Your API key is saved on this device' : 'Use your own API key'}</b><small>{activeApiKey ? 'Your selected provider, model and key are restored on your next visit in this browser. Anyone with access to this browser profile may be able to use the saved key.' : 'Submit your key to save it in this browser for the next visit. Avoid saving keys on shared devices.'}</small></div>
                    </div>
                    <label className="api-key-input-label" htmlFor="lokizenith-api-key">{apiProvider === 'openrouter' ? 'OpenRouter API key' : apiProvider === 'groq' ? 'Groq API key' : apiProvider === 'gemini' ? 'Google Gemini API key' : 'Provider API key'}</label>
                    <input id="lokizenith-api-key" className="api-key-input" type="password" autoComplete="new-password" spellCheck={false} value={apiKeyDraft} onChange={e => setApiKeyDraft(e.target.value)} placeholder={'Paste your ' + (apiProvider === 'openrouter' ? 'OpenRouter' : apiProvider === 'groq' ? 'Groq' : apiProvider === 'gemini' ? 'Gemini' : 'provider') + ' API key here'} />
                    <div className="api-key-actions">
                      <button className="primary-small" onClick={saveCustomApiKey}><Check size={15} /> Submit / use this key</button>
                      <button className="outline-action" onClick={() => void testConnection()} disabled={connectionBusy}>{connectionBusy ? 'Testing…' : 'Test connection'} <Activity size={15} /></button>
                      {activeApiKey && <button className="outline-action" onClick={clearCustomApiKey}>Use app default</button>}
                    </div>
                    <div className="connection-status"><span className="online-dot" /><div><b>Connection test</b><small>{connectionStatus}</small></div></div>
                    <p className="small-note">Text chat, LokiCode, and presentations use the selected provider. Image generation currently requires Gemini. Your API key is saved in this browser's local storage so it survives refreshes and future visits; use this only on a device/profile you trust. Never paste API keys into chat.</p>
                  </>
                ) : settingsTab === 'Voice & sound' ? (
                  <>
                    <SettingToggle
                      title="Interface sounds"
                      detail="Play subtle sounds for actions"
                      value={pref('sound')}
                      onChange={() => togglePref('sound')}
                    />
                    <p className="small-note">
                      Voice conversation controls are not enabled in this
                      version.
                    </p>
                  </>
                ) : settingsTab === 'Files & uploads' ? (
                  <>
                    <p className="settings-intro">
                      Attach up to five files per message.
                    </p>
                    <div className="info-tile">
                      <Paperclip size={18} />
                      <span>
                        <b>Images and text files</b>
                        <small>
                          Images up to 6 MB each; text and code files are read
                          directly.
                        </small>
                      </span>
                    </div>
                    <div className="info-tile">
                      <FileText size={18} />
                      <span>
                        <b>Other document formats</b>
                        <small>
                          File names can be attached, but PDF/Office extraction
                          needs a document parser connection.
                        </small>
                      </span>
                    </div>
                  </>
                ) : settingsTab === 'Accessibility' ? (
                  <>
                    <SettingToggle
                      title="Animated interface"
                      detail="Reduce motion by turning this off"
                      value={pref('animations')}
                      onChange={() => togglePref('animations')}
                    />
                    <label className="setting-row">
                      <span>
                        <b>Text size</b>
                        <small>Adjust reading comfort</small>
                      </span>
                      <select
                        value={prefs.fontSize}
                        onChange={e =>
                          setPrefs((p: any) => ({
                            ...p,
                            fontSize: e.target.value,
                          }))
                        }
                      >
                        <option>Compact</option>
                        <option>Comfortable</option>
                        <option>Large</option>
                      </select>
                    </label>
                  </>
                ) : (
                  <>
                    <div className="about-brand">
                      <div className="brand-mark">
                        <Sparkles size={24} />
                      </div>
                      <h3>Lokizenith AI</h3>
                      <p>A brighter place to think, make and explore.</p>
                      <span>Preview build · 1.0</span>
                    </div>
                    <div className="info-tile">
                      <ShieldCheck size={18} />
                      <span>
                        <b>Privacy first</b>
                        <small>
                          Your conversations are saved locally in this browser.
                        </small>
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="settings-footer">
              <span>
                <Check size={14} /> Changes save automatically
              </span>
              <button
                className="primary-small"
                onClick={() => {
                  localStorage.setItem('lokizenith.prefs', JSON.stringify(prefs));
                  localStorage.setItem('lokizenith.api', JSON.stringify({ key: activeApiKey || apiKeyDraft.trim(), provider: apiProvider, model: apiModel.trim(), baseUrl: apiBaseUrl.trim() }));
                  if (apiKeyDraft.trim()) setActiveApiKey(apiKeyDraft.trim());
                  setSettingsOpen(false);
                  setToast('Settings saved on this device');
                }}
              >
                Done
              </button>
            </div>
          </section>
        </div>
      )}
      {toast && (
        <div className="toast">
          <span className="toast-icon">
            <Check size={15} />
          </span>
          {toast}
        </div>
      )}
    </div>
  );
}

function SettingToggle({
  title,
  detail,
  value,
  onChange,
}: {
  title: string;
  detail: string;
  value: boolean;
  onChange: () => void;
}) {
  return (
    <div className="setting-row">
      <span>
        <b>{title}</b>
        <small>{detail}</small>
      </span>
      <button
        className={'toggle ' + (value ? 'on' : '')}
        onClick={onChange}
        role="switch"
        aria-checked={value}
      >
        <span />
      </button>
    </div>
  );
}
export default App;
