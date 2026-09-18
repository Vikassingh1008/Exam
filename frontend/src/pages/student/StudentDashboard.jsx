import React, { useState, useEffect } from 'react';
import { BookOpen, CalendarDays, Clock3, FileText, Play, ShieldCheck, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosInstance';

const StudentDashboard = () => {
  const [tests, setTests] = useState([]);
  const [exams, setExams] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTest, setSelectedTest] = useState(null);

  const filteredTests = tests.filter(test =>
    test.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [testsRes, examsRes, categoriesRes] = await Promise.all([
          api.get('/tests'),
          api.get('/exams'),
          api.get('/categories')
        ]);
        setTests(testsRes.data.tests || []);
        setExams(examsRes.data.exams || []);
        setCategories(categoriesRes.data.categories || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const testsByCategory = {};
  filteredTests.forEach(test => {
    const exam = exams.find(e => e.name === test.examName);
    const category = categories.find(c => c._id === exam?.category);
    const categoryName = category ? category.name : 'Other Exams';

    if (!testsByCategory[categoryName]) {
      testsByCategory[categoryName] = [];
    }
    testsByCategory[categoryName].push(test);
  });

  const categoriesToRender = Object.entries(testsByCategory).filter(([categoryName]) =>
    selectedCategory === 'All' || categoryName === selectedCategory
  );

  return (
    <div className="space-y-7 pb-8">


      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Practice library</p><h3 className="mt-1 text-2xl font-bold text-slate-900">Available Tests</h3><p className="mt-1 text-sm text-slate-500"></p></div><span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">{filteredTests.length} live papers</span></div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full sm:max-w-xs rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white text-slate-700 font-medium"
          >
            <option value="All">All Categories</option>
            {categories.map(c => (
              <option key={c._id} value={c.name}>{c.name}</option>
            ))}
            <option value="Other Exams">Other Exams</option>
          </select>

          <input
            type="text"
            placeholder="Search by test title..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full sm:max-w-md rounded-xl border border-slate-200 px-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {loading ? (
          <div className="py-10 text-center text-slate-500">Loading tests...</div>
        ) : categoriesToRender.length === 0 ? (
          <div className="py-10 text-center text-slate-500">No test papers found for the selected category or search.</div>
        ) : (
          <div className="space-y-8">
            {categoriesToRender.map(([categoryName, categoryTests]) => (
              <div key={categoryName}>
                <h4 className="text-lg font-bold text-slate-800 mb-3 pb-2 border-b border-slate-100">{categoryName}</h4>
                <div className="divide-y divide-slate-100">
                  {categoryTests.map((paper, idx) => {
                    const tones = ['bg-blue-50 text-blue-700', 'bg-violet-50 text-violet-700', 'bg-emerald-50 text-emerald-700'];
                    const tone = tones[idx % tones.length];
                    return (
                      <article key={paper._id} className="flex flex-col gap-4 py-4 first:pt-0 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-4"><div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}><BookOpen size={19} /></div><div><h4 className="font-bold text-slate-800">{paper.name}</h4><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-500"><span className="inline-flex items-center gap-1"><CalendarDays size={13} /> {new Date(paper.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span><span className="inline-flex items-center gap-1"><FileText size={13} /> {paper.totalMarks || 100} Marks</span><span className="inline-flex items-center gap-1"><Clock3 size={13} /> {paper.duration} min</span></div></div></div><button onClick={() => setSelectedTest(paper)} className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-600">Start test</button></article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {selectedTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Ready to begin?</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              You are about to start the test: <strong className="text-slate-800">{selectedTest.name}</strong>.
              Once you begin, the timer of <strong>{selectedTest.duration} minutes</strong> will start immediately. Please ensure you have a stable internet connection.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setSelectedTest(null)} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
              <Link to={`/student/exam/${selectedTest._id}`} className="px-4 py-2 rounded-xl bg-blue-600 text-sm font-bold text-white hover:bg-blue-700 transition-colors">OK, Start</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
