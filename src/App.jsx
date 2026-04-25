import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TAGS = ['Accounting', 'LinkedIn', 'Side Quest'];

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.07 } },
};

export default function App() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState(TAGS[0]);
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;

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
    <div className="min-h-dvh bg-black flex items-center justify-center p-4">
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
              Task sent to Andrii
            </motion.h2>
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleAnother}
              className="mt-4 w-full py-3 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors"
            >
              Submit another
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="form"
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
              Inbox of Andrii's Corporation
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
                  Tag
                </label>
                <select
                  id="tag"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-white/30 transition-colors"
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
                  Task title
                </label>
                <input
                  id="title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors"
                />
              </motion.div>

              <motion.div variants={fade}>
                <label htmlFor="description" className="block text-sm text-white/50 mb-1.5">
                  Description
                  <span className="text-white/30 ml-1">optional</span>
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Any extra context..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 transition-colors resize-none"
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
                  className="w-full py-3 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {status === 'submitting' ? 'Sending...' : 'Submit'}
                </motion.button>
              </motion.div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
