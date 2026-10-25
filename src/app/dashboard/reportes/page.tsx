'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  FileSpreadsheet,
  FileText,
  Printer,
  Search,
  Filter,
  Download,
  Building2,
  DollarSign,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ItemReporte {
  recetaId: string;
  numeroReceta: string;
  fecha: string;
  pacienteNombre: string;
  matricula: string;
  codigoPersona: string;
  tipoAtencion: string;
  fuenteFinanciamiento: string;
  nombreGenerico: string;
  nombreComercial: string;
  codigoLiname: string;
  codigoMedicamento: string;
  concentracion: string;
  presentacion: string;
  cantidad: number;
  costoUnitario: number;
  costoTotal: number;
  salaCamaInternacion?: string;
}

export default function ReportesPage() {
  const [tipoReporte, setTipoReporte] = useState<'ATENCIONES' | 'INTERNACION'>('ATENCIONES');
  const [fuente, setFuente] = useState<'F1' | 'F2' | ''>('F1');
  const [fechaDesde, setFechaDesde] = useState('2026-01-01');
  const [fechaHasta, setFechaHasta] = useState('2026-01-31');
  const [personaId, setPersonaId] = useState('');
  const [pacientes, setPacientes] = useState<any[]>([]);

  const [items, setItems] = useState<ItemReporte[]>([]);
  const [resumen, setResumen] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Cargar lista de pacientes para el filtro de internación
  useEffect(() => {
    fetch('/api/pacientes')
      .then((r) => r.json())
      .then((data) => setPacientes(data))
      .catch(console.error);
  }, []);

  const generarReporte = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('tipoReporte', tipoReporte);
      if (fuente) params.append('fuente', fuente);
      params.append('fechaDesde', fechaDesde);
      params.append('fechaHasta', fechaHasta);
      if (tipoReporte === 'INTERNACION' && personaId) {
        params.append('personaId', personaId);
      }

      const res = await fetch(`/api/reportes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setResumen(data.resumen || {});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generarReporte();
  }, [tipoReporte, fuente, fechaDesde, fechaHasta, personaId]);

  // Exportar a Excel
  const exportarExcel = () => {
    if (items.length === 0) return;

    const dataExcel = items.map((it) => ({
      'N° Receta': it.numeroReceta,
      'Fecha': it.fecha,
      'Paciente': it.pacienteNombre,
      'Matrícula': it.matricula,
      'Cód. Persona': it.codigoPersona,
      'Tipo Atención': it.tipoAtencion,
      'Fuente': it.fuenteFinanciamiento,
      'Liname': it.codigoLiname,
      'Nombre Genérico': it.nombreGenerico,
      'Nombre Comercial': it.nombreComercial,
      'Concentración': it.concentracion,
      'Presentación': it.presentacion,
      'Cantidad': it.cantidad,
      'Costo Unitario (Bs.)': it.costoUnitario,
      'Costo Total (Bs.)': it.costoTotal,
      'Sala/Cama Internación': it.salaCamaInternacion || '',
    }));

    const ws = XLSX.utils.json_to_sheet(dataExcel);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte_Farmacia');

    const nombreArchivo = `Reporte_${tipoReporte}_${fuente || 'TODAS'}_${fechaDesde}_a_${fechaHasta}.xlsx`;
    XLSX.writeFile(wb, nombreArchivo);
  };

  // Exportar a PDF
  const exportarPDF = () => {
    if (items.length === 0) return;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' });

    doc.setFontSize(14);
    doc.text('SISTEMA DE FARMACIA - REPORTE CLÍNICO CONSOLIDADO', 14, 15);

    doc.setFontSize(10);
    const subtitulo =
      tipoReporte === 'ATENCIONES'
        ? `Atenciones (Consulta Externa / Odontología / Emergencia) - Fuente: ${fuente || 'TODAS'} | Periodo: ${fechaDesde} al ${fechaHasta}`
        : `Internación - Paciente: ${pacientes.find((p) => p.id === personaId)?.nombreCompleto || 'Todos'} - Fuente: ${fuente || 'TODAS'}`;
    doc.text(subtitulo, 14, 22);

    const headers = [
      ['Fecha', 'Receta', 'Paciente', 'Matrícula', 'Liname', 'Medicamento', 'Cant.', 'P. Unit.', 'Total (Bs.)'],
    ];

    const body = items.map((it) => [
      it.fecha,
      it.numeroReceta,
      it.pacienteNombre,
      it.matricula,
      it.codigoLiname,
      `${it.nombreGenerico} (${it.concentracion})`,
      it.cantidad,
      it.costoUnitario.toFixed(2),
      it.costoTotal.toFixed(2),
    ]);

    autoTable(doc, {
      startY: 27,
      head: headers,
      body: body,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [16, 185, 129] },
      foot: [
        [
          '',
          '',
          '',
          '',
          '',
          'TOTAL GENERAL:',
          items.reduce((acc, i) => acc + i.cantidad, 0),
          '',
          `Bs. ${Number(resumen?.costoTotalGeneral || 0).toFixed(2)}`,
        ],
      ],
      footStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold' },
    });

    doc.save(`Reporte_Farmacia_${tipoReporte}_${fuente}.pdf`);
  };

  const imprimir = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Acciones de Exportación */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-emerald-400" />
            Reportes Clínicos y Financieros
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Consolidado por tipo de atención, fuentes F1 / F2 e internaciones con exportación directa
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={imprimir}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-300" />
            Imprimir
          </button>

          <button
            onClick={exportarPDF}
            disabled={items.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 text-xs font-semibold disabled:opacity-50 transition cursor-pointer"
          >
            <FileText className="w-4 h-4 text-rose-400" />
            Exportar PDF
          </button>

          <button
            onClick={exportarExcel}
            disabled={items.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold disabled:opacity-50 transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            Exportar Excel
          </button>
        </div>
      </div>

      {/* Controles de Configuración del Reporte */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
        {/* Pestañas de Tipo de Reporte */}
        <div className="flex border-b border-slate-800 pb-3 gap-3">
          <button
            onClick={() => setTipoReporte('ATENCIONES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              tipoReporte === 'ATENCIONES'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'text-slate-400 hover:text-white bg-slate-800/60'
            }`}
          >
            Consulta Externa / Odontología / Emergencia (Por Periodo)
          </button>

          <button
            onClick={() => setTipoReporte('INTERNACION')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
              tipoReporte === 'INTERNACION'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'text-slate-400 hover:text-white bg-slate-800/60'
            }`}
          >
            Reportes de Internación (Por Paciente)
          </button>
        </div>

        {/* Filtros específicos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Fuente de Financiamiento F1 / F2 */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">
              Fuente de Financiamiento:
            </label>
            <select
              value={fuente}
              onChange={(e) => setFuente(e.target.value as any)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2 focus:ring-1 focus:ring-emerald-500"
            >
              <option value="F1">Fuente F1 (Financiamiento 1)</option>
              <option value="F2">Fuente F2 (Financiamiento 2)</option>
              <option value="">Todas las fuentes</option>
            </select>
          </div>

          {/* Periodo Desde */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">Periodo Fecha Desde:</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
            />
          </div>

          {/* Periodo Hasta */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">Periodo Fecha Hasta:</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
            />
          </div>

          {/* Filtro Paciente (Especialmente relevante para Internación) */}
          <div>
            <label className="block text-slate-400 font-medium mb-1">
              {tipoReporte === 'INTERNACION' ? 'Paciente de Internación:' : 'Filtrar por Paciente (Opcional):'}
            </label>
            <select
              value={personaId}
              onChange={(e) => setPersonaId(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-3 py-2"
            >
              <option value="">Todos los pacientes</option>
              {pacientes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombreCompleto} ({p.matricula})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tarjeta de Resumen Estadístico */}
      {resumen && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Recetas Involucradas</div>
              <div className="text-2xl font-bold text-white mt-1">{resumen.totalRecetas}</div>
            </div>
            <FileText className="w-8 h-8 text-emerald-400/50" />
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Ítems Medicamentos Despachados</div>
              <div className="text-2xl font-bold text-white mt-1">{resumen.totalItems}</div>
            </div>
            <BarChart3 className="w-8 h-8 text-blue-400/50" />
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400">Costo Total Liquidado</div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                Bs. {Number(resumen.costoTotalGeneral || 0).toFixed(2)}
              </div>
            </div>
            <DollarSign className="w-8 h-8 text-emerald-400/50" />
          </div>
        </div>
      )}

      {/* Tabla Detallada del Reporte Clínico */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-[11px] uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Paciente / Matrícula</th>
                <th className="px-4 py-3">Atención</th>
                <th className="px-4 py-3">Liname</th>
                <th className="px-4 py-3">Nombre Genérico / Comercial</th>
                <th className="px-4 py-3">Conc. / Pres.</th>
                <th className="px-4 py-3 text-center">Fuente</th>
                <th className="px-4 py-3 text-right">Cant.</th>
                <th className="px-4 py-3 text-right">C. Unit (Bs.)</th>
                <th className="px-4 py-3 text-right">Total (Bs.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 font-sans text-slate-500">
                    Generando reporte consolidado...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 font-sans text-slate-500">
                    No existen registros clínicos para los criterios y fuente seleccionada.
                  </td>
                </tr>
              ) : (
                items.map((it, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition">
                    <td className="px-4 py-2.5 text-slate-400 whitespace-nowrap">{it.fecha}</td>
                    <td className="px-4 py-2.5 font-sans">
                      <div className="font-semibold text-white">{it.pacienteNombre}</div>
                      <div className="text-[11px] text-slate-400 font-mono">Mat: {it.matricula}</div>
                    </td>
                    <td className="px-4 py-2.5 font-sans whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 border border-slate-700 text-slate-300">
                        {it.tipoAtencion.replace('_', ' ')}
                      </span>
                      {it.salaCamaInternacion && (
                        <div className="text-[10px] text-amber-400 mt-0.5">
                          {it.salaCamaInternacion}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-emerald-400 font-bold whitespace-nowrap">
                      {it.codigoLiname}
                    </td>
                    <td className="px-4 py-2.5 font-sans">
                      <div className="text-slate-100 font-semibold">{it.nombreGenerico}</div>
                      <div className="text-[11px] text-slate-400 italic">{it.nombreComercial}</div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-300 font-sans whitespace-nowrap">
                      {it.concentracion} - {it.presentacion}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          it.fuenteFinanciamiento === 'F1'
                            ? 'bg-blue-500/20 text-blue-300'
                            : 'bg-purple-500/20 text-purple-300'
                        }`}
                      >
                        {it.fuenteFinanciamiento}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-200">
                      {it.cantidad}
                    </td>
                    <td className="px-4 py-2.5 text-right text-slate-300">
                      {it.costoUnitario.toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-white">
                      {it.costoTotal.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {items.length > 0 && (
              <tfoot className="bg-slate-800/90 font-mono font-bold text-xs border-t-2 border-slate-700">
                <tr>
                  <td colSpan={7} className="px-4 py-3 text-right font-sans text-slate-300">
                    TOTAL GENERAL LIQUIDADO:
                  </td>
                  <td className="px-4 py-3 text-right text-white">
                    {items.reduce((acc, i) => acc + i.cantidad, 0)}
                  </td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-right text-emerald-400 text-sm">
                    Bs. {Number(resumen?.costoTotalGeneral || 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
