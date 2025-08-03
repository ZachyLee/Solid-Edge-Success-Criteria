import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const [email, setEmail] = useState('');
  const [language, setLanguage] = useState('EN');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleStart = async () => {
    if (!email.trim()) {
      alert('Please enter your email address');
      return;
    }

    if (!email.includes('@')) {
      alert('Please enter a valid email address');
      return;
    }

    setLoading(true);

    // Store user info in sessionStorage for the checklist
    sessionStorage.setItem('userEmail', email);
    sessionStorage.setItem('userLanguage', language);

    // Navigate to checklist
    navigate('/checklist');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="neumo-card max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Solid Edge Success Criteria Checklist
          </h1>
          <p className="text-gray-600">
            {language === 'EN' 
              ? 'Evaluate your Solid Edge implementation with our comprehensive assessment tool.'
              : 'Evaluasi implementasi Solid Edge Anda dengan alat penilaian komprehensif kami.'
            }
          </p>
        </div>

        <div className="space-y-6">
          {/* Language Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'EN' ? 'Select Language' : 'Pilih Bahasa'}
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="neumo-select text-gray-800"
            >
              <option value="EN">English</option>
              <option value="ID">Bahasa Indonesia</option>
            </select>
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {language === 'EN' ? 'Email Address' : 'Alamat Email'}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={language === 'EN' ? 'Enter your email' : 'Masukkan email Anda'}
              className="neumo-input text-gray-800"
              required
            />
          </div>

          {/* Start Button */}
          <button
            onClick={handleStart}
            disabled={loading}
            className="neumo-button primary w-full py-4 text-white font-semibold disabled:opacity-60"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="neumo-spinner mr-2"></div>
                {language === 'EN' ? 'Loading...' : 'Memuat...'}
              </div>
            ) : (
              language === 'EN' ? 'Start Assessment' : 'Mulai Penilaian'
            )}
          </button>
        </div>

        {/* Admin Link */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/admin')}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            {language === 'EN' ? 'Admin Dashboard' : 'Dashboard Admin'}
          </button>
        </div>

        {/* Info Card */}
        <div className="mt-6 p-4 bg-blue-50 rounded-2xl border-l-4 border-blue-400">
          <h3 className="text-sm font-medium text-blue-800 mb-2">
            {language === 'EN' ? 'Assessment Overview' : 'Ikhtisar Penilaian'}
          </h3>
          <p className="text-xs text-blue-700">
            {language === 'EN' 
              ? 'This assessment evaluates various aspects of your Solid Edge implementation. You can export your results as PDF upon completion.'
              : 'Penilaian ini mengevaluasi berbagai aspek implementasi Solid Edge Anda. Anda dapat mengekspor hasil sebagai PDF setelah selesai.'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;