import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TAGS = ['Accounting', 'LinkedIn', 'Side Quest'];

const i18n = {
  pl: {
    title: 'Skrzynka Andrija',
    tag: 'Tag',
    taskTitle: 'Tytuł zadania',
    placeholder: 'Co trzeba zrobić?',
    description: 'Opis',
    optional: 'opcjonalnie',
    descPlaceholder: 'Dodatkowy kontekst...',
    submit: 'Wyślij',
    sending: 'Wysyłanie...',
    success: 'Zadanie wysłane do Andrija',
    another: 'Wyślij kolejne',
  },
  en: {
    title: "Andrii's Inbox",
    tag: 'Tag',
    taskTitle: 'Task title',
    placeholder: 'What needs to be done?',
    description: 'Description',
    optional: 'optional',
    descPlaceholder: 'Any extra context...',
    submit: 'Submit',
    sending: 'Sending...',
    success: 'Task sent to Andrii',
    another: 'Submit another',
  },
};

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.07 } },
};

export default function App() {
  const [lang, setLang] = useState('pl');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState(TAGS[0]);
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const formRef = useRef(null);
  const titleRef = useRef(null);

  const t = i18n[lang];

  const scrollIntoView = useCallback((e) => {
    const el = e.target;
    setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    document.activeElement?.blur();

    setStatus('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/.netlify/functions/submit-task', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          tag,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong');
      }

      setStatus('success');
      setTitle('');
      setDescription('');
    } catch (err) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  const handleAnother = () => {
    setStatus('idle');
    setErrorMsg('');
  };

  return (
    <div className="min-h-dvh bg-black flex flex-col">
      <div className="flex justify-end p-4 pb-0">
        <div className="flex gap-1 text-sm text-white/40">
          <button
            onClick={() => setLang('pl')}
            className={`px-2 py-1 rounded transition-colors ${lang === 'pl' ? 'text-white bg-white/10' : 'hover:text-white/60'}`}
          >
            PL
          </button>
          <button
            onClick={() => setLang('en')}
            className={`px-2 py-1 rounded transition-colors ${lang === 'en' ? 'text-white bg-white/10' : 'hover:text-white/60'}`}
          >
            EN
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 py-safe">
        <AnimatePresence mode="wait">
          {status === 'success' ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-md text-center space-y-6"
            >
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.15 }}
                className="text-5xl text-emerald-400"
              >
                &#10003;
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="text-xl font-semibold text-white"
              >
                {t.success}
              </motion.h2>
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleAnother}
                className="mt-4 w-full py-3.5 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors active:bg-white/80"
              >
                {t.another}
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              ref={formRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-md space-y-8"
            >
              <motion.h1
                {...fade}
                className="text-xl font-semibold text-white tracking-tight"
              >
                {t.title}
              </motion.h1>

              <motion.form
                onSubmit={handleSubmit}
                className="space-y-5"
                variants={stagger}
                initial="initial"
                animate="animate"
              >
                <motion.div variants={fade}>
                  <label htmlFor="tag" className="block text-sm text-white/50 mb-1.5">
                    {t.tag}
                  </label>
                  <select
                    id="tag"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    className="field appearance-none"
                  >
                    {TAGS.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </motion.div>

                <motion.div variants={fade}>
                  <label htmlFor="title" className="block text-sm text-white/50 mb-1.5">
                    {t.taskTitle}
                  </label>
                  <input
                    ref={titleRef}
                    id="title"
                    type="text"
                    required
                    autoComplete="off"
                    enterKeyHint="next"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onFocus={scrollIntoView}
                    placeholder={t.placeholder}
                    className="field"
                  />
                </motion.div>

                <motion.div variants={fade}>
                  <label htmlFor="description" className="block text-sm text-white/50 mb-1.5">
                    {t.description}
                    <span className="text-white/30 ml-1">{t.optional}</span>
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    autoComplete="off"
                    enterKeyHint="done"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onFocus={scrollIntoView}
                    placeholder={t.descPlaceholder}
                    className="field resize-none"
                  />
                </motion.div>

                <AnimatePresence>
                  {status === 'error' && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="text-red-400 text-sm"
                    >
                      {errorMsg}
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.div variants={fade}>
                  <motion.button
                    type="submit"
                    disabled={status === 'submitting' || !title.trim()}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full py-3.5 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed active:bg-white/80"
                  >
                    {status === 'submitting' ? t.sending : t.submit}
                  </motion.button>
                </motion.div>
              </motion.form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
