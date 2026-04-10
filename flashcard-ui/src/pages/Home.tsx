import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Book, ChevronLeft, ChevronRight, Layers, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

import { API_URL } from '../config';

export default function Home() {
  const [sets, setSets] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSets(page);
  }, [page]);

  const fetchSets = async (currentPage: number) => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${API_URL}/StudySets?page=${currentPage}&pageSize=9`);
      setSets(res.data.items);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as any, stiffness: 260, damping: 22 } }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pb-10">
      {/* Hero */}
      <div className="mb-10 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={18} className="text-indigo-500" />
            <span className="text-sm font-semibold text-indigo-500 uppercase tracking-wider">Community Sets</span>
          </div>
          <h1 className="text-4xl font-black text-slate-800">Discover <span className="text-blue-600">Study Sets</span></h1>
          <p className="text-slate-500 mt-2 text-base">Browse flashcard sets created by the community</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {sets.map((set) => (
              <motion.div key={set.id} variants={itemVariants}>
                <Link to={`/set/${set.id}`} className="block h-full">
                  <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm hover:shadow-lg hover:shadow-blue-100 hover:-translate-y-1 hover:border-blue-200 transition-all duration-300 group cursor-pointer h-full flex flex-col relative overflow-hidden">

                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500 rounded-t-2xl" />

                    <div className="flex items-center gap-3 text-blue-500 mb-4 bg-blue-50 w-fit p-3 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
                      <Layers size={22} />
                    </div>

                    <h2 className="text-lg font-bold text-slate-700 group-hover:text-blue-600 transition-colors mb-1 line-clamp-1">{set.title}</h2>
                    <p className="text-slate-400 mt-1 line-clamp-2 flex-grow text-sm leading-relaxed">{set.description}</p>

                    <div className="mt-5 pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 text-white flex justify-center items-center font-bold text-xs shadow-sm">
                          {set.username?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <span className="font-medium text-slate-500">{set.username}</span>
                      </div>
                      <span className="text-slate-400 text-xs">{new Date(set.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}

            {sets.length === 0 && (
              <div className="col-span-full py-20 text-center text-slate-400 bg-white border border-dashed border-slate-200 rounded-2xl">
                <Book className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                <p className="text-xl font-medium text-slate-500">No study sets yet</p>
                <p className="text-sm mt-1">Be the first to create one!</p>
              </div>
            )}
          </motion.div>

          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex justify-center mt-12 items-center gap-3"
            >
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="font-semibold text-slate-600 px-2">
                <span className="text-blue-600">{page}</span> / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}
