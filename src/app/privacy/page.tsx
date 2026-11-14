import React from 'react';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white pt-24 pb-20 px-6 font-inter">
      <div className="max-w-3xl mx-auto prose prose-invert">
        <h1 className="font-outfit text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-gray-400 mb-8">Last updated: Oct 2023</p>
        
        <h2>1. Data Collection</h2>
        <p>We collect information you provide directly to us, including account details, chat queries, and uploaded documents used for context.</p>

        <h2>2. How We Use Data</h2>
        <p>Your data is used to provide, maintain, and improve the MAYA AI service, including generating responses and detecting hallucinations. We do not use your private data to train our foundational models.</p>

        <h2>3. Data Sharing</h2>
        <p>We do not sell your personal data. We may share data with third-party service providers (like our cloud hosting) strictly for operating our service.</p>

        <h2>4. Security</h2>
        <p>We implement industry-standard security measures to protect your data. All data is encrypted in transit and at rest.</p>

        <h2>5. Your Rights</h2>
        <p>You have the right to access, update, or delete your data at any time through your account settings.</p>
      </div>
    </div>
  );
}
