import React, { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import { Link } from 'react-router-dom';
import { History, Search, FileText, CheckCircle, Clock } from 'lucide-react';

const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const StudentHistory = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get('/attempts/my-history', auth());
        setAttempts(data.attempts || []);
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const filteredAttempts = attempts.filter(attempt => 
    attempt.testId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <History className="text-indigo-600" /> Exam History
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Review your past test attempts and analysis.</p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search exams..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div></div>
      ) : filteredAttempts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="text-slate-400" size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">No history found</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            You haven't attempted any tests yet, or none match your search criteria.
          </p>
          <Link to="/student/exams" className="mt-6 inline-block px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors">
            Browse Exams
          </Link>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Test Name</th>
                  <th className="px-6 py-4">Date Taken</th>
                  <th className="px-6 py-4">Score</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredAttempts.map((attempt) => (
                  <tr key={attempt._id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 dark:text-white">
                        {attempt.testId?.name || 'Unknown Test'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                        <Clock size={12}/> {attempt.testId?.duration || 0} mins • {attempt.testId?.totalMarks || 0} marks
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                      {new Date(attempt.startTime).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 dark:text-white">
                        {attempt.score} <span className="text-slate-400 text-xs font-normal">/ {attempt.testId?.totalMarks || 0}</span>
                      </div>
                      <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mt-1">
                        {attempt.percentage?.toFixed(1) || 0}%
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        attempt.status === 'completed' 
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {attempt.status === 'completed' ? <CheckCircle size={12}/> : <Clock size={12}/>}
                        {attempt.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {attempt.status === 'completed' ? (
                        <Link 
                          to={`/student/results/${attempt._id}`}
                          className="inline-flex items-center px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 font-semibold rounded-lg text-sm transition-colors"
                        >
                          View Analysis
                        </Link>
                      ) : (
                        <span className="text-slate-400 text-sm italic">Incomplete</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentHistory;
