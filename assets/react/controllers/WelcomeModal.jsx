import React from 'react';

export default function WelcomeModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[9999] p-4">
      <div className="glass-card rounded-2xl w-full max-w-2xl shadow-2xl relative flex flex-col max-h-[90vh]">
        <div className="p-8 pb-4 flex justify-between items-center shrink-0">
          <h2 className="text-6xl text-white font-medium tracking-tight">Welcome to LOGZYPHER</h2>
          <button 
            onClick={onClose}
            className="text-white/60 text-5xl hover:text-white transition-colors"
          >
            &times;
          </button>
        </div>

        <div className="px-8 pb-4 overflow-y-auto custom-scrollbar">
          <div className="space-y-6 text-white/90">
            <p className="text-3xl leading-relaxed">
              Take control of your system logs with our advanced monitoring dashboard. 
              Upload your PHP, Symfony or Monolog files to visualize errors, warnings, and system activity in real-time.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <h3 className="text-3xl font-semibold mb-2 text-white">Analyze</h3>
                <p className="text-2xl text-white/70">Parse complex log files instantly using our regex-powered engine.</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <h3 className="text-3xl font-semibold mb-2 text-white">Visualize</h3>
                <p className="text-2xl text-white/70">Beautiful charts and dithered wave aesthetics for a modern experience.</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <h3 className="text-3xl font-semibold mb-2 text-white">History</h3>
                <p className="text-2xl text-white/70">Securely store and retrieve your analysis history in the cloud.</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <h3 className="text-3xl font-semibold mb-2 text-white">Optimized</h3>
                <p className="text-2xl text-white/70">GZIP compression and smart sampling for handling massive log files.</p>
              </div>
            </div>

            <p className="text-2xl italic text-white/50 pt-4 text-center">
              Log in to save your history and access it from anywhere.
            </p>
          </div>
        </div>

        <div className="p-8 pt-4 shrink-0">
          <button
            onClick={onClose}
            className="flex justify-center w-full px-4 py-4 rounded-xl border border-white/30 transition-all duration-300 hover:scale-[1.02] glass-button text-white text-4xl hover:bg-white/15 shadow-xl"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}
