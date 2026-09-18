import { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const AdminExams = () => {
  const [exams, setExams] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', category: '', status: 'active' });
  const [editingId, setEditingId] = useState(null);

  const fetchData = async () => {
    try {
      const [examsRes, categoriesRes] = await Promise.all([
        api.get('/exams'),
        api.get('/categories')
      ]);
      setExams(examsRes.data.exams);
      setCategories(categoriesRes.data.categories);
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
      const token = 'MOCK_TOKEN'; // We'll implement actual token passing later or use interceptor
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } };
      
      const payload = { ...formData };
      if (!payload.category) {
        delete payload.category;
      }
      
      if (editingId) {
        await api.put(`/exams/${editingId}`, payload, config);
      } else {
        await api.post('/exams', payload, config);
      }
      setIsModalOpen(false);
      setFormData({ name: '', slug: '', description: '', category: '', status: 'active' });
      setEditingId(null);
      fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Error saving exam');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) return;
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } };
      await api.delete(`/exams/${id}`, config);
      fetchData();
    } catch (error) {
      alert('Error deleting exam');
    }
  };

  const openEdit = (exam) => {
    setFormData(exam);
    setEditingId(exam._id);
    setIsModalOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Manage Exams</h2>
        <button 
          onClick={() => { setEditingId(null); setFormData({ name: '', slug: '', description: '', category: '', status: 'active' }); setIsModalOpen(true); }}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} /> Create Exam
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 font-semibold text-gray-600">Exam Name</th>
                <th className="p-4 font-semibold text-gray-600">Category</th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-gray-500">No exams found.</td></tr>
              ) : exams.map((exam) => (
                <tr key={exam._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-800">{exam.name}</td>
                  <td className="p-4 text-gray-600">{categories.find(c => c._id === exam.category)?.name || exam.category || '-'}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${exam.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {exam.status}
                    </span>
                  </td>
                  <td className="p-4 flex justify-end gap-3">
                    <button onClick={() => openEdit(exam)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-md"><Edit2 size={18} /></button>
                    <button onClick={() => handleDelete(exam._id)} className="text-red-600 hover:bg-red-50 p-2 rounded-md"><Trash2 size={18} /></button>
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
              <h3 className="text-xl font-bold">{editingId ? 'Edit Exam' : 'Create Exam'}</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-')})} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
                <input required type="text" value={formData.slug} onChange={e => setFormData({...formData, slug: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500">
                  <option value="">No Category</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
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

export default AdminExams;
