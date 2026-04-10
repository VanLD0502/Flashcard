import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Trash2, Save, ArrowLeft, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

import { API_URL } from '../config';

interface FlashcardInput {
  id?: string;
  index: number;
  term: string;
  definition: string;
  image: File | null;
  imagePreview: string | null;
  isImageDeleted: boolean;
}

const EditSet: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [originalTitle, setOriginalTitle] = useState('');
  const [originalDesc, setOriginalDesc] = useState('');
  
  // We keep cards in state just to send them back unchanged when updating Title/Desc
  const [cards, setCards] = useState<any[]>([]);
  const [authError, setAuthError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!user && !storedUser) {
      navigate('/login');
      return;
    }
    
    if (user || storedUser) {
      fetchSetData();
    }
  }, [user, id]);

  const fetchSetData = async () => {
    try {
      const res = await axios.get(`${API_URL}/StudySets/${id}`);
      const data = res.data;
      
      // Force wait for user to be loaded from storage if context is slow
      let currentUser = user;
      if (!currentUser) {
        const stored = localStorage.getItem('user');
        if (stored) currentUser = JSON.parse(stored);
      }

      if (!currentUser) {
        // If still no user, we might be truly logged out or still initializing
        // We'll wait a bit more or just let the useEffect handle the /login redirect
        setIsLoading(false);
        return;
      }
      
      // Robust ID check handling all possible cases (camelCase, PascalCase, and specific AuthResponse naming)
      const setOwnerId = data?.userId ?? data?.UserId;
      const currentId = currentUser?.id ?? currentUser?.Id ?? currentUser?.userId ?? currentUser?.UserId;

      if (!setOwnerId || !currentId || setOwnerId.toString() !== currentId.toString()) {
        const errorMsg = 'You do not have permission to edit this set.';
        setAuthError(errorMsg);
        toast.error(errorMsg);
        setIsLoading(false);
        return; 
      }
      
      setTitle(data.title);
      setDescription(data.description || '');
      setOriginalTitle(data.title);
      setOriginalDesc(data.description || '');
      
      if (data.flashcards && data.flashcards.length > 0) {
        setCards(data.flashcards);
      }
    } catch (err) { 
      console.error(err);
      toast.error('Failed to load study set data.');
    }
    finally { setIsLoading(false); }
  };

  const isChanged = title !== originalTitle || description !== originalDesc;

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!title.trim()) { toast.error('Please enter a title.'); return; }

    setIsSubmitting(true);
    const toastId = toast.loading('Saving changes...');
    try {
      const formData = new FormData();
      formData.append('Title', title);
      formData.append('Description', description);
      
      // Send cards back exactly as they are so they aren't deleted
      cards.forEach((card, i) => {
        const cId = card.id || card.Id;
        const cTerm = card.questionText || card.term || card.Term;
        const cDef = card.answerText || card.definition || card.Definition;
        
        if (cId) formData.append(`Cards[${i}].Id`, cId);
        formData.append(`Cards[${i}].Term`, cTerm || '');
        formData.append(`Cards[${i}].Definition`, cDef || '');
        formData.append(`Cards[${i}].IsImageDeleted`, "false");
      });
      
      await axios.put(`${API_URL}/StudySets/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      
      toast.success('Changes saved successfully!', { id: toastId });
      navigate(`/set/${id}`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to save. Please try again.', { id: toastId });
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await axios.delete(`${API_URL}/StudySets/${id}`);
      toast.success('Study set deleted successfully!');
      navigate('/my-sets');
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete. Please try again.');
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );

  if (authError) return (
    <div className="max-w-md mx-auto py-20 text-center">
      <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-2xl mb-6">
        <p className="font-bold text-lg">{authError}</p>
      </div>
      <button onClick={() => navigate('/')} className="text-blue-600 font-bold underline">Go back Home</button>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto px-4 py-6 pb-16">

      {/* Sticky Header */}
      <div className="flex justify-between items-center mb-8 sticky top-[64px] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 backdrop-blur-md z-40 py-4 border-b border-blue-100">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(`/set/${id}`)} className="text-slate-400 hover:text-blue-600 transition p-2 rounded-xl hover:bg-blue-50">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-2xl font-black text-slate-800">Edit <span className="text-blue-600">Study Set</span></h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-300 px-4 py-2.5 rounded-xl font-semibold transition-all text-sm"
          >
            <Trash2 size={16} /> Delete Set
          </button>
          {isChanged && (
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-200 hover:shadow-indigo-300 transition-all"
            >
              <Save size={18} />
              {isSubmitting ? 'Saving…' : 'Save Changes'}
            </motion.button>
          )}
        </div>
      </div>

      {/* Title & Description */}
      <div className="mb-6 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="mb-5">
          <label className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-2 block">Title</label>
          <input
            type="text"
            placeholder="e.g. Biology - Chapter 22: Evolution"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xl font-bold text-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition placeholder-slate-300"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-2 block">Description</label>
          <input
            type="text"
            placeholder="Add a description (optional)"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition placeholder-slate-300"
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>
      </div>

      {/* Delete Confirm Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowDeleteConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-red-50 mx-auto mb-5">
                <AlertTriangle size={28} className="text-red-500" />
              </div>
              <h3 className="text-xl font-black text-slate-800 text-center mb-2">Delete this set?</h3>
              <p className="text-slate-500 text-center text-sm mb-7">
                This will permanently remove <span className="font-bold text-slate-700">"{title}"</span> and all its flashcards. This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold transition disabled:opacity-60"
                >
                  {isDeleting ? 'Deleting…' : 'Delete Set'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EditSet;
