'use client';

import { useState, useEffect } from 'react';
import {
  Pill,
  Search,
  Plus,
  Filter,
  DollarSign,
  Tag,
  Boxes,
} from 'lucide-react';

export default function MedicamentosPage() {
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroFuente, setFiltroFuente] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);

  // Form nuevo medicamento
  const [nuevo, setNuevo] = useState({
    codigoMedicamento: '',
    codigoLiname: '',
    nombreGenerico: '',
    nombreComercial: '',
    concentracion: '',
    presentacion: '',
    costoUnitario: 0,
    fuenteFinanciamiento: 'F1',
    stockActual: 100,
  });

  const cargarMedicamentos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (busqueda) params.append('q', busqueda);
      if (filtroFuente) params.append('fuente', filtroFuente);

      const res = await fetch(`/api/medicamentos?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setMedicamentos(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMedicamentos();
  }, [filtroFuente]);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    cargarMedicamentos();
  };

  const handleCrear = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/medicamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevo),
      });

      if (res.ok) {
        setModalAbierto(false);
        setNuevo({
          codigoMedicamento: '',
          codigoLiname: '',
          nombreGenerico: '',
          nombreComercial: '',
          concentracion: '',
          presentacion: '',
          costoUnitario: 0,
          fuenteFinanciamiento: 'F1',
          stockActual: 100,
        });
        cargarMedicamentos();
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
            <Pill className="w-7 h-7 text-emerald-400" />
            Catálogo de Medicamentos & LINAME
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gestión de fármacos de la farmacia, códigos LINAME, costos unitarios y fuentes F1/F2
          </p>
        </div>

        <button
          onClick={() => setModalAbierto(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm shadow-lg shadow-emerald-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Registrar Medicamento
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <form onSubmit={handleBuscar} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por Liname, genérico, comercial o código..."
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
            <Filter className="w-3.5 h-3.5 text-emerald-400" /> Fuente:
          </span>
          <select
            value={filtroFuente}
            onChange={(e) => setFiltroFuente(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2"
          >
            <option value="">Todas las fuentes (F1 y F2)</option>
            <option value="F1">Fuente F1</option>
            <option value="F2">Fuente F2</option>
          </select>
        </div>
      </div>

      {/* Tabla de Medicamentos */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Código LINAME</th>
                <th className="px-5 py-3.5">Cód. Sistema Ext.</th>
                <th className="px-5 py-3.5">Nombre Genérico / Comercial</th>
                <th className="px-5 py-3.5">Concentración / Presentación</th>
                <th className="px-5 py-3.5 text-center">Fuente</th>
                <th className="px-5 py-3.5 text-right">Stock</th>
                <th className="px-5 py-3.5 text-right">Costo Unit. (Bs.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    Cargando catálogo...
                  </td>
                </tr>
              ) : medicamentos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    No se encontraron medicamentos en esta farmacia.
                  </td>
                </tr>
              ) : (
                medicamentos.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3.5 font-mono text-emerald-400 text-xs font-bold">
                      {m.codigoLiname}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-400 text-xs">
                      {m.codigoMedicamento}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-white">{m.nombreGenerico}</div>
                      <div className="text-xs text-slate-400">{m.nombreComercial}</div>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-300">
                      {m.concentracion} — {m.presentacion}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          m.fuenteFinanciamiento === 'F1'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                            : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                        }`}
                      >
                        {m.fuenteFinanciamiento}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-xs text-slate-200">
                      {m.stockActual} u.
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-white text-xs">
                      Bs. {Number(m.costoUnitario).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Medicamento */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" /> Registrar Medicamento en Catálogo
              </h2>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCrear} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Código LINAME:</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. LIN-0101"
                    value={nuevo.codigoLiname}
                    onChange={(e) => setNuevo({ ...nuevo, codigoLiname: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Cód. Medicamento (Ext):</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. MED-EXT-105"
                    value={nuevo.codigoMedicamento}
                    onChange={(e) => setNuevo({ ...nuevo, codigoMedicamento: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Nombre Genérico:</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Paracetamol"
                  value={nuevo.nombreGenerico}
                  onChange={(e) => setNuevo({ ...nuevo, nombreGenerico: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1 font-semibold">Nombre Comercial:</label>
                <input
                  type="text"
                  placeholder="ej. Tempra / Doloforte"
                  value={nuevo.nombreComercial}
                  onChange={(e) => setNuevo({ ...nuevo, nombreComercial: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Concentración:</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. 500 mg, 1 g"
                    value={nuevo.concentracion}
                    onChange={(e) => setNuevo({ ...nuevo, concentracion: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Presentación:</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Comprimido, Jarabe"
                    value={nuevo.presentacion}
                    onChange={(e) => setNuevo({ ...nuevo, presentacion: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Costo Unitario (Bs.):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={nuevo.costoUnitario}
                    onChange={(e) => setNuevo({ ...nuevo, costoUnitario: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Fuente:</label>
                  <select
                    value={nuevo.fuenteFinanciamiento}
                    onChange={(e) => setNuevo({ ...nuevo, fuenteFinanciamiento: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  >
                    <option value="F1">Fuente F1</option>
                    <option value="F2">Fuente F2</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">Stock Inicial:</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={nuevo.stockActual}
                    onChange={(e) => setNuevo({ ...nuevo, stockActual: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono"
                  />
                </div>
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
                  Guardar Medicamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
