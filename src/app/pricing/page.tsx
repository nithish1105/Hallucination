import React from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';

export default function PricingPage() {
  const tiers = [
    { name: 'Free', price: '$0', desc: 'Perfect for exploring', features: ['50 queries/day', 'Basic hallucination detection', 'Standard response time'] },
    { name: 'Pro', price: '$19', desc: 'For power users', features: ['Unlimited queries', 'Priority response time', 'Document upload (PDF/Word)', 'Voice input'], highlight: true },
    { name: 'Enterprise', price: 'Custom', desc: 'For large teams', features: ['Dedicated support', 'Custom knowledge base integration', 'API access', 'SSO authentication'] }
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] text-white pt-24 pb-20 px-6 font-inter">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-outfit font-bold mb-4">Simple, transparent pricing</h1>
          <p className="text-gray-400 text-lg">Choose the plan that's right for you.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-20">
          {tiers.map(tier => (
            <div key={tier.name} className={`bg-[#111827] rounded-2xl p-8 border ${tier.highlight ? 'border-accent shadow-[0_0_30px_rgba(37,99,235,0.2)]' : 'border-white/10'}`}>
              {tier.highlight && <span className="px-3 py-1 bg-accent/20 text-accent text-xs font-bold rounded-full mb-4 inline-block">Most Popular</span>}
              <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
              <div className="mb-4"><span className="text-4xl font-bold">{tier.price}</span>{tier.price !== 'Custom' && <span className="text-gray-400">/mo</span>}</div>
              <p className="text-gray-400 text-sm mb-6">{tier.desc}</p>
              <Link href="/auth/signup" className={`block w-full py-3 rounded-lg text-center font-medium transition-colors mb-8 ${tier.highlight ? 'bg-accent text-white hover:bg-accent/90' : 'bg-white/5 hover:bg-white/10'}`}>
                Get Started
              </Link>
              <ul className="space-y-4">
                {tier.features.map(f => (
                  <li key={f} className="flex items-center gap-3 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-accent flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
