'use client';
import { useState, useEffect } from "react";
import { useAuth } from "../../providers/AuthProvider";

interface TwoFactorStatus {
  is_enabled: boolean;
  methods: Array<{
    id: string;
    method_type: string;
    is_enabled: boolean;
    phone_number?: string;
    has_secret: boolean;
    created_at: string;
  }>;
}

interface SecurityEvent {
  id: string;
  event_type: string;
  description: string;
  ip_address?: string;
  is_suspicious: boolean;
  created_at: string;
}

export default function TwoFactorPage() {
  const { user } = useAuth();
  const [status, setStatus] = useState<TwoFactorStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupMethod, setSetupMethod] = useState<'totp' | 'sms' | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState("");
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [showSecurityEvents, setShowSecurityEvents] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/2fa/status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('tregu:token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error("Failed to load 2FA status:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadSecurityEvents = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/2fa/security-events`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('tregu:token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSecurityEvents(data.events);
      }
    } catch (error) {
      console.error("Failed to load security events:", error);
    }
  };

  const startSetup = async (method: 'totp' | 'sms') => {
    setSetupMethod(method);
    try {
      const endpoint = method === 'totp' ? '/auth/2fa/setup/totp' : '/auth/2fa/setup/sms';
      const body = method === 'sms' ? { phone_number: phoneNumber } : {};

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('tregu:token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data = await response.json();
        if (method === 'totp') {
          setQrCode(data.qr_code);
          setBackupCodes(data.backup_codes);
        } else {
          setBackupCodes(data.backup_codes);
        }
      } else {
        alert("Failed to start 2FA setup. Please try again.");
      }
    } catch (error) {
      console.error("Failed to start 2FA setup:", error);
      alert("Failed to start 2FA setup. Please try again.");
    }
  };

  const verifySetup = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/2fa/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('tregu:token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: verificationCode,
          method_type: setupMethod
        })
      });

      if (response.ok) {
        alert("2FA has been successfully enabled!");
        setSetupMethod(null);
        setQrCode(null);
        setBackupCodes([]);
        setVerificationCode("");
        loadStatus();
      } else {
        alert("Invalid verification code. Please try again.");
      }
    } catch (error) {
      console.error("Failed to verify 2FA setup:", error);
      alert("Failed to verify 2FA setup. Please try again.");
    }
  };

  const disableMethod = async (methodId: string) => {
    if (!confirm("Are you sure you want to disable this 2FA method? This will make your account less secure.")) {
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/2fa/method/${methodId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('tregu:token')}`
        }
      });

      if (response.ok) {
        alert("2FA method has been disabled.");
        loadStatus();
      } else {
        alert("Failed to disable 2FA method. Please try again.");
      }
    } catch (error) {
      console.error("Failed to disable 2FA method:", error);
      alert("Failed to disable 2FA method. Please try again.");
    }
  };

  const regenerateBackupCodes = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/2fa/backup-codes/regenerate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('tregu:token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBackupCodes(data.backup_codes);
        alert("Backup codes have been regenerated. Make sure to save the new codes!");
      } else {
        alert("Failed to regenerate backup codes. Please try again.");
      }
    } catch (error) {
      console.error("Failed to regenerate backup codes:", error);
      alert("Failed to regenerate backup codes. Please try again.");
    }
  };

  if (!user) return <div className="p-6">Please sign in to manage 2FA settings.</div>;
  if (loading) return <div className="p-6">Loading 2FA settings...</div>;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="rounded-2xl border bg-white p-6 shadow">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Two-Factor Authentication</h1>
            <p className="text-gray-600 mt-1">
              Add an extra layer of security to your account with 2FA.
              {status?.is_enabled ? (
                <span className="text-green-600 font-medium"> ✓ Enabled</span>
              ) : (
                <span className="text-orange-600 font-medium"> ⚠ Not configured</span>
              )}
            </p>
          </div>
          <div className="text-right">
            <button
              onClick={() => {
                setShowSecurityEvents(!showSecurityEvents);
                if (!showSecurityEvents) loadSecurityEvents();
              }}
              className="btn bg-gray-600 text-white hover:bg-gray-500"
            >
              {showSecurityEvents ? 'Hide' : 'Show'} Security Log
            </button>
          </div>
        </div>
      </div>

      {/* Security Events */}
      {showSecurityEvents && (
        <div className="rounded-2xl border bg-white p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">Security Events</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {securityEvents.length === 0 ? (
              <p className="text-gray-500">No security events found.</p>
            ) : (
              securityEvents.map((event) => (
                <div key={event.id} className={`p-3 rounded-lg border ${
                  event.is_suspicious ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{event.event_type.replace('_', ' ').toUpperCase()}</div>
                      <div className="text-sm text-gray-600">{event.description}</div>
                      <div className="text-xs text-gray-500">
                        {new Date(event.created_at).toLocaleString()}
                        {event.ip_address && ` • ${event.ip_address}`}
                      </div>
                    </div>
                    {event.is_suspicious && (
                      <div className="text-red-600">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Current 2FA Methods */}
      {status?.methods && status.methods.length > 0 && (
        <div className="rounded-2xl border bg-white p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">Active 2FA Methods</h2>
          <div className="space-y-4">
            {status.methods.map((method) => (
              <div key={method.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    {method.method_type === 'totp' ? (
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="font-medium">
                      {method.method_type === 'totp' ? 'Authenticator App' : 'SMS'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {method.method_type === 'sms' && method.phone_number
                        ? `Phone: ${method.phone_number}`
                        : 'Time-based codes'
                      }
                    </div>
                    <div className="text-xs text-gray-400">
                      Added {new Date(method.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={regenerateBackupCodes}
                    className="btn bg-blue-600 text-white hover:bg-blue-500 text-sm"
                  >
                    Backup Codes
                  </button>
                  <button
                    onClick={() => disableMethod(method.id)}
                    className="btn bg-red-600 text-white hover:bg-red-500 text-sm"
                  >
                    Disable
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Setup 2FA */}
      {!status?.is_enabled && (
        <div className="rounded-2xl border bg-white p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">Set Up Two-Factor Authentication</h2>
          <p className="text-gray-600 mb-6">
            Choose your preferred 2FA method to secure your account.
          </p>

          {!setupMethod ? (
            <div className="grid md:grid-cols-2 gap-4">
              <button
                onClick={() => setSetupMethod('totp')}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <div className="font-medium">Authenticator App</div>
                    <div className="text-sm text-gray-500">Use Google Authenticator, Authy, or similar</div>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setSetupMethod('sms')}
                className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
              >
                <div className="flex items-center space-x-3 mb-2">
                  <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div>
                    <div className="font-medium">SMS</div>
                    <div className="text-sm text-gray-500">Receive codes via text message</div>
                  </div>
                </div>
              </button>
            </div>
          ) : setupMethod === 'sms' && !backupCodes.length ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1234567890"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => startSetup('sms')}
                  disabled={!phoneNumber}
                  className="btn bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  Send Verification Code
                </button>
                <button
                  onClick={() => setSetupMethod(null)}
                  className="btn bg-gray-600 text-white hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {setupMethod === 'totp' && qrCode && (
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-4">Scan QR Code</h3>
                  <p className="text-gray-600 mb-4">
                    Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                  </p>
                  <img src={qrCode} alt="QR Code" className="mx-auto border rounded-lg" />
                </div>
              )}

              {setupMethod === 'sms' && backupCodes.length > 0 && (
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-4">SMS Setup</h3>
                  <p className="text-gray-600 mb-4">
                    A verification code has been sent to {phoneNumber}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Enter Verification Code
                </label>
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="000000"
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                  maxLength={6}
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={verifySetup}
                  disabled={verificationCode.length !== 6}
                  className="btn bg-green-600 text-white hover:bg-green-500 disabled:opacity-50"
                >
                  Verify & Enable 2FA
                </button>
                <button
                  onClick={() => {
                    setSetupMethod(null);
                    setQrCode(null);
                    setBackupCodes([]);
                    setVerificationCode("");
                  }}
                  className="btn bg-gray-600 text-white hover:bg-gray-500"
                >
                  Cancel
                </button>
              </div>

              {backupCodes.length > 0 && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-800 mb-2">⚠️ Save Your Backup Codes</h4>
                  <p className="text-sm text-yellow-700 mb-3">
                    These codes can be used to access your account if you lose your device.
                    Keep them in a safe place.
                  </p>
                  <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                    {backupCodes.map((code, index) => (
                      <div key={index} className="bg-white p-2 rounded border text-center">
                        {code}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-yellow-600 mt-2">
                    Each code can only be used once. Generate new codes if needed.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Security Recommendations */}
      <div className="rounded-2xl border bg-blue-50 border-blue-200 p-6">
        <h2 className="text-xl font-semibold text-blue-900 mb-4">Security Recommendations</h2>
        <div className="space-y-3 text-blue-800">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
            <div>
              <strong>Use an authenticator app</strong> instead of SMS when possible - it's more secure and doesn't rely on cellular service.
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
            <div>
              <strong>Save your backup codes</strong> in a secure location like a password manager or printed document in a safe.
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
            <div>
              <strong>Monitor your security log</strong> regularly for suspicious activity and unfamiliar login attempts.
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
            <div>
              <strong>Enable 2FA on all your accounts</strong> - it's one of the most effective ways to protect your online accounts.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}