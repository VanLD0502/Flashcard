import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Trash2, Image as ImageIcon, CheckCircle, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

import { API_URL } from '../config';

interface FlashcardInput {
  index: number;
  term: string;
  definition: string;
  image: File | null;
  imagePreview: string | null;
}

const CreateSet: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cards, setCards] = useState<FlashcardInput[]>([
    { index: 1, term: '', definition: '', image: null, imagePreview: null },
    { index: 2, term: '', definition: '', image: null, imagePreview: null },
    { index: 3, term: '', definition: '', image: null, imagePreview: null },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => { if (!user) navigate('/login'); }, [user, navigate]);

  const addCard = () => setCards(prev => [...prev, { index: prev.length + 1, term: '', definition: '', image: null, imagePreview: null }]);

  const removeCard = (index: number) => {
    if (cards.length > 2) setCards(cards.filter((_, i) => i !== index).map((c, i) => ({ ...c, index: i + 1 })));
  };

  const updateCard = (index: number, field: keyof FlashcardInput, value: any) => {
    setCards(prev => { const n = [...prev]; n[index] = { ...n[index], [field]: value }; return n; });
  };

  const handleImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setCards(prev => { const n = [...prev]; n[index].image = file; n[index].imagePreview = URL.createObjectURL(file); return n; });
    }
  };

  const removeImage = (index: number) => {
    setCards(prev => { const n = [...prev]; n[index].image = null; n[index].imagePreview = null; return n; });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!title.trim()) { alert('Please enter a title.'); return; }
    const valid = cards.filter(c => c.term.trim() || c.definition.trim());
    if (valid.length < 2) { alert('At least 2 cards needed.'); return; }

    setIsSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('Title', title);
      fd.append('Description', description);
      valid.forEach((c, i) => {
        fd.append(`Cards[${i}].Term`, c.term);
        fd.append(`Cards[${i}].Definition`, c.definition);
        if (c.image) fd.append(`Cards[${i}].Image`, c.image);
      });
      const res = await axios.post(`${API_URL}/StudySets`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      navigate(`/set/${res.data.id}`);
    } catch (e) {
      console.error(e);
      alert('Failed to create. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto px-4 py-6 pb-16">

      {/* Sticky header */}
      <div className="flex justify-between items-center mb-8 sticky top-[64px] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 backdrop-blur-md z-40 py-4 border-b border-blue-100">
        <h1 className="text-2xl font-black text-slate-800">Create <span className="text-blue-600">New Set</span></h1>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
            onClick={handleSubmit} disabled={isSubmitting}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-200 hover:shadow-indigo-300 transition-shadow"
          >
            <CheckCircle size={18} /> {isSubmitting ? 'Creating…' : 'Create Set'}
          </motion.button>
        </div>
      </div>

      {/* Title & Description */}
      <div className="mb-8 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="mb-5">
          <label className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-2 block">Title *</label>
          <input
            type="text"
            placeholder='e.g. "Biology - Chapter 22: Evolution"'
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xl font-bold text-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition placeholder-slate-300"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-2 block">Description</label>
          <input
            type="text"
            placeholder="What is this set about? (optional)"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition placeholder-slate-300"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>
      </div>

      {/* Cards */}
      <AnimatePresence>
        <div className="space-y-4">
          {cards.map((card, index) => (
            <motion.div
              key={card.index}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all overflow-hidden"
            >
              <div className="flex justify-between items-center px-6 pt-5 pb-3 border-b border-slate-50">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 font-black text-sm flex items-center justify-center">{card.index}</span>
                </div>
                <button onClick={() => removeCard(index)} className="text-slate-300 hover:text-red-400 p-2 rounded-xl hover:bg-red-50 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-0 md:divide-x divide-slate-100">
                <div className="flex-1 p-5">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Term</label>
                  <textarea
                    rows={2}
                    placeholder="Enter term"
                    className="w-full bg-transparent text-slate-700 text-base resize-none outline-none placeholder-slate-300 leading-relaxed"
                    value={card.term}
                    onChange={e => updateCard(index, 'term', e.target.value)}
                  />
                  <div className="h-0.5 bg-slate-100 rounded-full mt-1" />
                </div>
                <div className="flex-1 p-5">
                  <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">Definition</label>
                  <textarea
                    rows={2}
                    placeholder="Enter definition"
                    className="w-full bg-transparent text-slate-700 text-base resize-none outline-none placeholder-slate-300 leading-relaxed"
                    value={card.definition}
                    onChange={e => updateCard(index, 'definition', e.target.value)}
                  />
                  <div className="h-0.5 bg-slate-100 rounded-full mt-1" />
                </div>
                <div className="p-5 flex items-center justify-center md:w-32">
                  {!card.imagePreview ? (
                    <label className="cursor-pointer flex flex-col items-center justify-center h-20 w-20 border-2 border-dashed border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition group">
                      <ImageIcon className="text-slate-300 group-hover:text-blue-400 w-6 h-6 transition-colors" />
                      <span className="text-[10px] text-slate-300 mt-1 group-hover:text-blue-400">Add image</span>
                      <input type="file" className="hidden" accept="image/*" onChange={e => handleImageChange(index, e)} />
                    </label>
                  ) : (
                    <div className="relative h-20 w-20 rounded-xl overflow-hidden group border border-slate-200">
                      <img src={card.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <button onClick={() => removeImage(index)} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
        onClick={addCard}
        className="w-full mt-5 py-5 rounded-2xl border-2 border-dashed border-blue-200 text-blue-500 hover:bg-blue-50 hover:border-blue-400 font-bold text-base transition-all flex items-center justify-center gap-2"
      >
        <Plus size={20} /> Add a Card
      </motion.button>

      <div className="mt-10 flex justify-end">
        <motion.button
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={handleSubmit} disabled={isSubmitting}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-10 py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-shadow text-lg"
        >
          <CheckCircle size={22} /> {isSubmitting ? 'Creating…' : 'Complete Creation'}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default CreateSet;
