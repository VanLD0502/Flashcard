import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Book, Edit, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { API_URL } from '../config';

export default function MySets() {
  const [sets, setSets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchMySets();
  }, [user, navigate]);

  const fetchMySets = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/StudySets/my-sets`);
      setSets(res.data);
    } catch (err) { 
      console.error(err); 
      toast.error('Failed to load study sets.');
    }
    finally { setIsLoading(false); }
  };

  const deleteSet = async (setId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this study set? This action cannot be undone.")) return;
    
    const toastId = toast.loading('Deleting...');
    try {
      await axios.delete(`${API_URL}/StudySets/${setId}`);
      setSets(sets.filter(s => s.id !== setId));
      toast.success('Study set deleted successfully.', { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete study set.', { id: toastId });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 22 } }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800">My <span className="text-blue-600">Study Sets</span></h1>
          <p className="text-slate-500 mt-1">Sets you've created</p>
        </div>
        <Link
          to="/create"
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-200 hover:shadow-indigo-300 transition-shadow"
        >
          <Plus size={16} /> Create New
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-3">
          {sets.length === 0 ? (
            <div className="text-center py-20 bg-white border border-dashed border-slate-200 rounded-2xl">
              <Book className="mx-auto h-12 w-12 text-slate-300 mb-4" />
              <p className="text-xl font-semibold text-slate-500 mb-2">No sets yet</p>
              <Link to="/create" className="text-blue-600 font-bold hover:text-blue-700">Create one now →</Link>
            </div>
          ) : (
            sets.map(set => (
              <motion.div
                key={set.id}
                variants={itemVariants}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-blue-50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white p-3 rounded-xl transition-all duration-300">
                    <Book size={22} />
                  </div>
                  <div>
                    <Link to={`/set/${set.id}`} className="text-lg font-bold text-slate-700 hover:text-blue-600 transition-colors line-clamp-1">
                      {set.title}
                    </Link>
                    <p className="text-slate-400 text-sm mt-0.5">
                      {set.cardCount} Terms · {new Date(set.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto shrink-0">
                  <button
                    onClick={(e) => deleteSet(set.id, e)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-500 hover:text-red-600 border border-red-100 hover:border-red-200 px-3 py-2 rounded-xl font-semibold transition-all text-sm"
                    title="Delete Set"
                  >
                    <Trash2 size={15} />
                  </button>
                  <Link
                    to={`/set/${set.id}`}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-slate-50 hover:bg-blue-50 text-slate-500 hover:text-blue-600 border border-slate-200 hover:border-blue-200 px-4 py-2 rounded-xl font-semibold transition-all text-sm"
                  >
                    <Edit size={15} /> Edit
                  </Link>
                  <Link
                    to={`/set/${set.id}`}
                    className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-semibold transition-all text-sm shadow-sm"
                  >
                    Study <ArrowRight size={15} />
                  </Link>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
