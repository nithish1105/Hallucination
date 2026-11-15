'use client';

import React, { useState } from 'react';
import { Users, MessageSquare, AlertTriangle, TrendingUp, Crown, Plus, Trash2 } from 'lucide-react';
import { toast } from '@/lib/safeToast';

export default function AdminPage() {
  const [articleTitle, setArticleTitle] = useState('');
  
  const stats = [
    { label: 'Total Users', value: '1,248', icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Total Queries', value: '45.2k', icon: MessageSquare, color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { label: 'Hallucinations', value: '8.4%', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' },
    { label: 'Avg Confidence', value: '94%', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
  ];

  const recentActivity = [
    { id: 1, user: 'jane@example.com', query: 'What is the capital of Australia?', status: 'verified', conf: '99%', time: '2m ago' },
    { id: 2, user: 'bob@example.com', query: 'Write a python script for...', status: 'high_confidence', conf: '87%', time: '5m ago' },
    { id: 3, user: 'alice@test.com', query: 'Tell me about the X-15 jet', status: 'possible_hallucination', conf: '42%', time: '12m ago' },
  ];

  const handleAddArticle = () => {
    if (!articleTitle) return;
    toast.success(`"${articleTitle}" added to knowledge base queue`);
    setArticleTitle('');
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-amber-500/20 text-amber-500 rounded-lg">
          <Crown className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-outfit font-bold text-foreground">Admin Dashboard</h1>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-surface/50 border border-border rounded-xl p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted mb-1">{stat.label}</p>
              <h3 className="text-2xl font-bold text-foreground">{stat.value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* RECENT ACTIVITY */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Recent Queries</h2>
          <div className="bg-surface border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-surface border-b border-border text-muted uppercase text-xs font-semibold">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Query</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentActivity.map(row => (
                  <tr key={row.id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-3 text-foreground truncate max-w-[120px]">{row.user}</td>
                    <td className="px-4 py-3 text-muted truncate max-w-[200px]">{row.query}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-medium border ${row.status === 'verified' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : row.status === 'high_confidence' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                        {row.conf} {row.status.split('_')[0]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-muted">{row.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* KNOWLEDGE BASE */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">Knowledge Base</h2>
          <div className="bg-surface border border-border rounded-xl p-5">
            <p className="text-sm text-muted mb-4">Ingest new verified sources into the FAISS vector database.</p>
            <div className="flex flex-col gap-3">
              <input 
                type="text" 
                value={articleTitle}
                onChange={e => setArticleTitle(e.target.value)}
                placeholder="Wikipedia article title..."
                className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
              <button 
                onClick={handleAddArticle}
                className="w-full flex items-center justify-center gap-2 py-2 bg-accent text-white rounded-md text-sm font-medium hover:bg-accent/90 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Article
              </button>
            </div>
            
            <div className="mt-6">
              <h4 className="text-xs font-semibold text-muted uppercase mb-3">Recently Added</h4>
              <ul className="space-y-2 text-sm">
                {['Quantum Computing', 'James Webb Space Telescope', 'History of Rome'].map((item, i) => (
                  <li key={i} className="flex items-center justify-between p-2 rounded hover:bg-background group">
                    <span className="text-foreground">{item}</span>
                    <button className="text-muted opacity-0 group-hover:opacity-100 hover:text-danger"><Trash2 className="w-3.5 h-3.5" /></button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
