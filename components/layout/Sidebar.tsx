'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Files, 
  MessageSquare, 
  BookOpen, 
  Search,
  MessageCircle,
  Share2,
  PieChart,
  Map,
  AlertTriangle,
  Clock,
  Activity,
  Users,
  Settings,
  Plus,
  Bot,
  QrCode,
  X,
  Headphones,
  Target,
  Video
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/hooks/useSidebar';

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, isCollapsed, close } = useSidebar();
  
  const menuItems = [
    { icon: Home, label: 'Dashboard', href: '/' },
    { icon: Target, label: 'SPMS Executive', href: '/spms' },
    { icon: Files, label: 'Pelayanan', href: '/pelayanan' },
    { icon: Activity, label: 'Monitoring', href: '/monitoring' },
    { icon: MessageCircle, label: 'WhatsApp Center', href: '/whatsapp' },
    { icon: Share2, label: 'Social Media', href: '/social' },
    { icon: Video, label: 'PURI Meet', href: '/puri-meet' },
    { icon: Bot, label: 'AI Center', href: '/ai-dashboard' },
    { icon: Headphones, label: 'AI Customer Service', href: '/ai-cs' },
    { icon: BookOpen, label: 'Knowledge Base', href: '/kb' },
    { icon: Map, label: 'GIS & Peta', href: '/gis' },
    { icon: PieChart, label: 'Analytics', href: '/analisis' },
    { icon: AlertTriangle, label: 'Pengaduan', href: '/pengaduan' },
    { icon: Settings, label: 'Pengaturan', href: '/pengaturan' },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={close}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "h-screen fixed left-0 top-0 glass-panel border-r border-white/10 z-50 flex flex-col transition-all duration-300 ease-in-out md:translate-x-0 overflow-hidden",
        isOpen ? "translate-x-0" : "-translate-x-full",
        isCollapsed ? "w-[80px]" : "w-[260px]"
      )}>
        {/* Logo Area */}
        <div className={cn("p-6 border-b border-white/10 flex items-start gap-4", isCollapsed && "justify-center px-4")}>
          <div className="w-12 h-12 shrink-0">
             <div className="w-full h-full bg-blue-900 rounded-lg flex items-center justify-center border border-white/20">
                <span className="text-xs font-bold text-yellow-400">GARUT</span>
             </div>
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <h1 className="text-sm font-bold text-white tracking-wide leading-tight">GARUT SMART<br/>COMMAND CENTER</h1>
              <p className="text-[10px] text-slate-400 mt-2 leading-tight">Dinas Pekerjaan Umum dan<br/>Penataan Ruang Kabupaten Garut</p>
            </div>
          )}
          <button onClick={close} className="md:hidden text-slate-400 hover:text-white shrink-0 ml-auto">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Menu Items */}
        <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar">
          <nav className="space-y-1">
            {menuItems.map((item, idx) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  href={item.href}
                  key={idx}
                  title={isCollapsed ? item.label : undefined}
                  onClick={() => {
                    if (window.innerWidth < 768) close();
                  }}
                  className={cn(
                    "w-full flex items-center gap-4 rounded-lg text-sm transition-all duration-250",
                    isCollapsed ? "justify-center p-3" : "px-4 py-3",
                    isActive 
                      ? "bg-blue-600 text-white shadow-lg font-medium" 
                      : "text-slate-300 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-white" : "")} strokeWidth={isActive ? 2.5 : 2} />
                  {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Quick Actions */}
        {!isCollapsed && (
          <div className="p-4 border-t border-white/10">
            <p className="text-xs text-slate-400 font-bold mb-3 uppercase tracking-wider">QUICK ACTION</p>
            <div className="grid grid-cols-2 gap-2">
              <button className="flex flex-col items-center justify-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-slate-300 text-center leading-tight">Tambah<br/>Permohonan</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-slate-300 text-center leading-tight">AI<br/>Assistant</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-slate-300 text-center leading-tight">Scan QR</span>
              </button>
              <Link href="/whatsapp" className="flex flex-col items-center justify-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 text-green-400 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <span className="text-[10px] text-slate-300 text-center leading-tight">WhatsApp</span>
              </Link>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
