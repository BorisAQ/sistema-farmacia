'use client';

import { useState, useEffect } from 'react';
import { Building2, MapPin, Pill, FileText, Users, Phone } from 'lucide-react';

export default function FarmaciasPage() {
  const [farmacias, setFarmacias] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/farmacias')
      .then((r) => r.json())
      .then((data) => setFarmacias(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <Building2 className="w-7 h-7 text-emerald-400" />
          Red Nacional de Farmacias (15 Sedes en Bolivia)
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Supervisión centralizada de las sedes departamentales, catálogos asignados y recetas emitidas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-12 text-slate-500">
            Cargando sedes de farmacia...
          </div>
        ) : (
          farmacias.map((f) => (
            <div
              key={f.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl hover:border-slate-700 transition space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {f.codigoFarmacia}
                  </span>
                  <h3 className="font-bold text-white text-base mt-2">{f.nombre}</h3>
                </div>

                <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-medium flex items-center gap-1 border border-slate-700">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  {f.departamento}
                </span>
              </div>

              <div className="text-xs text-slate-400 space-y-1">
                <div className="truncate">📍 {f.direccion || 'Dirección central'}</div>
                {f.telefono && <div>📞 {f.telefono}</div>}
              </div>

              <div className="pt-3 border-t border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/60">
                  <div className="font-bold text-emerald-400 font-mono text-sm">
                    {f._count?.medicamentos || 0}
                  </div>
                  <div className="text-[10px] text-slate-400">Medicamentos</div>
                </div>

                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/60">
                  <div className="font-bold text-blue-400 font-mono text-sm">
                    {f._count?.recetas || 0}
                  </div>
                  <div className="text-[10px] text-slate-400">Recetas</div>
                </div>

                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800/60">
                  <div className="font-bold text-purple-400 font-mono text-sm">
                    {f._count?.usuarios || 0}
                  </div>
                  <div className="text-[10px] text-slate-400">Personal</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
