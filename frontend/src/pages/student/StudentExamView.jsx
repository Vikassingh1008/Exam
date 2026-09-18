import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, Bookmark, ChevronLeft, ChevronRight, Clock3, Flag, Menu, X, Sun, Moon } from 'lucide-react';
import api from '../../api/axiosInstance';
import QuestionCard from '../../components/QuestionCard';

const StudentExamView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [testData, setTestData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [marked, setMarked] = useState(new Set());
  const [seconds, setSeconds] = useState(7194);
  const [timeSpent, setTimeSpent] = useState({});
  const currentIndexRef = React.useRef(currentIndex);
  const [mobilePanel, setMobilePanel] = useState(false);
  const [language, setLanguage] = useState('en');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate(`/login?redirect=/student/exam/${id}`);
    }
  }, [id, navigate]);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const { data } = await api.get(`/tests/${id}`);
        setTestData(data.test);
        const allQuestions = data.test.sections.flatMap(s => s.questions);
        setQuestions(allQuestions);
        setSeconds((data.test.duration || 120) * 60);
      } catch (error) {
        console.error('Error fetching test:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTest();
  }, [id]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => { currentIndexRef.current = currentIndex; }, [currentIndex]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(value => Math.max(0, value - 1));
      setTimeSpent(prev => {
        const idx = currentIndexRef.current;
        return { ...prev, [idx]: (prev[idx] || 0) + 1 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const clock = useMemo(() => `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`, [seconds]);
  const currentQuestion = questions[currentIndex];
  const answered = Object.keys(answers).length;
  
  const sectionStarts = useMemo(() => {
    if (!testData?.sections) return [];
    let start = 0;
    return testData.sections.map(sec => {
      const currentStart = start;
      start += sec.questions?.length || 0;
      return { name: sec.name, start: currentStart, end: Math.max(currentStart, start - 1), count: sec.questions?.length || 0 };
    });
  }, [testData]);

  const activeSectionIndex = sectionStarts.findIndex(sec => currentIndex >= sec.start && currentIndex <= sec.end);

  const goTo = (index) => { setCurrentIndex(index); setMobilePanel(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const toggleMarked = () => setMarked(previous => { const next = new Set(previous); next.has(currentIndex) ? next.delete(currentIndex) : next.add(currentIndex); return next; });
  const submitTest = async () => {
    let correct = 0;
    let incorrect = 0;
    let score = 0;
    
    const formattedAnswers = questions.map((q, index) => {
      const studentAns = answers[index];
      if (studentAns !== undefined) {
         if (q.options[studentAns]?.isCorrect) {
             correct++;
             score += (q.marks !== undefined ? q.marks : 1);
         }
         else {
             incorrect++;
             if (testData?.negativeMarking) {
                 score -= (q.negativeMarks !== undefined ? q.negativeMarks : 0.25);
             }
         }
      }
      return {
        questionId: q._id,
        selectedOptionId: studentAns !== undefined ? q.options[studentAns]?._id : null,
        status: studentAns !== undefined ? 'answered' : (marked.has(index) ? 'marked_for_review' : 'not_visited'),
        timeSpent: timeSpent[index] || 0
      };
    });

    const attempted = correct + incorrect;
    score = Number(score.toFixed(2));
    const unattemptedCount = questions.length - attempted;
    
    try {
      const payload = {
        testId: id,
        answers: formattedAnswers,
        score,
        correctCount: correct,
        incorrectCount: incorrect,
        unansweredCount: unattemptedCount,
        timeTaken: (testData?.duration || 120) * 60 - seconds
      };
      
      const token = localStorage.getItem('token');
      const { data } = await api.post('/attempts', payload, { headers: { Authorization: `Bearer ${token}` } });
      
      // Store in session storage for immediate offline-like access if needed, though we can fetch it via API now
      const result = { 
        answers, correct, incorrect, attempted, unattempted: unattemptedCount, 
        score, questions, testName: testData?.name || 'Practice Test', 
        totalMarks: testData?.calculatedTotalMarks || questions.length,
        rank: data.rank,
        totalStudents: data.totalStudents,
        timeSpent
      };
      sessionStorage.setItem(`exam-result-${data.attempt._id}`, JSON.stringify(result));
      
      // Navigate to the newly created attempt ID, not the test ID
      navigate(`/student/results/${data.attempt._id}`);
    } catch (error) {
      alert('Failed to submit test. Please check your connection.');
      console.error(error);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 gap-6">
      <div className="relative flex justify-center items-center w-20 h-20">
        <div className="absolute inset-0 rounded-full border-t-2 border-blue-500 animate-spin"></div>
        <div className="absolute inset-2 rounded-full border-r-2 border-cyan-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 animate-pulse shadow-lg shadow-blue-500/30"></div>
      </div>
      <p className="text-sm font-bold text-slate-300 tracking-[0.2em] uppercase animate-pulse">Loading Test Environment</p>
    </div>
  );
  if (!questions.length) return <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100">Test not found or has no questions.</div>;

  const t = {
    en: {
      practiceTest: 'Practice Test',
      totalMarks: 'Total Marks',
      submitTest: 'Submit test',
      submitPaper: 'Submit paper',
      eachQuestion: testData?.negativeMarking 
        ? `Each question carries ${testData?.marksPerQuestion || 1} mark(s). There is a ${testData?.negativeMarks || 0} negative mark for an incorrect answer.`
        : `Each question carries ${testData?.marksPerQuestion || 1} mark(s). There is no negative marking.`,
      previous: 'Previous',
      markForReview: 'Mark for review',
      markedForReview: 'Marked for review',
      saveAndNext: 'Save & next',
      finishTest: 'Finish test',
      questionPalette: 'Question palette',
      answered: 'Answered',
      marked: 'Marked',
      notVisited: 'Not visited',
      current: 'Current'
    },
    hi: {
      practiceTest: 'अभ्यास परीक्षण',
      totalMarks: 'कुल अंक',
      submitTest: 'टेस्ट जमा करें',
      submitPaper: 'पेपर जमा करें',
      eachQuestion: testData?.negativeMarking 
        ? `प्रत्येक प्रश्न ${testData?.marksPerQuestion || 1} अंक का है। गलत उत्तर के लिए ${testData?.negativeMarks || 0} नकारात्मक अंक है।`
        : `प्रत्येक प्रश्न ${testData?.marksPerQuestion || 1} अंक का है। कोई नकारात्मक अंकन नहीं है।`,
      previous: 'पिछला',
      markForReview: 'समीक्षा के लिए चिह्नित करें',
      markedForReview: 'समीक्षा के लिए चिह्नित',
      saveAndNext: 'सहेजें और अगला',
      finishTest: 'टेस्ट समाप्त करें',
      questionPalette: 'प्रश्न पैलेट',
      answered: 'उत्तर दिया',
      marked: 'चिह्नित',
      notVisited: 'देखा नहीं गया',
      current: 'वर्तमान'
    }
  }[language];

  const palette = (
    <aside className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors duration-200">
      <div className="border-b border-slate-100 dark:border-slate-800 p-5 transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 font-bold text-blue-700 dark:text-blue-300">AS</div>
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-100">Aman Singh</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Computer Operator Practice 06</p>
          </div>
        </div>
      </div>
      <div className="p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t.questionPalette}</p>
        <div className="mt-4 grid grid-cols-5 gap-2">
          {sectionStarts[activeSectionIndex] && Array.from({ length: sectionStarts[activeSectionIndex].count }).map((_, i) => {
            const index = sectionStarts[activeSectionIndex].start + i;
            const isCurrent = index === currentIndex;
            const isAnswered = answers[index] !== undefined;
            const isMarked = marked.has(index);
            return (
              <button 
                onClick={() => goTo(index)} 
                key={index} 
                aria-label={`Go to question ${i + 1}`} 
                className={`relative h-9 rounded-lg text-xs font-bold transition ${
                  isCurrent 
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 ring-2 ring-slate-300 dark:ring-slate-700' 
                    : isAnswered 
                      ? 'bg-emerald-500 text-white' 
                      : isMarked 
                        ? 'bg-amber-400 text-amber-950' 
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {i + 1}
                {isMarked && <Bookmark size={9} className="absolute right-0.5 top-0.5" fill="currentColor" />}
              </button>
            );
          })}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-y-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center"><i className="mr-2 inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" /> {t.answered}</span>
          <span className="flex items-center"><i className="mr-2 inline-block h-2.5 w-2.5 rounded-sm bg-amber-400" /> {t.marked}</span>
          <span className="flex items-center"><i className="mr-2 inline-block h-2.5 w-2.5 rounded-sm bg-slate-200 dark:bg-slate-700" /> {t.notVisited}</span>
          <span className="flex items-center"><i className="mr-2 inline-block h-2.5 w-2.5 rounded-sm bg-slate-900 dark:bg-slate-100" /> {t.current}</span>
        </div>
      </div>
      <div className="border-t border-slate-100 dark:border-slate-800 p-5 transition-colors duration-200">
        <button onClick={submitTest} className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700">{t.submitPaper}</button>
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 transition-colors duration-200">
      <header className="sticky top-0 z-20 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors duration-200">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{testData?.name || t.practiceTest}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t.totalMarks}: {testData?.calculatedTotalMarks || questions.length} · {id}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 mr-2">
              <button onClick={() => setLanguage('en')} className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${language === 'en' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>EN</button>
              <button onClick={() => setLanguage('hi')} className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${language === 'hi' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>HI</button>
            </div>
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)} 
              className="rounded-lg p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <div className="hidden items-center gap-2 rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm font-bold text-red-600 dark:text-red-400 sm:flex">
              <Clock3 size={16} /> {clock}
            </div>
            <button onClick={() => setMobilePanel(!mobilePanel)} className="rounded-lg border border-slate-200 dark:border-slate-700 p-2 text-slate-600 dark:text-slate-400 lg:hidden">
              {mobilePanel ? <X size={19} /> : <Menu size={19} />}
            </button>
            <button onClick={submitTest} className="hidden rounded-lg bg-slate-900 dark:bg-blue-600 px-4 py-2 text-sm font-bold text-white sm:block hover:bg-slate-800 dark:hover:bg-blue-700 transition">
              {t.submitTest}
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {sectionStarts.length > 0 && (
          <div className="mb-6 flex overflow-x-auto border-b border-slate-200 dark:border-slate-800 scrollbar-hide">
            {sectionStarts.map((sec, i) => (
              <button
                key={i}
                onClick={() => goTo(sec.start)}
                className={`whitespace-nowrap px-6 py-3.5 text-sm font-bold transition-all border-b-[3px] ${
                  activeSectionIndex === i 
                    ? 'border-blue-600 text-blue-700 dark:border-blue-500 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-900/20' 
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {sec.name}
              </button>
            ))}
          </div>
        )}
        
        <div className="mb-5 flex items-center justify-between rounded-xl border border-blue-100 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 px-4 py-3 text-sm text-blue-800 dark:text-blue-300 transition-colors duration-200">
          <span className="flex items-center gap-2"><AlertCircle size={17} /> {t.eachQuestion}</span>
          {sectionStarts[activeSectionIndex] && (
            <span className="hidden font-bold sm:block">
              {currentIndex - sectionStarts[activeSectionIndex].start + 1} / {sectionStarts[activeSectionIndex].count}
            </span>
          )}
        </div>
        {mobilePanel && <div className="mb-5 lg:hidden">{palette}</div>}
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section>
            <QuestionCard 
              questionNumber={sectionStarts[activeSectionIndex] ? (currentIndex - sectionStarts[activeSectionIndex].start + 1) : (currentIndex + 1)} 
              questionText={language === 'hi' && currentQuestion.questionTextHi ? currentQuestion.questionTextHi : currentQuestion.questionText} 
              options={currentQuestion.options.map(o => ({ text: language === 'hi' && o.optionTextHi ? o.optionTextHi : o.optionText }))} 
              selectedOption={answers[currentIndex]} 
              onSelect={(option) => setAnswers(current => ({ ...current, [currentIndex]: option }))} 
            />
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <button 
                onClick={() => setCurrentIndex(index => Math.max(0, index - 1))} 
                disabled={!currentIndex} 
                className="inline-flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-3 text-sm font-bold text-slate-700 dark:text-slate-300 disabled:cursor-not-allowed disabled:opacity-40 transition-colors duration-200"
              >
                <ChevronLeft size={17} /> {t.previous}
              </button>
              <button 
                onClick={toggleMarked} 
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors duration-200 ${
                  marked.has(currentIndex) 
                    ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400' 
                    : 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Bookmark size={16} fill={marked.has(currentIndex) ? 'currentColor' : 'none'} /> 
                {marked.has(currentIndex) ? t.markedForReview : t.markForReview}
              </button>
              <button 
                onClick={() => currentIndex === questions.length - 1 ? submitTest() : setCurrentIndex(index => index + 1)} 
                className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 transition"
              >
                {currentIndex === questions.length - 1 ? t.finishTest : t.saveAndNext} <ChevronRight size={17} />
              </button>
            </div>
          </section>
          <div className="hidden lg:block">{palette}</div>
        </div>
      </main>
    </div>
  );
};

export default StudentExamView;
