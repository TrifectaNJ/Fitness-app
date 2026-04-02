import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Clock, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Support: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="mb-8 text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to App
        </Button>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sm:p-10 space-y-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Murray Mania – App Support
          </h1>

          <div className="space-y-6 text-gray-700 leading-relaxed">
            <p className="text-lg">
              Need help with the Murray Mania app?
            </p>

            <div className="space-y-3">
              <p>
                For questions, issues, or support requests, please contact us at:
              </p>
              <a
                href="mailto:info@trifectagroupco.com"
                className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-semibold transition-colors"
              >
                <Mail className="w-5 h-5" />
                info@trifectagroupco.com
              </a>

            </div>

            <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-4">
              <Clock className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <p className="text-gray-700">
                We typically respond within 1–2 business days.
              </p>
            </div>

            <div className="border-t border-gray-200 pt-6 space-y-3">
              <div className="flex items-center gap-2">
                <UserX className="w-5 h-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900">Account Deletion</h2>
              </div>
              <p>
                If you would like to delete your account, please email us from the address associated with your account and we will assist you.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;
