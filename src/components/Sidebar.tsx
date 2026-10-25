'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FileText,
  Users,
  Pill,
  BarChart3,
  FileSpreadsheet,
  Building2,
} from 'lucide-react';

interface SidebarProps {
  rol?: string;
}

export default function Sidebar({ rol }: SidebarProps) {
  const pathname = usePathname();

  const links = [
    {
      name: 'Recetas & Dispensación',
      href: '/dashboard/recetas',
      icon: FileText,
    },
    {
      name: 'Población Beneficiaria',
      href: '/dashboard/pacientes',
      icon: Users,
    },
    {
      name: 'Catálogo & Medicamentos',
      href: '/dashboard/medicamentos',
      icon: Pill,
    },
    {
      name: 'Reportes Clínicos',
      href: '/dashboard/reportes',
      icon: BarChart3,
    },
    {
      name: 'Integración Masiva (Excel)',
      href: '/dashboard/integracion',
      icon: FileSpreadsheet,
    },
  ];

  if (rol === 'ADMIN_CENTRAL') {
    links.push({
      name: 'Red de Farmacias (15 Sedes)',
      href: '/dashboard/farmacias',
      icon: Building2,
    });
  }

  return (
    <aside className="w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <nav className="p-4 space-y-1.5">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{link.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Info Card en el pie del Sidebar */}
      <div className="mt-auto p-4 border-t border-slate-800/80">
        <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-xs text-slate-400">
          <p className="font-semibold text-slate-300">Reglas Clínicas Activas:</p>
          <ul className="mt-1 space-y-1 list-disc list-inside text-[11px] text-slate-400">
            <li>Validación estricta de beneficiarios vigentes</li>
            <li>Aislamiento multisede por farmacia</li>
            <li>Fuentes de financiamiento F1 y F2</li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
