import React, { useState, useEffect } from 'react';
import { BookOpen, CalendarDays, Clock3, FileText, ShieldCheck, Landmark, Monitor, Briefcase, GraduationCap, ChevronRight, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axiosInstance';

const getCategoryIcon = (name) => {
  const n = name.toLowerCase();
  if (n.includes('police') || n.includes('defense')) return <ShieldCheck size={24} />;
  if (n.includes('bank') || n.includes('finance')) return <Landmark size={24} />;
  if (n.includes('tech') || n.includes('computer')) return <Monitor size={24} />;
  if (n.includes('ssc') || n.includes('railway')) return <Briefcase size={24} />;
  return <GraduationCap size={24} />;
};

const StudentDashboard = () => {
  const [tests, setTests] = useState([]);
  const [exams, setExams] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedExam, setSelectedExam] = useState('All');
  const [selectedTest, setSelectedTest] = useState(null);

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

  const filteredTests = tests.filter(test => {
    const matchesSearch = test.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    const exam = exams.find(e => e.name === test.examName);
    const category = categories.find(c => c._id === exam?.category);
    const categoryName = category ? category.name : 'Other Exams';

    if (selectedCategory !== 'All' && categoryName !== selectedCategory) return false;
    if (selectedExam !== 'All' && test.examName !== selectedExam) return false;

    return true;
  });

  const availableExams = selectedCategory === 'All' 
    ? [] 
    : exams.filter(e => {
        const cat = categories.find(c => c._id === e.category);
        return cat && cat.name === selectedCategory;
      });

  const testsByGroup = {};
  filteredTests.forEach(test => {
    let groupName = 'Other';
    if (selectedCategory === 'All') {
      const exam = exams.find(e => e.name === test.examName);
      const category = categories.find(c => c._id === exam?.category);
      groupName = category ? category.name : 'Other Exams';
    } else {
      groupName = test.examName || 'Other Tests';
    }

    if (!testsByGroup[groupName]) {
      testsByGroup[groupName] = [];
    }
    testsByGroup[groupName].push(test);
  });

  const groupsToRender = Object.entries(testsByGroup);

  return (
    <div className="space-y-8 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Sleek Search Header */}
      <div className="relative mb-10">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
          <Search className="h-6 w-6 text-indigo-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-14 pr-6 py-4 border-0 rounded-full bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-slate-900 placeholder-slate-400 focus:ring-4 focus:ring-indigo-500/20 transition-all text-lg font-medium outline-none"
          placeholder="Search for mock tests, previous year papers, or exams..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-2">
           <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">⌘K</span>
        </div>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* Visual Browse Categories */}
          <section className="mb-10">
            <div className="flex items-center justify-between mb-6 px-1">
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">Explore Categories</h3>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar snap-x snap-mandatory px-1">
              <button
                onClick={() => { setSelectedCategory('All'); setSelectedExam('All'); }}
                className={`snap-start flex-shrink-0 flex items-center gap-3 px-6 py-4 rounded-2xl transition-all duration-300 border ${
                  selectedCategory === 'All' 
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-transparent shadow-[0_8px_20px_rgba(79,70,229,0.3)] transform -translate-y-1' 
                    : 'bg-white text-slate-700 border-slate-100 hover:border-indigo-200 hover:shadow-md'
                }`}
              >
                <div className={`p-2.5 rounded-xl ${selectedCategory === 'All' ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600'}`}>
                   <BookOpen size={22} />
                </div>
                <div className="text-left">
                  <span className="block font-bold text-sm">All Tests</span>
                  <span className={`text-[11px] font-medium ${selectedCategory === 'All' ? 'text-indigo-100' : 'text-slate-400'}`}>Explore everything</span>
                </div>
              </button>
              
              {categories.map(c => (
                <button
                  key={c._id}
                  onClick={() => { setSelectedCategory(c.name); setSelectedExam('All'); }}
                  className={`snap-start flex-shrink-0 flex items-center gap-3 px-6 py-4 rounded-2xl transition-all duration-300 border ${
                    selectedCategory === c.name 
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-transparent shadow-[0_8px_20px_rgba(79,70,229,0.3)] transform -translate-y-1' 
                      : 'bg-white text-slate-700 border-slate-100 hover:border-indigo-200 hover:shadow-md'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl ${selectedCategory === c.name ? 'bg-white/20' : 'bg-indigo-50 text-indigo-600'}`}>
                     {React.cloneElement(getCategoryIcon(c.name), { size: 22 })}
                  </div>
                  <div className="text-left">
                    <span className="block font-bold text-sm whitespace-nowrap">{c.name}</span>
                    <span className={`text-[11px] font-medium ${selectedCategory === c.name ? 'text-indigo-100' : 'text-slate-400'}`}>Exams</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Subcategory Pills (Exams) */}
          {selectedCategory !== 'All' && availableExams.length > 0 && (
            <section className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => setSelectedExam('All')}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm ${selectedExam === 'All' ? 'bg-slate-900 text-white shadow-slate-900/20' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}
                >
                  All {selectedCategory} Exams
                </button>
                {availableExams.map(e => (
                  <button 
                    key={e._id}
                    onClick={() => setSelectedExam(e.name)}
                    className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm ${selectedExam === e.name ? 'bg-slate-900 text-white shadow-slate-900/20' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}
                  >
                    {e.name}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Test Cards Grid */}
          {groupsToRender.length === 0 ? (
            <div className="py-20 text-center">
               <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="text-slate-400" size={32} />
               </div>
               <h3 className="text-xl font-bold text-slate-800 mb-2">No tests found</h3>
               <p className="text-slate-500">Try adjusting your category or search filters.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {groupsToRender.map(([groupName, groupTests]) => (
                <div key={groupName} className="animate-in fade-in duration-500">
                  <div className="flex items-center justify-between mb-6">
                     <h4 className="text-2xl font-extrabold text-slate-900">{groupName}</h4>
                     <span className="text-sm font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{groupTests.length} tests</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {groupTests.map((paper) => (
                      <article 
                        key={paper._id} 
                        onClick={() => setSelectedTest(paper)}
                        className="group flex flex-col bg-white border border-slate-100 rounded-[1.75rem] overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-100 hover:-translate-y-1 transition-all duration-500 cursor-pointer relative" 
                      >
                        {/* Thumbnail area */}
                        <div className="relative aspect-[16/9] w-full bg-slate-100 overflow-hidden">
                          {paper.thumbnail ? (
                            <img src={paper.thumbnail} alt={paper.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-700 ease-out">
                              <span className="text-white font-black text-2xl opacity-30 tracking-widest uppercase rotate-[-10deg] drop-shadow-md">{paper.examName || 'TEST'}</span>
                            </div>
                          )}
                          <div className="absolute top-4 left-4 flex gap-2">
                            {paper.isFree !== false ? (
                               <span className="bg-emerald-500 text-white text-[10px] sm:text-xs font-black tracking-wider px-3 py-1.5 rounded-lg shadow-md uppercase">FREE</span>
                            ) : (
                               <span className="bg-amber-500 text-white text-[10px] sm:text-xs font-black tracking-wider px-3 py-1.5 rounded-lg shadow-md uppercase">PREMIUM</span>
                            )}
                            {paper.testType && (
                               <span className="bg-black/40 backdrop-blur-md text-white text-[10px] sm:text-xs font-bold tracking-wider px-3 py-1.5 rounded-lg shadow-md uppercase">{paper.testType}</span>
                            )}
                          </div>
                          
                          {/* Hover Play Button Overlay */}
                          <div className="absolute inset-0 bg-indigo-900/0 group-hover:bg-indigo-900/20 transition-colors duration-500 flex items-center justify-center z-10">
                            <div className="w-14 h-14 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 shadow-xl transform translate-y-4 group-hover:translate-y-0">
                               <ChevronRight className="text-indigo-600 ml-1" size={28} strokeWidth={3} />
                            </div>
                          </div>
                        </div>

                        <div className="p-6 flex flex-col flex-grow bg-gradient-to-b from-white to-slate-50/50 relative z-20">
                          <h3 className="font-extrabold text-[1.15rem] text-slate-800 leading-snug mb-6 line-clamp-2 group-hover:text-indigo-600 transition-colors">{paper.name}</h3>
                          
                          <div className="mt-auto flex flex-wrap sm:flex-nowrap gap-3">
                            <div className="flex-1 flex items-center justify-center gap-2 text-[13px] sm:text-sm font-bold text-slate-600 bg-white border border-slate-200/80 py-2.5 px-3 rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] group-hover:bg-indigo-50/50 group-hover:border-indigo-100 group-hover:text-indigo-700 transition-all">
                               <FileText size={18} className="text-indigo-500"/> 
                               <span>{paper.questions?.length || 0} Qs</span>
                            </div>
                            <div className="flex-1 flex items-center justify-center gap-2 text-[13px] sm:text-sm font-bold text-slate-600 bg-white border border-slate-200/80 py-2.5 px-3 rounded-xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] group-hover:bg-amber-50/50 group-hover:border-amber-100 group-hover:text-amber-700 transition-all">
                               <Clock3 size={18} className="text-amber-500"/> 
                               <span>{paper.duration} Min</span>
                            </div>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {selectedTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-8">
               <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <BookOpen size={32} />
               </div>
               <h3 className="text-2xl font-black text-slate-900 mb-3 leading-tight">{selectedTest.name}</h3>
               <p className="text-slate-600 leading-relaxed mb-8">
                  You are about to start this test. The timer of <strong className="text-slate-900">{selectedTest.duration} minutes</strong> will begin immediately. Good luck!
               </p>
               <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={() => setSelectedTest(null)} className="flex-1 px-4 py-3 rounded-2xl text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors text-center">Cancel</button>
                  <Link to={`/student/exam/${selectedTest._id}`} className="flex-1 px-4 py-3 rounded-2xl bg-blue-600 text-sm font-bold text-white hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 transition-all text-center">Start Attempt</Link>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
