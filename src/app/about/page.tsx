import React from 'react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#0F172A] text-white pt-24 pb-20 px-6 font-inter">
      <div className="max-w-4xl mx-auto space-y-12">
        <h1 className="text-4xl md:text-5xl font-outfit font-bold text-center">About MAYA AI</h1>
        
        <section className="glass-card p-8">
          <h2 className="text-2xl font-semibold mb-4 text-accent">Our Mission</h2>
          <p className="text-gray-300 leading-relaxed">
            We believe AI should be transparent about what it knows and what it doesn't know. 
            MAYA (Mitigating AI Yielded Anomalies) was created to bridge the trust gap between humans and large language models.
          </p>
        </section>

        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-center">Why Hallucination Detection Matters</h2>
          <p className="text-gray-400 text-center max-w-2xl mx-auto">
            As AI becomes integrated into critical workflows—from healthcare to legal analysis—the cost of a plausible-sounding but factually incorrect answer (a hallucination) is too high.
          </p>
        </section>

        <section className="grid md:grid-cols-3 gap-6">
          <div className="bg-surface border border-white/10 p-6 rounded-xl">
            <h3 className="font-bold mb-2">Llama 3</h3>
            <p className="text-sm text-gray-400">The core reasoning engine that generates our initial responses.</p>
          </div>
          <div className="bg-surface border border-white/10 p-6 rounded-xl">
            <h3 className="font-bold mb-2">DeBERTa</h3>
            <p className="text-sm text-gray-400">Our cross-encoder that verifies the response against retrieved facts.</p>
          </div>
          <div className="bg-surface border border-white/10 p-6 rounded-xl">
            <h3 className="font-bold mb-2">FAISS</h3>
            <p className="text-sm text-gray-400">High-speed vector database for retrieving trusted evidence.</p>
          </div>
        </section>

        <section className="text-center pt-8">
          <h2 className="text-2xl font-semibold mb-6">Our Team</h2>
          <div className="flex justify-center gap-8">
            {[1,2,3].map(i => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold mb-3">T{i}</div>
                <span className="font-medium">Team Member</span>
                <span className="text-xs text-gray-500">Engineer</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
