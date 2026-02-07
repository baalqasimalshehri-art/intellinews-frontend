
import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 sm:py-24">
      <Link to="/signup" className="inline-flex items-center gap-2 text-sm font-semibold text-[#301CA0] mb-8 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Sign Up
      </Link>
      <div className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-12 shadow-sm space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
        <p className="text-gray-500 text-sm italic">Last Updated: May 20, 2024</p>
        
        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">1. Information We Collect</h2>
          <p className="text-gray-600 leading-relaxed">
            We collect your email address, selected topics, and keywords to provide a personalized newsletter experience. We may also collect technical data about your interaction with our platform.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">2. How We Use Your Information</h2>
          <p className="text-gray-600 leading-relaxed">
            Your information is used exclusively to:
          </p>
          <ul className="list-disc pl-5 text-gray-600 space-y-2">
            <li>Generate and deliver your personalized newsletters.</li>
            <li>Maintain and improve our recommendation algorithms.</li>
            <li>Communicate with you regarding your account or service updates.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">3. Data Security</h2>
          <p className="text-gray-600 leading-relaxed">
            We implement industry-standard security measures to protect your personal information from unauthorized access, disclosure, or destruction.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">4. Third-Party Services</h2>
          <p className="text-gray-600 leading-relaxed">
            We use advanced AI models to process and summarize content. Your specific keywords and interests are shared with these models to facilitate personalization, but your personal identity is masked during processing.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">5. Your Rights</h2>
          <p className="text-gray-600 leading-relaxed">
            You have the right to access, update, or delete your information at any time through the Preferences dashboard or by contacting our support team.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
