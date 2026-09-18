import React, { useState, useEffect } from 'react';
import { BookOpen, CalendarDays, Clock3, FileText, ShieldCheck, Landmark, Monitor, Briefcase, GraduationCap, ChevronRight, Search, Trophy, ListChecks, Globe, Check, X, CircleHelp } from 'lucide-react';
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
  const [termsAccepted, setTermsAccepted] = useState(false);

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
                        className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-[0_2px_10px_rgb(0,0,0,0.03)] hover:shadow-lg transition-all duration-300 flex flex-col" 
                      >
                        <div className="p-5 flex flex-col h-full">
                          {/* Badges */}
                          <div className="flex items-center gap-2 mb-4">
                            {paper.hasAttempted ? (
                              <span className="flex items-center gap-1.5 px-2 py-1 text-[10px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md tracking-wider uppercase">
                                <Check size={14}/> ATTEMPTED
                              </span>
                            ) : (
                              <>
                                <span className="flex items-center gap-1.5 px-2 py-1 text-[10px] sm:text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-md tracking-wider uppercase">
                                  <div className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></div> LIVE
                                </span>
                                {paper.isFree !== false && (
                                  <span className="px-2 py-1 text-[10px] sm:text-xs font-bold text-white bg-emerald-500 rounded-md tracking-wider uppercase shadow-sm">
                                    FREE
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                          
                          {/* Logo and Title */}
                          <div className="flex gap-4 items-start mb-5">
                            <img src="/examsetu-logo.jpg" alt="ExamSetu" className="w-14 h-14 rounded-lg object-cover shadow-sm border border-gray-100 shrink-0 bg-white" />
                            <h3 className="font-extrabold text-gray-900 text-lg leading-snug line-clamp-2">{paper.name}</h3>
                          </div>
                          
                          {/* Meta Data */}
                          <div className="flex items-center flex-wrap gap-4 text-xs font-semibold text-gray-400 mb-6 mt-auto">
                            <span className="flex items-center gap-1"><CircleHelp size={14}/> {paper.questions?.length || 0} Qs</span>
                            <span className="flex items-center gap-1"><Clock3 size={14}/> {paper.duration} Minutes</span>
                            <span className="text-gray-500">{paper.marks || (paper.questions?.length || 0)} Marks</span>
                          </div>
                          
                          {/* Actions */}
                          {paper.hasAttempted ? (
                            <div className="flex gap-3 mt-auto">
                              <Link to={`/student/results/${paper.attemptId}`} className="flex-1 px-4 py-2.5 text-sm font-bold text-blue-600 bg-white border-2 border-blue-600 rounded-lg hover:bg-blue-50 text-center transition-colors">Results</Link>
                              <button onClick={() => { setSelectedTest(paper); setTermsAccepted(false); }} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">Reattempt <ChevronRight size={16}/></button>
                            </div>
                          ) : (
                            <button onClick={() => { setSelectedTest(paper); setTermsAccepted(false); }} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm mt-auto">Attempt <ChevronRight size={16}/></button>
                          )}
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 sm:p-6 overflow-y-auto">
          <div className="w-full max-w-5xl bg-gray-50 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto">
            
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800">{selectedTest.name}</h3>
              <button onClick={() => setSelectedTest(null)} className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Stat Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                    <Clock3 size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 mb-1">Duration</p>
                    <p className="text-lg font-bold text-gray-800">{selectedTest.duration} minutes</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                    <ListChecks size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 mb-1">Total Questions</p>
                    <p className="text-lg font-bold text-gray-800">{selectedTest.questions?.length || 0}</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
                    <Trophy size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 mb-1">Maximum Marks</p>
                    <p className="text-lg font-bold text-gray-800">
                      {selectedTest.questions?.reduce((acc, q) => acc + (q.marks || 1), 0) || 0}
                    </p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-500 flex items-center justify-center shrink-0">
                    <Globe size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 mb-1">Language</p>
                    <p className="text-lg font-bold text-gray-800">hi / en</p>
                  </div>
                </div>
              </div>

              {/* Terms and Conditions Box */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 h-48 overflow-y-auto">
                <h4 className="font-bold text-gray-800 mb-4">Terms & Conditions</h4>
                <div className="text-sm text-gray-600 space-y-3">
                  <p>1. The timer will start immediately upon clicking "Agree and Continue".</p>
                  <p>2. Do not refresh the page or navigate away during the test, as this may submit your test prematurely.</p>
                  <p>3. Ensure you have a stable internet connection.</p>
                  <p>4. Use of any unfair means is strictly prohibited.</p>
                  <p>5. Each correct answer awards the designated marks. Negative marking applies as per the question settings.</p>
                </div>
              </div>

              {/* Acceptance Checkbox */}
              <div className="flex items-start gap-3 px-1">
                <button 
                  onClick={() => setTermsAccepted(!termsAccepted)}
                  className={`mt-1 w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-colors ${termsAccepted ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 bg-white'}`}
                >
                  {termsAccepted && <Check size={14} strokeWidth={3} />}
                </button>
                <p className="text-sm text-gray-600 cursor-pointer" onClick={() => setTermsAccepted(!termsAccepted)}>
                  I have read and agree to the <strong className="text-gray-800">Terms & Conditions</strong> of this test. I confirm that I will not use any unfair means during the test.
                </p>
              </div>

              {/* Start Button */}
              <div className="pt-4">
                <Link 
                  to={termsAccepted ? `/student/exam/${selectedTest._id}` : '#'}
                  className={`block w-full py-4 rounded-xl text-center font-bold text-lg transition-all ${termsAccepted ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg' : 'bg-blue-300 text-white cursor-not-allowed'}`}
                  onClick={(e) => { if (!termsAccepted) e.preventDefault(); }}
                >
                  Agree and Continue
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
