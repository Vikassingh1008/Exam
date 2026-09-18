import { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const AdminQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [exams, setExams] = useState([]);
  const [tests, setTests] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    examId: '',
    testId: '',
    sectionId: '',
    questionText: '',
    questionType: 'Single MCQ',
    difficulty: 'Medium',
    options: [
      { text: '', isCorrect: true },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ],
    marks: 1,
    negativeMarks: 0.25,
    status: 'active'
  });

  const fetchData = async () => {
    try {
      const [questionsRes, examsRes, sectionsRes, testsRes] = await Promise.all([
        api.get('/questions/admin', { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } }),
        api.get('/exams'),
        api.get('/sections'),
        api.get('/tests/admin', { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } })
      ]);
      setQuestions(questionsRes.data.questions || []);
      setExams(examsRes.data.exams || []);
      setSections(sectionsRes.data.sections || []);
      setTests(testsRes.data.tests || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOptionChange = (index, field, value) => {
    const newOptions = [...formData.options];
    if (field === 'isCorrect') {
      // For Single MCQ, only one can be correct
      if (formData.questionType === 'Single MCQ') {
        newOptions.forEach(opt => opt.isCorrect = false);
      }
      newOptions[index].isCorrect = value;
    } else {
      newOptions[index][field] = value;
    }
    setFormData({ ...formData, options: newOptions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.questionType === 'Single MCQ' && formData.options.filter(option => option.isCorrect).length !== 1) {
      alert('Please select exactly one correct option.');
      return;
    }
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } };
      
      // Clean up empty options just in case, though we expect 4
      const payload = { ...formData, options: formData.options.filter(o => o.text.trim() !== '') };

      if (editingId) {
        await api.put(`/questions/${editingId}`, payload, config);
      } else {
        await api.post('/questions', payload, config);
      }
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving question');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } };
      await api.delete(`/questions/${id}`, config);
      fetchData();
    } catch (error) {
      alert('Error deleting question');
    }
  };

  const openEdit = (q) => {
    // Pad options to 4 if less exist
    let paddedOptions = [...q.options];
    while(paddedOptions.length < 4) {
      paddedOptions.push({ text: '', isCorrect: false });
    }
    setFormData({
      ...q,
      examId: q.examId?._id || q.examId,
      testId: q.testId?._id || q.testId,
      sectionId: q.sectionId?._id || q.sectionId,
      options: paddedOptions.slice(0, 4)
    });
    setEditingId(q._id);
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      examId: exams.length > 0 ? exams[0]._id : '',
      testId: '',
      sectionId: sections.length > 0 ? sections[0]._id : '',
      questionText: '',
      questionType: 'Single MCQ',
      difficulty: 'Medium',
      options: [
        { text: '', isCorrect: true },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false }
      ],
      marks: 1,
      negativeMarks: 0.25,
      status: 'active'
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Questions</h2>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus size={20} /> Add Question
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 font-semibold text-gray-600">Question</th>
                <th className="p-4 font-semibold text-gray-600">Exam</th>
                <th className="p-4 font-semibold text-gray-600">Difficulty</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {questions.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-gray-500">No questions found.</td></tr>
              ) : questions.map((q) => (
                <tr key={q._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-800 truncate max-w-md">{q.questionText}</td>
                  <td className="p-4 text-gray-600">{q.examId?.name || '-'}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${q.difficulty === 'Easy' ? 'bg-green-100 text-green-700' : q.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                      {q.difficulty}
                    </span>
                  </td>
                  <td className="p-4 flex justify-end gap-3">
                    <button onClick={() => openEdit(q)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-md"><Edit2 size={18} /></button>
                    <button onClick={() => handleDelete(q._id)} className="text-red-600 hover:bg-red-50 p-2 rounded-md"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">{editingId ? 'Edit Question' : 'Add Question'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-6 overflow-y-auto">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Exam</label>
                  <select required value={formData.examId} onChange={e => setFormData({...formData, examId: e.target.value, testId: ''})} className="w-full border border-gray-300 rounded-lg p-2.5">
                    <option value="">Select Exam</option>
                    {exams.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Test Paper</label>
                  <select required value={formData.testId} onChange={e => setFormData({...formData, testId: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5">
                    <option value="">Select Test Paper</option>
                    {tests.filter(test => (test.examId?._id || test.examId) === formData.examId).map(test => <option key={test._id} value={test._id}>{test.name}</option>)}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">Create the test paper before adding questions.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <select required value={formData.sectionId} onChange={e => setFormData({...formData, sectionId: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5">
                    <option value="">Select Section</option>
                    {sections.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Text</label>
                <textarea required rows="3" value={formData.questionText} onChange={e => setFormData({...formData, questionText: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" placeholder="Type your question here..."></textarea>
              </div>

              {/* Options Section */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <div className="mb-4"><h4 className="font-semibold text-gray-800">Options and answer key</h4><p className="mt-1 text-sm text-gray-500">Choose the one correct answer. Students cannot see this answer key until they submit the test.</p></div>
                <div className="space-y-3">
                  {formData.options.map((option, index) => {
                    const label = String.fromCharCode(65 + index); // A, B, C, D
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <span className="font-bold text-gray-600 w-6">{label}.</span>
                        <input 
                          type="text" 
                          required
                          value={option.text} 
                          onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                          placeholder={`Option ${label}`}
                          className="flex-1 border border-gray-300 rounded-lg p-2"
                        />
                        <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-gray-200">
                          <input 
                            type="radio" 
                            name="correctOption" 
                            checked={option.isCorrect} 
                            onChange={(e) => handleOptionChange(index, 'isCorrect', e.target.checked)}
                            className="w-4 h-4 text-green-600"
                          />
                          <span className="text-sm font-medium">Correct answer</span>
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                  <select value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5">
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
                  <input type="number" required value={formData.marks} onChange={e => setFormData({...formData, marks: Number(e.target.value)})} className="w-full border border-gray-300 rounded-lg p-2.5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Negative Marks</label>
                  <input type="number" step="0.01" required value={formData.negativeMarks} onChange={e => setFormData({...formData, negativeMarks: Number(e.target.value)})} className="w-full border border-gray-300 rounded-lg p-2.5" />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium transition-colors">{editingId ? 'Update Question' : 'Save Question'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminQuestions;
