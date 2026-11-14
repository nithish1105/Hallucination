import React from 'react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white pt-24 pb-20 px-6 font-inter">
      <div className="max-w-3xl mx-auto prose prose-invert">
        <h1 className="font-outfit text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-gray-400 mb-8">Last updated: Oct 2023</p>
        
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing MAYA AI, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service.</p>

        <h2>2. Use License</h2>
        <p>Permission is granted to temporarily use MAYA AI for personal, non-commercial transitory viewing only.</p>

        <h2>3. Disclaimer</h2>
        <p>The materials on MAYA AI are provided on an 'as is' basis. MAYA makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties.</p>

        <h2>4. Limitations</h2>
        <p>In no event shall MAYA or its suppliers be liable for any damages arising out of the use or inability to use the service.</p>
      </div>
    </div>
  );
}
