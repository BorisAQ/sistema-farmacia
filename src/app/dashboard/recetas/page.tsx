'use client';

import { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  FileText,
  Calendar,
  User,
  Pill,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Hospital,
  DollarSign,
  Printer,
  ChevronRight,
  Filter,
} from 'lucide-react';

interface Paciente {
  id: string;
  codigoPersona: string;
  matricula: string;
  nombreCompleto: string;
  vigente: boolean;
  sexo: string;
}

interface Medicamento {
  id: string;
  codigoMedicamento: string;
  codigoLiname: string;
  nombreGenerico: string;
  nombreComercial: string;
  concentracion: string;
  presentacion: string;
  costoUnitario: number;
  fuenteFinanciamiento: 'F1' | 'F2';
  stockActual: number;
}

interface ItemDetalle {
  medicamentoId: string;
  cantidad: number;
}

export default function RecetasPage() {
  const [recetas, setRecetas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);

  // Filtros de listado
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroFuente, setFiltroFuente] = useState('');

  // Estados del Formulario de Nueva Receta
  const [pacientesVigentes, setPacientesVigentes] = useState<Paciente[]>([]);
  const [catalogoMedicamentos, setCatalogoMedicamentos] = useState<Medicamento[]>([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState<Paciente | null>(null);
  const [busquedaPaciente, setBusquedaPaciente] = useState('');
  const [tipoAtencion, setTipoAtencion] = useState('CONSULTA_EXTERNA');
  const [periodoInicio, setPeriodoInicio] = useState('2026-01-01');
  const [periodoFin, setPeriodoFin] = useState('2026-01-31');
  const [salaCamaInternacion, setSalaCamaInternacion] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [items, setItems] = useState<ItemDetalle[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState('');
  const [exitoMsg, setExitoMsg] = useState('');

  // Cargar lista de recetas
  const cargarRecetas = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filtroTipo) params.append('tipoAtencion', filtroTipo);
      if (filtroFuente) params.append('fuente', filtroFuente);

      const res = await fetch(`/api/recetas?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setRecetas(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarRecetas();
  }, [filtroTipo, filtroFuente]);

  // Cargar pacientes vigentes y catálogo de medicamentos para el modal
  useEffect(() => {
    if (modalAbierto) {
      fetch('/api/pacientes?soloVigentes=true')
        .then((r) => r.json())
        .then((data) => setPacientesVigentes(data))
        .catch(console.error);

      fetch('/api/medicamentos')
        .then((r) => r.json())
        .then((data) => setCatalogoMedicamentos(data))
        .catch(console.error);
    }
  }, [modalAbierto]);

  const agregarItem = () => {
    if (catalogoMedicamentos.length > 0) {
      setItems([...items, { medicamentoId: catalogoMedicamentos[0].id, cantidad: 1 }]);
    }
  };

  const actualizarItem = (index: number, campo: 'medicamentoId' | 'cantidad', valor: any) => {
    const copia = [...items];
    copia[index] = { ...copia[index], [campo]: valor };
    setItems(copia);
  };

  const eliminarItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Pacientes filtrados en el buscador
  const pacientesFiltrados = pacientesVigentes.filter(
    (p) =>
      p.nombreCompleto.toLowerCase().includes(busquedaPaciente.toLowerCase()) ||
      p.matricula.toLowerCase().includes(busquedaPaciente.toLowerCase()) ||
      p.codigoPersona.toLowerCase().includes(busquedaPaciente.toLowerCase())
  );

  // Calcular costo total en tiempo real
  const totalEstimado = items.reduce((acc, it) => {
    const med = catalogoMedicamentos.find((m) => m.id === it.medicamentoId);
    if (!med) return acc;
    return acc + Number(med.costoUnitario) * Number(it.cantidad || 0);
  }, 0);

  const handleCrearReceta = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorForm('');

    if (!pacienteSeleccionado) {
      setErrorForm('Debe seleccionar un paciente habilitado y vigente.');
      return;
    }

    if (items.length === 0) {
      setErrorForm('Debe añadir al menos un medicamento a la receta.');
      return;
    }

    setGuardando(true);

    try {
      const payload = {
        personaId: pacienteSeleccionado.id,
        tipoAtencion,
        periodoInicio: tipoAtencion !== 'INTERNACION' ? periodoInicio : null,
        periodoFin: tipoAtencion !== 'INTERNACION' ? periodoFin : null,
        salaCamaInternacion: tipoAtencion === 'INTERNACION' ? salaCamaInternacion : null,
        observaciones,
        detalles: items,
      };

      const res = await fetch('/api/recetas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al emitir receta');
      }

      setExitoMsg(`Receta ${data.numeroReceta} registrada exitosamente.`);
      setModalAbierto(false);
      // Reset
      setPacienteSeleccionado(null);
      setItems([]);
      setBusquedaPaciente('');
      cargarRecetas();
    } catch (err: any) {
      setErrorForm(err.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-7 h-7 text-emerald-400" />
            Emisión y Control de Recetas
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Registro con validación de vigencia clínica, tipificación de atención y fuentes F1/F2
          </p>
        </div>

        <button
          onClick={() => {
            setModalAbierto(true);
            setErrorForm('');
            setExitoMsg('');
            if (items.length === 0) agregarItem();
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm shadow-lg shadow-emerald-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nueva Receta
        </button>
      </div>

      {exitoMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{exitoMsg}</span>
        </div>
      )}

      {/* Barra de Filtros */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold uppercase text-slate-400 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-emerald-400" /> Filtrar por:
          </span>

          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">Todos los tipos de atención</option>
            <option value="CONSULTA_EXTERNA">Consulta Externa</option>
            <option value="ODONTOLOGIA">Odontología</option>
            <option value="EMERGENCIA">Emergencia</option>
            <option value="INTERNACION">Internación</option>
          </select>

          <select
            value={filtroFuente}
            onChange={(e) => setFiltroFuente(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">Todas las fuentes (F1 / F2)</option>
            <option value="F1">Fuente F1</option>
            <option value="F2">Fuente F2</option>
          </select>
        </div>

        <div className="text-xs text-slate-400">
          Total registradas: <strong className="text-white">{recetas.length}</strong>
        </div>
      </div>

      {/* Tabla de Recetas */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/60 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">N° Receta</th>
                <th className="px-5 py-3.5">Fecha</th>
                <th className="px-5 py-3.5">Paciente Beneficiario</th>
                <th className="px-5 py-3.5">Atención</th>
                <th className="px-5 py-3.5">Fuente</th>
                <th className="px-5 py-3.5">Medicamentos</th>
                <th className="px-5 py-3.5 text-right">Total (Bs.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-slate-500">
                    Cargando recetas...
                  </td>
                </tr>
              ) : recetas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    No se encontraron recetas emitidas con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                recetas.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3.5 font-mono text-emerald-400 font-semibold text-xs">
                      {r.numeroReceta}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400 whitespace-nowrap">
                      {new Date(r.fecha).toLocaleDateString('es-BO')}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-white">{r.persona.nombreCompleto}</div>
                      <div className="text-xs text-slate-400 font-mono">
                        Mat: {r.persona.matricula}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-800 border border-slate-700 text-slate-300">
                        {r.tipoAtencion.replace('_', ' ')}
                      </span>
                      {r.salaCamaInternacion && (
                        <div className="text-[11px] text-amber-400 mt-0.5">
                          Sala/Cama: {r.salaCamaInternacion}
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                          r.fuenteFinanciamiento === 'F1'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                            : 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                        }`}
                      >
                        {r.fuenteFinanciamiento}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-xs text-slate-300 space-y-0.5 max-w-xs">
                        {r.detalles.map((d: any) => (
                          <div key={d.id} className="truncate">
                            • <strong className="text-slate-100">{d.medicamento.nombreGenerico}</strong> ({d.medicamento.codigoLiname}) x{d.cantidad}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-white">
                      Bs. {Number(r.costoTotalReceta).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal / Formulario Nueva Receta */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-800/80 border-b border-slate-700 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                Registrar Nueva Receta
              </h2>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCrearReceta} className="p-6 space-y-6">
              {errorForm && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Alerta Clínica:</span> {errorForm}
                  </div>
                </div>
              )}

              {/* 1. Selección y Validación de Paciente Vigente */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-emerald-400" /> 1. Paciente Beneficiario (Solo Vigentes)
                  </label>
                  {pacienteSeleccionado && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                      ✓ VIGENTE HABILITADO
                    </span>
                  )}
                </div>

                {!pacienteSeleccionado ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Buscar por Nombre, Matrícula o Código de Persona..."
                        value={busquedaPaciente}
                        onChange={(e) => setBusquedaPaciente(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="max-h-36 overflow-y-auto divide-y divide-slate-800 border border-slate-800 rounded-lg bg-slate-950">
                      {pacientesFiltrados.length === 0 ? (
                        <div className="p-3 text-xs text-slate-500 text-center">
                          No se encontraron pacientes vigentes con ese criterio.
                        </div>
                      ) : (
                        pacientesFiltrados.slice(0, 5).map((p) => (
                          <div
                            key={p.id}
                            onClick={() => setPacienteSeleccionado(p)}
                            className="p-2.5 hover:bg-slate-800/80 cursor-pointer flex items-center justify-between text-xs transition"
                          >
                            <div>
                              <span className="font-semibold text-white">{p.nombreCompleto}</span>
                              <span className="ml-2 font-mono text-slate-400">Mat: {p.matricula}</span>
                            </div>
                            <span className="text-[11px] text-emerald-400 font-mono">{p.codigoPersona}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm">
                    <div>
                      <div className="font-bold text-white">{pacienteSeleccionado.nombreCompleto}</div>
                      <div className="text-xs text-slate-300 font-mono">
                        Matrícula: {pacienteSeleccionado.matricula} | Cód: {pacienteSeleccionado.codigoPersona}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPacienteSeleccionado(null)}
                      className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                    >
                      Cambiar
                    </button>
                  </div>
                )}
              </div>

              {/* 2. Tipo de Atención y Periodo / Internación */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-4">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Hospital className="w-4 h-4 text-emerald-400" /> 2. Tipo de Atención Médica
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'CONSULTA_EXTERNA', label: 'Consulta Externa' },
                    { id: 'ODONTOLOGIA', label: 'Odontología' },
                    { id: 'EMERGENCIA', label: 'Emergencia' },
                    { id: 'INTERNACION', label: 'Internación' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTipoAtencion(t.id)}
                      className={`p-2.5 rounded-lg border text-xs font-semibold transition ${
                        tipoAtencion === t.id
                          ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300'
                          : 'border-slate-700 bg-slate-900/60 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {tipoAtencion !== 'INTERNACION' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Periodo Desde:</label>
                      <input
                        type="date"
                        value={periodoInicio}
                        onChange={(e) => setPeriodoInicio(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Periodo Hasta:</label>
                      <input
                        type="date"
                        value={periodoFin}
                        onChange={(e) => setPeriodoFin(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="pt-2">
                    <label className="block text-xs text-slate-400 mb-1">
                      Identificador de Sala y Cama de Internación:
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Pabellón Quirúrgico - Sala 3, Cama 12"
                      value={salaCamaInternacion}
                      onChange={(e) => setSalaCamaInternacion(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500"
                    />
                  </div>
                )}
              </div>

              {/* 3. Detalle de Medicamentos */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-emerald-400" /> 3. Detalle de Medicamentos (Catálogo de Sede)
                  </label>
                  <button
                    type="button"
                    onClick={agregarItem}
                    className="text-xs font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar ítem
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((it, idx) => {
                    const medSel = catalogoMedicamentos.find((m) => m.id === it.medicamentoId);
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-3"
                      >
                        <div className="flex-1 w-full">
                          <select
                            value={it.medicamentoId}
                            onChange={(e) => actualizarItem(idx, 'medicamentoId', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2 focus:ring-1 focus:ring-emerald-500"
                          >
                            {catalogoMedicamentos.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.nombreGenerico} [{m.nombreComercial}] - {m.concentracion} ({m.presentacion}) - Liname: {m.codigoLiname} | Fuente: {m.fuenteFinanciamiento} | Bs. {Number(m.costoUnitario).toFixed(2)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-400">Cant:</span>
                            <input
                              type="number"
                              min={1}
                              value={it.cantidad}
                              onChange={(e) => actualizarItem(idx, 'cantidad', parseInt(e.target.value) || 1)}
                              className="w-16 bg-slate-800 border border-slate-700 text-white text-xs rounded-lg p-2 text-center"
                            />
                          </div>

                          <div className="text-xs font-mono font-bold text-white whitespace-nowrap">
                            Bs. {medSel ? (Number(medSel.costoUnitario) * (it.cantidad || 0)).toFixed(2) : '0.00'}
                          </div>

                          <button
                            type="button"
                            onClick={() => eliminarItem(idx)}
                            className="text-slate-500 hover:text-rose-400 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-2 flex justify-between items-center text-sm border-t border-slate-800">
                  <span className="text-slate-400">Costo Total Estimado:</span>
                  <span className="text-lg font-bold font-mono text-emerald-400">
                    Bs. {totalEstimado.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition cursor-pointer"
                >
                  {guardando ? 'Guardando...' : 'Confirmar y Emitir Receta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
