import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PERIOD_TYPES = [
  { value: 'student_visa', label: 'Student Visa', rate: 0.5, color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' },
  { value: 'student_karta', label: 'Student Karta Pobytu', rate: 0.5, color: 'text-sky-400', bg: 'bg-sky-400/10', border: 'border-sky-400/20' },
  { value: 'work_karta', label: 'Karta Pobytu (UoP)', rate: 1.0, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' },
  { value: 'business_karta', label: 'Karta Pobytu (B2B/JDG)', rate: 1.0, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' },
  { value: 'pending_student', label: 'Stampka (after student karta)', rate: 0.5, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' },
  { value: 'pending_work', label: 'Stampka (after work/business karta)', rate: 1.0, color: 'text-violet-400', bg: 'bg-violet-400/10', border: 'border-violet-400/20' },
  { value: 'other', label: 'Other Legal Stay', rate: 1.0, color: 'text-gray-400', bg: 'bg-gray-400/10', border: 'border-gray-400/20' },
];

const CASE_STATUSES = ['Submitted', 'In Review', 'Decision Issued', 'Card Received', 'Rejected', 'Appealed'];

const DEFAULT_PERIODS = [
  {
    id: '1',
    type: 'student_visa',
    label: 'Student Visa — arrival in Poland',
    startDate: '2020-09-01',
    endDate: '2020-12-31',
    notes: 'Arrived in Poland as a student from Ukraine.',
  },
  {
    id: '2',
    type: 'student_visa',
    label: 'Student Visa (continued)',
    startDate: '2021-01-01',
    endDate: '2021-02-15',
    notes: 'Continued on student visa before applying for karta pobytu.',
  },
  {
    id: '3',
    type: 'student_karta',
    label: 'Student Karta Pobytu Application & Card',
    startDate: '2021-02-15',
    endDate: '2024-04-30',
    notes: 'Applied ~Feb 2021. After back-and-forth, received student karta pobytu valid until ~May 2024. Stampka covered the waiting period.',
  },
  {
    id: '4',
    type: 'work_karta',
    label: 'Karta Pobytu based on UoP',
    startDate: '2024-04-30',
    endDate: '2025-02-28',
    notes: 'Applied April 2024 based on employment contract (UoP). Decision received Feb 2025, karta valid until Apr 2028. Quit job in Feb 2025.',
  },
  {
    id: '5',
    type: 'pending_work',
    label: 'Pending — B2B/JDG Karta Application (Katowice)',
    startDate: '2025-02-28',
    endDate: '',
    notes: 'Opened JDG, applied for new karta pobytu based on business activity. May 2026: application accepted, case number assigned. Ongoing.',
  },
];

const DEFAULT_CASES = [
  {
    id: 'c1',
    title: 'Student Karta Pobytu',
    applicationDate: '2021-02-15',
    decisionDate: '2021-08-01',
    status: 'Card Received',
    office: 'Urząd Wojewódzki',
    caseNumber: '',
    notes: 'First karta. Valid until ~May 2024.',
  },
  {
    id: 'c2',
    title: 'Karta Pobytu — UoP',
    applicationDate: '2024-04-15',
    decisionDate: '2025-02-15',
    status: 'Card Received',
    office: 'Urząd Wojewódzki',
    caseNumber: '',
    notes: 'Based on employment contract. Decision Feb 2025. Card valid until Apr 2028.',
  },
  {
    id: 'c3',
    title: 'Karta Pobytu — JDG/B2B (Katowice)',
    applicationDate: '2025-03-01',
    decisionDate: '',
    status: 'In Review',
    office: 'Urząd Wojewódzki Katowice',
    caseNumber: '',
    notes: 'May 2026: application accepted, case number received.',
  },
];

const LONG_TERM_YEARS = 5;
// Current law: 3yr on long-term resident card after obtaining it (5+3=8 practical minimum)
// Pending bills propose 8-10yr but none passed as of May 2026
const PASSPORT_YEARS = 8;

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function daysBetween(start, end) {
  const s = new Date(start);
  const e = end ? new Date(end) : new Date();
  return Math.max(0, (e - s) / (1000 * 60 * 60 * 24));
}

function formatYearsMonthsDays(totalDays) {
  const years = Math.floor(totalDays / 365.25);
  const months = Math.floor((totalDays % 365.25) / 30.44);
  const days = Math.floor(totalDays % 30.44);
  const parts = [];
  if (years > 0) parts.push(`${years}y`);
  if (months > 0) parts.push(`${months}m`);
  parts.push(`${days}d`);
  return parts.join(' ');
}

function formatDate(dateStr) {
  if (!dateStr) return 'present';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const fade = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

export default function ResidencyTracker({ onBack }) {
  const [periods, setPeriods] = useState(() => {
    const saved = localStorage.getItem('residency_periods');
    return saved ? JSON.parse(saved) : DEFAULT_PERIODS;
  });

  const [cases, setCases] = useState(() => {
    const saved = localStorage.getItem('residency_cases');
    return saved ? JSON.parse(saved) : DEFAULT_CASES;
  });

  const [editingPeriod, setEditingPeriod] = useState(null);
  const [editingCase, setEditingCase] = useState(null);
  const [activeTab, setActiveTab] = useState('timeline');

  useEffect(() => {
    localStorage.setItem('residency_periods', JSON.stringify(periods));
  }, [periods]);

  useEffect(() => {
    localStorage.setItem('residency_cases', JSON.stringify(cases));
  }, [cases]);

  const calculations = useMemo(() => {
    let totalEffectiveDays = 0;
    let totalActualDays = 0;
    const breakdown = [];

    const sorted = [...periods].sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    for (const period of sorted) {
      if (!period.startDate) continue;
      const typeInfo = PERIOD_TYPES.find(t => t.value === period.type) || PERIOD_TYPES[5];
      const actual = daysBetween(period.startDate, period.endDate);
      const effective = actual * typeInfo.rate;
      totalActualDays += actual;
      totalEffectiveDays += effective;
      breakdown.push({ ...period, actual, effective, rate: typeInfo.rate, typeInfo });
    }

    const longTermProgress = (totalEffectiveDays / (LONG_TERM_YEARS * 365.25)) * 100;
    const passportProgress = (totalEffectiveDays / (PASSPORT_YEARS * 365.25)) * 100;

    const longTermRemaining = Math.max(0, LONG_TERM_YEARS * 365.25 - totalEffectiveDays);
    const passportRemaining = Math.max(0, PASSPORT_YEARS * 365.25 - totalEffectiveDays);

    const longTermDate = new Date(Date.now() + longTermRemaining * 24 * 60 * 60 * 1000);
    const passportDate = new Date(Date.now() + passportRemaining * 24 * 60 * 60 * 1000);

    return {
      totalEffectiveDays,
      totalActualDays,
      breakdown,
      longTermProgress: Math.min(100, longTermProgress),
      passportProgress: Math.min(100, passportProgress),
      longTermRemaining,
      passportRemaining,
      longTermEstDate: longTermRemaining > 0 ? longTermDate : null,
      passportEstDate: passportRemaining > 0 ? passportDate : null,
    };
  }, [periods]);

  const savePeriod = (period) => {
    if (periods.find(p => p.id === period.id)) {
      setPeriods(prev => prev.map(p => p.id === period.id ? period : p));
    } else {
      setPeriods(prev => [...prev, period]);
    }
    setEditingPeriod(null);
  };

  const deletePeriod = (id) => {
    setPeriods(prev => prev.filter(p => p.id !== id));
    setEditingPeriod(null);
  };

  const saveCase = (c) => {
    if (cases.find(x => x.id === c.id)) {
      setCases(prev => prev.map(x => x.id === c.id ? c : x));
    } else {
      setCases(prev => [...prev, c]);
    }
    setEditingCase(null);
  };

  const deleteCase = (id) => {
    setCases(prev => prev.filter(c => c.id !== id));
    setEditingCase(null);
  };

  return (
    <div className="min-h-dvh bg-black text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className="text-white/40 hover:text-white transition-colors text-sm"
          >
            ← back
          </button>
          <h1 className="text-sm font-medium text-white/70 flex-1 text-center">
            Residency Tracker
          </h1>
          <div className="w-12" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Progress Cards */}
        <motion.div {...fade} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ProgressCard
            title="Karta Długoterminowa"
            subtitle="Long-term EU Resident"
            required={`${LONG_TERM_YEARS} years`}
            accumulated={formatYearsMonthsDays(calculations.totalEffectiveDays)}
            progress={calculations.longTermProgress}
            remaining={calculations.longTermRemaining > 0 ? formatYearsMonthsDays(calculations.longTermRemaining) : null}
            estDate={calculations.longTermEstDate}
            color="purple"
          />
          <ProgressCard
            title="Paszport Polski"
            subtitle="Citizenship (5yr LTR + 3yr on card)"
            required={`~${PASSPORT_YEARS} years total`}
            accumulated={formatYearsMonthsDays(calculations.totalEffectiveDays)}
            progress={calculations.passportProgress}
            remaining={calculations.passportRemaining > 0 ? formatYearsMonthsDays(calculations.passportRemaining) : null}
            estDate={calculations.passportEstDate}
            color="amber"
          />
        </motion.div>

        {/* Effective time summary */}
        <motion.div {...fade} transition={{ delay: 0.05 }} className="bg-white/5 rounded-xl p-4 border border-white/8">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-xs text-white/40 uppercase tracking-wider">Effective Time Accumulated</span>
            <span className="text-lg font-semibold text-white">{formatYearsMonthsDays(calculations.totalEffectiveDays)}</span>
          </div>
          <div className="flex justify-between items-baseline">
            <span className="text-xs text-white/40 uppercase tracking-wider">Actual Time in Poland</span>
            <span className="text-sm text-white/60">{formatYearsMonthsDays(calculations.totalActualDays)}</span>
          </div>
          <p className="text-xs text-white/25 mt-3">Student periods count at 50% per Polish law. Work & business periods count at 100%.</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-lg p-1">
          {['timeline', 'cases', 'breakdown'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-sm rounded-md transition-colors capitalize ${
                activeTab === tab ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'timeline' && (
            <motion.div key="timeline" {...fade} className="space-y-3">
              {[...periods].sort((a, b) => new Date(a.startDate) - new Date(b.startDate)).map(period => {
                const typeInfo = PERIOD_TYPES.find(t => t.value === period.type) || PERIOD_TYPES[5];
                const days = daysBetween(period.startDate, period.endDate);
                return (
                  <motion.div
                    key={period.id}
                    layout
                    className={`${typeInfo.bg} border ${typeInfo.border} rounded-xl p-4 cursor-pointer hover:border-white/20 transition-colors`}
                    onClick={() => setEditingPeriod({ ...period })}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className={`text-xs font-medium ${typeInfo.color} mb-1`}>{typeInfo.label} — {typeInfo.rate === 0.5 ? '50%' : '100%'}</div>
                        <div className="text-sm font-medium text-white truncate">{period.label}</div>
                        <div className="text-xs text-white/40 mt-1">
                          {formatDate(period.startDate)} → {formatDate(period.endDate)}
                          <span className="text-white/25 ml-2">({formatYearsMonthsDays(days)})</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs text-white/30">effective</div>
                        <div className={`text-sm font-medium ${typeInfo.color}`}>
                          {formatYearsMonthsDays(days * typeInfo.rate)}
                        </div>
                      </div>
                    </div>
                    {period.notes && (
                      <p className="text-xs text-white/30 mt-2 line-clamp-2">{period.notes}</p>
                    )}
                  </motion.div>
                );
              })}
              <button
                onClick={() => setEditingPeriod({ id: generateId(), type: 'work_karta', label: '', startDate: '', endDate: '', notes: '' })}
                className="w-full py-3 border border-dashed border-white/10 rounded-xl text-sm text-white/30 hover:text-white/50 hover:border-white/20 transition-colors"
              >
                + Add period
              </button>
            </motion.div>
          )}

          {activeTab === 'cases' && (
            <motion.div key="cases" {...fade} className="space-y-3">
              {[...cases].sort((a, b) => new Date(b.applicationDate) - new Date(a.applicationDate)).map(c => (
                <motion.div
                  key={c.id}
                  layout
                  className="bg-white/5 border border-white/8 rounded-xl p-4 cursor-pointer hover:border-white/15 transition-colors"
                  onClick={() => setEditingCase({ ...c })}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white">{c.title}</div>
                      <div className="text-xs text-white/40 mt-1">
                        Applied: {formatDate(c.applicationDate)}
                        {c.decisionDate && ` · Decision: ${formatDate(c.decisionDate)}`}
                      </div>
                      {c.office && <div className="text-xs text-white/25 mt-0.5">{c.office}</div>}
                    </div>
                    <span className={`shrink-0 text-xs px-2 py-1 rounded-full ${
                      c.status === 'Card Received' ? 'bg-emerald-400/10 text-emerald-400' :
                      c.status === 'Decision Issued' ? 'bg-blue-400/10 text-blue-400' :
                      c.status === 'In Review' ? 'bg-amber-400/10 text-amber-400' :
                      c.status === 'Rejected' ? 'bg-red-400/10 text-red-400' :
                      'bg-white/10 text-white/40'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                  {c.caseNumber && <div className="text-xs text-white/20 mt-2 font-mono">Case: {c.caseNumber}</div>}
                  {c.notes && <p className="text-xs text-white/25 mt-1 line-clamp-2">{c.notes}</p>}
                </motion.div>
              ))}
              <button
                onClick={() => setEditingCase({ id: generateId(), title: '', applicationDate: '', decisionDate: '', status: 'Submitted', office: '', caseNumber: '', notes: '' })}
                className="w-full py-3 border border-dashed border-white/10 rounded-xl text-sm text-white/30 hover:text-white/50 hover:border-white/20 transition-colors"
              >
                + Add case
              </button>
            </motion.div>
          )}

          {activeTab === 'breakdown' && (
            <motion.div key="breakdown" {...fade} className="space-y-2">
              <div className="bg-white/5 rounded-xl border border-white/8 overflow-hidden">
                <div className="grid grid-cols-[1fr,auto,auto,auto] gap-2 px-4 py-2 text-xs text-white/30 border-b border-white/5 font-medium">
                  <span>Period</span>
                  <span className="text-right">Actual</span>
                  <span className="text-right">Rate</span>
                  <span className="text-right">Effective</span>
                </div>
                {calculations.breakdown.map(b => (
                  <div key={b.id} className="grid grid-cols-[1fr,auto,auto,auto] gap-2 px-4 py-2.5 text-sm border-b border-white/3 last:border-0">
                    <span className="text-white/70 truncate text-xs">{b.label || b.typeInfo.label}</span>
                    <span className="text-right text-white/40 text-xs">{formatYearsMonthsDays(b.actual)}</span>
                    <span className={`text-right text-xs ${b.rate === 0.5 ? 'text-amber-400' : 'text-emerald-400'}`}>{b.rate * 100}%</span>
                    <span className="text-right text-white text-xs font-medium">{formatYearsMonthsDays(b.effective)}</span>
                  </div>
                ))}
                <div className="grid grid-cols-[1fr,auto,auto,auto] gap-2 px-4 py-3 text-sm bg-white/3 font-medium">
                  <span className="text-white/60">Total</span>
                  <span className="text-right text-white/40 text-xs">{formatYearsMonthsDays(calculations.totalActualDays)}</span>
                  <span />
                  <span className="text-right text-white">{formatYearsMonthsDays(calculations.totalEffectiveDays)}</span>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl border border-white/8 p-4 space-y-3 text-xs text-white/40">
                <h3 className="text-white/60 font-medium text-sm">Polish Law Notes (as of 2026)</h3>
                <ul className="space-y-1.5 list-disc list-inside">
                  <li><span className="text-amber-400/70">Student visa/karta periods count at 50%</span> toward long-term residency (Art. 212 ustawy o cudzoziemcach)</li>
                  <li><span className="text-emerald-400/70">Work & business karta periods count at 100%</span></li>
                  <li><span className="text-purple-400/70">Stampka waiting time counts at the rate of the previous karta</span> — if your student karta expired and you applied for a new one, waiting time = 50%. If work karta expired, waiting time = 100% (Art. 108)</li>
                  <li>Karta długoterminowego rezydenta UE requires <strong className="text-white/60">5 years</strong> of uninterrupted legal stay</li>
                  <li>Absences: max 6 months single absence, max 10 months total in the 5-year period</li>
                  <li>Polish citizenship: current law requires <strong className="text-white/60">3 years</strong> on a permanent/long-term resident card (so ~8yr total in practice). Pending bills may raise this to 8-10yr — not yet passed</li>
                  <li><span className="text-red-400/70">From July 1, 2026:</span> B1 language certificate required for long-term resident card (university diplomas no longer accepted)</li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Period Edit Modal */}
      <AnimatePresence>
        {editingPeriod && (
          <EditModal
            title="Edit Period"
            onClose={() => setEditingPeriod(null)}
            onSave={() => savePeriod(editingPeriod)}
            onDelete={() => deletePeriod(editingPeriod.id)}
          >
            <FieldGroup label="Type">
              <select
                value={editingPeriod.type}
                onChange={e => setEditingPeriod(prev => ({ ...prev, type: e.target.value }))}
                className="field appearance-none"
              >
                {PERIOD_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label} ({t.rate * 100}%)</option>
                ))}
              </select>
            </FieldGroup>
            <FieldGroup label="Label">
              <input
                type="text"
                value={editingPeriod.label}
                onChange={e => setEditingPeriod(prev => ({ ...prev, label: e.target.value }))}
                className="field"
                placeholder="e.g. Student Karta Pobytu"
              />
            </FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Start Date">
                <input
                  type="date"
                  value={editingPeriod.startDate}
                  onChange={e => setEditingPeriod(prev => ({ ...prev, startDate: e.target.value }))}
                  className="field"
                />
              </FieldGroup>
              <FieldGroup label="End Date">
                <input
                  type="date"
                  value={editingPeriod.endDate}
                  onChange={e => setEditingPeriod(prev => ({ ...prev, endDate: e.target.value }))}
                  className="field"
                  placeholder="Leave empty for ongoing"
                />
              </FieldGroup>
            </div>
            <FieldGroup label="Notes">
              <textarea
                rows={3}
                value={editingPeriod.notes}
                onChange={e => setEditingPeriod(prev => ({ ...prev, notes: e.target.value }))}
                className="field resize-none"
                placeholder="Additional context..."
              />
            </FieldGroup>
          </EditModal>
        )}
      </AnimatePresence>

      {/* Case Edit Modal */}
      <AnimatePresence>
        {editingCase && (
          <EditModal
            title="Edit Case"
            onClose={() => setEditingCase(null)}
            onSave={() => saveCase(editingCase)}
            onDelete={() => deleteCase(editingCase.id)}
          >
            <FieldGroup label="Title">
              <input
                type="text"
                value={editingCase.title}
                onChange={e => setEditingCase(prev => ({ ...prev, title: e.target.value }))}
                className="field"
                placeholder="e.g. Karta Pobytu — UoP"
              />
            </FieldGroup>
            <FieldGroup label="Status">
              <select
                value={editingCase.status}
                onChange={e => setEditingCase(prev => ({ ...prev, status: e.target.value }))}
                className="field appearance-none"
              >
                {CASE_STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Application Date">
                <input
                  type="date"
                  value={editingCase.applicationDate}
                  onChange={e => setEditingCase(prev => ({ ...prev, applicationDate: e.target.value }))}
                  className="field"
                />
              </FieldGroup>
              <FieldGroup label="Decision Date">
                <input
                  type="date"
                  value={editingCase.decisionDate}
                  onChange={e => setEditingCase(prev => ({ ...prev, decisionDate: e.target.value }))}
                  className="field"
                />
              </FieldGroup>
            </div>
            <FieldGroup label="Office">
              <input
                type="text"
                value={editingCase.office}
                onChange={e => setEditingCase(prev => ({ ...prev, office: e.target.value }))}
                className="field"
                placeholder="e.g. Urząd Wojewódzki Katowice"
              />
            </FieldGroup>
            <FieldGroup label="Case Number">
              <input
                type="text"
                value={editingCase.caseNumber}
                onChange={e => setEditingCase(prev => ({ ...prev, caseNumber: e.target.value }))}
                className="field font-mono"
                placeholder="Case number (if assigned)"
              />
            </FieldGroup>
            <FieldGroup label="Notes">
              <textarea
                rows={3}
                value={editingCase.notes}
                onChange={e => setEditingCase(prev => ({ ...prev, notes: e.target.value }))}
                className="field resize-none"
                placeholder="Additional details..."
              />
            </FieldGroup>
          </EditModal>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProgressCard({ title, subtitle, required, accumulated, progress, remaining, estDate, color }) {
  const barColor = color === 'purple'
    ? 'bg-gradient-to-r from-purple-500 to-violet-400'
    : 'bg-gradient-to-r from-amber-500 to-yellow-400';

  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/8">
      <div className="text-xs text-white/40 uppercase tracking-wider">{subtitle}</div>
      <div className="text-sm font-semibold text-white mt-0.5">{title}</div>
      <div className="mt-3 h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </div>
      <div className="flex justify-between mt-2 text-xs">
        <span className="text-white/50">{accumulated} / {required}</span>
        <span className="text-white/30">{Math.round(progress)}%</span>
      </div>
      {remaining ? (
        <div className="text-xs text-white/25 mt-1.5">
          ~{remaining} remaining
          {estDate && ` · est. ${estDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}`}
        </div>
      ) : (
        <div className="text-xs text-emerald-400/60 mt-1.5">Requirement met!</div>
      )}
    </div>
  );
}

function EditModal({ title, onClose, onSave, onDelete, children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="bg-gray-950 border border-white/10 rounded-2xl p-5 w-full max-w-md max-h-[85vh] overflow-y-auto space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-white/70">{title}</h3>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 text-sm">✕</button>
        </div>
        {children}
        <div className="flex gap-2 pt-2">
          <button
            onClick={onDelete}
            className="px-4 py-2.5 text-sm text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
          >
            Delete
          </button>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm text-white/40 hover:text-white/60 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-5 py-2.5 text-sm bg-white text-black font-medium rounded-lg hover:bg-white/90 transition-colors"
          >
            Save
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function FieldGroup({ label, children }) {
  return (
    <div>
      <label className="block text-xs text-white/40 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
