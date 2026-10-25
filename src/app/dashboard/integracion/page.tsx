'use client';

import { useState } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Database,
  ArrowRight,
  FileDown,
} from 'lucide-react';
import * as XLSX from 'xlsx';

export default function IntegracionPage() {
  const [tab, setTab] = useState<'PACIENTES' | 'MEDICAMENTOS'>('PACIENTES');
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const [previsualizacion, setPrevisualizacion] = useState<any[]>([]);

  // 1. Exportar datos a Excel
  const handleExportar = async () => {
    setCargando(true);
    setMensaje(null);
    try {
      const url =
        tab === 'PACIENTES'
          ? '/api/integracion/pacientes'
          : '/api/integracion/medicamentos';

      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Error al exportar');

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, tab === 'PACIENTES' ? 'Pacientes' : 'Medicamentos');

      const filename =
        tab === 'PACIENTES'
          ? 'Padron_Pacientes_Integracion.xlsx'
          : 'Catalogo_Medicamentos_Integracion.xlsx';

      XLSX.writeFile(wb, filename);
      setMensaje({ tipo: 'ok', texto: `Archivo ${filename} exportado exitosamente.` });
    } catch (e: any) {
      setMensaje({ tipo: 'error', texto: e.message });
    } finally {
      setCargando(false);
    }
  };

  // 2. Leer archivo Excel subido
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMensaje(null);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          setMensaje({ tipo: 'error', texto: 'El archivo Excel no contiene filas de datos.' });
          return;
        }

        setPrevisualizacion(data);
        setMensaje({
          tipo: 'ok',
          texto: `Archivo leído correctamente. Se encontraron ${data.length} registros listos para sincronizar.`,
        });
      } catch (err: any) {
        setMensaje({ tipo: 'error', texto: 'No se pudo procesar el archivo Excel. Verifique el formato.' });
      }
    };

    reader.readAsBinaryString(file);
  };

  // 3. Confirmar e Importar al Backend
  const handleConfirmarImportacion = async () => {
    if (previsualizacion.length === 0) return;

    setCargando(true);
    setMensaje(null);

    try {
      let res;
      if (tab === 'PACIENTES') {
        res = await fetch('/api/integracion/pacientes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(previsualizacion),
        });
      } else {
        res = await fetch('/api/integracion/medicamentos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ medicamentos: previsualizacion }),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar registros');

      setMensaje({
        tipo: 'ok',
        texto: `Sincronización masiva exitosa: Se procesaron ${data.procesados} registros correctamente.`,
      });
      setPrevisualizacion([]);
    } catch (e: any) {
      setMensaje({ tipo: 'error', texto: e.message });
    } finally {
      setCargando(false);
    }
  };

  // 4. Descargar Plantilla de Ejemplo
  const descargarPlantilla = () => {
    let ejemploData = [];
    let nombreArchivo = '';

    if (tab === 'PACIENTES') {
      ejemploData = [
        {
          codigoPersona: 'PER-9001',
          matricula: 'MAT-9001-LP',
          nombreCompleto: 'Alcides Arguedas Paz',
          sexo: 'M',
          fechaNacimiento: '1988-05-15',
          vigente: 'SI',
          observaciones: 'Afiliado titular',
        },
        {
          codigoPersona: 'PER-9002',
          matricula: 'MAT-9002-LP',
          nombreCompleto: 'Beatriz Canedo Rivera',
          sexo: 'F',
          fechaNacimiento: '1993-10-20',
          vigente: 'NO',
          observaciones: 'Renovación pendiente',
        },
      ];
      nombreArchivo = 'Plantilla_Importacion_Pacientes.xlsx';
    } else {
      ejemploData = [
        {
          codigoMedicamento: 'MED-EXT-801',
          codigoLiname: 'LIN-0105',
          nombreGenerico: 'Diclofenaco Sódico',
          nombreComercial: 'Voltaren',
          concentracion: '50 mg',
          presentacion: 'Comprimido',
          costoUnitario: 0.75,
          fuenteFinanciamiento: 'F1',
          stockActual: 500,
        },
        {
          codigoMedicamento: 'MED-EXT-802',
          codigoLiname: 'LIN-0106',
          nombreGenerico: 'Ciprofloxacina',
          nombreComercial: 'Ciprobay',
          concentracion: '500 mg',
          presentacion: 'Comprimido',
          costoUnitario: 2.10,
          fuenteFinanciamiento: 'F2',
          stockActual: 300,
        },
      ];
      nombreArchivo = 'Plantilla_Importacion_Medicamentos.xlsx';
    }

    const ws = XLSX.utils.json_to_sheet(ejemploData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
    XLSX.writeFile(wb, nombreArchivo);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <FileSpreadsheet className="w-7 h-7 text-emerald-400" />
          Módulo de Integración con Sistema Externo
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Carga masiva y exportación en Excel basada en <code>codigoPersona</code> y <code>codigoMedicamento</code>
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-4">
        <button
          onClick={() => {
            setTab('PACIENTES');
            setPrevisualizacion([]);
            setMensaje(null);
          }}
          className={`pb-3 text-sm font-semibold transition border-b-2 cursor-pointer ${
            tab === 'PACIENTES'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Integración de Pacientes (Padrón de Beneficiarios)
        </button>

        <button
          onClick={() => {
            setTab('MEDICAMENTOS');
            setPrevisualizacion([]);
            setMensaje(null);
          }}
          className={`pb-3 text-sm font-semibold transition border-b-2 cursor-pointer ${
            tab === 'MEDICAMENTOS'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Integración de Medicamentos & LINAME
        </button>
      </div>

      {mensaje && (
        <div
          className={`p-4 rounded-xl border text-sm flex items-center gap-2.5 ${
            mensaje.tipo === 'ok'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          {mensaje.tipo === 'ok' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{mensaje.texto}</span>
        </div>
      )}

      {/* Acciones principales: Exportar vs Importar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tarjeta de Exportación */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4">
              <Download className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">
              Exportar {tab === 'PACIENTES' ? 'Población' : 'Catálogo'} a Excel
            </h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Genera un archivo compatible para migrar o alimentar el otro sistema corporativo, incluyendo{' '}
              <strong className="text-slate-300">
                {tab === 'PACIENTES' ? 'codigoPersona y matrícula' : 'codigoMedicamento y código Liname'}
              </strong>
              .
            </p>
          </div>

          <button
            onClick={handleExportar}
            disabled={cargando}
            className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Descargar Base Completa en Excel
          </button>
        </div>

        {/* Tarjeta de Importación */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Upload className="w-6 h-6" />
              </div>

              <button
                type="button"
                onClick={descargarPlantilla}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 underline cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5" /> Descargar Plantilla Vacía
              </button>
            </div>

            <h2 className="text-lg font-bold text-white">
              Cargar Masivamente desde Excel
            </h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Seleccione el archivo exportado del otro sistema. Se actualizarán o crearán los registros
              sin duplicados mediante clave externa.
            </p>
          </div>

          <div className="mt-6">
            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-700 hover:border-emerald-500/50 rounded-xl bg-slate-950 cursor-pointer transition">
              <Upload className="w-6 h-6 text-slate-400 mb-1" />
              <span className="text-xs font-semibold text-slate-300">
                Haga clic para seleccionar archivo Excel (.xlsx, .xls)
              </span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Previsualización de Datos cargados */}
      {previsualizacion.length > 0 && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-white text-base">
                Vista Previa de Carga ({previsualizacion.length} registros)
              </h3>
              <p className="text-xs text-slate-400">
                Revise la estructura antes de confirmar la inserción en la base de datos
              </p>
            </div>

            <button
              onClick={handleConfirmarImportacion}
              disabled={cargando}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 transition cursor-pointer"
            >
              <Database className="w-4 h-4" />
              {cargando ? 'Sincronizando...' : 'Confirmar e Importar a Base de Datos'}
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-xl max-h-72">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-800 text-[11px] uppercase font-semibold text-slate-400 sticky top-0">
                <tr>
                  {Object.keys(previsualizacion[0] || {}).map((col) => (
                    <th key={col} className="px-4 py-2.5">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 bg-slate-950 font-mono text-[11px]">
                {previsualizacion.slice(0, 10).map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    {Object.values(row).map((val: any, i) => (
                      <td key={i} className="px-4 py-2 truncate max-w-xs">
                        {String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {previsualizacion.length > 10 && (
            <p className="text-[11px] text-slate-500 text-center">
              Mostrando las primeras 10 filas de {previsualizacion.length}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
