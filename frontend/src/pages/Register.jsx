import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Calendar, MapPin, Hash } from 'lucide-react';
import api from '../utils/api';
import OtpInput from '../components/OtpInput';
import axios from 'axios';

const Register = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [addressQuery, setAddressQuery] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState([]);

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: '',
    dob: '',
    address: '',
    email: '',
    username: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => {
    setError('');
    if (step === 1) {
      if (!formData.firstName || !formData.lastName || !formData.gender) {
        return setError('Please fill all fields');
      }
    }
    if (step === 2) {
      if (!formData.dob || !formData.address) {
        return setError('Please fill all fields');
      }
    }
    if (step === 3) {
      if (!formData.email || !formData.username) {
        return setError('Please fill all fields');
      }
      handleRequestOtp();
      return;
    }
    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  // Address Auto-complete using OpenStreetMap Nominatim
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (addressQuery.length > 2) {
        axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${addressQuery}&limit=5`)
          .then(res => setAddressSuggestions(res.data))
          .catch(err => console.error(err));
      } else {
        setAddressSuggestions([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [addressQuery]);

  const selectAddress = (addr) => {
    setFormData({ ...formData, address: addr });
    setAddressQuery(addr);
    setAddressSuggestions([]);
  };

  const handleRequestOtp = async () => {
    setLoading(true);
    setError('');
    try {
      await api.post('/auth/register-init', formData);
      setStep(4);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (otpValue) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/register-verify', { email: formData.email, otp: otpValue });
      localStorage.setItem('makiToken', res.data.token);
      localStorage.setItem('makiUser', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brown-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <lord-icon
            src={step === 4 ? "https://cdn.lordicon.com/diihvcfp.json" : "https://cdn.lordicon.com/dxjqoygy.json"}
            trigger="loop"
            colors="primary:#a18072,secondary:#43302b"
            style={{ width: '80px', height: '80px' }}
          ></lord-icon>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-brown-900">
          Create Maki Account
        </h2>

        {/* Progress Bar */}
        <div className="mt-6 flex justify-center gap-2">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`h-2 w-12 rounded-full ${step >= s ? 'bg-brown-500' : 'bg-brown-200'}`} />
          ))}
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-brown-100 min-h-[400px] flex flex-col justify-center">
          <AnimatePresence mode="wait">

            {/* Step 1: Personal Info */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-brown-700">First Name</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-brown-400" />
                    </div>
                    <input
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="block w-full pl-10 sm:text-sm border-brown-300 rounded-md py-3 border focus:ring-brown-500 focus:border-brown-500 outline-none text-brown-900"
                      placeholder="Jane"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brown-700">Last Name</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-brown-400" />
                    </div>
                    <input
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="block w-full pl-10 sm:text-sm border-brown-300 rounded-md py-3 border focus:ring-brown-500 focus:border-brown-500 outline-none text-brown-900"
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brown-700">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="mt-1 block w-full pl-3 pr-10 py-3 text-base border-brown-300 focus:outline-none focus:ring-brown-500 focus:border-brown-500 sm:text-sm rounded-md border text-brown-900 bg-white"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </motion.div>
            )}

            {/* Step 2: Demographics */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-brown-700">Date of Birth</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-brown-400" />
                    </div>
                    <input
                      type="date"
                      name="dob"
                      value={formData.dob}
                      onChange={handleChange}
                      className="block w-full pl-10 sm:text-sm border-brown-300 rounded-md py-3 border focus:ring-brown-500 focus:border-brown-500 outline-none text-brown-900"
                    />
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-brown-700">Address</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-5 w-5 text-brown-400" />
                    </div>
                    <input
                      type="text"
                      value={addressQuery}
                      onChange={(e) => {
                        setAddressQuery(e.target.value);
                        handleChange({ target: { name: 'address', value: e.target.value }});
                      }}
                      className="block w-full pl-10 sm:text-sm border-brown-300 rounded-md py-3 border focus:ring-brown-500 focus:border-brown-500 outline-none text-brown-900"
                      placeholder="Start typing your address..."
                    />
                  </div>
                  {addressSuggestions.length > 0 && (
                    <ul className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                      {addressSuggestions.map((addr) => (
                        <li
                          key={addr.place_id}
                          className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-brown-50 text-brown-900"
                          onClick={() => selectAddress(addr.display_name)}
                        >
                          {addr.display_name}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 3: Account Info */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-sm font-medium text-brown-700">Email</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-brown-400" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="block w-full pl-10 sm:text-sm border-brown-300 rounded-md py-3 border focus:ring-brown-500 focus:border-brown-500 outline-none text-brown-900"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brown-700">Username</label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Hash className="h-5 w-5 text-brown-400" />
                    </div>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      className="block w-full pl-10 sm:text-sm border-brown-300 rounded-md py-3 border focus:ring-brown-500 focus:border-brown-500 outline-none text-brown-900"
                      placeholder="janedoe123"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: OTP Verification */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <p className="text-sm font-medium text-brown-700 mb-6">
                    We've sent a 6-digit verification code to <br/><span className="font-bold text-brown-900">{formData.email}</span>
                  </p>

                  <OtpInput length={6} onComplete={handleVerifyOtp} />

                  {loading && <p className="text-brown-500 text-sm mt-4">Verifying...</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && <p className="text-red-500 text-sm text-center mt-4">{error}</p>}

          {/* Navigation Buttons */}
          <div className="mt-8 flex flex-col gap-4">
            <div className="flex justify-between gap-4 w-full">
              {step > 1 && step < 4 && (
                <button
                  onClick={prevStep}
                  className="w-full flex justify-center py-3 px-4 border border-brown-300 rounded-md shadow-sm text-sm font-medium text-brown-700 bg-white hover:bg-brown-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brown-500 transition-colors"
                >
                  Back
                </button>
              )}

              {step < 4 && (
                <button
                  onClick={nextStep}
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-brown-600 hover:bg-brown-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brown-500 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Processing...' : (step === 3 ? 'Send Verification Code' : 'Next Step')}
                </button>
              )}
            </div>

            {step === 1 && (
              <div className="text-center mt-2">
                <p className="text-sm text-brown-600">
                  Already have an account?{' '}
                  <Link to="/login" className="font-medium text-brown-600 hover:text-brown-800 underline">
                    Sign in here
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
