import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axiosInstance';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Trash2, GripVertical, Settings, Eye, ChevronLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';
import axios from 'axios';

const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });

const SortableItem = ({ id, children, isActive, onClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };
  
  return (
    <div ref={setNodeRef} style={style} className={`flex items-center p-3 border-b cursor-pointer hover:bg-gray-50 ${isActive ? 'bg-primary-50 border-l-4 border-l-primary-600' : ''}`} onClick={onClick}>
      <div {...attributes} {...listeners} className="mr-2 text-gray-400 cursor-grab hover:text-gray-600"><GripVertical size={16} /></div>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
};

const TestBuilder = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState(null);
  const [activeQuestionId, setActiveQuestionId] = useState(null);
  const [previewQuestion, setPreviewQuestion] = useState(null);
  const [previewTest, setPreviewTest] = useState(false);
  const [editorLanguage, setEditorLanguage] = useState('en');
  const [confirmAction, setConfirmAction] = useState({ isOpen: false, type: null, payload: null, message: '', title: '' });
  const [sectionModal, setSectionModal] = useState({ isOpen: false, name: '' });

  // Load Test Data
  const loadTest = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/tests/admin/${testId}`, auth());
      setTest(data.test);
      if (data.test.sections?.length > 0 && !activeSectionId) {
        setActiveSectionId(data.test.sections[0]._id);
      }
    } catch (error) {
      toast.error('Error loading test');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTest(); }, [testId]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Handlers for Sections
  const handleAddSection = () => {
    setSectionModal({ isOpen: true, name: '' });
  };

  const submitSection = async (e) => {
    e.preventDefault();
    if (!sectionModal.name.trim()) return;
    try {
      await api.post('/sections', { name: sectionModal.name.trim(), testId }, auth());
      toast.success('Section created successfully');
      setSectionModal({ isOpen: false, name: '' });
      loadTest();
    } catch (error) {
      toast.error('Failed to create section');
    }
  };

  const handleDeleteSection = (id, e) => {
    e.stopPropagation();
    setConfirmAction({
      isOpen: true,
      type: 'deleteSection',
      payload: id,
      title: 'Delete Section',
      message: 'Are you sure you want to delete this section and all its questions? This cannot be undone.'
    });
  };

  const handleDragEndSection = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    const oldIndex = test.sections.findIndex(s => s._id === active.id);
    const newIndex = test.sections.findIndex(s => s._id === over.id);
    
    const newSections = arrayMove(test.sections, oldIndex, newIndex);
    setTest({ ...test, sections: newSections });
    
    try {
      await api.put('/sections/reorder', { sectionIds: newSections.map(s => s._id) }, auth());
    } catch {
      toast.error('Failed to save section order');
      loadTest(); // Revert on failure
    }
  };

  // Handlers for Questions
  const activeSection = test?.sections?.find(s => s._id === activeSectionId);
  const questions = activeSection?.questions || [];

  const handleAddQuestion = async () => {
    if (!activeSectionId) return toast.error('Select a section first');
    try {
      const newQuestion = {
        questionText: 'New Question',
        testId,
        sectionId: activeSectionId,
        questionType: 'Single MCQ',
        marks: test?.marksPerQuestion || 1,
        negativeMarks: test?.negativeMarking ? (test?.negativeMarks || 0) : 0,
        options: [
          { optionLabel: 'A', optionText: 'Option 1', isCorrect: true },
          { optionLabel: 'B', optionText: 'Option 2', isCorrect: false }
        ]
      };
      const { data } = await api.post('/questions', newQuestion, auth());
      setActiveQuestionId(data.question._id);
      toast.success('Question added successfully');
      loadTest();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create question');
    }
  };

  const handleDragEndQuestion = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    const oldIndex = questions.findIndex(q => q._id === active.id);
    const newIndex = questions.findIndex(q => q._id === over.id);
    const newQuestions = arrayMove(questions, oldIndex, newIndex);
    
    // Optimistic update locally
    const newSections = test.sections.map(s => s._id === activeSectionId ? { ...s, questions: newQuestions } : s);
    setTest({ ...test, sections: newSections });
    
    try {
      await api.put('/questions/reorder', { questionIds: newQuestions.map(q => q._id) }, auth());
    } catch {
      toast.error('Failed to save question order');
      loadTest();
    }
  };

  const handleDeleteQuestion = (id, e) => {
    e.stopPropagation();
    setConfirmAction({
      isOpen: true,
      type: 'deleteQuestion',
      payload: id,
      title: 'Delete Question',
      message: 'Are you sure you want to delete this question? This cannot be undone.'
    });
  };

  const handleConfirmAction = async () => {
    const { type, payload } = confirmAction;
    setConfirmAction({ isOpen: false, type: null, payload: null, message: '', title: '' });
    
    if (type === 'deleteSection') {
      try {
        await api.delete(`/sections/${payload}`, auth());
        if (activeSectionId === payload) setActiveSectionId(null);
        toast.success('Section deleted successfully');
        loadTest();
      } catch {
        toast.error('Failed to delete section');
      }
    } else if (type === 'deleteQuestion') {
      try {
        await api.delete(`/questions/${payload}`, auth());
        if (activeQuestionId === payload) setActiveQuestionId(null);
        toast.success('Question deleted successfully');
        loadTest();
      } catch {
        toast.error('Failed to delete question');
      }
    }
  };

  // Right Panel form handler
  const activeQuestion = questions.find(q => q._id === activeQuestionId);

  const handleQuestionChange = (field, value) => {
    // Update local state optimistic
    const updatedQuestion = { ...activeQuestion, [field]: value };
    const newSections = test.sections.map(s => 
      s._id === activeSectionId 
        ? { ...s, questions: s.questions.map(q => q._id === activeQuestionId ? updatedQuestion : q) }
        : s
    );
    setTest({ ...test, sections: newSections });
  };

  const handleSaveQuestion = async () => {
    try {
      await api.put(`/questions/${activeQuestionId}`, activeQuestion, auth());
      toast.success('Question saved successfully');
      loadTest();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save question');
    }
  };

  const autoTranslate = async () => {
    if (!activeQuestion) return;
    setIsTranslating(true);
    try {
      const translateText = async (text) => {
        if (!text) return text;
        const res = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=hi&dt=t&q=${encodeURIComponent(text)}`);
        return res.data[0].map(item => item[0]).join('');
      };

      const translatedQuestionText = await translateText(activeQuestion.questionText);
      const translatedExplanation = await translateText(activeQuestion.explanation);
      
      const newOptions = activeQuestion.options.map(opt => ({ ...opt }));
      for (let i = 0; i < newOptions.length; i++) {
        newOptions[i].optionTextHi = await translateText(newOptions[i].optionText);
      }

      const updatedQuestion = { 
        ...activeQuestion, 
        questionTextHi: translatedQuestionText,
        explanationHi: translatedExplanation,
        options: newOptions
      };

      const newSections = test.sections.map(s => 
        s._id === activeSectionId 
          ? { ...s, questions: s.questions.map(q => q._id === activeQuestionId ? updatedQuestion : q) }
          : s
      );
      setTest({ ...test, sections: newSections });
      setEditorLanguage('hi');
      toast.success('Translation complete! Please review the translated text.');
    } catch (err) {
      toast.error('Failed to translate automatically. Please enter manually.');
    } finally {
      setIsTranslating(false);
    }
  };

  const handlePublish = async () => {
    try {
      await api.post(`/tests/${testId}/publish`, {}, auth());
      toast.success('Test published successfully!');
      loadTest();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not publish test');
    }
  };

  if (loading && !test) return <div className="p-10 text-center">Loading Test Builder...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-gray-100 -mx-8 -mb-8 mt-[-32px]">
      {/* Header */}
      <div className="bg-white border-b px-6 py-3 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/vkadmin/tests')} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full"><ChevronLeft size={20} /></button>
          <div>
            <h2 className="font-bold text-lg">{test?.name}</h2>
            <p className="text-xs text-gray-500">{test?.calculatedTotalQuestions || 0} Questions | {test?.calculatedTotalMarks || 0} Marks</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPreviewTest(true)} className="px-4 py-2 text-sm text-gray-600 border rounded hover:bg-gray-50 flex items-center gap-2"><Eye size={16}/> Preview Test</button>
          <button onClick={handlePublish} className="px-4 py-2 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 font-medium">Publish</button>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Col: Sections */}
        <div className="w-64 bg-white border-r flex flex-col shrink-0">
          <div className="p-4 border-b flex justify-between items-center bg-gray-50">
            <h3 className="font-semibold text-sm text-gray-700 uppercase tracking-wider">Sections</h3>
            <button onClick={handleAddSection} className="text-primary-600 hover:text-primary-800"><Plus size={18} /></button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndSection}>
              <SortableContext items={test?.sections?.map(s => s._id) || []} strategy={verticalListSortingStrategy}>
                {test?.sections?.map(section => (
                  <SortableItem 
                    key={section._id} 
                    id={section._id} 
                    isActive={activeSectionId === section._id}
                    onClick={() => { setActiveSectionId(section._id); setActiveQuestionId(null); }}
                  >
                    <div className="flex justify-between items-center group">
                      <span className="truncate text-sm font-medium">{section.name}</span>
                      <button onClick={(e) => handleDeleteSection(section._id, e)} className="text-gray-300 hover:text-red-500 hidden group-hover:block"><Trash2 size={14} /></button>
                    </div>
                  </SortableItem>
                ))}
              </SortableContext>
            </DndContext>
            {!test?.sections?.length && <p className="p-4 text-xs text-gray-400 text-center">No sections yet.</p>}
          </div>
        </div>

        {/* Center Col: Questions List */}
        <div className="w-80 bg-gray-50 border-r flex flex-col shrink-0">
          <div className="p-4 border-b flex justify-between items-center bg-white">
            <h3 className="font-semibold text-sm text-gray-700 uppercase tracking-wider">Questions</h3>
            <button onClick={handleAddQuestion} disabled={!activeSectionId} className="text-primary-600 hover:text-primary-800 disabled:opacity-50"><Plus size={18} /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {!activeSectionId ? (
              <p className="p-4 text-xs text-gray-400 text-center">Select a section to view questions.</p>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEndQuestion}>
                <SortableContext items={questions.map(q => q._id)} strategy={verticalListSortingStrategy}>
                  {questions.map((question, index) => (
                    <SortableItem 
                      key={question._id} 
                      id={question._id}
                      isActive={activeQuestionId === question._id}
                      onClick={() => setActiveQuestionId(question._id)}
                    >
                      <div className="flex justify-between items-center group w-full">
                        <span className="truncate text-sm pr-2 flex-1">Q{index + 1}. {question.questionText?.replace(/<[^>]*>?/gm, '').substring(0, 20) || 'Empty'}...</span>
                        <div className="flex gap-2 hidden group-hover:flex bg-white px-1 shadow-sm rounded">
                          <button onClick={(e) => { e.stopPropagation(); setPreviewQuestion(question); }} className="text-gray-400 hover:text-blue-500 p-1"><Eye size={14} /></button>
                          <button onClick={(e) => handleDeleteQuestion(question._id, e)} className="text-gray-400 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </SortableItem>
                  ))}
                </SortableContext>
              </DndContext>
            )}
            {activeSectionId && questions.length === 0 && <p className="p-4 text-xs text-gray-400 text-center">No questions in this section.</p>}
          </div>
        </div>

        {/* Right Col: Question Editor */}
        <div className="flex-1 bg-white overflow-y-auto p-6">
          {!activeQuestion ? (
            <div className="h-full flex items-center justify-center text-gray-400">
              Select a question to edit its details
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <div className="flex items-center gap-4">
                  <h3 className="text-xl font-bold text-gray-800">Edit Question</h3>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button onClick={() => setEditorLanguage('en')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${editorLanguage === 'en' ? 'bg-white shadow-sm text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}>English</button>
                    <button onClick={() => setEditorLanguage('hi')} className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${editorLanguage === 'hi' ? 'bg-white shadow-sm text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}>Hindi</button>
                  </div>
                  <button onClick={autoTranslate} disabled={isTranslating} className="text-xs font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50 border border-blue-200 rounded px-2 py-1">
                    {isTranslating ? 'Translating...' : 'Auto-Translate to Hindi'}
                  </button>
                </div>
                <button onClick={handleSaveQuestion} className="flex items-center gap-2 px-4 py-2 bg-primary-100 text-primary-700 font-medium rounded hover:bg-primary-200">
                  <Save size={16} /> Save Changes
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Marks</label>
                  <input type="number" min="1" value={activeQuestion.marks} onChange={e => handleQuestionChange('marks', e.target.value === '' ? '' : Number(e.target.value))} className="w-full border rounded p-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Negative Marks</label>
                  <input type="number" min="0" step="0.25" value={activeQuestion.negativeMarks} onChange={e => handleQuestionChange('negativeMarks', e.target.value === '' ? '' : Number(e.target.value))} className="w-full border rounded p-2 text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Question Text ({editorLanguage === 'hi' ? 'Hindi' : 'English'})</label>
                <textarea rows="4" value={editorLanguage === 'hi' ? (activeQuestion.questionTextHi || '') : activeQuestion.questionText} onChange={e => handleQuestionChange(editorLanguage === 'hi' ? 'questionTextHi' : 'questionText', e.target.value)} className="w-full border rounded p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none"></textarea>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Options (Select Correct Answer)</label>
                <div className="space-y-3">
                  {activeQuestion.options?.map((option, idx) => (
                    <div key={idx} className={`flex items-start gap-3 p-3 border rounded-lg ${option.isCorrect ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                      <input 
                        type="radio" 
                        name="correctAnswer" 
                        className="mt-1 w-4 h-4 text-green-600 focus:ring-green-500" 
                        checked={option.isCorrect} 
                        onChange={() => {
                          const newOptions = activeQuestion.options.map((opt, i) => ({ ...opt, isCorrect: i === idx }));
                          handleQuestionChange('options', newOptions);
                        }}
                      />
                      <div className="flex-1 flex gap-2">
                        <span className="font-bold text-gray-600 pt-1">{option.optionLabel}.</span>
                        <input 
                          value={editorLanguage === 'hi' ? (option.optionTextHi || '') : option.optionText} 
                          onChange={(e) => {
                            const newOptions = [...activeQuestion.options];
                            if (editorLanguage === 'hi') {
                              newOptions[idx].optionTextHi = e.target.value;
                            } else {
                              newOptions[idx].optionText = e.target.value;
                            }
                            handleQuestionChange('options', newOptions);
                          }}
                          className="w-full border-b border-gray-300 bg-transparent p-1 text-sm focus:border-primary-500 outline-none" 
                          placeholder={`Option text in ${editorLanguage === 'hi' ? 'Hindi' : 'English'}...`}
                        />
                      </div>
                      <button onClick={() => {
                        const newOptions = activeQuestion.options.filter((_, i) => i !== idx);
                        handleQuestionChange('options', newOptions);
                      }} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                    </div>
                  ))}
                </div>
                <button onClick={() => {
                  const label = String.fromCharCode(65 + (activeQuestion.options?.length || 0)); // A, B, C...
                  const newOptions = [...(activeQuestion.options || []), { optionLabel: label, optionText: '', isCorrect: false }];
                  handleQuestionChange('options', newOptions);
                }} className="mt-3 flex items-center gap-1 text-sm text-primary-600 font-medium hover:text-primary-800">
                  <Plus size={16}/> Add Option
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Explanation ({editorLanguage === 'hi' ? 'Hindi' : 'English'})</label>
                <textarea rows="3" value={editorLanguage === 'hi' ? (activeQuestion.explanationHi || '') : (activeQuestion.explanation || '')} onChange={e => handleQuestionChange(editorLanguage === 'hi' ? 'explanationHi' : 'explanation', e.target.value)} className="w-full border rounded p-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Provide an explanation for the correct answer..."></textarea>
              </div>
              
            </div>
          )}
        </div>
      </div>

      {/* Preview Question Modal */}
      {previewQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="border-b p-4 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold">Question Preview</h3>
              <button onClick={() => setPreviewQuestion(null)} className="text-gray-500 hover:text-gray-700">Close</button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="mb-4 text-sm text-gray-500 flex justify-between">
                <span>Marks: {previewQuestion.marks}</span>
                <span className="text-red-500">Negative: {previewQuestion.negativeMarks}</span>
              </div>
              <h4 className="text-lg font-medium text-gray-800 mb-6">{previewQuestion.questionText}</h4>
              <div className="space-y-3 mb-8">
                {previewQuestion.options?.map((opt, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 border rounded-lg ${opt.isCorrect ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${opt.isCorrect ? 'border-green-500 bg-green-500 text-white' : 'border-gray-400'}`}>
                      {opt.isCorrect && <div className="w-2 h-2 rounded-full bg-white"></div>}
                    </div>
                    <span className="font-medium">{opt.optionLabel}.</span>
                    <span>{opt.optionText}</span>
                  </div>
                ))}
              </div>
              {previewQuestion.explanation && (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                  <h5 className="font-semibold text-blue-800 mb-1">Explanation</h5>
                  <p className="text-sm text-blue-900">{previewQuestion.explanation}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full Test Preview Modal */}
      {previewTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl bg-white rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[95vh]">
            <div className="border-b p-4 flex justify-between items-center bg-gray-50">
              <h3 className="text-xl font-bold text-gray-800">Test Preview: {test?.name}</h3>
              <button onClick={() => setPreviewTest(false)} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300">Close</button>
            </div>
            <div className="p-6 overflow-y-auto bg-gray-50/50">
              {test?.sections?.map((section, sIdx) => (
                <div key={section._id} className="mb-10 last:mb-0">
                  <h4 className="text-xl font-bold text-primary-700 mb-4 pb-2 border-b-2 border-primary-100">Section {sIdx + 1}: {section.name}</h4>
                  {section.questions?.length === 0 ? (
                    <p className="text-gray-500 italic">No questions in this section.</p>
                  ) : (
                    <div className="space-y-6">
                      {section.questions?.map((q, qIdx) => (
                        <div key={q._id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                          <div className="flex justify-between items-start mb-3">
                            <span className="font-bold text-gray-700">Q{qIdx + 1}.</span>
                            <div className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {q.marks} Marks | -{q.negativeMarks}
                            </div>
                          </div>
                          <p className="text-gray-800 font-medium mb-4 whitespace-pre-wrap">{q.questionText}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                            {q.options?.map((opt, i) => (
                              <div key={i} className={`flex items-center gap-3 p-3 border rounded-lg ${opt.isCorrect ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${opt.isCorrect ? 'border-green-500 bg-green-500 text-white' : 'border-gray-400 bg-white'}`}>
                                  {opt.isCorrect && <div className="w-2 h-2 rounded-full bg-white"></div>}
                                </div>
                                <span className="font-bold text-gray-700">{opt.optionLabel}.</span>
                                <span className="text-sm text-gray-700">{opt.optionText}</span>
                              </div>
                            ))}
                          </div>
                          {q.explanation && (
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded-r-lg text-sm text-blue-800">
                              <span className="font-bold block mb-1">Explanation:</span>
                              {q.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmAction.isOpen}
        title={confirmAction.title}
        message={confirmAction.message}
        confirmText="Yes, Delete"
        onConfirm={handleConfirmAction}
        onCancel={() => setConfirmAction({ isOpen: false, type: null, payload: null, message: '', title: '' })}
      />

      {/* Section Name Modal */}
      {sectionModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={submitSection} className="w-full max-w-sm bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Create New Section</h3>
              <p className="text-sm text-gray-500 mb-4">Enter a name for the new section.</p>
              <input 
                autoFocus
                type="text" 
                placeholder="e.g. Quantitative Aptitude"
                value={sectionModal.name} 
                onChange={e => setSectionModal({...sectionModal, name: e.target.value})} 
                className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
              />
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t">
              <button type="button" onClick={() => setSectionModal({ isOpen: false, name: '' })} className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
              <button type="submit" disabled={!sectionModal.name.trim()} className="px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors">Create Section</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TestBuilder;
