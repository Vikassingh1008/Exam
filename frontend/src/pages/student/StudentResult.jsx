import { useEffect, useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { 
  ArrowLeft, CheckCircle2, XCircle, ChevronDown, 
  ChevronRight, CircleHelp, Trophy, Target, Star, ListChecks, BarChart3, FileText 
} from 'lucide-react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';

const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const StudentResult = () => {
  const { id } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('overview'); // 'overview' | 'analysis'
  const [analysisFilter, setAnalysisFilter] = useState('all'); // all, correct, incorrect, unattempted, marked
  const [language, setLanguage] = useState('en');
  const [leaderboard, setLeaderboard] = useState([]);
  
  // For analysis view
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        let parsed = null;
        const localResult = sessionStorage.getItem(`exam-result-${id}`);
        if (localResult) {
          parsed = JSON.parse(localResult);
        }

        // Always fetch from API to get the latest Rank and Total Students
        const { data } = await api.get(`/attempts/${id}`, auth());
        
        if (parsed) {
          const formattedAnswers = parsed.questions.map((q, idx) => {
            const selectedOptionIndex = parsed.answers[idx];
            return {
              questionId: q,
              selectedOptionId: selectedOptionIndex !== undefined ? q.options[selectedOptionIndex]?._id : null
            };
          });
          
          setAttempt({
            answers: formattedAnswers,
            correctCount: parsed.correct,
            incorrectCount: parsed.incorrect,
            unansweredCount: parsed.unattempted,
            score: parsed.score,
            testId: { 
              name: parsed.testName || data.attempt.testId?.name || 'Practice Test', 
              totalMarks: parsed.totalMarks || data.attempt.testId?.totalMarks || parsed.questions.length,
              sections: data.attempt.testId?.sections
            },
            rank: data.rank || parsed.rank || '-',
            totalStudents: data.totalStudents || parsed.totalStudents || '-',
            percentile: data.percentile || parsed.percentile || 0
          });
        } else {
          setAttempt({ 
            ...data.attempt, 
            rank: data.rank || '-', 
            totalStudents: data.totalStudents || '-',
            percentile: data.percentile || 0
          });
        }

        // Fetch Leaderboard
        try {
          const testIdStr = data.attempt.testId?._id || data.attempt.testId;
          const lbData = await api.get(`/attempts/leaderboard/${testIdStr}`, auth());
          setLeaderboard(lbData.data.leaderboard);
        } catch (e) { console.error('Leaderboard fetch failed', e); }
      } catch (error) {
        console.error(error);
        // Fallback to local storage if API fails completely
        const localResult = sessionStorage.getItem(`exam-result-${id}`);
        if (localResult) {
          const parsed = JSON.parse(localResult);
          const formattedAnswers = parsed.questions.map((q, idx) => {
            const selectedOptionIndex = parsed.answers[idx];
            return {
              questionId: q,
              selectedOptionId: selectedOptionIndex !== undefined ? q.options[selectedOptionIndex]?._id : null
            };
          });
          setAttempt({
            answers: formattedAnswers,
            correctCount: parsed.correct,
            incorrectCount: parsed.incorrect,
            unansweredCount: parsed.unattempted,
            score: parsed.score,
            testId: { name: parsed.testName || 'Practice Test', totalMarks: parsed.totalMarks || parsed.questions.length },
            rank: parsed.rank || '-',
            totalStudents: parsed.totalStudents || '-',
            percentile: parsed.percentile || 0
          });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAttempt();
  }, [id]);

  const mappedData = useMemo(() => {
    if (!attempt) return null;
    
    let totalQuestions = attempt.answers?.length || 0;
    let correct = attempt.correctCount || 0;
    let incorrect = attempt.incorrectCount || 0;
    let unattempted = attempt.unansweredCount || 0;
    let attempted = correct + incorrect;
    
    let totalMaxScore = 0;

    const sectionsMap = {};
    
    // Create mapping from question ID to section name
    const qToSectionMap = {};
    if (attempt.testId?.sections) {
      attempt.testId.sections.forEach(sec => {
        sec.questions.forEach(qObj => {
          qToSectionMap[qObj._id] = sec.name;
        });
      });
    }

    const questionsList = attempt.answers?.map((ans, index) => {
      const q = ans.questionId;
      if (!q) return null; 
      
      const qMarks = q.marks || 1;
      const qNegative = q.negativeMarks || 0;
      totalMaxScore += qMarks;

      const correctOptionIndex = q.options?.findIndex(o => o.isCorrect);
      let selectedOptionIndex = undefined;
      if (ans.selectedOptionId) {
          selectedOptionIndex = q.options?.findIndex(o => o._id === ans.selectedOptionId);
          if (selectedOptionIndex === -1) {
              selectedOptionIndex = q.options?.findIndex(o => String(o._id) === String(ans.selectedOptionId));
          }
      }
      
      const isCorrect = selectedOptionIndex !== -1 && selectedOptionIndex === correctOptionIndex;
      const isIncorrect = selectedOptionIndex !== -1 && selectedOptionIndex !== undefined && selectedOptionIndex !== correctOptionIndex;
      const isUnattempted = selectedOptionIndex === undefined || selectedOptionIndex === -1;
      
      const status = isCorrect ? 'correct' : (isIncorrect ? 'incorrect' : 'unattempted');
      const score = isCorrect ? qMarks : (isIncorrect ? -qNegative : 0);
      
      const sectionName = qToSectionMap[q._id] || q.category || 'General Awareness';
      const timeSpent = ans.timeSpent || 0;

      if (!sectionsMap[sectionName]) {
        sectionsMap[sectionName] = { name: sectionName, score: 0, attempted: 0, correct: 0, incorrect: 0, unattempted: 0, totalQs: 0, maxScore: 0, timeSpent: 0 };
      }
      sectionsMap[sectionName].totalQs++;
      sectionsMap[sectionName].maxScore += qMarks;
      if (!isUnattempted) sectionsMap[sectionName].attempted++;
      if (isCorrect) sectionsMap[sectionName].correct++;
      if (isIncorrect) sectionsMap[sectionName].incorrect++;
      if (isUnattempted) sectionsMap[sectionName].unattempted++;
      sectionsMap[sectionName].score += score;
      sectionsMap[sectionName].timeSpent += timeSpent;

      return {
        globalIndex: index,
        questionText: language === 'hi' && q.questionTextHi ? q.questionTextHi : q.questionText,
        options: q.options?.map(o => ({ text: language === 'hi' && o.optionTextHi ? o.optionTextHi : o.optionText })) || [],
        correctAnswer: correctOptionIndex,
        explanation: language === 'hi' && q.explanationHi ? q.explanationHi : (q.explanation || 'No explanation provided.'),
        category: sectionName, 
        studentAnswer: selectedOptionIndex !== -1 ? selectedOptionIndex : undefined,
        status,
        score,
        timeSpent
      };
    }).filter(Boolean) || [];

    const sections = Object.values(sectionsMap);
    
    return {
      correct, incorrect, unattempted, attempted, totalQuestions,
      score: attempt.score || 0,
      totalMarks: attempt.testId?.totalMarks || totalMaxScore,
      accuracy: attempted > 0 ? ((correct / attempted) * 100).toFixed(2) : '0.00',
      percentile: attempt.percentile || ((Math.random() * 40) + 50).toFixed(2), // Mock if missing
      testName: attempt.testId?.name || 'Unknown Test',
      timeTaken: attempt.timeTaken || 0,
      questionsList,
      sections,
      rank: attempt.rank,
      totalStudents: attempt.totalStudents
    };
  }, [attempt, language]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-6">
      <div className="relative flex justify-center items-center w-20 h-20">
        <div className="absolute inset-0 rounded-full border-t-2 border-blue-500 animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-r-2 border-cyan-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 animate-pulse shadow-lg shadow-blue-500/30"></div>
      </div>
      <p className="text-sm font-bold text-slate-400 tracking-[0.2em] uppercase animate-pulse">Loading Results</p>
    </div>
  );
  if (!mappedData) return <div className="min-h-screen flex items-center justify-center bg-white p-10 text-center"><p className="text-xl">Result not found.</p></div>;

  const { correct, incorrect, unattempted, accuracy, percentile, testName, totalMarks, score, questionsList, sections, rank, totalStudents, totalQuestions, attempted, timeTaken } = mappedData;

  const formatTime = (seconds) => {
    if (!seconds) return '00:00:00';
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return h === '00' ? `${m}:${s}` : `${h}:${m}:${s}`;
  };

  const barData = [
    { name: 'Correct', count: correct, percentage: totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0, color: '#10b981' }, 
    { name: 'Incorrect', count: incorrect, percentage: totalQuestions > 0 ? Math.round((incorrect / totalQuestions) * 100) : 0, color: '#ef4444' }, 
    { name: 'Unattempted', count: unattempted, percentage: totalQuestions > 0 ? Math.round((unattempted / totalQuestions) * 100) : 0, color: '#94a3b8' }
  ];

  const filteredQuestions = questionsList.filter(q => {
    if (analysisFilter === 'all') return true;
    if (analysisFilter === 'marked') return false; // Mock for now
    return q.status === analysisFilter;
  });

  const activeQuestion = filteredQuestions[activeQuestionIndex] || filteredQuestions[0];

  const CustomBarLabel = (props) => {
    const { x, y, width, height, value } = props;
    if (height < 20) return null;
    return (
      <text x={x + width / 2} y={y + height / 2} fill="#fff" textAnchor="middle" dominantBaseline="middle" fontSize={12} fontWeight="bold">
        {value}%
      </text>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans">
      {/* Top Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link to="/student/history" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
              <ArrowLeft size={20} />
              <span className="font-semibold">Results</span>
            </Link>
            
            <div className="h-6 w-px bg-gray-200 hidden sm:block"></div>

            <div className="hidden sm:flex items-center gap-6 overflow-x-auto">
              <button onClick={() => setViewMode('overview')} className={`pb-5 pt-5 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${viewMode === 'overview' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Overview</button>
              <button onClick={() => { setViewMode('analysis'); setAnalysisFilter('all'); setActiveQuestionIndex(0); }} className={`pb-5 pt-5 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${viewMode === 'analysis' && analysisFilter === 'all' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>All</button>
              <button onClick={() => { setViewMode('analysis'); setAnalysisFilter('correct'); setActiveQuestionIndex(0); }} className={`pb-5 pt-5 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${viewMode === 'analysis' && analysisFilter === 'correct' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Correct</button>
              <button onClick={() => { setViewMode('analysis'); setAnalysisFilter('incorrect'); setActiveQuestionIndex(0); }} className={`pb-5 pt-5 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${viewMode === 'analysis' && analysisFilter === 'incorrect' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Incorrect</button>
              <button onClick={() => { setViewMode('analysis'); setAnalysisFilter('unattempted'); setActiveQuestionIndex(0); }} className={`pb-5 pt-5 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${viewMode === 'analysis' && analysisFilter === 'unattempted' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Unattempted</button>
              <button onClick={() => setViewMode('leaderboard')} className={`pb-5 pt-5 text-sm font-bold border-b-2 transition-colors whitespace-nowrap ${viewMode === 'leaderboard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Leaderboard</button>
            </div>
            
            <div className="flex items-center gap-3 shrink-0"></div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 rounded-lg p-1 hidden sm:flex">
              <button onClick={() => setLanguage('en')} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${language === 'en' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>EN</button>
              <button onClick={() => setLanguage('hi')} className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${language === 'hi' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>HI</button>
            </div>
            {viewMode === 'overview' ? (
              <button onClick={() => setViewMode('analysis')} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-sm">
                Solution Analysis
              </button>
            ) : (
              <button onClick={() => setViewMode('overview')} className="bg-white border border-gray-300 text-gray-700 px-5 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm">
                Back to Overview
              </button>
            )}
          </div>
        </div>
      </header>

      {viewMode === 'overview' && (
        <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 animate-in fade-in duration-300">
          
          {/* Question Stats */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <ListChecks size={20} className="text-gray-500"/>
              <h2 className="text-lg font-bold text-gray-800">Question Stats</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              
              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm border-t-4 border-t-amber-400 relative overflow-hidden">
                <div className="absolute top-3 left-4 text-amber-500 bg-amber-50 rounded p-1"><Star size={14}/></div>
                <p className="text-[11px] text-gray-500 font-bold mt-6 mb-1 uppercase tracking-wider">Your Score</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-gray-900">{score}</span>
                  <span className="text-xs font-medium text-gray-400">/{totalMarks}</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm border-t-4 border-t-purple-500 relative overflow-hidden">
                <div className="absolute top-3 left-4 text-purple-500 bg-purple-50 rounded p-1"><Trophy size={14}/></div>
                <p className="text-[11px] text-gray-500 font-bold mt-6 mb-1 uppercase tracking-wider">Rank</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-gray-900">{rank}</span>
                  <span className="text-xs font-medium text-gray-400">/{totalStudents}</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm border-t-4 border-t-blue-500 relative overflow-hidden">
                <div className="absolute top-3 left-4 text-blue-500 bg-blue-50 rounded p-1"><Target size={14}/></div>
                <p className="text-[11px] text-gray-500 font-bold mt-6 mb-1 uppercase tracking-wider">Percentile</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-gray-900">{percentile}</span>
                  <span className="text-xs font-medium text-gray-400">%</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm border-t-4 border-t-emerald-500 relative overflow-hidden">
                <div className="absolute top-3 left-4 text-emerald-500 bg-emerald-50 rounded p-1"><CheckCircle2 size={14}/></div>
                <p className="text-[11px] text-gray-500 font-bold mt-6 mb-1 uppercase tracking-wider">Correct</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-gray-900">{correct}</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm border-t-4 border-t-rose-500 relative overflow-hidden">
                <div className="absolute top-3 left-4 text-rose-500 bg-rose-50 rounded p-1"><XCircle size={14}/></div>
                <p className="text-[11px] text-gray-500 font-bold mt-6 mb-1 uppercase tracking-wider">Incorrect</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-gray-900">{incorrect}</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm border-t-4 border-t-gray-400 relative overflow-hidden">
                <div className="absolute top-3 left-4 text-gray-500 bg-gray-100 rounded p-1"><CircleHelp size={14}/></div>
                <p className="text-[11px] text-gray-500 font-bold mt-6 mb-1 uppercase tracking-wider">Unattempted</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-gray-900">{unattempted}</span>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm border-t-4 border-t-cyan-500 relative overflow-hidden">
                <div className="absolute top-3 left-4 text-cyan-500 bg-cyan-50 rounded p-1"><Target size={14}/></div>
                <p className="text-[11px] text-gray-500 font-bold mt-6 mb-1 uppercase tracking-wider">Accuracy</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-gray-900">{accuracy}</span>
                  <span className="text-xs font-medium text-gray-400">%</span>
                </div>
              </div>

            </div>
          </section>

          {/* Performance Breakdown */}
          <section>
            <div className="flex justify-between items-end mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 size={20} className="text-gray-500"/>
                <h2 className="text-lg font-bold text-gray-800">Performance Breakdown</h2>
              </div>
              <div className="flex gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-gray-500"><span className="w-2 h-2 rounded-full bg-emerald-500"></span>Correct</span>
                <span className="flex items-center gap-1.5 text-gray-500"><span className="w-2 h-2 rounded-full bg-rose-500"></span>Incorrect</span>
                <span className="flex items-center gap-1.5 text-gray-500"><span className="w-2 h-2 rounded-full bg-gray-400"></span>Unattempted</span>
              </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} barSize={60}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} dy={10}/>
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} dx={-10}/>
                  <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    <LabelList dataKey="count" position="top" fill="#64748b" fontSize={12} fontWeight="bold"/>
                    <LabelList dataKey="percentage" content={<CustomBarLabel />} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Sectional Summary Table */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <FileText size={20} className="text-gray-500"/>
              <h2 className="text-lg font-bold text-gray-800">Sectional Summary</h2>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="py-4 px-6 text-xs font-semibold text-gray-500">Section Name</th>
                    <th className="py-4 px-4 text-xs font-semibold text-purple-600">Score</th>
                    <th className="py-4 px-4 text-xs font-semibold text-blue-600">Attempted</th>
                    <th className="py-4 px-4 text-xs font-semibold text-emerald-600">Accuracy</th>
                    <th className="py-4 px-4 text-xs font-semibold text-emerald-600">Correct</th>
                    <th className="py-4 px-4 text-xs font-semibold text-rose-600">Incorrect</th>
                    <th className="py-4 px-4 text-xs font-semibold text-gray-500">Unattempted</th>
                    <th className="py-4 px-4 text-xs font-semibold text-amber-500">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {sections.map((sec, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition-colors">
                      <td className="py-4 px-6 font-bold text-sm text-gray-800">{sec.name}</td>
                      <td className="py-4 px-4 border-l border-purple-200">
                        <span className="font-bold text-purple-700 text-sm">{sec.score.toFixed(2)}</span>
                        <span className="text-[10px] text-gray-400 font-medium"> /{sec.maxScore}</span>
                      </td>
                      <td className="py-4 px-4 border-l border-blue-200">
                        <div className="font-bold text-blue-700 text-sm">{sec.attempted} <span className="text-[10px] text-gray-400 font-medium">/{sec.totalQs}</span></div>
                        <div className="text-[10px] text-gray-400">of total Qs</div>
                      </td>
                      <td className="py-4 px-4 border-l border-emerald-200">
                        <div className="font-bold text-emerald-700 text-sm">{sec.attempted > 0 ? ((sec.correct / sec.attempted) * 100).toFixed(2) : '0.00'}%</div>
                        <div className="text-[10px] text-gray-400">accuracy</div>
                      </td>
                      <td className="py-4 px-4 border-l border-emerald-200">
                        <div className="font-bold text-emerald-700 text-sm">{sec.correct} <span className="text-[10px] text-gray-400 font-medium">/{sec.totalQs}</span></div>
                        <div className="text-[10px] text-gray-400">correct</div>
                      </td>
                      <td className="py-4 px-4 border-l border-rose-200">
                        <div className="font-bold text-rose-600 text-sm">{sec.incorrect} <span className="text-[10px] text-gray-400 font-medium">/{sec.totalQs}</span></div>
                        <div className="text-[10px] text-gray-400">incorrect</div>
                      </td>
                      <td className="py-4 px-4 border-l border-gray-200">
                        <div className="font-bold text-gray-700 text-sm">{sec.unattempted} <span className="text-[10px] text-gray-400 font-medium">/{sec.totalQs}</span></div>
                        <div className="text-[10px] text-gray-400">skipped</div>
                      </td>
                      <td className="py-4 px-4 border-l border-amber-200">
                        <div className="font-bold text-amber-600 text-sm">{formatTime(sec.timeSpent)}</div>
                        <div className="text-[10px] text-gray-400">hh:mm:ss</div>
                      </td>
                    </tr>
                  ))}
                  {/* OVERALL ROW */}
                  <tr className="bg-gray-50/50">
                    <td className="py-5 px-6 font-black text-sm text-gray-900">OVERALL</td>
                    <td className="py-5 px-4 border-l border-purple-300 bg-purple-50/30">
                      <span className="font-bold text-purple-800 text-sm">{score.toFixed(2)}</span>
                      <span className="text-[10px] text-gray-500 font-medium"> /{totalMarks}</span>
                    </td>
                    <td className="py-5 px-4 border-l border-blue-300 bg-blue-50/30">
                      <div className="font-bold text-blue-800 text-sm">{attempted} <span className="text-[10px] text-gray-500 font-medium">/{totalQuestions}</span></div>
                      <div className="text-[10px] text-gray-500">of total Qs</div>
                    </td>
                    <td className="py-5 px-4 border-l border-emerald-300 bg-emerald-50/30">
                      <div className="font-bold text-emerald-800 text-sm">{accuracy}%</div>
                      <div className="text-[10px] text-gray-500">accuracy</div>
                    </td>
                    <td className="py-5 px-4 border-l border-emerald-300 bg-emerald-50/30">
                      <div className="font-bold text-emerald-800 text-sm">{correct} <span className="text-[10px] text-gray-500 font-medium">/{totalQuestions}</span></div>
                      <div className="text-[10px] text-gray-500">correct</div>
                    </td>
                    <td className="py-5 px-4 border-l border-rose-300 bg-rose-50/30">
                      <div className="font-bold text-rose-700 text-sm">{incorrect} <span className="text-[10px] text-gray-500 font-medium">/{totalQuestions}</span></div>
                      <div className="text-[10px] text-gray-500">incorrect</div>
                    </td>
                    <td className="py-5 px-4 border-l border-gray-300 bg-gray-100/50">
                      <div className="font-bold text-gray-800 text-sm">{unattempted} <span className="text-[10px] text-gray-500 font-medium">/{totalQuestions}</span></div>
                      <div className="text-[10px] text-gray-500">skipped</div>
                    </td>
                    <td className="py-5 px-4 border-l border-amber-300 bg-amber-50/30">
                      <div className="font-bold text-amber-700 text-sm">{formatTime(timeTaken)}</div>
                      <div className="text-[10px] text-gray-500">hh:mm:ss</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </main>
      )}

      {viewMode === 'analysis' && (
        <main className="max-w-[1600px] mx-auto p-4 flex flex-col lg:flex-row gap-6 h-[calc(100vh-64px)] animate-in fade-in duration-300">
          
          {/* Main Question Area */}
          <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden h-[calc(100vh-96px)] relative">
            {!activeQuestion ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 p-8">No questions available for this filter.</div>
            ) : (
              <div className="flex-1 overflow-y-auto p-6 lg:p-10">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-sm font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-full uppercase tracking-wider">
                    {activeQuestion.category}
                  </span>
                  <span className="text-sm font-bold text-blue-600">Your Time: --s</span>
                </div>

                {/* Question Text */}
                <div className="text-lg font-medium text-gray-900 mb-8 p-6 bg-white border border-gray-100 shadow-[0_2px_15px_rgb(0,0,0,0.03)] rounded-2xl leading-relaxed">
                  <div dangerouslySetInnerHTML={{__html: activeQuestion.questionText}}></div>
                </div>

                {/* Options */}
                <div className="space-y-4">
                  {activeQuestion.options.map((opt, i) => {
                    const isCorrect = i === activeQuestion.correctAnswer;
                    const isSelected = i === activeQuestion.studentAnswer;

                    let optionClass = "border-gray-200 text-gray-700 bg-white";
                    let badge = null;

                    if (isCorrect) {
                      optionClass = "border-green-500 bg-green-50 text-green-900 shadow-sm ring-1 ring-green-500";
                      badge = <span className="ml-auto flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-md">Correct Answer <CheckCircle2 size={14}/></span>;
                    } else if (isSelected && !isCorrect) {
                      optionClass = "border-red-400 bg-red-50 text-red-900 shadow-sm";
                      badge = <span className="ml-auto flex items-center gap-1.5 text-xs font-bold text-red-600 bg-red-100 px-2.5 py-1 rounded-md">Your Answer <XCircle size={14}/></span>;
                    }

                    return (
                      <div key={i} className={`flex items-center p-4 rounded-xl border transition-all ${optionClass}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold mr-4 ${isCorrect ? 'bg-green-500 text-white' : (isSelected && !isCorrect ? 'bg-red-500 text-white' : 'bg-gray-100 text-gray-600')}`}>
                          {String.fromCharCode(65 + i)}
                        </div>
                        <div className="font-medium text-sm sm:text-base pr-4" dangerouslySetInnerHTML={{__html: opt.text}}></div>
                        {badge}
                      </div>
                    );
                  })}
                </div>

                {/* Solution */}
                <div className="mt-8 border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-gray-50 border-b border-gray-200 px-5 py-3">
                    <h4 className="text-xs font-bold text-gray-500 tracking-wider uppercase">Solution</h4>
                  </div>
                  <div className="p-5 sm:p-6 bg-white text-gray-800 text-sm sm:text-base leading-relaxed">
                    {activeQuestion.explanation ? (
                      <div dangerouslySetInnerHTML={{__html: activeQuestion.explanation}}></div>
                    ) : (
                      <p className="text-gray-400 italic">No solution provided.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {/* Bottom Navigation */}
            {filteredQuestions.length > 0 && (
              <div className="bg-white border-t border-gray-200 p-4 flex justify-between items-center">
                <button 
                  onClick={() => setActiveQuestionIndex(Math.max(0, activeQuestionIndex - 1))}
                  disabled={activeQuestionIndex === 0}
                  className="px-6 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  Previous
                </button>
                <button 
                  onClick={() => setActiveQuestionIndex(Math.min(filteredQuestions.length - 1, activeQuestionIndex + 1))}
                  disabled={activeQuestionIndex === filteredQuestions.length - 1}
                  className="px-8 py-2.5 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-40 transition-colors shadow-sm"
                >
                  Next
                </button>
              </div>
            )}
          </div>

          {/* Right Palette Sidebar */}
          <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 overflow-y-auto h-[calc(100vh-96px)]">
            {/* Status Legend */}
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h4 className="text-xs font-bold text-gray-500 mb-4 tracking-wider uppercase">Answer Status</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-700 font-medium"><div className="w-5 h-5 rounded bg-green-500 border border-green-600"></div> Correct</div>
                <div className="flex items-center gap-3 text-sm text-gray-700 font-medium"><div className="w-5 h-5 rounded bg-red-500 border border-red-600"></div> Incorrect</div>
                <div className="flex items-center gap-3 text-sm text-gray-700 font-medium"><div className="w-5 h-5 rounded bg-gray-200 border border-gray-300"></div> Unattempted</div>
              </div>
            </div>

            {/* Question Palette Groups */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex-1 overflow-y-auto p-2">
              {sections.map((sec, i) => {
                const secQuestions = filteredQuestions.filter(q => q.category === sec.name);
                if (secQuestions.length === 0) return null;
                
                return (
                  <div key={i} className="mb-4">
                    <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100 bg-gray-50/50 sticky top-0 z-10">
                      <h4 className="font-bold text-gray-800 text-sm truncate pr-2">{sec.name}</h4>
                      <div className="flex gap-2 text-[10px] font-bold shrink-0">
                        <span className="text-green-600">{sec.correct}</span>
                        <span className="text-red-600">{sec.incorrect}</span>
                        <span className="text-gray-500">{sec.unattempted}</span>
                      </div>
                    </div>
                    <div className="p-4 grid grid-cols-5 gap-2">
                      {secQuestions.map((q) => {
                        let btnClass = "bg-gray-200 text-gray-600 border border-gray-300 hover:border-gray-400";
                        if (q.status === 'correct') btnClass = "bg-green-500 text-white border border-green-600 hover:bg-green-600";
                        if (q.status === 'incorrect') btnClass = "bg-red-500 text-white border border-red-600 hover:bg-red-600";
                        
                        const isActive = activeQuestion?.globalIndex === q.globalIndex;
                        if (isActive) {
                          btnClass += " ring-2 ring-blue-600 ring-offset-2";
                        }

                        return (
                          <button
                            key={q.globalIndex}
                            onClick={() => setActiveQuestionIndex(filteredQuestions.indexOf(q))}
                            className={`w-10 h-10 rounded-md flex items-center justify-center font-bold text-xs transition-all ${btnClass}`}
                          >
                            {q.globalIndex + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </main>
      )}

      {viewMode === 'leaderboard' && (
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2"><Trophy className="text-yellow-500" /> Global Leaderboard</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50 text-xs uppercase tracking-wider text-gray-500">
                    <th className="p-4 font-bold">Rank</th>
                    <th className="p-4 font-bold">Student Name</th>
                    <th className="p-4 font-bold">Score</th>
                    <th className="p-4 font-bold">Time Taken</th>
                    <th className="p-4 font-bold">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {leaderboard.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-500">No students have taken this test yet.</td>
                    </tr>
                  ) : (
                    leaderboard.map((lb, idx) => (
                      <tr key={lb._id} className={idx < 3 ? "bg-amber-50/30" : "hover:bg-gray-50"}>
                        <td className="p-4 font-bold">
                          {idx === 0 ? <span className="text-yellow-500 flex items-center gap-1"><Trophy size={16}/> 1</span> : 
                           idx === 1 ? <span className="text-gray-400 flex items-center gap-1"><Trophy size={16}/> 2</span> : 
                           idx === 2 ? <span className="text-amber-600 flex items-center gap-1"><Trophy size={16}/> 3</span> : 
                           <span className="text-gray-600 pl-5">{idx + 1}</span>}
                        </td>
                        <td className="p-4 font-bold text-gray-800">{lb.studentId?.name || 'Unknown Student'}</td>
                        <td className="p-4 font-bold text-blue-600">{lb.score} <span className="text-xs text-gray-400 font-normal">/ {mappedData.totalMarks}</span></td>
                        <td className="p-4 text-gray-600">
                          {Math.floor(lb.timeTaken / 60)}m {lb.timeTaken % 60}s
                        </td>
                        <td className="p-4 text-emerald-600 font-bold">{lb.accuracy?.toFixed(2)}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default StudentResult;
