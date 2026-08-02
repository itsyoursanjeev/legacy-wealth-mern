import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ReCAPTCHA from 'react-google-recaptcha';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

const Signup = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const recaptchaRef = useRef(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', referralCode: '' });
  const [captchaToken, setCaptchaToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [referralStatus, setReferralStatus] = useState(null); // { valid, referrerName } | null

  const handleReferralBlur = async () => {
    const code = form.referralCode.trim();
    if (!code) {
      setReferralStatus(null);
      return;
    }
    try {
      const { data } = await api.get(`/referral/validate/${code}`);
      setReferralStatus(data.valid ? { valid: true, referrerName: data.referrerName } : { valid: false });
    } catch {
      setReferralStatus({ valid: false });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (SITE_KEY && !captchaToken) {
      toast.error('Please complete the captcha');
      return;
    }
    setLoading(true);
    try {
      await register({ ...form, captchaToken });
      toast.success('Account created!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Signup failed');
      // Reset captcha on failure so user can retry
      recaptchaRef.current?.reset();
      setCaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-cream px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl text-navy mb-2">Create your account</h1>
          <p className="text-ink/60">Join the institute. Trade with logic.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-navy-100 p-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Full Name</label>
            <input
              required
              type="text"
              className="input-field"
              value={form.name}
              onChange={e => setForm({...form, name: e.target.value})}
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Email</label>
            <input
              required
              type="email"
              className="input-field"
              value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Mobile</label>
            <input
              required
              type="tel"
              pattern="[6-9][0-9]{9}"
              maxLength={10}
              className="input-field"
              value={form.phone}
              onChange={e => setForm({...form, phone: e.target.value})}
              placeholder="10-digit Indian mobile"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Password</label>
            <input
              required
              type="password"
              minLength={8}
              className="input-field"
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              placeholder="Minimum 8 characters"
            />
          </div>

          <div>
            <input
              type="text"
              className="input-field"
              value={form.referralCode}
              onChange={e => setForm({...form, referralCode: e.target.value})}
              onBlur={handleReferralBlur}
              placeholder="Referral code (optional)"
            />
            {referralStatus?.valid && (
              <p className="text-xs text-green-600 mt-1.5">✓ Referred by {referralStatus.referrerName} — you'll both get benefits!</p>
            )}
            {referralStatus?.valid === false && (
              <p className="text-xs text-red-600 mt-1.5">✗ Invalid referral code</p>
            )}
          </div>

          {SITE_KEY && (
            <div className="flex justify-center pt-1">
              <ReCAPTCHA
                ref={recaptchaRef}
                sitekey={SITE_KEY}
                onChange={token => setCaptchaToken(token)}
                onExpired={() => setCaptchaToken(null)}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (SITE_KEY && !captchaToken)}
            className="btn-gold w-full !py-3.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating…' : 'Create Account'}
          </button>

          <p className="text-center text-sm text-ink/60 pt-2">
            Already have an account?{' '}
            <Link to="/login" className="text-gold-dark hover:underline font-medium">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
