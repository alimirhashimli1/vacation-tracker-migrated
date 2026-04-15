import React, { useState, useEffect } from 'react';
import { Mail, Lock, Info, ArrowRight, ShieldCheck, Sparkles, Calendar, Users, BarChart3, Clock, Copy, Check } from 'lucide-react';

interface DemoWelcomeProps {
  onContinue: () => void;
}

const DemoWelcome: React.FC<DemoWelcomeProps> = ({ onContinue }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);

  const credentials = {
    email: 'absencemanageradmin@gmail.com',
    password: 'absencemanageradmin'
  };

  const copyToClipboard = (text: string, type: 'email' | 'pass') => {
    navigator.clipboard.writeText(text);
    if (type === 'email') {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedPass(true);
      setTimeout(() => setCopiedPass(false), 2000);
    }
  };

  const features = [
    { icon: Calendar, title: "Absence Tracking", desc: "Effortlessly manage leave requests" },
    { icon: Users, title: "Team Management", desc: "Coordinate with your entire department" },
    { icon: BarChart3, title: "Smart Insights", desc: "Visualize attendance patterns" },
    { icon: Clock, title: "Real-time Updates", desc: "Instant notifications for approvals" }
  ];

  useEffect(() => {
    setIsVisible(true);
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [features.length]);

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 bg-[#f8fafc] overflow-hidden transition-all duration-1000 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-4xl w-full bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.1)] overflow-hidden border border-white relative">
        <div className="flex flex-col md:flex-row h-full">
          {/* Left Side: Information */}
          <div className="w-full md:w-3/5 p-8 md:p-12 border-b md:border-b-0 md:border-r border-slate-100">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Interactive Demo
            </div>

            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
              Manage Time <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">
                Without the Stress
              </span>
            </h1>

            <p className="text-lg text-slate-600 mb-10 leading-relaxed max-w-md">
              Welcome to the <span className="font-semibold text-slate-900">Absence Manager Demo</span>. 
              Step inside to see how we help modern teams stay perfectly in sync.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              {features.map((feature, idx) => (
                <div 
                  key={idx}
                  className={`flex items-start gap-3 transition-all duration-500 ${activeFeature === idx ? 'opacity-100 translate-x-1' : 'opacity-50'}`}
                >
                  <div className={`p-2 rounded-lg ${activeFeature === idx ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    <feature.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{feature.title}</h3>
                    <p className="text-xs text-slate-500">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side: Credentials & CTA */}
          <div className="w-full md:w-2/5 p-8 md:p-12 bg-slate-50/50 flex flex-col justify-center">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Ready to explore?</h2>
              <p className="text-sm text-slate-500 mb-6">Use these admin credentials to access the full suite of features:</p>
              
              <div className="space-y-3">
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm group hover:border-indigo-300 transition-all relative">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Email Address</div>
                  <div className="text-sm font-mono text-indigo-600 font-semibold break-all pr-8">{credentials.email}</div>
                  <button 
                    onClick={() => copyToClipboard(credentials.email, 'email')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-indigo-600"
                    title="Copy email"
                  >
                    {copiedEmail ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                
                <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm group hover:border-indigo-300 transition-all relative">
                  <div className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">Access Password</div>
                  <div className="text-sm font-mono text-indigo-600 font-semibold pr-8">{credentials.password}</div>
                  <button 
                    onClick={() => copyToClipboard(credentials.password, 'pass')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400 hover:text-indigo-600"
                    title="Copy password"
                  >
                    {copiedPass ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100 mb-8">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <p className="text-xs text-blue-700 leading-relaxed">
                  Everything is live. Create absences, edit users, and see the changes in real-time.
                </p>
              </div>
            </div>

            <button
              onClick={onContinue}
              className="w-full py-4 px-6 bg-slate-900 hover:bg-black text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-xl hover:shadow-indigo-200"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Decoration */}
      <div className="absolute top-1/4 right-10 hidden lg:block animate-bounce" style={{ animationDuration: '4s' }}>
        <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">System Secure</div>
            <div className="text-[10px] text-slate-500">All data encrypted</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoWelcome;
