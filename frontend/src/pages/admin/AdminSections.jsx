import { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const AdminSections = () => {
  const [sections, setSections] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', examId: '', description: '', status: 'active', order: 0 });
  const [editingId, setEditingId] = useState(null);

  const fetchData = async () => {
    try {
      const [secRes, examRes] = await Promise.all([
        api.get('/sections'),
        api.get('/exams')
      ]);
      setSections(secRes.data.sections);
      setExams(examRes.data.exams);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } };
      
      if (editingId) {
        await api.put(`/sections/${editingId}`, formData, config);
      } else {
        await api.post('/sections', formData, config);
      }
      setIsModalOpen(false);
      setFormData({ name: '', examId: '', description: '', status: 'active', order: 0 });
      setEditingId(null);
      fetchData(); // reload
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving section');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this section?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } };
      await api.delete(`/sections/${id}`, config);
      fetchData();
    } catch (error) {
      alert('Error deleting section');
    }
  };

  const openEdit = (section) => {
    setFormData({
      name: section.name,
      examId: section.examId._id,
      description: section.description || '',
      status: section.status,
      order: section.order
    });
    setEditingId(section._id);
    setIsModalOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Sections</h2>
        <button 
          onClick={() => { setEditingId(null); setFormData({ name: '', examId: '', description: '', status: 'active', order: 0 }); setIsModalOpen(true); }}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} /> Add Section
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 font-semibold text-gray-600">Section Name</th>
                <th className="p-4 font-semibold text-gray-600">Exam</th>
                <th className="p-4 font-semibold text-gray-600">Order</th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sections.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No sections found.</td></tr>
              ) : sections.map((section) => (
                <tr key={section._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-800">{section.name}</td>
                  <td className="p-4 text-gray-600">{section.examId?.name || '-'}</td>
                  <td className="p-4 text-gray-600">{section.order}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${section.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {section.status}
                    </span>
                  </td>
                  <td className="p-4 flex justify-end gap-3">
                    <button onClick={() => openEdit(section)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-md"><Edit2 size={18} /></button>
                    <button onClick={() => handleDelete(section._id)} className="text-red-600 hover:bg-red-50 p-2 rounded-md"><Trash2 size={18} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold">{editingId ? 'Edit Section' : 'Add Section'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Exam</label>
                <select required value={formData.examId} onChange={e => setFormData({...formData, examId: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500">
                  <option value="" disabled>-- Select Exam --</option>
                  {exams.map(ex => <option key={ex._id} value={ex._id}>{ex.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
                <input type="number" value={formData.order} onChange={e => setFormData({...formData, order: Number(e.target.value)})} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium">{editingId ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSections;
