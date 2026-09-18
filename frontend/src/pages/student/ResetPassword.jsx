import { useState } from 'react';
import api from '../../api/axiosInstance';
import { useNavigate, useParams, Link } from 'react-router-dom';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { token } = useParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);

    try {
      const res = await api.put(`/auth/reset-password/${token}`, { password });
      
      if (res.data.success) {
        setMessage('Password has been reset successfully!');
        
        // Save the new token and log them in
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('userInfo', JSON.stringify(res.data.user));
        
        setTimeout(() => {
          navigate('/student/dashboard');
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link might be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-slate-200 p-8 sm:p-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800">Reset Password</h2>
          <p className="text-slate-500 mt-2">Enter your new password below</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 text-sm font-medium">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-green-50 text-green-700 p-4 rounded-xl mb-6 text-sm font-medium border border-green-200">
            {message}
          </div>
        )}

        {!message && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">New Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
        
        <p className="mt-8 text-center text-sm font-medium text-slate-600">
          <Link to="/login" className="text-blue-600 hover:underline">Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ResetPassword;
