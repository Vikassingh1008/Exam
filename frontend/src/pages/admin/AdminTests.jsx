import { useEffect, useState } from 'react';
import api from '../../api/axiosInstance';
import { ClipboardList, Edit2, Plus, Trash2, Settings, Eye, CheckCircle, Copy } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';

const emptyForm = { name: '', examName: '', testType: 'Full Mock Test', description: '', duration: 60, totalMarks: 100, negativeMarking: false, marksPerQuestion: 1, negativeMarks: 0, language: 'English', status: 'draft' };
const auth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } });

const AdminTests = () => {
  const [tests, setTests] = useState([]); 
  const [exams, setExams] = useState([]); 
  const [form, setForm] = useState(emptyForm); 
  const [editing, setEditing] = useState(null); 
  const [open, setOpen] = useState(false); 
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });
  const navigate = useNavigate();

  const load = async () => { 
    try { 
      const [testRes, examRes] = await Promise.all([
        api.get('/tests/admin', auth()), 
        api.get('/exams')
      ]); 
      setTests(testRes.data.tests || []); 
      setExams(examRes.data.exams || []); 
    } catch (error) { 
      console.error(error); 
    } finally { 
      setLoading(false); 
    } 
  };

  useEffect(() => { load(); }, []);

  const save = async (event) => { 
    event.preventDefault(); 
    try { 
      // Auto populate examName based on selected exam if it's stored in form.examId (temporary holding)
      const selectedExam = exams.find(e => e._id === form.examId);
      const dataToSave = { ...form, examName: selectedExam ? selectedExam.name : form.examName || 'Unknown Exam' };
      
      editing ? await api.put(`/tests/${editing}`, dataToSave, auth()) : await api.post('/tests', dataToSave, auth()); 
      setOpen(false); 
      setEditing(null); 
      setForm(emptyForm); 
      toast.success(editing ? 'Test paper updated successfully' : 'Test paper created successfully');
      load(); 
    } catch (error) { 
      toast.error(error.response?.data?.message || 'Test paper could not be saved'); 
    } 
  };

  const edit = (test) => { 
    setEditing(test._id); 
    setForm({ ...emptyForm, ...test, examId: exams.find(e => e.name === test.examName)?._id || '' }); 
    setOpen(true); 
  };

  const remove = (id) => { 
    setConfirmDelete({ isOpen: true, id });
  };

  const handleConfirmDelete = async () => {
    const id = confirmDelete.id;
    setConfirmDelete({ isOpen: false, id: null });
    try { 
      await api.delete(`/tests/${id}`, auth()); 
      toast.success('Test paper deleted successfully');
      load(); 
    } catch { 
      toast.error('Test paper could not be deleted'); 
    } 
  };

  const publish = async (id) => {
    try {
      await api.post(`/tests/${id}/publish`, {}, auth());
      toast.success('Test published successfully!');
      load();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not publish test');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Test Papers</h2>
          <p className="mt-1 text-sm text-gray-500">Manage all test papers, configure sections, and add questions.</p>
        </div>
        <button onClick={() => { setForm({ ...emptyForm, examId: exams[0]?._id || '' }); setEditing(null); setOpen(true); }} className="flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-white hover:bg-primary-700">
          <Plus size={19} /> Create test paper
        </button>
      </div>

      {loading ? (
        <p className="py-12 text-center text-gray-500">Loading test papers…</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-sm text-gray-600">
              <tr>
                <th className="p-4">Test Paper Name</th>
                <th className="p-4">Exam Name</th>
                <th className="p-4">Total Questions / Marks</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tests.length ? tests.map(test => (
                <tr key={test._id} className="border-t border-gray-100">
                  <td className="p-4 font-medium text-gray-800">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex rounded bg-primary-50 p-1 text-primary-600"><ClipboardList size={15} /></span>
                      {test.name}
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">{test.examName || '-'}</td>
                  <td className="p-4 text-gray-600">
                    <span className="font-semibold text-gray-800">{test.questions?.length || 0}</span> Qs / <span className="font-semibold text-gray-800">{test.totalMarks}</span> Marks
                  </td>
                  <td className="p-4 text-gray-600">{test.duration} min</td>
                  <td className="p-4">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${test.status === 'published' ? 'bg-green-100 text-green-700' : test.status === 'archived' ? 'bg-gray-100 text-gray-700' : 'bg-amber-100 text-amber-700'}`}>
                      {test.status}
                    </span>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-1">
                    <button onClick={() => navigate(`/vkadmin/tests/${test._id}/builder`)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded" title="Manage Sections & Questions">
                      <Settings size={17} />
                    </button>
                    <button onClick={() => publish(test._id)} className="p-2 text-green-600 hover:bg-green-50 rounded" title="Publish">
                      <CheckCircle size={17} />
                    </button>
                    <button onClick={() => edit(test)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Edit Info">
                      <Edit2 size={17} />
                    </button>
                    <button onClick={() => remove(test._id)} className="p-2 text-red-600 hover:bg-red-50 rounded" title="Delete">
                      <Trash2 size={17} />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-gray-500">No test papers found. Create one to get started.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <form onSubmit={save} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white shadow-xl">
            <div className="border-b p-6 bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-800">{editing ? 'Edit Test Paper' : 'Create New Test Paper'}</h3>
              <p className="text-sm text-gray-500 mt-1">Configure the details and settings for your test paper below.</p>
            </div>
            <div className="grid gap-5 p-6 sm:grid-cols-2">
              <label className="text-sm font-medium text-gray-700 sm:col-span-2">Test paper name
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1.5 w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all" placeholder="e.g. UP Police Mock Test 1" />
              </label>
              
              <label className="text-sm font-medium text-gray-700">Select Exam / Category
                <select required value={form.examId || ''} onChange={e => setForm({ ...form, examId: e.target.value })} className="mt-1.5 w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all bg-white">
                  <option value="">Select exam</option>
                  {exams.map(exam => <option key={exam._id} value={exam._id}>{exam.name}</option>)}
                </select>
              </label>
              
              <label className="text-sm font-medium text-gray-700">Paper type
                <select value={form.testType} onChange={e => setForm({ ...form, testType: e.target.value })} className="mt-1.5 w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all bg-white">
                  <option>Full Mock Test</option>
                  <option>Section Test</option>
                  <option>Practice Test</option>
                  <option>Previous Year Paper</option>
                </select>
              </label>

              <label className="text-sm font-medium text-gray-700">Duration (minutes)
                <input min="1" required type="number" value={form.duration} onChange={e => setForm({ ...form, duration: Number(e.target.value) })} className="mt-1.5 w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all" />
              </label>

              <label className="text-sm font-medium text-gray-700">Total marks
                <input min="1" required type="number" value={form.totalMarks} onChange={e => setForm({ ...form, totalMarks: Number(e.target.value) })} className="mt-1.5 w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all" />
              </label>

              <label className="text-sm font-medium text-gray-700">Marks per question
                <input min="1" type="number" step="any" value={form.marksPerQuestion} onChange={e => setForm({ ...form, marksPerQuestion: Number(e.target.value) })} className="mt-1.5 w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all" />
              </label>

              <label className="text-sm font-medium text-gray-700">Negative marking
                <select value={form.negativeMarking ? 'yes' : 'no'} onChange={e => setForm({ ...form, negativeMarking: e.target.value === 'yes' })} className="mt-1.5 w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all bg-white">
                  <option value="no">No</option>
                  <option value="yes">Yes</option>
                </select>
              </label>

              {form.negativeMarking && (
                <label className="text-sm font-medium text-gray-700">Negative marks
                  <input min="0" type="number" step="any" value={form.negativeMarks} onChange={e => setForm({ ...form, negativeMarks: Number(e.target.value) })} className="mt-1.5 w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all" />
                </label>
              )}

              <label className={`text-sm font-medium text-gray-700 ${form.negativeMarking ? 'sm:col-span-2' : ''}`}>Instructions / Description
                <textarea value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1.5 w-full rounded-lg border border-gray-300 p-2.5 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all" rows="3" />
              </label>
            </div>
            <div className="flex justify-end gap-3 border-t p-5 bg-gray-50/50">
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg px-5 py-2 text-gray-600 font-medium hover:bg-gray-200 transition-colors">Cancel</button>
              <button className="rounded-lg bg-primary-600 px-5 py-2 font-medium text-white shadow-sm hover:bg-primary-700 transition-colors">Save test paper</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmDelete.isOpen}
        title="Delete Test Paper"
        message="Are you sure you want to delete this test paper? This action cannot be undone."
        confirmText="Yes, Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null })}
      />
    </div>
  );
};

export default AdminTests;
