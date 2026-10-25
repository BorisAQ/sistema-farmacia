'use client';

import { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  Filter,
  UserCheck,
  UserX,
} from 'lucide-react';

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroVigencia, setFiltroVigencia] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);

  // Form nuevo paciente
  const [nuevo, setNuevo] = useState({
    codigoPersona: '',
    matricula: '',
    nombreCompleto: '',
    sexo: 'M',
    fechaNacimiento: '1990-01-01',
    vigente: true,
    observaciones: '',
  });

  const cargarPacientes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (busqueda) params.append('q', busqueda);
      if (filtroVigencia === 'VIGENTES') params.append('soloVigentes', 'true');

      const res = await fetch(`/api/pacientes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPacientes(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarPacientes();
  }, [filtroVigencia]);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    cargarPacientes();
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/pacientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevo),
      });

      if (res.ok) {
        setModalAbierto(false);
        setNuevo({
          codigoPersona: '',
          matricula: '',
          nombreCompleto: '',
          sexo: 'M',
          fechaNacimiento: '1990-01-01',
          vigente: true,
          observaciones: '',
        });
        cargarPacientes();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-7 h-7 text-emerald-400" />
            Padrón de Beneficiarios Habilitados
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestión de pacientes, matrículas y control clínico de vigencia para recetas
          </p>
        </div>

        <button
          onClick={() => setModalAbierto(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm shadow-lg shadow-emerald-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Registrar Paciente
        </button>
      </div>

      {/* Filtros y Búsqueda */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleBuscar} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por nombre, matrícula o código persona..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-lg font-medium cursor-pointer"
          >
            Buscar
          </button>
        </form>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-emerald-400" /> Estado:
          </span>
          <select
            value={filtroVigencia}
            onChange={(e) => setFiltroVigencia(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2"
          >
            <option value="">Todos los registrados</option>
            <option value="VIGENTES">Solo Vigentes Habilitados</option>
          </select>
        </div>
      </div>

      {/* Tabla de Pacientes */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Código Persona</th>
                <th className="px-5 py-3.5">Matrícula</th>
                <th className="px-5 py-3.5">Nombre Completo</th>
                <th className="px-5 py-3.5">Sexo</th>
                <th className="px-5 py-3.5">Fecha Nacimiento</th>
                <th className="px-5 py-3.5">Estado Vigencia</th>
                <th className="px-5 py-3.5">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    Cargando padrón...
                  </td>
                </tr>
              ) : pacientes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    No se encontraron beneficiarios.
                  </td>
                </tr>
              ) : (
                pacientes.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3.5 font-mono text-emerald-400 text-xs font-semibold">
                      {p.codigoPersona}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-300 text-xs font-semibold">
                      {p.matricula}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-white">{p.nombreCompleto}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">{p.sexo}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">
                      {new Date(p.fechaNacimiento).toLocaleDateString('es-BO')}
                    </td>
                    <td className="px-5 py-3.5">
                      {p.vigente ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Vigente
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          <XCircle className="w-3.5 h-3.5" /> No Vigente
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">{p.observaciones || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Paciente */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" /> Registrar Nuevo Paciente
              </h2>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCrear} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Código Persona (Clave Externa):</label>
                <input
                  type="text"
                  required
                  placeholder="ej. PER-2045"
                  value={nuevo.codigoPersona}
                  onChange={(e) => setNuevo({ ...nuevo, codigoPersona: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Matrícula de Afiliación:</label>
                <input
                  type="text"
                  required
                  placeholder="ej. MAT-98012-LP"
                  value={nuevo.matricula}
                  onChange={(e) => setNuevo({ ...nuevo, matricula: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Nombre Completo:</label>
                <input
                  type="text"
                  required
                  placeholder="Nombre y Apellidos"
                  value={nuevo.nombreCompleto}
                  onChange={(e) => setNuevo({ ...nuevo, nombreCompleto: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Sexo:</label>
                  <select
                    value={nuevo.sexo}
                    onChange={(e) => setNuevo({ ...nuevo, sexo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="M">Masculino (M)</option>
                    <option value="F">Femenino (F)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Fecha Nacimiento:</label>
                  <input
                    type="date"
                    required
                    value={nuevo.fechaNacimiento}
                    onChange={(e) => setNuevo({ ...nuevo, fechaNacimiento: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Condición de Vigencia:</label>
                <select
                  value={nuevo.vigente ? 'true' : 'false'}
                  onChange={(e) => setNuevo({ ...nuevo, vigente: e.target.value === 'true' })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="true">Vigente (Habilitado para recibir recetas)</option>
                  <option value="false">No Vigente (Inhabilitado / Cese)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  Guardar Paciente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
