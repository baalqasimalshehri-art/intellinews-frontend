
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const TermsOfService = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 sm:py-24">
      <Link to="/signup" className="inline-flex items-center gap-2 text-sm font-semibold text-[#301CA0] mb-8 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Sign Up
      </Link>
      <div className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-12 shadow-sm space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
        <p className="text-gray-500 text-sm italic">Last Updated: May 20, 2024</p>
        
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">1. Acceptance of Terms</h2>
          <p className="text-gray-600 leading-relaxed">
            By accessing and using IntelliNews, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">2. Description of Service</h2>
          <p className="text-gray-600 leading-relaxed">
            IntelliNews provides an AI-powered personalized newsletter system. We collect, filter, and summarize academic and industry content based on user-defined preferences.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">3. User Conduct</h2>
          <p className="text-gray-600 leading-relaxed">
            Users are responsible for maintaining the confidentiality of their account information. You agree to use the service only for lawful purposes and in accordance with these Terms.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">4. Intellectual Property</h2>
          <p className="text-gray-600 leading-relaxed">
            The content provided through IntelliNews is synthesized from external sources. While we summarize this information, the original intellectual property rights remain with the respective authors and publishers.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">5. Limitation of Liability</h2>
          <p className="text-gray-600 leading-relaxed">
            IntelliNews is provided "as is" without any warranties. We are not responsible for the accuracy of summarized content or any decisions made based on the information provided.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfService;
