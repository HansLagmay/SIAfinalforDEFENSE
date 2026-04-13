import { useState, useEffect, useRef } from 'react';
import { customerAuthAPI } from '../../services/api';
import CountdownTimer from '../shared/CountdownTimer';

interface PhoneVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
  phone: string;
}

export const PhoneVerificationModal = ({
  isOpen,
  onClose,
  onVerified,
  phone
}: PhoneVerificationModalProps) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [showTimer, setShowTimer] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(300);
  const [timerKey, setTimerKey] = useState(0);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const getCooldownStorageKey = () => {
    const userRaw = localStorage.getItem('customer_user');
    if (!userRaw) return `otp_cooldown_${phone}`;
    try {
      const user = JSON.parse(userRaw);
      return `otp_cooldown_${user.id || phone}`;
    } catch (_error) {
      return `otp_cooldown_${phone}`;
    }
  };

  const setCooldown = (seconds: number) => {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const cooldownEndAt = Date.now() + safeSeconds * 1000;
    localStorage.setItem(getCooldownStorageKey(), String(cooldownEndAt));
    setCountdownSeconds(safeSeconds);
    setShowTimer(safeSeconds > 0);
    setTimerKey((prev) => prev + 1);
  };

  const restoreCooldown = () => {
    const cooldownValue = localStorage.getItem(getCooldownStorageKey());
    if (!cooldownValue) return false;

    const cooldownEndAt = Number(cooldownValue);
    if (!Number.isFinite(cooldownEndAt)) {
      localStorage.removeItem(getCooldownStorageKey());
      return false;
    }

    const remainingSeconds = Math.ceil((cooldownEndAt - Date.now()) / 1000);
    if (remainingSeconds <= 0) {
      localStorage.removeItem(getCooldownStorageKey());
      return false;
    }

    setCountdownSeconds(remainingSeconds);
    setShowTimer(true);
    setTimerKey((prev) => prev + 1);
    return true;
  };

  useEffect(() => {
    if (isOpen && !otpSent) {
      if (restoreCooldown()) {
        setOtpSent(true);
        return;
      }
      handleSendOTP();
    }
  }, [isOpen]);

  const handleSendOTP = async () => {
    try {
      setSending(true);
      setError('');
      setSuccess('');
      
      const token = localStorage.getItem('customer_token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await customerAuthAPI.sendPhoneOTP(token);
      
      setOtpSent(true);
      setCooldown(response?.data?.expiresIn || 300);
      setSuccess(response.data.message || 'Verification code sent!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
      // Focus first input
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      console.error('Send OTP error:', err);
      const errorMsg = err.response?.data?.error || 'Failed to send verification code';
      if (typeof errorMsg === 'string' && errorMsg.toLowerCase().includes('already verified')) {
        localStorage.removeItem(getCooldownStorageKey());
        setSuccess('Phone number is already verified.');
        setTimeout(() => {
          onVerified();
          onClose();
        }, 1000);
        return;
      }
      const retryAfter = err.response?.data?.retryAfter;
      if (retryAfter) {
        setCooldown(retryAfter);
        setOtpSent(true);
        setError(`${errorMsg} (${retryAfter}s)`);
      } else {
        setError(errorMsg);
      }
    } finally {
      setSending(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setSending(true);
      setError('');
      setSuccess('');
      setOtp(['', '', '', '', '', '']);
      
      const token = localStorage.getItem('customer_token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const response = await customerAuthAPI.resendPhoneOTP(token);
      
      setCooldown(response?.data?.expiresIn || 300);
      setSuccess('New verification code sent!');
      setTimeout(() => setSuccess(''), 3000);
      
      // Focus first input
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      console.error('Resend OTP error:', err);
      const errorMsg = err.response?.data?.error || 'Failed to resend code';
      if (typeof errorMsg === 'string' && errorMsg.toLowerCase().includes('already verified')) {
        localStorage.removeItem(getCooldownStorageKey());
        setSuccess('Phone number is already verified.');
        setTimeout(() => {
          onVerified();
          onClose();
        }, 1000);
        return;
      }
      const retryAfter = err.response?.data?.retryAfter;
      
      if (retryAfter) {
        setCooldown(retryAfter);
        setError(`${errorMsg} (${retryAfter}s)`);
      } else {
        setError(errorMsg);
      }
    } finally {
      setSending(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Take only last character
    setOtp(newOtp);
    setError('');
    
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
    
    // Auto-submit when all 6 digits entered
    if (newOtp.every(digit => digit !== '') && value) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = [...otp];
    
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    
    setOtp(newOtp);
    
    // Focus last filled input or first empty
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
    
    // Auto-submit if complete
    if (pastedData.length === 6) {
      handleVerify(pastedData);
    }
  };

  const handleVerify = async (otpCode?: string) => {
    const code = otpCode || otp.join('');
    
    if (code.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('customer_token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      await customerAuthAPI.verifyPhone(token, code);

      localStorage.removeItem(getCooldownStorageKey());
      
      setSuccess('Phone verified successfully!');
      setTimeout(() => {
        onVerified();
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Verify phone error:', err);
      setError(err.response?.data?.error || 'Invalid verification code');
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleTimerComplete = () => {
    localStorage.removeItem(getCooldownStorageKey());
    setShowTimer(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Verify Phone Number</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Info */}
          <div className="text-center space-y-2">
            <p className="text-gray-600">
              We've sent a 6-digit verification code to:
            </p>
            <p className="text-lg font-semibold text-gray-900">{phone}</p>
            <p className="text-sm text-gray-500">
              Enter the code below to verify your phone number
            </p>
          </div>

          {/* OTP Input */}
          <div className="flex justify-center space-x-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className={`
                  w-12 h-14 text-center text-2xl font-bold
                  border-2 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-blue-500
                  transition-all
                  ${error ? 'border-red-300' : 'border-gray-300'}
                  ${digit ? 'border-blue-400' : ''}
                `}
                disabled={loading || sending}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start space-x-2">
              <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-start space-x-2">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {/* Timer & Resend */}
          <div className="text-center space-y-3">
            {showTimer ? (
              <p className="text-sm text-gray-600">
                Code expires in{' '}
                <CountdownTimer
                  key={timerKey}
                  seconds={countdownSeconds}
                  onComplete={handleTimerComplete}
                  className="text-blue-600 font-semibold"
                />
              </p>
            ) : (
              <p className="text-sm text-gray-500">Code expired</p>
            )}

            <button
              onClick={handleResendOTP}
              disabled={sending || showTimer}
              className={`
                text-sm font-medium flex items-center justify-center space-x-1 mx-auto
                ${
                  showTimer || sending
                    ? 'text-gray-400 cursor-not-allowed'
                    : 'text-blue-600 hover:text-blue-700'
                }
              `}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span>{sending ? 'Sending...' : 'Resend Code'}</span>
            </button>
          </div>

          {/* Verify Button */}
          <button
            onClick={() => handleVerify()}
            disabled={loading || sending || otp.some(digit => !digit)}
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg
                     hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                     transition-colors flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Verify Phone</span>
              </>
            )}
          </button>

          {/* Help Text */}
          <p className="text-xs text-gray-500 text-center">
            Didn't receive the code? Check your phone or try resending after the timer expires.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PhoneVerificationModal;
