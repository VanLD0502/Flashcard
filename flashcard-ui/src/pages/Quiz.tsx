import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import type { QuizQuestion } from '../types';
import { ChevronLeft, CheckCircle, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { API_URL } from '../config';

export default function Quiz() {
  const { id } = useParams();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchQuiz(); }, [id]);

  useEffect(() => {
    if (isFinished && questions.length > 0) {
      const percentage = Math.round((score / questions.length) * 100);
      const key = `quizHistory_${id}`;
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      const entry = { date: new Date().toISOString(), score, total: questions.length, percentage };
      localStorage.setItem(key, JSON.stringify([entry, ...existing].slice(0, 5)));
    }
  }, [isFinished, score, questions.length, id]);

  const fetchQuiz = async () => {
    try {
      const res = await axios.get(`${API_URL}/StudySets/${id}/quiz`);
      setQuestions(res.data);
    } catch (err: any) {
      setError(err.response?.data || 'Failed to load quiz');
    }
  };

  const handleSelect = (opt: string) => { if (!isAnswered) setSelectedAnswer(opt); };

  const handleSubmit = () => {
    if (!selectedAnswer) return;
    setIsAnswered(true);
    if (selectedAnswer === questions[currentIndex].correctAnswer) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (currentIndex === questions.length - 1) setIsFinished(true);
    else { setCurrentIndex(i => i + 1); setSelectedAnswer(null); setIsAnswered(false); }
  };

  if (error) return (
    <div className="text-center py-20">
      <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-2xl max-w-lg mx-auto mb-6">
        <p className="font-bold text-lg">{error}</p>
      </div>
      <Link to={`/set/${id}`} className="text-blue-600 font-bold underline">Go back to set</Link>
    </div>
  );

  if (questions.length === 0) return (
    <div className="flex justify-center items-center py-32">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (isFinished) {
    const pct = Math.round((score / questions.length) * 100);
    const color = pct >= 80 ? 'text-green-600' : pct >= 50 ? 'text-blue-600' : 'text-red-500';
    const ring = pct >= 80 ? 'border-green-400' : pct >= 50 ? 'border-blue-500' : 'border-red-400';
    const bg = pct >= 80 ? 'from-green-400 to-emerald-500' : pct >= 50 ? 'from-blue-500 to-indigo-600' : 'from-red-400 to-rose-500';

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto"
      >
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
          <div className={`bg-gradient-to-r ${bg} p-8 text-center text-white`}>
            <h2 className="text-4xl font-black mb-1">Quiz Complete! 🎉</h2>
            <p className="text-white/80">Your result has been saved</p>
          </div>
          <div className="p-10 text-center">
            <div className="relative w-40 h-40 mx-auto flex items-center justify-center rounded-full border-[14px] border-slate-100 mb-8">
              <div className={`absolute inset-0 rounded-full border-[14px] ${ring}`}
                style={{ clipPath: `polygon(0 0, 100% 0, 100% ${pct}%, 0 ${pct}%)` }} />
              <div className="z-10 flex flex-col items-center">
                <span className={`text-5xl font-black ${color}`}>{pct}%</span>
                <span className="text-slate-400 text-sm mt-1">{score}/{questions.length}</span>
              </div>
            </div>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => { setCurrentIndex(0); setScore(0); setIsFinished(false); setIsAnswered(false); setSelectedAnswer(null); fetchQuiz(); }}
                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-md"
              >
                Retake Quiz
              </button>
              <Link to={`/set/${id}`} className="px-8 py-3 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition">
                Back to Set
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  const q = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto pb-12">
      {/* Top bar */}
      <div className="mb-6 flex justify-between items-center">
        <Link to={`/set/${id}`} className="flex items-center gap-2 text-slate-400 hover:text-blue-600 font-semibold transition">
          <ChevronLeft size={20} /> Exit Quiz
        </Link>
        <span className="text-sm font-bold text-slate-500 bg-white border border-slate-200 px-4 py-1.5 rounded-full shadow-sm">
          <span className="text-blue-600">{currentIndex + 1}</span> / {questions.length}
        </span>
      </div>

      {/* Progress */}
      <div className="w-full h-1.5 bg-slate-200 rounded-full mb-7 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.25 }}
        >
          {/* Question Card */}
          <div className="bg-white rounded-3xl shadow-md border border-slate-100 overflow-hidden mb-6">
            <div className="p-8 md:p-12 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-slate-100 min-h-[200px] flex flex-col items-center justify-center text-center">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-400 mb-4">Question</span>
              <h3 className="text-2xl md:text-3xl font-bold text-slate-800 leading-snug whitespace-pre-wrap">{q.questionText}</h3>
              {q.questionImageUrl && (
                <div className="mt-6 w-full flex justify-center">
                  <img src={q.questionImageUrl} alt="Question" className="max-h-72 w-auto object-contain rounded-xl shadow-lg border border-slate-100" />
                </div>
              )}
            </div>

            <div className="p-8 md:p-10">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-5">Choose the correct answer:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {q.options.map((opt, i) => {
                  let cls = 'border-2 rounded-2xl p-4 text-left text-base font-medium transition-all duration-200 flex justify-between items-center ';
                  if (!isAnswered) {
                    cls += selectedAnswer === opt
                      ? 'border-blue-500 bg-blue-50 text-blue-800 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50 text-slate-700';
                  } else {
                    if (opt === q.correctAnswer) cls += 'border-green-400 bg-green-50 text-green-800';
                    else if (opt === selectedAnswer) cls += 'border-red-400 bg-red-50 text-red-700';
                    else cls += 'border-slate-100 bg-slate-50 text-slate-400 opacity-60';
                  }
                  return (
                    <button key={i} onClick={() => handleSelect(opt)} className={cls} disabled={isAnswered}>
                      <span className="whitespace-pre-wrap">{opt}</span>
                      {isAnswered && opt === q.correctAnswer && <CheckCircle className="text-green-500 shrink-0" size={22} />}
                      {isAnswered && opt === selectedAnswer && selectedAnswer !== q.correctAnswer && <XCircle className="text-red-400 shrink-0" size={22} />}
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 flex justify-end">
                {!isAnswered ? (
                  <button
                    onClick={handleSubmit}
                    disabled={!selectedAnswer}
                    className="bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-md disabled:shadow-none"
                  >
                    Submit Answer
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="bg-slate-800 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-900 transition flex items-center gap-2 shadow-md"
                  >
                    {currentIndex === questions.length - 1 ? 'See Results' : 'Next Question'} <ChevronLeft size={18} className="rotate-180" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
