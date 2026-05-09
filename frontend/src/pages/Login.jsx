import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail } from 'lucide-react';
import api from '../utils/api';
import OtpInput from '../components/OtpInput';

const Login = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Email is required');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/login-init', { email });
      setStep(2);
      toast.success('Verification code sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otpValue) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login-verify', { email, otp: otpValue });
      localStorage.setItem('makiToken', res.data.token);
      localStorage.setItem('makiUser', JSON.stringify(res.data.user));
      navigate('/dashboard');
      toast.success('Successfully logged in!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brown-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <lord-icon
            src="https://cdn.lordicon.com/ljvjsnvh.json"
            trigger="loop"
            colors="primary:#a18072,secondary:#43302b"
            style={{ width: '80px', height: '80px' }}
          ></lord-icon>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-brown-900">
          Sign in to Maki
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-brown-100">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleRequestOtp}
                className="space-y-6"
              >
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-brown-700">
                    Email address
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-brown-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 sm:text-sm border-brown-300 rounded-md py-3 border focus:ring-brown-500 focus:border-brown-500 outline-none text-brown-900"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brown-600 hover:bg-brown-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brown-500 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Sending code...' : 'Continue with Email'}
                  </button>
                </div>

                <div className="mt-4 text-center">
                  <p className="text-sm text-brown-600">
                    Don't have an account?{' '}
                    <Link to="/register" className="font-medium text-brown-600 hover:text-brown-800 underline">
                      Create one here
                    </Link>
                  </p>
                </div>
              </motion.form>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <p className="text-sm font-medium text-brown-700 mb-4">
                    We've sent a 6-digit code to <br/><span className="font-bold text-brown-900">{email}</span>
                  </p>

                  <OtpInput length={6} onComplete={handleVerifyOtp} />

                  {loading && <p className="text-brown-500 text-sm mt-4">Verifying...</p>}

                  <button
                    onClick={() => setStep(1)}
                    className="mt-6 text-sm font-medium text-brown-500 hover:text-brown-700"
                  >
                    Use a different email
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Login;
