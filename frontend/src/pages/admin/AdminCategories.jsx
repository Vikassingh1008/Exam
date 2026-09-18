import { useState, useEffect } from 'react';
import api from '../../api/axiosInstance';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/ConfirmModal';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', status: 'active' });
  const [editingId, setEditingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null });

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.categories);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } };
      
      if (editingId) {
        await api.put(`/categories/${editingId}`, formData, config);
        toast.success('Category updated successfully');
      } else {
        await api.post('/categories', formData, config);
        toast.success('Category created successfully');
      }
      setIsModalOpen(false);
      setFormData({ name: '', slug: '', description: '', status: 'active' });
      setEditingId(null);
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error saving category');
    }
  };

  const handleDelete = (id) => {
    setConfirmDelete({ isOpen: true, id });
  };

  const handleConfirmDelete = async () => {
    const id = confirmDelete.id;
    setConfirmDelete({ isOpen: false, id: null });
    try {
      const config = { headers: { Authorization: `Bearer ${localStorage.getItem('adminToken')}` } };
      await api.delete(`/categories/${id}`, config);
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      toast.error('Error deleting category');
    }
  };

  const openEdit = (cat) => {
    setFormData({
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      status: cat.status
    });
    setEditingId(cat._id);
    setIsModalOpen(true);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Exam Categories</h2>
        <button 
          onClick={() => { setEditingId(null); setFormData({ name: '', slug: '', description: '', status: 'active' }); setIsModalOpen(true); }}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus size={20} /> Create Category
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 font-semibold text-gray-600">Category Name</th>
                <th className="p-4 font-semibold text-gray-600">Slug</th>
                <th className="p-4 font-semibold text-gray-600">Status</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-gray-500">No categories found.</td></tr>
              ) : categories.map((cat) => (
                <tr key={cat._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-800">{cat.name}</td>
                  <td className="p-4 text-gray-600">{cat.slug}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${cat.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {cat.status}
                    </span>
                  </td>
                  <td className="p-4 flex justify-end gap-3">
                    <button onClick={() => openEdit(cat)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-md"><Edit2 size={18} /></button>
                    <button onClick={() => handleDelete(cat._id)} className="text-red-600 hover:bg-red-50 p-2 rounded-md"><Trash2 size={18} /></button>
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
              <h3 className="text-xl font-bold">{editingId ? 'Edit Category' : 'Create Category'}</h3>
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

      <ConfirmModal 
        isOpen={confirmDelete.isOpen}
        title="Delete Category"
        message="Are you sure you want to delete this category? Tests linked to this category may lose their grouping."
        confirmText="Yes, Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete({ isOpen: false, id: null })}
      />
    </div>
  );
};

export default AdminCategories;
