import React from 'react';
import { auth } from '../../lib/firebase';

export default function OperatorPending() {
  return (
    <div className="max-w-xl mx-auto p-8 text-center">
      <h1 className="text-2xl font-semibold mb-4">Account Pending Approval</h1>
      <p className="text-gray-600 mb-6">Your operator account has been received and is awaiting approval by an administrator. You will be notified once your account is approved.</p>
      <div className="flex justify-center gap-4">
        <button onClick={() => auth.signOut()} className="px-4 py-2 bg-red-600 text-white rounded">Sign out</button>
      </div>
    </div>
  );
}
