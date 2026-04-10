import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import type { StudySet } from '../types';
import { Play, ClipboardList, Edit, ArrowLeft, X, Image as ImageIcon, Save, Trash2, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

import { API_URL } from '../config';

export default function StudySetDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [set, setSet] = useState<StudySet | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [editingCard, setEditingCard] = useState<any>(null);
  const [editTerm, setEditTerm] = useState('');
  const [editDef, setEditDef] = useState('');
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [isImageDeleted, setIsImageDeleted] = useState(false);
  const [editAnswerImage, setEditAnswerImage] = useState<File | null>(null);
  const [editAnswerImagePreview, setEditAnswerImagePreview] = useState<string | null>(null);
  const [isAnswerImageDeleted, setIsAnswerImageDeleted] = useState(false);

  const [authError, setAuthError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
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
    const h = JSON.parse(localStorage.getItem(`quizHistory_${id}`) || '[]');
    setHistory(h);
  }, [id]);

  const fetchDetail = async () => {
    try {
      const res = await axios.get(`${API_URL}/StudySets/${id}`);
      setSet(res.data);
    } catch (err) { 
      console.error("fetchSetData error:", err); 
      setAuthError('Failed to load study set data. It might not exist or you might be offline.');
    }
    finally { setIsLoading(false); }
  };

  if (authError) return (
    <div className="max-w-md mx-auto py-20 text-center">
      <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-2xl mb-6">
        <p className="font-bold text-lg">{authError}</p>
      </div>
      <button onClick={() => navigate('/')} className="text-blue-600 font-bold underline">Go back Home</button>
    </div>
  );

  if (isLoading) return (
    <div className="flex justify-center items-center py-32">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  const openAddCardModal = () => {
    if (!isOwner) return;
    setEditingCard({ isNew: true });
    setEditTerm('');
    setEditDef('');
    setEditImage(null);
    setEditImagePreview(null);
    setIsImageDeleted(false);
    setEditAnswerImage(null);
    setEditAnswerImagePreview(null);
    setIsAnswerImageDeleted(false);
  };

  const openCardEditModal = (card: any) => {
    if (!isOwner) {
      setAuthError('You do not have permission to edit this set.');
      return;
    }
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
          // Check min dimensions
          if (img.width < 100 || img.height < 100) {
            toast.error("Image must be at least 100x100 pixels.");
            resolve(null);
            return;
          }

          // Calculate new dimensions (Target ~500x250 while maintaining aspect ratio)
          const maxWidth = 500;
          const maxHeight = 250;
          let width = img.width;
          let height = img.height;

          // Resize logic
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
    if (!user || !set) return;
    
    // Check ownership
    const currentUserId = (user.id || user.UserId || user.userId)?.toString();
    const setOwnerId = (set.userId || set.UserId)?.toString();
    
    if (currentUserId !== setOwnerId) {
      toast.error('You do not have permission to edit this set.');
      return;
    }
    if (!editTerm.trim() || !editDef.trim()) return toast.error("Q and A cannot be empty.");
    setIsSavingCard(true);
    const toastId = toast.loading('Saving card...');
    
    try {
      const fd = new FormData();
      fd.append('Title', set?.title || '');
      fd.append('Description', set?.description || '');
      
      if (editingCard.isNew) {
        set?.flashcards?.forEach((c, i) => {
          fd.append(`Cards[${i}].Id`, c.id);
          fd.append(`Cards[${i}].Term`, c.questionText);
          fd.append(`Cards[${i}].Definition`, c.answerText);
          fd.append(`Cards[${i}].IsImageDeleted`, "false");
          fd.append(`Cards[${i}].IsAnswerImageDeleted`, "false");
        });
        const nextIdx = set.flashcards?.length || 0;
        fd.append(`Cards[${nextIdx}].Term`, editTerm);
        fd.append(`Cards[${nextIdx}].Definition`, editDef);
        fd.append(`Cards[${nextIdx}].IsImageDeleted`, "false");
        fd.append(`Cards[${nextIdx}].IsAnswerImageDeleted`, "false");
        if (editImage) fd.append(`Cards[${nextIdx}].Image`, editImage);
        if (editAnswerImage) fd.append(`Cards[${nextIdx}].AnswerImage`, editAnswerImage);
      } else {
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
      }

      await axios.put(`${API_URL}/StudySets/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      await fetchDetail();
      setEditingCard(null);
      toast.success(editingCard.isNew ? 'Card added successfully!' : 'Card updated successfully!', { id: toastId });
    } catch (e) {
      console.error(e);
      toast.error("Failed to save card.", { id: toastId });
    } finally {
      setIsSavingCard(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto pb-12">

      {/* Back + header */}
      <div className="mb-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-slate-400 hover:text-blue-600 font-medium text-sm mb-5 transition-colors">
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-4xl font-black text-slate-800 mb-2 leading-tight">{set?.title}</h1>
            <p className="text-lg text-slate-500">{set?.description}</p>
            <p className="text-sm text-slate-400 mt-2">{set?.flashcards?.length || 0} terms</p>
          </div>
          {isOwner && (
            <Link
              to={`/set/${id}/edit`}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-all"
            >
              <Edit size={16} /> Edit Title
            </Link>
          )}
        </div>
      </div>

      {/* Action Buttons + History */}
      <div className="flex flex-col md:flex-row gap-4 mb-10">
        <div className="flex flex-1 gap-4">
          <Link
            to={`/set/${id}/study`}
            className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-blue-100/60 hover:-translate-y-1 hover:border-blue-200 p-6 flex flex-col items-center justify-center gap-3 transition-all group"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white flex items-center justify-center transition-all duration-300 group-hover:scale-110">
              <Play size={28} fill="currentColor" />
            </div>
            <span className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors">Flashcards</span>
            <span className="text-xs text-slate-400">Click & flip</span>
          </Link>

          <Link
            to={`/set/${id}/quiz`}
            className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-indigo-100/60 hover:-translate-y-1 hover:border-indigo-200 p-6 flex flex-col items-center justify-center gap-3 transition-all group"
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white flex items-center justify-center transition-all duration-300 group-hover:scale-110">
              <ClipboardList size={28} />
            </div>
            <span className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">Practice Quiz</span>
            <span className="text-xs text-slate-400">Test yourself</span>
          </Link>
        </div>

        {/* Latest quiz history */}
        {history.length > 0 && (
          <div className="w-full md:w-56 bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col items-center justify-center">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">Last Quiz</p>
            <div className="relative w-24 h-24 flex items-center justify-center rounded-full border-8 border-slate-100 mb-3">
              <div
                className="absolute inset-0 rounded-full border-8 border-blue-500"
                style={{ clipPath: `polygon(0 0, 100% 0, 100% ${history[0].percentage}%, 0 ${history[0].percentage}%)` }}
              />
              <span className="text-2xl font-black text-slate-800">{history[0].percentage}%</span>
            </div>
            <p className="text-sm font-semibold text-slate-600">{history[0].score}/{history[0].total} correct</p>
            <p className="text-xs text-slate-400 mt-1">{new Date(history[0].date).toLocaleDateString()}</p>
          </div>
        )}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-xl font-bold text-slate-700">Terms in this set</h2>
        <span className="text-sm font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{set?.flashcards?.length || 0}</span>
        <div className="flex-1 h-px bg-slate-100" />
      </div>

      <div className="space-y-3">
        {set?.flashcards?.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04 }}
            className="bg-white rounded-2xl border border-slate-100 hover:border-blue-100 hover:shadow-md transition-all flex flex-col md:flex-row overflow-hidden relative group"
          >
            {/* Question */}
              <div className="flex-1 p-5 md:p-6 border-b md:border-b-0 md:border-r border-slate-100 flex gap-4">
                <div className="flex-shrink-0 flex flex-col items-center pt-1">
                  <span className="text-xl font-black text-blue-400 leading-none">Q</span>
                  <div className="w-px h-full bg-blue-100 mt-2" />
                </div>
                <div className="flex-1 pt-0.5 flex flex-col items-start">
                  {card.questionText && (
                    <span className="text-base text-slate-700 font-medium leading-snug break-words whitespace-pre-wrap">{card.questionText}</span>
                  )}
                  {card.questionImageUrl && (
                    <div className="mt-3 bg-slate-50 rounded-xl p-2 border border-slate-100 shadow-sm self-start max-w-full">
                      <img src={card.questionImageUrl} alt="Card" className="max-h-96 max-w-full object-contain rounded-lg shadow-inner" />
                    </div>
                  )}
                </div>
              </div>

              {/* Answer */}
              <div className={`flex-1 p-5 md:p-6 flex gap-4 bg-slate-50/60 ${isOwner ? 'pr-14' : ''}`}>
                <div className="flex-shrink-0 flex flex-col items-center pt-1">
                  <span className="text-xl font-black text-indigo-400 leading-none">A</span>
                  <div className="w-px h-full bg-indigo-100 mt-2" />
                </div>
                <div className="flex-1 pt-0.5 flex flex-col items-start">
                  {card.answerText && (
                    <span className="text-base text-indigo-700 font-semibold leading-snug break-words whitespace-pre-wrap">{card.answerText}</span>
                  )}
                  {card.answerImageUrl && (
                    <div className="mt-3 bg-indigo-50 rounded-xl p-2 border border-indigo-100 shadow-sm self-start max-w-full">
                      <img src={card.answerImageUrl} alt="Answer" className="max-h-96 max-w-full object-contain rounded-lg shadow-inner" />
                    </div>
                  )}
                </div>
              </div>
            
            {/* Edit Button */}
            {isOwner && (
              <button 
                onClick={() => openCardEditModal(card)}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 shadow-sm"
              >
                <Edit size={16} />
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {/* Add Flashcard Button at the bottom */}
      {isOwner && (
        <div className="mt-6">
          <button 
            onClick={openAddCardModal}
            className="w-full py-4 border-2 border-dashed border-blue-200 rounded-2xl flex items-center justify-center gap-2 text-blue-500 font-bold hover:bg-blue-50 hover:border-blue-400 transition-all"
          >
            <Plus size={20} /> Add Flashcard
          </button>
        </div>
      )}

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
                <h3 className="font-bold text-lg text-slate-800">{editingCard.isNew ? 'Add Flashcard' : 'Edit Flashcard'}</h3>
                <button onClick={() => setEditingCard(null)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition">
                  <X size={20} />
                </button>
              </div>
              
              <div className="p-6 space-y-5">
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

              <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
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
