import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import type { StudySet } from '../types';
import { ArrowLeft, ArrowRight, ChevronLeft, RotateCcw, Edit, X, Image as ImageIcon, Save, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { API_URL } from '../config';

export default function FlashcardStudy() {
  const { id } = useParams();
  const [set, setSet] = useState<StudySet | null>(null);
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [animating, setAnimating] = useState(false);

  // Edit states
  const [editingCard, setEditingCard] = useState<any>(null);
  const [editTerm, setEditTerm] = useState('');
  const [editDef, setEditDef] = useState('');
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [isImageDeleted, setIsImageDeleted] = useState(false);
  const [editAnswerImage, setEditAnswerImage] = useState<File | null>(null);
  const [editAnswerImagePreview, setEditAnswerImagePreview] = useState<string | null>(null);
  const [isAnswerImageDeleted, setIsAnswerImageDeleted] = useState(false);
  const [isSavingCard, setIsSavingCard] = useState(false);

  const isOwner = !!user && !!set && (
    (user.id || user.UserId || user.userId)?.toString() === (set.userId || set.UserId)?.toString()
  );

  console.log("DEBUG Ownership Details:", {
    full_user_object: user,
    full_set_object: set,
    detected_user_id: user?.id || user?.UserId || user?.userId,
    detected_set_owner_id: set?.userId || set?.UserId,
    isOwner
  });

  useEffect(() => {
    fetchDetail();
  }, [id]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === ' ') { e.preventDefault(); setIsFlipped(f => !f); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [animating, set]);

  const fetchDetail = async () => {
    try {
      const res = await axios.get(`${API_URL}/StudySets/${id}`);
      setSet(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const openCardEditModal = (e: React.MouseEvent, card: any) => {
    e.stopPropagation();
    if (!isOwner) return;
    setEditingCard(card);
    setEditTerm(card.questionText);
    setEditDef(card.answerText);
    setEditImage(null);
    setEditImagePreview(card.questionImageUrl);
    setIsImageDeleted(false);
    setEditAnswerImage(null);
    setEditAnswerImagePreview(card.answerImageUrl);
    setIsAnswerImageDeleted(false);
  };

  const processImage = (file: File): Promise<File | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          if (img.width < 100 || img.height < 100) {
            toast.error("Image must be at least 100x100 pixels.");
            resolve(null);
            return;
          }
          const maxWidth = 500;
          const maxHeight = 250;
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(resizedFile);
            } else {
              resolve(null);
            }
          }, file.type);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const processedFile = await processImage(file);
      if (processedFile) {
        setEditImage(processedFile);
        setEditImagePreview(URL.createObjectURL(processedFile));
        setIsImageDeleted(false);
      }
    }
  };

  const removeImage = () => {
    setEditImage(null);
    setEditImagePreview(null);
    setIsImageDeleted(true);
  };

  const handleAnswerImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const processedFile = await processImage(file);
      if (processedFile) {
        setEditAnswerImage(processedFile);
        setEditAnswerImagePreview(URL.createObjectURL(processedFile));
        setIsAnswerImageDeleted(false);
      }
    }
  };

  const removeAnswerImage = () => {
    setEditAnswerImage(null);
    setEditAnswerImagePreview(null);
    setIsAnswerImageDeleted(true);
  };

  const saveCardEdit = async () => {
    if (!isOwner) return;
    if (!editTerm.trim() || !editDef.trim()) return toast.error("Q and A cannot be empty.");
    setIsSavingCard(true);
    const toastId = toast.loading('Saving card...');
    
    try {
      const fd = new FormData();
      fd.append('Title', set?.title || '');
      fd.append('Description', set?.description || '');
      
      set?.flashcards?.forEach((c, i) => {
        fd.append(`Cards[${i}].Id`, c.id);
        if (c.id === editingCard.id) {
          fd.append(`Cards[${i}].Term`, editTerm);
          fd.append(`Cards[${i}].Definition`, editDef);
          fd.append(`Cards[${i}].IsImageDeleted`, isImageDeleted.toString());
          fd.append(`Cards[${i}].IsAnswerImageDeleted`, isAnswerImageDeleted.toString());
          if (editImage) fd.append(`Cards[${i}].Image`, editImage);
          if (editAnswerImage) fd.append(`Cards[${i}].AnswerImage`, editAnswerImage);
        } else {
          fd.append(`Cards[${i}].Term`, c.questionText);
          fd.append(`Cards[${i}].Definition`, c.answerText);
          fd.append(`Cards[${i}].IsImageDeleted`, "false");
          fd.append(`Cards[${i}].IsAnswerImageDeleted`, "false");
        }
      });

      await axios.put(`${API_URL}/StudySets/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await fetchDetail();
      setEditingCard(null);
      toast.success('Card updated successfully!', { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error("Failed to save card.", { id: toastId });
    } finally {
      setIsSavingCard(false);
    }
  };

  if (!set) return (
    <div className="flex justify-center items-center py-32">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (!set.flashcards || set.flashcards.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4 text-slate-700">No flashcards to study</h2>
        <Link to={`/set/${id}`} className="text-blue-600 hover:text-blue-800 underline">Go back to add cards</Link>
      </div>
    );
  }

  const handleNext = () => {
    if (animating) return;
    setAnimating(true);
    setDirection('right');
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === set!.flashcards.length - 1 ? 0 : prev + 1));
      setAnimating(false);
    }, 300);
  };

  const handlePrev = () => {
    if (animating) return;
    setAnimating(true);
    setDirection('left');
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev === 0 ? set!.flashcards.length - 1 : prev - 1));
      setAnimating(false);
    }, 300);
  };

  const card = set.flashcards[currentIndex];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto flex flex-col items-center pb-12"
    >
      <div className="w-full mb-6 flex justify-between items-center">
        <Link to={`/set/${id}`} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition font-medium text-sm">
          <ChevronLeft size={18} /> Back to set
        </Link>
        <span className="text-slate-400 text-sm font-medium">{set.title}</span>
      </div>

      {/* Card Area */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: direction === 'right' ? 80 : -80, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: direction === 'right' ? -60 : 60, scale: 0.97 }}
          transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
          className="w-full"
        >
          {/* Flashcard flip container - fixed height so nav buttons always visible */}
          <div
            className="w-full h-[350px] md:h-[420px] perspective-1000 cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <motion.div
              className="relative w-full h-full transform-style-preserve-3d"
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Front */}
              <div className="absolute w-full h-full backface-hidden bg-white rounded-3xl shadow-xl shadow-blue-100/80 border border-blue-100/80 p-10 flex flex-col items-center justify-center text-center overflow-hidden">
                {/* Decorative */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 rounded-t-3xl" />
                <div className="absolute -bottom-12 -right-12 w-48 h-48 rounded-full bg-blue-50 opacity-60 pointer-events-none" />
                <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-indigo-50 opacity-60 pointer-events-none" />

                <div className="absolute top-3 left-6 text-xs font-black uppercase tracking-widest text-blue-400 z-20">Question</div>
                
                {isOwner && (
                  <button 
                    onClick={(e) => openCardEditModal(e, card)}
                    className="absolute top-2.5 right-5 p-2 bg-white/50 hover:bg-blue-50 text-slate-300 hover:text-blue-500 rounded-lg transition-colors z-30"
                  >
                    <Edit size={16} />
                  </button>
                )}

                <div className="flex w-full h-[calc(100%-1.5rem)] mt-2 items-center justify-center gap-6 z-10 px-2 sm:px-4">
                  {card.questionImageUrl && card.questionText ? (
                    <>
                      {/* Image Left */}
                      <div className="flex-1 h-full flex flex-col items-center justify-center min-w-0">
                        <img src={card.questionImageUrl} alt="Card" className="max-h-full max-w-full object-contain rounded-xl shadow-lg border border-slate-100 bg-slate-50/50 p-1" />
                      </div>
                      {/* Text Right */}
                      <div className="flex-1 h-full flex items-center justify-start min-w-0">
                        <span className="text-xl md:text-2xl font-bold text-slate-700 break-words max-w-full leading-relaxed text-left whitespace-pre-wrap">
                          {card.questionText}
                        </span>
                      </div>
                    </>
                  ) : card.questionImageUrl ? (
                    /* Image Only Center */
                    <div className="w-full h-full flex items-center justify-center p-1">
                      <img src={card.questionImageUrl} alt="Card" className="max-h-full max-w-full object-contain rounded-xl shadow-2xl border border-slate-100 bg-slate-50/50 p-2" />
                    </div>
                  ) : (
                    /* Text Only Center */
                    <div className="w-full h-full flex items-center justify-center px-4">
                      <span className="text-3xl md:text-4xl font-bold text-slate-700 break-words max-w-full leading-relaxed text-center whitespace-pre-wrap">
                        {card.questionText}
                      </span>
                    </div>
                  )}
                </div>

                <div className="absolute bottom-5 flex items-center gap-1.5 text-slate-300 text-xs">
                  <RotateCcw size={12} /> Click to reveal answer
                </div>
              </div>

              {/* Back */}
              <div className="absolute w-full h-full backface-hidden rotate-y-180 bg-indigo-50 rounded-3xl shadow-xl shadow-indigo-100/60 p-10 flex flex-col items-center justify-center text-center overflow-hidden border border-indigo-100">
                <div className="absolute -bottom-16 -right-16 w-56 h-56 rounded-full bg-white/40 pointer-events-none" />
                <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full bg-white/40 pointer-events-none" />

                <div className="absolute top-3 left-6 text-xs font-black uppercase tracking-widest text-indigo-400 z-20">Answer</div>

                {isOwner && (
                  <button 
                    onClick={(e) => openCardEditModal(e, card)}
                    className="absolute top-2.5 right-5 p-2 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors z-30 border border-slate-100"
                  >
                    <Edit size={16} />
                  </button>
                )}

                <div className="flex w-full h-[calc(100%-1.5rem)] mt-2 items-center justify-center gap-6 z-10 px-2 sm:px-4">
                  {card.answerImageUrl && card.answerText ? (
                    <>
                      {/* Image Left */}
                      <div className="flex-1 h-full flex flex-col items-center justify-center min-w-0">
                        <img src={card.answerImageUrl} alt="Answer" className="max-h-full max-w-full object-contain rounded-xl shadow-lg border border-slate-100 bg-slate-50/50 p-1" />
                      </div>
                      {/* Text Right */}
                      <div className="flex-1 h-full flex items-center justify-start min-w-0">
                        <span className="text-xl md:text-2xl font-bold text-indigo-900 break-words max-w-full leading-relaxed text-left whitespace-pre-wrap">
                          {card.answerText}
                        </span>
                      </div>
                    </>
                  ) : card.answerImageUrl ? (
                    /* Image Only Center */
                    <div className="w-full h-full flex items-center justify-center p-1">
                      <img src={card.answerImageUrl} alt="Answer" className="max-h-full max-w-full object-contain rounded-xl shadow-2xl border border-slate-100 bg-slate-50/50 p-2" />
                    </div>
                  ) : (
                    /* Text Only Center */
                    <div className="w-full h-full flex items-center justify-center px-4">
                      <span className="text-3xl md:text-4xl font-bold text-indigo-900 break-words max-w-full leading-relaxed text-center whitespace-pre-wrap">
                        {card.answerText}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Controls - Counter in the middle */}
      <div className="mt-6 flex items-center gap-5">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          className="w-13 h-13 p-3.5 rounded-2xl bg-white text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 shadow-sm transition-colors"
        >
          <ArrowLeft size={22} />
        </motion.button>

        {/* Counter Badge - centre */}
        <div className="flex flex-col items-center gap-1 min-w-[90px]">
          <span className="text-2xl font-black text-slate-700">
            <span className="text-blue-600">{currentIndex + 1}</span>
            <span className="text-slate-300 mx-1">/</span>
            <span>{set.flashcards.length}</span>
          </span>
          <span className="text-xs text-slate-400 font-medium">Space to flip</span>
        </div>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.93 }}
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          className="w-13 h-13 p-3.5 rounded-2xl bg-white text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 shadow-sm transition-colors"
        >
          <ArrowRight size={22} />
        </motion.button>
      </div>

      {/* Dot indicators */}
      <div className="mt-5 flex gap-1.5 flex-wrap justify-center max-w-[300px]">
        {set.flashcards.map((_, i) => (
          <button
            key={i}
            onClick={() => { setDirection(i > currentIndex ? 'right' : 'left'); setIsFlipped(false); setCurrentIndex(i); }}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'bg-blue-500 w-5' : 'bg-slate-300 w-1.5 hover:bg-slate-400'}`}
          />
        ))}
      </div>

      {/* Edit Card Modal Popup */}
      <AnimatePresence>
        {editingCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setEditingCard(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
                <h3 className="font-bold text-lg text-slate-800">Edit Flashcard</h3>
                <button onClick={() => setEditingCard(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-5 text-left">
                <div>
                  <label className="text-xs font-bold text-blue-500 mb-2 block">Question (Q)</label>
                  <textarea
                    rows={1}
                    value={editTerm}
                    onChange={e => {
                      setEditTerm(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    style={{ minHeight: '50px', maxHeight: '120px' }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 resize-none outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition overflow-y-auto"
                  />
                </div>
                
                <div>
                  <label className="text-xs font-bold text-indigo-500 mb-2 block">Answer (A)</label>
                  <textarea
                    rows={1}
                    value={editDef}
                    onChange={e => {
                      setEditDef(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                    style={{ minHeight: '50px', maxHeight: '120px' }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 resize-none outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition overflow-y-auto"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Question Image */}
                  <div className="flex-1">
                    <label className="text-xs font-bold text-blue-400 mb-2 block">Question Image</label>
                    {!editImagePreview ? (
                      <label className="cursor-pointer flex items-center gap-2 px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl hover:bg-slate-50 hover:border-blue-300 transition group w-full">
                        <ImageIcon className="text-slate-400 group-hover:text-blue-500 w-5 h-5 transition-colors" />
                        <span className="text-sm text-slate-500 font-medium group-hover:text-blue-600 transition-colors">Add Image</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                      </label>
                    ) : (
                      <div className="relative h-24 w-auto rounded-xl overflow-hidden group border border-slate-200 inline-block shadow-sm">
                        <img src={editImagePreview} alt="Preview" className="h-full object-cover" />
                        <button
                          onClick={removeImage}
                          className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Answer Image */}
                  <div className="flex-1">
                    <label className="text-xs font-bold text-indigo-400 mb-2 block">Answer Image</label>
                    {!editAnswerImagePreview ? (
                      <label className="cursor-pointer flex items-center gap-2 px-4 py-3 border-2 border-dashed border-indigo-200 rounded-xl hover:bg-indigo-50 hover:border-indigo-300 transition group w-full">
                        <ImageIcon className="text-slate-400 group-hover:text-indigo-500 w-5 h-5 transition-colors" />
                        <span className="text-sm text-slate-500 font-medium group-hover:text-indigo-600 transition-colors">Add Image</span>
                        <input type="file" className="hidden" accept="image/*" onChange={handleAnswerImageChange} />
                      </label>
                    ) : (
                      <div className="relative h-24 w-auto rounded-xl overflow-hidden group border border-indigo-200 inline-block shadow-sm">
                        <img src={editAnswerImagePreview} alt="Preview" className="h-full object-cover" />
                        <button
                          onClick={removeAnswerImage}
                          className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 text-base">
                <button
                  onClick={() => setEditingCard(null)}
                  className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCardEdit}
                  disabled={isSavingCard}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition shadow-md disabled:bg-blue-300"
                >
                  <Save size={18} /> {isSavingCard ? 'Saving...' : 'Save Card'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
