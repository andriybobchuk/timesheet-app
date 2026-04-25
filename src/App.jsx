import { useState } from 'react';

const TAGS = ['Accounting', 'LinkedIn', 'Side Quest'];

export default function App() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState(TAGS[0]);
  const [status, setStatus] = useState('idle'); // idle | submitting | success | error
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

  if (status === 'success') {
    return (
      <div className="min-h-dvh bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center space-y-6">
          <p className="text-5xl">&#10003;</p>
          <h2 className="text-xl font-semibold text-white">Task sent to Andrii</h2>
          <button
            onClick={handleAnother}
            className="mt-4 w-full py-3 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors"
          >
            Submit another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <h1 className="text-xl font-semibold text-white tracking-tight">
          Inbox of Andrii's Corporation
        </h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
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
          </div>

          <div>
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
          </div>

          <div>
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
          </div>

          {status === 'error' && (
            <p className="text-red-400 text-sm">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={status === 'submitting' || !title.trim()}
            className="w-full py-3 bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {status === 'submitting' ? 'Sending...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
}
