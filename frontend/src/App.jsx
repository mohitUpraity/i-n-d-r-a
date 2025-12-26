import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import AuthCitizen from '../pages/citizen/Auth-Citizen';
import AuthOperator from '../pages/operator/Auth-Operator';
import AuthAdmin from '../pages/admin/Auth-Admin';
import IndraLanding from '../pages/LandingPage';
import ProtectedRoute from './components/ProtectedRoute';
import CitizenHome from '../pages/citizen/CitizenHome';
import ReportCreate from '../pages/citizen/Reports';
import ReportsList from '../pages/citizen/ReportsList';
import OperatorDashboard from '../pages/operator/OperatorDashboard';
import ReportView from '../pages/citizen/ReportView';
import OperatorPending from '../pages/operator/OperatorPending';
import AdminDashboard from '../pages/admin/AdminDashboard';

const App = () => {
  // ensure auth persistence is configured
  useEffect(() => {
    import('../lib/auth').then(mod => {
      if (mod && mod.initAuthPersistence) mod.initAuthPersistence();
    }).catch(err => console.warn('Could not init auth persistence', err));
  }, []);

  return (
    <>
      <Routes>
        <Route path='/' element={<IndraLanding />} />
        <Route path='/auth/citizen' element={<AuthCitizen />} />
        <Route path='/auth/operator' element={<AuthOperator />} />
        <Route path='/auth/admin' element={<AuthAdmin />} />

        {/* Protected routes */}
        <Route
          path='/citizen/home'
          element={
            <ProtectedRoute>
              <CitizenHome />
            </ProtectedRoute>
          }
        />

        <Route
          path='/report'
          element={
            <ProtectedRoute>
              <ReportCreate />
            </ProtectedRoute>
          }
        />

        <Route
          path='/reports'
          element={
            <ProtectedRoute>
              <ReportsList />
            </ProtectedRoute>
          }
        />

        <Route
          path='/reports/:id'
          element={
            <ProtectedRoute>
              <ReportView />
            </ProtectedRoute>
          }
        />

        <Route
          path='/operator/dashboard'
          element={
            <ProtectedRoute requiredRole="operator">
              <OperatorDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path='/operator/pending'
          element={
            <ProtectedRoute requiredRole="operator">
              <OperatorPending />
            </ProtectedRoute>
          }
        />

        <Route
          path='/admin'
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
};

export default App;
