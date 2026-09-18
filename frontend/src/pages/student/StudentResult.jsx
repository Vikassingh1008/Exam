import { useEffect, useState, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { BarChart3, CheckCircle2, ChevronLeft, ChevronRight, CircleHelp, RefreshCw, Trophy, XCircle } from 'lucide-react';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

const StudentResult = () => {
  const { id } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [reviewIndex, setReviewIndex] = useState(0);
  const [language, setLanguage] = useState('en');

  useEffect(() => {
    const fetchAttempt = async () => {
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
          rank: parsed.rank,
          totalStudents: parsed.totalStudents
        });
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get(`/attempts/${id}`, auth());
        setAttempt({ ...data.attempt, rank: data.rank, totalStudents: data.totalStudents });
      } catch (error) {
        console.error(error);
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
    
    const sampleQuestions = attempt.answers?.map(ans => {
      const q = ans.questionId;
      if (!q) return null; 
      
      const correctOptionIndex = q.options?.findIndex(o => o.isCorrect);
      let selectedOptionIndex = undefined;
      if (ans.selectedOptionId) {
          selectedOptionIndex = q.options?.findIndex(o => o._id === ans.selectedOptionId);
          // if not found by string matching due to type difference, check string val
          if (selectedOptionIndex === -1) {
              selectedOptionIndex = q.options?.findIndex(o => String(o._id) === String(ans.selectedOptionId));
          }
      }
      
      return {
        questionText: language === 'hi' && q.questionTextHi ? q.questionTextHi : q.questionText,
        options: q.options?.map(o => ({ text: language === 'hi' && o.optionTextHi ? o.optionTextHi : o.optionText })) || [],
        correctAnswer: correctOptionIndex,
        explanation: language === 'hi' && q.explanationHi ? q.explanationHi : (q.explanation || 'No explanation provided.'),
        category: 'General', 
        studentAnswer: selectedOptionIndex !== -1 ? selectedOptionIndex : undefined
      };
    }).filter(Boolean) || [];
    
    return {
      correct, incorrect, unattempted, attempted, score: attempt.score || 0,
      accuracy: attempt.accuracy || (attempted ? Math.round((correct / attempted) * 100) : 0),
      testName: attempt.testId?.name || 'Unknown Test',
      totalMarks: attempt.testId?.totalMarks || totalQuestions,
      sampleQuestions,
      rank: attempt.rank,
      totalStudents: attempt.totalStudents
    };
  }, [attempt, language]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-100">Loading analysis...</div>;
  if (!mappedData) return <div className="min-h-screen flex items-center justify-center bg-slate-100 p-10 text-center"><p className="text-xl">Result not found or access denied.</p></div>;

  const { correct, incorrect, unattempted, accuracy, testName, totalMarks, score, sampleQuestions, rank, totalStudents } = mappedData;

  const pieData = [
    { name: 'Correct', value: correct, color: '#10b981' }, 
    { name: 'Incorrect', value: incorrect, color: '#f43f5e' }, 
    { name: 'Unattempted', value: unattempted, color: '#cbd5e1' }
  ];

  const topics = [{ topic: 'General Topic', correct, total: sampleQuestions.length }];

  const filtered = sampleQuestions.map((question, index) => ({ 
    question, 
    index, 
    answer: question.studentAnswer 
  })).filter(({ question, answer }) => 
    filter === 'all' || 
    (filter === 'correct' && answer === question.correctAnswer) || 
    (filter === 'incorrect' && answer !== undefined && answer !== question.correctAnswer) || 
    (filter === 'unattempted' && answer === undefined)
  );

  const active = filtered[reviewIndex] || filtered[0];
  const chooseFilter = (value) => { setFilter(value); setReviewIndex(0); };

  return <div className="min-h-screen bg-slate-100 pb-12">
    <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div>
                <p className="text-sm font-bold text-slate-800">{testName}</p>
                <p className="text-xs text-slate-500">Results Analysis</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex bg-slate-100 rounded-lg p-1">
                <button onClick={() => setLanguage('en')} className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${language === 'en' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>EN</button>
                <button onClick={() => setLanguage('hi')} className={`px-2 py-1 text-xs font-bold rounded-md transition-colors ${language === 'hi' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>HI</button>
              </div>
              <Link to="/student/history" className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50">Back to History</Link>
            </div>
        </div>
    </header>
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl sm:p-8">
            <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-blue-300">Test submitted successfully</p>
                    <h1 className="mt-2 text-3xl font-bold">Your performance report</h1>
                    <p className="mt-2 text-sm text-slate-300">Review every answer and use the topic analysis to plan your next revision.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex items-center gap-4 rounded-2xl bg-white/10 px-5 py-4 ring-1 ring-white/15">
                      <Trophy className="text-amber-300" size={32} />
                      <div>
                          <p className="text-3xl font-bold">{score}<span className="text-base text-slate-300"> / {totalMarks}</span></p>
                          <p className="text-xs font-medium text-slate-300">Score Achieved</p>
                      </div>
                  </div>
                  {rank !== undefined && (
                    <div className="flex items-center gap-4 rounded-2xl bg-white/10 px-5 py-4 ring-1 ring-white/15">
                        <Trophy className="text-blue-300" size={32} />
                        <div>
                            <p className="text-3xl font-bold">#{rank}<span className="text-base text-slate-300"> / {totalStudents}</span></p>
                            <p className="text-xs font-medium text-slate-300">Class Rank</p>
                        </div>
                    </div>
                  )}
                </div>
            </div>
            <div className="absolute -right-10 -top-14 h-48 w-48 rounded-full bg-blue-500/20 blur-2xl" />
        </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[[correct, 'Correct answers', CheckCircle2, 'text-emerald-600 bg-emerald-50'], [incorrect, 'Incorrect answers', XCircle, 'text-rose-600 bg-rose-50'], [unattempted, 'Not attempted', CircleHelp, 'text-slate-600 bg-slate-100'], [`${accuracy}%`, 'Accuracy', Trophy, 'text-blue-600 bg-blue-50']].map(([value, label, Icon, style]) => 
            <div key={label} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${style}`}><Icon size={20} /></div>
                <p className="text-2xl font-bold text-slate-900">{value}</p>
                <p className="mt-1 text-sm text-slate-500">{label}</p>
            </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2"><BarChart3 size={19} className="text-blue-600" /><h2 className="font-bold text-slate-800">Attempt overview</h2></div>
            <div className="mt-4 h-56">
                <ResponsiveContainer><PieChart><Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={3}>{pieData.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 text-xs font-medium text-slate-600">
                {pieData.map(item => <span key={item.name}><i className="mr-1 inline-block h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />{item.name}: {item.value}</span>)}
            </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-slate-800">Topic-wise accuracy</h2>
            <div className="mt-4 h-64">
                <ResponsiveContainer><BarChart data={topics} layout="vertical" margin={{ left: 12 }}><XAxis type="number" allowDecimals={false} domain={[0, 'dataMax']} /><YAxis type="category" dataKey="topic" width={118} tick={{ fontSize: 11 }} /><Tooltip /><Bar dataKey="correct" fill="#2563eb" radius={[0, 5, 5, 0]} /></BarChart></ResponsiveContainer>
            </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
                <p className="text-xs font-bold uppercase tracking-widest text-blue-600">Detailed solutions</p>
                <h2 className="mt-1 text-2xl font-bold text-slate-900">Review each question</h2>
            </div>
            <Link to={`/student/exams`} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50"><RefreshCw size={16} /> Take more tests</Link>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
            {[
              ['all', `All (${sampleQuestions.length})`, 'bg-slate-900 text-white', 'bg-slate-100 text-slate-600 hover:bg-slate-200'], 
              ['correct', `Correct (${correct})`, 'bg-emerald-600 text-white', 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'], 
              ['incorrect', `Incorrect (${incorrect})`, 'bg-rose-600 text-white', 'bg-rose-50 text-rose-700 hover:bg-rose-100'], 
              ['unattempted', `Unattempted (${unattempted})`, 'bg-slate-600 text-white', 'bg-slate-100 text-slate-600 hover:bg-slate-200']
            ].map(([value, label, activeClass, inactiveClass]) => 
                <button key={value} onClick={() => chooseFilter(value)} className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${filter === value ? activeClass : inactiveClass}`}>{label}</button>
            )}
        </div>
        {!active ? <p className="py-12 text-center text-slate-500">No questions in this filter.</p> : 
        <div className="mt-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">Question {reviewIndex + 1} of {filtered.length}</span>
                    <h3 className="mt-4 text-lg font-bold leading-7 text-slate-800" dangerouslySetInnerHTML={{__html: active.question.questionText}}></h3>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${active.answer === undefined ? 'bg-slate-100 text-slate-600' : active.answer === active.question.correctAnswer ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{active.answer === undefined ? 'Unattempted' : active.answer === active.question.correctAnswer ? 'Correct' : 'Incorrect'}</span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {active.question.options.map((option, index) => { 
                    const isCorrect = index === active.question.correctAnswer; 
                    const isSelected = index === active.answer; 
                    return <div key={index} className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${isCorrect ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : isSelected ? 'border-rose-300 bg-rose-50 text-rose-800' : 'border-slate-200 text-slate-600'}`}>
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold">{String.fromCharCode(65 + index)}</span>
                        {option.text}
                        {isCorrect && <CheckCircle2 className="ml-auto" size={16} />}
                        {isSelected && !isCorrect && <XCircle className="ml-auto" size={16} />}
                    </div>; 
                })}
            </div>
            {active.question.explanation && (
                <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm leading-6 text-blue-900">
                    <strong>Explanation: </strong>
                    <span dangerouslySetInnerHTML={{__html: active.question.explanation}}></span>
                </div>
            )}
            <div className="mt-5 flex items-center justify-between">
                <button disabled={!reviewIndex} onClick={() => setReviewIndex(value => value - 1)} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 disabled:opacity-40 hover:bg-slate-50"><ChevronLeft size={16} /> Previous</button>
                <span className="text-xs font-semibold text-slate-500">{reviewIndex + 1} / {filtered.length}</span>
                <button disabled={reviewIndex >= filtered.length - 1} onClick={() => setReviewIndex(value => value + 1)} className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-40">Next <ChevronRight size={16} /></button>
            </div>
        </div>}
      </section>
    </main></div>;
};

export default StudentResult;
