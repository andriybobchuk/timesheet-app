import { useFirestore } from './hooks/useFirestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

function ScoreCard({ name, score, onIncrement, onDecrement, color, note }) {
  const isPositive = score > 0;
  const isNegative = score < 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center gap-4 sm:gap-6 w-full"
    >
      <h2 className={`text-2xl sm:text-3xl font-bold ${color}`}>{name}</h2>

      <div className="relative">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={score}
            initial={{ opacity: 0, y: -20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.8 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`text-6xl sm:text-8xl font-black tabular-nums block text-center ${
              isPositive ? 'text-emerald-400' : isNegative ? 'text-red-400' : 'text-white/60'
            }`}
          >
            {score > 0 ? `+${score}` : score}
          </motion.span>
        </AnimatePresence>
      </div>

      <div className="flex gap-3">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onDecrement}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl glass flex items-center justify-center
                     text-red-400 hover:bg-red-500/20 hover:border-red-500/30 transition-colors active:scale-90"
        >
          <Minus size={28} />
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onIncrement}
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl glass flex items-center justify-center
                     text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/30 transition-colors active:scale-90"
        >
          <Plus size={28} />
        </motion.button>
      </div>

      <p className="text-white/25 text-xs text-center italic">{note}</p>
    </motion.div>
  );
}

export default function App() {
  const { scores, loading, error, updateScore } = useFirestore();

  if (loading) {
    return (
      <div className="min-h-dvh gradient-mesh flex items-center justify-center">
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-white/50 text-lg"
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-dvh gradient-mesh flex items-center justify-center p-4">
        <div className="glass rounded-2xl p-6 text-red-400 text-center max-w-sm">
          Something went wrong: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh gradient-mesh flex items-center justify-center p-4">
      <div className="glass rounded-3xl p-6 sm:p-12 flex flex-col sm:flex-row items-center gap-8 sm:gap-20 w-full max-w-lg sm:max-w-2xl">
        <ScoreCard
          name="Andrew"
          score={scores.andrew}
          onIncrement={() => updateScore('andrew', 1)}
          onDecrement={() => updateScore('andrew', -1)}
          color="text-blue-400"
          note="Only Veronica is allowed to change this"
        />

        <div className="hidden sm:block w-px h-40 bg-white/10 shrink-0" />
        <div className="sm:hidden h-px w-3/4 bg-white/10" />

        <ScoreCard
          name="Veronica"
          score={scores.veronica}
          onIncrement={() => updateScore('veronica', 1)}
          onDecrement={() => updateScore('veronica', -1)}
          color="text-pink-400"
          note="Only Andrew is allowed to change this"
        />
      </div>
    </div>
  );
}
