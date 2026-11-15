'use client';

import React, { useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import * as Switch from '@radix-ui/react-switch';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useTheme } from 'next-themes';
import { Save, AlertTriangle } from 'lucide-react';
import { toast } from '@/lib/safeToast';

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const { fontSize, setFontSize } = useSettingsStore();
  
  const [name, setName] = useState(user?.name || '');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  
  const handleSaveProfile = () => {
    updateUser({ name });
    toast.success('Profile updated');
  };

  const handleDeleteAccount = () => {
    if (deleteConfirm === 'DELETE') {
      toast.success('Account scheduled for deletion');
      // logic
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto w-full">
      <h1 className="text-2xl font-outfit font-bold text-foreground mb-6">Settings</h1>
      
      <Tabs.Root defaultValue="profile" className="flex flex-col md:flex-row gap-8">
        <Tabs.List className="flex md:flex-col gap-2 border-b md:border-b-0 border-border pb-2 md:pb-0 overflow-x-auto">
          {['Profile', 'Appearance', 'Notifications', 'API Keys', 'Danger Zone'].map(tab => (
            <Tabs.Trigger 
              key={tab} 
              value={tab.toLowerCase().replace(/\s+/g, '-')}
              className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground hover:bg-surface rounded-md data-[state=active]:bg-accent/10 data-[state=active]:text-accent text-left whitespace-nowrap transition-colors"
            >
              {tab}
            </Tabs.Trigger>
          ))}
        </Tabs.List>

        <div className="flex-1">
          {/* PROFILE */}
          <Tabs.Content value="profile" className="space-y-6 animate-fadeIn">
            <h2 className="text-lg font-semibold text-foreground mb-4">Profile Information</h2>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-surface border border-border flex items-center justify-center text-xl font-medium">
                {name.charAt(0).toUpperCase()}
              </div>
              <button className="text-sm font-medium text-accent hover:underline">Change Avatar</button>
            </div>

            <div className="space-y-4 max-w-md">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Full Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:border-accent focus:outline-none" 
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-foreground">Email Address</label>
                <input 
                  type="email" 
                  value={user?.email || ''} 
                  disabled
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm text-muted cursor-not-allowed" 
                />
              </div>
              <button onClick={handleSaveProfile} className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-md text-sm font-medium hover:bg-accent/90 mt-2">
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </Tabs.Content>

          {/* APPEARANCE */}
          <Tabs.Content value="appearance" className="space-y-8 animate-fadeIn">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Theme</h2>
              <div className="flex gap-3 bg-surface p-1 rounded-lg max-w-xs border border-border">
                {['light', 'dark', 'system'].map(t => (
                  <button 
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`flex-1 py-1.5 text-sm font-medium capitalize rounded-md transition-colors ${theme === t ? 'bg-background shadow-sm text-foreground' : 'text-muted hover:text-foreground'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-4">Font Size</h2>
              <div className="flex gap-3 bg-surface p-1 rounded-lg max-w-xs border border-border">
                {(['sm', 'md', 'lg'] as const).map(s => (
                  <button 
                    key={s}
                    onClick={() => setFontSize(s)}
                    className={`flex-1 py-1.5 text-sm font-medium uppercase rounded-md transition-colors ${fontSize === s ? 'bg-background shadow-sm text-foreground' : 'text-muted hover:text-foreground'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </Tabs.Content>

          {/* NOTIFICATIONS */}
          <Tabs.Content value="notifications" className="space-y-6 animate-fadeIn">
            <h2 className="text-lg font-semibold text-foreground mb-4">Notification Preferences</h2>
            
            <div className="space-y-4 max-w-md">
              {[
                { id: 'email', label: 'Email Notifications', desc: 'Receive updates about your account via email' },
                { id: 'browser', label: 'Browser Notifications', desc: 'Get desktop alerts for incoming messages' },
                { id: 'digest', label: 'Weekly Digest', desc: 'A summary of your MAYA usage' }
              ].map(item => (
                <div key={item.id} className="flex items-start justify-between p-4 border border-border rounded-lg bg-surface/50">
                  <div>
                    <h3 className="text-sm font-medium text-foreground">{item.label}</h3>
                    <p className="text-xs text-muted mt-1">{item.desc}</p>
                  </div>
                  <Switch.Root className="w-10 h-5 bg-border rounded-full relative data-[state=checked]:bg-accent transition-colors outline-none">
                    <Switch.Thumb className="block w-4 h-4 bg-white rounded-full transition-transform translate-x-0.5 data-[state=checked]:translate-x-5 shadow-sm" />
                  </Switch.Root>
                </div>
              ))}
            </div>
          </Tabs.Content>

          {/* API KEYS */}
          <Tabs.Content value="api-keys" className="space-y-6 animate-fadeIn">
            <h2 className="text-lg font-semibold text-foreground mb-2">AI provider setup</h2>
            <p className="text-sm text-muted mb-6">
              Provider credentials are configured on the backend so API keys are not exposed or stored in this browser.
            </p>
            <div className="max-w-xl rounded-lg border border-border bg-surface/50 p-4">
              <p className="text-sm font-medium text-foreground">Set a provider key</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Add <code>GROQ_API_KEY</code> or <code>OPENAI_API_KEY</code> to <code>backend/.env</code>, then restart the API. MAYA reads these keys server-side.
              </p>
            </div>
          </Tabs.Content>

          {/* DANGER ZONE */}
          <Tabs.Content value="danger-zone" className="space-y-6 animate-fadeIn">
            <h2 className="text-lg font-semibold text-danger mb-4">Danger Zone</h2>
            
            <div className="border border-danger/30 bg-danger/5 rounded-xl p-6 max-w-md">
              <div className="flex items-center gap-3 text-danger mb-2">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="font-semibold">Delete Account</h3>
              </div>
              <p className="text-sm text-muted mb-4">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              
              <div className="space-y-3">
                <label className="text-xs font-medium text-foreground">Type &quot;DELETE&quot; to confirm</label>
                <input 
                  type="text" 
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                  className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:border-danger focus:outline-none" 
                />
                <button 
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirm !== 'DELETE'}
                  className="w-full py-2 bg-danger text-white rounded-md text-sm font-medium hover:bg-danger/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Delete Account permanently
                </button>
              </div>
            </div>
          </Tabs.Content>
        </div>
      </Tabs.Root>
    </div>
  );
}
