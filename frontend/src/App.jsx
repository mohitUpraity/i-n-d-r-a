import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthCitizen from '../pages/Auth-Citizen';
import AuthOperator from '../pages/Auth-Operator';
import IndraLanding from '../pages/LandingPage';
import ProtectedRoute from './components/ProtectedRoute';
import CitizenHome from '../pages/CitizenHome';
import OperatorDashboard from '../pages/OperatorDashboard';

const App = () => {
  // ensure auth persistence is configured
  useEffect(() => {
    import('../lib/auth').then(mod => {
      if (mod && mod.initAuthPersistence) mod.initAuthPersistence();
    }).catch(err => console.warn('Could not init auth persistence', err));
  }, []);

  return (
    <Router>
      <Routes>
        <Route path='/' element={<IndraLanding />} />
        <Route path='/auth/citizen' element={<AuthCitizen />} />
        <Route path='/auth/operator' element={<AuthOperator />} />

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
          path='/operator/dashboard'
          element={
            <ProtectedRoute requiredRole="operator">
              <OperatorDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
