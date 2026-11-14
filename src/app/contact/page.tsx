'use client';

import React, { useState } from 'react';
import { Mail, MessageSquare, Clock } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Message sent! We'll get back to you soon.");
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-white pt-24 pb-20 px-6 font-inter">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
        
        <div>
          <h1 className="text-4xl font-outfit font-bold mb-6">Get in touch</h1>
          <p className="text-gray-400 mb-8 leading-relaxed">
            Have questions about MAYA AI, enterprise plans, or integration? Fill out the form and our team will be in touch shortly.
          </p>
          
          <div className="space-y-6">
            <div className="flex items-center gap-4 text-gray-300">
              <div className="p-3 bg-surface rounded-full"><Mail className="w-5 h-5 text-accent" /></div>
              <div><p className="font-medium text-white">Email Us</p><p className="text-sm">support@maya-ai.com</p></div>
            </div>
            <div className="flex items-center gap-4 text-gray-300">
              <div className="p-3 bg-surface rounded-full"><MessageSquare className="w-5 h-5 text-accent" /></div>
              <div><p className="font-medium text-white">Live Chat</p><p className="text-sm">Available for Pro users</p></div>
            </div>
            <div className="flex items-center gap-4 text-gray-300">
              <div className="p-3 bg-surface rounded-full"><Clock className="w-5 h-5 text-accent" /></div>
              <div><p className="font-medium text-white">Response Time</p><p className="text-sm">Usually within 24 hours</p></div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-[#111827] border border-white/10 rounded-2xl p-8 space-y-4 shadow-xl">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm text-gray-400">Name</label>
              <input required value={formData.name} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full bg-[#0F172A] border border-white/10 rounded-lg px-4 py-2 focus:border-accent focus:outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-sm text-gray-400">Email</label>
              <input required type="email" value={formData.email} onChange={e=>setFormData({...formData, email: e.target.value})} className="w-full bg-[#0F172A] border border-white/10 rounded-lg px-4 py-2 focus:border-accent focus:outline-none" />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-400">Subject</label>
            <input required value={formData.subject} onChange={e=>setFormData({...formData, subject: e.target.value})} className="w-full bg-[#0F172A] border border-white/10 rounded-lg px-4 py-2 focus:border-accent focus:outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-gray-400">Message</label>
            <textarea required rows={5} value={formData.message} onChange={e=>setFormData({...formData, message: e.target.value})} className="w-full bg-[#0F172A] border border-white/10 rounded-lg px-4 py-2 focus:border-accent focus:outline-none resize-none" />
          </div>
          <button type="submit" className="w-full bg-accent text-white font-medium py-3 rounded-lg hover:bg-accent/90 transition-colors mt-2">Send Message</button>
        </form>

      </div>
    </div>
  );
}
