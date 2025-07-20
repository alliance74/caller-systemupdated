import React, { useState } from 'react';
import axios from 'axios';
import { Phone, X } from 'lucide-react';

const TestCall = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [callType, setCallType] = useState('info'); // info, sms, or agent
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const makeTestCall = async () => {
    try {
      setLoading(true);
      setError(null);
      setStatus('Initiating call...');

      // First test Twilio configuration
      const configTest = await axios.get('/api/twilio/test-config');
      console.log('Twilio config test:', configTest.data);

      // Make the test call
      const response = await axios.post('/api/twilio/test-call', {
        to: phoneNumber,
        type: callType
      });

      setStatus(`Call initiated successfully! Call ID: ${response.data.callId}`);
      console.log('Call response:', response.data);
    } catch (error) {
      console.error('Call error:', error);
      setError(error.response?.data?.message || error.message || 'Failed to make call');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 transition-colors"
        title="Test Call"
      >
        <Phone className="h-6 w-6" />
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold">Test Call System</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1234567890"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Call Type
                </label>
                <select
                  value={callType}
                  onChange={(e) => setCallType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="info">Information Call</option>
                  <option value="sms">SMS Info Call</option>
                  <option value="agent">Agent Transfer Call</option>
                </select>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {status && !error && (
                <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm">
                  {status}
                </div>
              )}

              <button
                onClick={makeTestCall}
                disabled={loading || !phoneNumber}
                className={`w-full py-2 px-4 rounded-lg text-white font-medium ${
                  loading || !phoneNumber
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Making Call...
                  </span>
                ) : (
                  'Make Test Call'
                )}
              </button>
            </div>

            <div className="p-4 bg-gray-50 rounded-b-lg text-sm text-gray-600">
              <h3 className="font-medium mb-2">What to expect:</h3>
              {callType === 'info' && (
                <p>The call will play an informational message with opt-out option (press 9).</p>
              )}
              {callType === 'sms' && (
                <p>The call will offer to send information via SMS (press 1).</p>
              )}
              {callType === 'agent' && (
                <p>The call will offer to transfer to an agent (press 5).</p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default TestCall; 