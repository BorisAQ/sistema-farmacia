import { describe, it } from 'node:test';
import assert from 'node:assert';

/**
 * Suite de Pruebas Automatizadas de Reglas de Negocio
 * Encargado de Calidad y Pruebas (QA) & Especialista de Seguridad
 */

describe('🧪 Suite de Pruebas: Reglas de Negocio Clínicas y Farmacéuticas', () => {

  describe('1. Regla Clínica: Emisión de Recetas según Vigencia del Paciente', () => {
    function validarEmisionReceta(paciente, items) {
      if (!paciente) {
        throw new Error('El paciente no está registrado');
      }
      if (!paciente.vigente) {
        throw new Error(`EMISIÓN DENEGADA: El paciente ${paciente.nombreCompleto} NO se encuentra vigente para recibir medicamentos.`);
      }
      if (!items || items.length === 0) {
        throw new Error('La receta debe contener al menos un medicamento');
      }
      return { aprobado: true, estado: 'EMITIDA' };
    }

    it('Debe RECHAZAR la receta si el paciente NO está vigente', () => {
      const pacienteNoVigente = {
        codigoPersona: 'PER-1006',
        matricula: 'MAT-78906-OR',
        nombreCompleto: 'Sonia Beatriz Condori',
        vigente: false,
      };

      assert.throws(
        () => validarEmisionReceta(pacienteNoVigente, [{ medicamentoId: 'M1', cantidad: 2 }]),
        /EMISIÓN DENEGADA: El paciente .* NO se encuentra vigente/
      );
    });

    it('Debe APROBAR la receta si el paciente SÍ está vigente y contiene medicamentos', () => {
      const pacienteVigente = {
        codigoPersona: 'PER-1001',
        matricula: 'MAT-78901-LP',
        nombreCompleto: 'Juan Carlos Mamani',
        vigente: true,
      };

      const resultado = validarEmisionReceta(pacienteVigente, [{ medicamentoId: 'M1', cantidad: 3 }]);
      assert.strictEqual(resultado.aprobado, true);
      assert.strictEqual(resultado.estado, 'EMITIDA');
    });

    it('Debe RECHAZAR la receta si no contiene medicamentos', () => {
      const pacienteVigente = {
        codigoPersona: 'PER-1001',
        nombreCompleto: 'Juan Carlos Mamani',
        vigente: true,
      };

      assert.throws(
        () => validarEmisionReceta(pacienteVigente, []),
        /La receta debe contener al menos un medicamento/
      );
    });
  });

  describe('2. Regla de Seguridad: Aislamiento Multisede por Farmacia', () => {
    function determinarFarmaciaEfectiva(usuario, farmaciaSolicitada) {
      if (usuario.rol === 'ADMIN_CENTRAL') {
        return farmaciaSolicitada || null; // El admin puede consultar cualquier farmacia
      }
      // Los farmacéuticos quedan estrictamente restringidos a su farmacia asignada
      return usuario.farmaciaId;
    }

    it('Un usuario farmacéutico de La Paz NO debe poder acceder a datos de Santa Cruz', () => {
      const usuarioLaPaz = {
        id: 'U1',
        username: 'farm_lapaz',
        rol: 'FARMACEUTICO',
        farmaciaId: 'FARM-LPZ-01',
      };

      const farmaciaConsultada = determinarFarmaciaEfectiva(usuarioLaPaz, 'FARM-SCZ-03');
      // Debe ignorar la farmacia solicitada y forzar la farmacia del usuario
      assert.strictEqual(farmaciaConsultada, 'FARM-LPZ-01');
    });

    it('El Administrador Central SÍ puede consultar cualquier farmacia especificada', () => {
      const admin = {
        id: 'U0',
        username: 'admin',
        rol: 'ADMIN_CENTRAL',
        farmaciaId: null,
      };

      const farmaciaConsultada = determinarFarmaciaEfectiva(admin, 'FARM-SCZ-03');
      assert.strictEqual(farmaciaConsultada, 'FARM-SCZ-03');
    });
  });

  describe('3. Regla Financiera: Clasificación y Congelamiento de Fuentes F1 y F2', () => {
    function calcularDetalleReceta(medicamento, cantidad) {
      const subtotal = medicamento.costoUnitario * cantidad;
      return {
        medicamentoId: medicamento.id,
        cantidad,
        costoUnitario: medicamento.costoUnitario,
        costoTotal: subtotal,
        fuenteFinanciamiento: medicamento.fuenteFinanciamiento, // F1 o F2 congelado
      };
    }

    it('Debe calcular correctamente subtotales y preservar la fuente de financiamiento', () => {
      const paracetamolF1 = {
        id: 'MED-1',
        nombreGenerico: 'Paracetamol',
        costoUnitario: 0.50,
        fuenteFinanciamiento: 'F1',
      };

      const amoxicilinaF2 = {
        id: 'MED-2',
        nombreGenerico: 'Amoxicilina',
        costoUnitario: 1.20,
        fuenteFinanciamiento: 'F2',
      };

      const detalle1 = calcularDetalleReceta(paracetamolF1, 10);
      assert.strictEqual(detalle1.costoTotal, 5.00);
      assert.strictEqual(detalle1.fuenteFinanciamiento, 'F1');

      const detalle2 = calcularDetalleReceta(amoxicilinaF2, 5);
      assert.strictEqual(detalle2.costoTotal, 6.00);
      assert.strictEqual(detalle2.fuenteFinanciamiento, 'F2');
    });
  });

  describe('4. Regla de Integración: Generación de Correlativos y Claves Externas', () => {
    function formatearReceta(codigoFarmacia, anio, secuencia) {
      const pad = String(secuencia).padStart(5, '0');
      return `${codigoFarmacia}-${anio}-${pad}`;
    }

    it('Debe generar el formato correlativo oficial por sede', () => {
      const numero = formatearReceta('FARM-LPZ-01', 2026, 42);
      assert.strictEqual(numero, 'FARM-LPZ-01-2026-00042');
    });
  });
});
