import { useState } from 'react';
import api from '../../api/axiosInstance';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await api.post('/auth/forgot-password', { email });
      if (res.data.success) {
        setMessage('Password reset email sent. Please check your inbox.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl shadow-slate-200 p-8 sm:p-10">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-800">Forgot Password</h2>
          <p className="text-slate-500 mt-2">Enter your email to receive a reset link</p>
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

        {!message ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                placeholder="student@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        ) : (
          <div className="text-center">
            <Link to="/login" className="inline-block mt-4 py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors">
              Return to Login
            </Link>
          </div>
        )}
        
        {!message && (
          <p className="mt-8 text-center text-sm font-medium text-slate-600">
            Remember your password? <Link to="/login" className="text-blue-600 hover:underline">Log in</Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
