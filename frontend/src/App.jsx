import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import AdminLayout from './layouts/AdminLayout';
import AdminCategories from './pages/admin/AdminCategories';
import AdminExams from './pages/admin/AdminExams';
import AdminTests from './pages/admin/AdminTests';
import TestBuilder from './pages/admin/TestBuilder';

import StudentLayout from './layouts/StudentLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentExamView from './pages/student/StudentExamView';
import StudentResult from './pages/student/StudentResult';
import StudentHistory from './pages/student/StudentHistory';

import AdminLogin from './pages/admin/AdminLogin';
import AdminRegister from './pages/admin/AdminRegister';
import StudentLogin from './pages/student/StudentLogin';
import StudentRegister from './pages/student/StudentRegister';
import ForgotPassword from './pages/student/ForgotPassword';
import ResetPassword from './pages/student/ResetPassword';

// Public Pages
const LandingPage = () => <div className="p-8 text-center"><h1 className="text-4xl font-bold text-primary-600">ExamSetu</h1><p className="mt-4">Prepare Smarter. Practice Better. Score Higher.</p></div>;

// Protected Student Pages
// We now import StudentDashboard from its file

// Protected Admin Pages
const AdminDashboard = () => <div><h2 className="text-2xl font-bold text-gray-800 mb-6">Dashboard Overview</h2><p className="text-gray-600">Welcome to ExamSetu Admin Panel.</p></div>;

function App() {
  return (
    <Router>
      <Toaster position="top-center" />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/student/exams" replace />} />
        <Route path="/login" element={<StudentLogin />} />
        <Route path="/register" element={<StudentRegister />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/vkadmin/login" element={<AdminLogin />} />
        <Route path="/vkadmin/register" element={<AdminRegister />} />

        {/* Student Protected Routes */}
        <Route path="/student/exam/:id" element={<StudentExamView />} />
        <Route path="/student/results/:id" element={<StudentResult />} />
        <Route path="/student" element={<StudentLayout />}>
          <Route index element={<Navigate to="/student/exams" replace />} />
          <Route path="dashboard" element={<Navigate to="/student/exams" replace />} />
          <Route path="exams" element={<StudentDashboard />} />
          <Route path="history" element={<StudentHistory />} />
          {/* other student routes can go here later */}
        </Route>
        
        <Route path="/vkadmin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/vkadmin/categories" replace />} />
          <Route path="dashboard" element={<Navigate to="/vkadmin/categories" replace />} />
          <Route path="categories" element={<AdminCategories />} />
          <Route path="exams" element={<AdminExams />} />
          <Route path="tests" element={<AdminTests />} />
          <Route path="tests/:testId/builder" element={<TestBuilder />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
