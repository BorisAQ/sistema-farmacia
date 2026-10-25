'use client';

import { useRouter } from 'next/navigation';
import { Building2, LogOut, Shield, UserCircle2, Pill } from 'lucide-react';

interface NavbarProps {
  user: {
    nombreCompleto?: string;
    username?: string;
    rol?: string;
    farmaciaNombre?: string;
    farmaciaCodigo?: string;
    departamento?: string;
  };
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">
        {/* Brand / Sede */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Pill className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-base tracking-tight">
                Farmacia Bolivia
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono border border-slate-700">
                {user?.farmaciaCodigo || 'ADM-00'}
              </span>
            </div>
            <div className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              <span>{user?.farmaciaNombre || 'Administración Central'}</span>
              {user?.departamento && user.departamento !== 'Nacional' && (
                <span className="text-slate-400">({user.departamento})</span>
              )}
            </div>
          </div>
        </div>

        {/* User Status & Logout */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-sm font-semibold text-slate-200">
              {user?.nombreCompleto || user?.username}
            </span>
            <div className="flex items-center gap-1 justify-end text-xs text-slate-400">
              <Shield className="w-3 h-3 text-emerald-400" />
              <span>{user?.rol === 'ADMIN_CENTRAL' ? 'Administrador Nacional' : 'Farmacéutico'}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Cerrar Sesión"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
            <span className="hidden sm:inline">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </header>
  );
}
