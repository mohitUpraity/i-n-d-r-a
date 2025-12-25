import { Link } from 'react-router-dom';
import { logOut } from '../lib/auth';

export default function OperatorDashboard() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-2xl p-8 bg-white rounded shadow">
        <h1 className="text-2xl font-bold mb-4">Operator Dashboard</h1>
        <p className="text-gray-700 mb-4">Protected operator dashboard (sample placeholder)</p>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-red-500 text-white rounded" onClick={() => logOut()}>Sign out</button>
          <Link to="/" className="px-4 py-2 border rounded">Back to Landing</Link>
        </div>
      </div>
    </div>
  );
}