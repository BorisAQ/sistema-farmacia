import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Iniciando Seed del Sistema de Farmacia (Bolivia) ---');

  // 1. Limpieza inicial opcional
  await prisma.detalleReceta.deleteMany();
  await prisma.receta.deleteMany();
  await prisma.medicamento.deleteMany();
  await prisma.usuario.deleteMany();
  await prisma.persona.deleteMany();
  await prisma.farmacia.deleteMany();

  // 2. Crear las 15 Farmacias Departamentales de Bolivia
  const farmaciasData = [
    { codigoFarmacia: 'FARM-LPZ-01', nombre: 'Farmacia Central La Paz', departamento: 'La Paz', direccion: 'Av. 6 de Agosto #2100' },
    { codigoFarmacia: 'FARM-EAL-02', nombre: 'Farmacia Hospital El Alto', departamento: 'La Paz', direccion: 'Av. Juan Pablo II #450' },
    { codigoFarmacia: 'FARM-SCZ-03', nombre: 'Farmacia Central Santa Cruz', departamento: 'Santa Cruz', direccion: 'Av. Monseñor Rivero #320' },
    { codigoFarmacia: 'FARM-SCZ-04', nombre: 'Farmacia Villa 1ro de Mayo', departamento: 'Santa Cruz', direccion: 'Calle 3 Oeste #88' },
    { codigoFarmacia: 'FARM-CBB-05', nombre: 'Farmacia Central Cochabamba', departamento: 'Cochabamba', direccion: 'Av. Ballivián #650' },
    { codigoFarmacia: 'FARM-CBB-06', nombre: 'Farmacia Quillacollo', departamento: 'Cochabamba', direccion: 'Plaza Bolívar #12' },
    { codigoFarmacia: 'FARM-ORU-07', nombre: 'Farmacia Central Oruro', departamento: 'Oruro', direccion: 'Calle Pagador #1540' },
    { codigoFarmacia: 'FARM-POT-08', nombre: 'Farmacia Central Potosí', departamento: 'Potosí', direccion: 'Calle Bolívar #410' },
    { codigoFarmacia: 'FARM-POT-09', nombre: 'Farmacia Uyuni', departamento: 'Potosí', direccion: 'Av. Potosí #95' },
    { codigoFarmacia: 'FARM-CHU-10', nombre: 'Farmacia Central Sucre', departamento: 'Chuquisaca', direccion: 'Calle España #220' },
    { codigoFarmacia: 'FARM-TAR-11', nombre: 'Farmacia Central Tarija', departamento: 'Tarija', direccion: 'Calle Sucre #780' },
    { codigoFarmacia: 'FARM-TAR-12', nombre: 'Farmacia Yacuiba', departamento: 'Tarija', direccion: 'Calle Campero #340' },
    { codigoFarmacia: 'FARM-BEN-13', nombre: 'Farmacia Central Trinidad', departamento: 'Beni', direccion: 'Av. 18 de Noviembre #512' },
    { codigoFarmacia: 'FARM-BEN-14', nombre: 'Farmacia Riberalta', departamento: 'Beni', direccion: 'Av. Gabriel René Moreno #100' },
    { codigoFarmacia: 'FARM-PAN-15', nombre: 'Farmacia Central Cobija', departamento: 'Pando', direccion: 'Av. 9 de Febrero #204' },
  ];

  const farmacias = [];
  for (const f of farmaciasData) {
    const created = await prisma.farmacia.create({ data: f });
    farmacias.push(created);
  }
  console.log(`✓ Creadas ${farmacias.length} farmacias.`);

  // 3. Crear Usuarios
  const passwordHash = bcrypt.hashSync('Password123!', 10);

  // Administrador Central (acceso global)
  await prisma.usuario.create({
    data: {
      username: 'admin',
      email: 'admin@farmacia.bo',
      passwordHash,
      nombreCompleto: 'Lic. Administrador Nacional',
      rol: 'ADMIN_CENTRAL',
      activo: true,
    },
  });

  // Usuarios asignados a farmacias específicas
  const usuariosFarmacia = [
    { username: 'farm_lapaz', email: 'farmacia.lapaz@farmacia.bo', nombreCompleto: 'Dra. Elena Ramos - La Paz', farmaciaId: farmacias[0].id },
    { username: 'farm_elalto', email: 'farmacia.elalto@farmacia.bo', nombreCompleto: 'Dr. Marco Quispe - El Alto', farmaciaId: farmacias[1].id },
    { username: 'farm_scz', email: 'farmacia.scz@farmacia.bo', nombreCompleto: 'Dra. Claudia Vaca - Santa Cruz', farmaciaId: farmacias[2].id },
    { username: 'farm_cbb', email: 'farmacia.cbb@farmacia.bo', nombreCompleto: 'Dr. Roberto Rojas - Cochabamba', farmaciaId: farmacias[4].id },
    { username: 'farm_sucre', email: 'farmacia.sucre@farmacia.bo', nombreCompleto: 'Dra. Jimena Torrez - Sucre', farmaciaId: farmacias[9].id },
  ];

  for (const u of usuariosFarmacia) {
    await prisma.usuario.create({
      data: {
        username: u.username,
        email: u.email,
        passwordHash,
        nombreCompleto: u.nombreCompleto,
        rol: 'FARMACEUTICO',
        farmaciaId: u.farmaciaId,
        activo: true,
      },
    });
  }
  console.log('✓ Creados usuarios de prueba (Contraseña genérica: Password123!).');

  // 4. Beneficiarios / Pacientes (Vigentes y No Vigentes)
  const personasData = [
    { codigoPersona: 'PER-1001', matricula: 'MAT-78901-LP', nombreCompleto: 'Juan Carlos Mamani Choque', sexo: 'M', fechaNacimiento: new Date('1985-04-12'), vigente: true },
    { codigoPersona: 'PER-1002', matricula: 'MAT-78902-LP', nombreCompleto: 'María René Flores Castro', sexo: 'F', fechaNacimiento: new Date('1990-08-23'), vigente: true },
    { codigoPersona: 'PER-1003', matricula: 'MAT-78903-SC', nombreCompleto: 'Rubén Aguilera Paz', sexo: 'M', fechaNacimiento: new Date('1978-11-05'), vigente: true },
    { codigoPersona: 'PER-1004', matricula: 'MAT-78904-SC', nombreCompleto: 'Paola Ortiz Saucedo', sexo: 'F', fechaNacimiento: new Date('1995-02-18'), vigente: true },
    { codigoPersona: 'PER-1005', matricula: 'MAT-78905-CB', nombreCompleto: 'Carlos Eduardo Montaño Lara', sexo: 'M', fechaNacimiento: new Date('1982-06-30'), vigente: true },
    { codigoPersona: 'PER-1006', matricula: 'MAT-78906-OR', nombreCompleto: 'Sonia Beatriz Condori Huarachi', sexo: 'F', fechaNacimiento: new Date('1992-09-14'), vigente: false, observaciones: 'Vigencia vencida por cese laboral' },
    { codigoPersona: 'PER-1007', matricula: 'MAT-78907-PT', nombreCompleto: 'Germán Valdivia Morales', sexo: 'M', fechaNacimiento: new Date('1965-03-21'), vigente: false, observaciones: 'Pendiente renovación de afiliación' },
    { codigoPersona: 'PER-1008', matricula: 'MAT-78908-TJ', nombreCompleto: 'Lucía Andrea Tejerina Cardozo', sexo: 'F', fechaNacimiento: new Date('2001-12-08'), vigente: true },
  ];

  for (const p of personasData) {
    await prisma.persona.create({ data: p });
  }
  console.log(`✓ Creadas ${personasData.length} personas en el padrón (incluye vigentes y no vigentes).`);

  // 5. Catálogo de Medicamentos por Farmacia (LINAME)
  const medicamentosPlantilla = [
    { codigoMedicamento: 'MED-EXT-001', codigoLiname: 'LIN-0101', nombreGenerico: 'Paracetamol', nombreComercial: 'Tempra / Parafon', concentracion: '500 mg', presentacion: 'Comprimido', costoUnitario: 0.50, fuenteFinanciamiento: 'F1', stockActual: 1000 },
    { codigoMedicamento: 'MED-EXT-002', codigoLiname: 'LIN-0102', nombreGenerico: 'Ibuprofeno', nombreComercial: 'Ibupirac / Doloral', concentracion: '400 mg', presentacion: 'Comprimido', costoUnitario: 0.85, fuenteFinanciamiento: 'F1', stockActual: 800 },
    { codigoMedicamento: 'MED-EXT-003', codigoLiname: 'LIN-0201', nombreGenerico: 'Amoxicilina', nombreComercial: 'Amoxil / Clamox', concentracion: '500 mg', presentacion: 'Cápsula', costoUnitario: 1.20, fuenteFinanciamiento: 'F2', stockActual: 500 },
    { codigoMedicamento: 'MED-EXT-004', codigoLiname: 'LIN-0202', nombreGenerico: 'Amoxicilina + Ác. Clavulánico', nombreComercial: 'Clavinex', concentracion: '500/125 mg', presentacion: 'Comprimido recubierto', costoUnitario: 3.50, fuenteFinanciamiento: 'F2', stockActual: 300 },
    { codigoMedicamento: 'MED-EXT-005', codigoLiname: 'LIN-0301', nombreGenerico: 'Omeprazol', nombreComercial: 'Zoltum / Losec', concentracion: '20 mg', presentacion: 'Cápsula', costoUnitario: 1.10, fuenteFinanciamiento: 'F1', stockActual: 600 },
    { codigoMedicamento: 'MED-EXT-006', codigoLiname: 'LIN-0302', nombreGenerico: 'Metformina', nombreComercial: 'Glucophage', concentracion: '850 mg', presentacion: 'Comprimido', costoUnitario: 0.90, fuenteFinanciamiento: 'F1', stockActual: 700 },
    { codigoMedicamento: 'MED-EXT-007', codigoLiname: 'LIN-0401', nombreGenerico: 'Losartán Potásico', nombreComercial: 'Cozaar / Cardiol', concentracion: '50 mg', presentacion: 'Comprimido', costoUnitario: 0.95, fuenteFinanciamiento: 'F1', stockActual: 650 },
    { codigoMedicamento: 'MED-EXT-008', codigoLiname: 'LIN-0501', nombreGenerico: 'Ceftriaxona', nombreComercial: 'Rocephin', concentracion: '1 g', presentacion: 'Polvo para solución inyectable', costoUnitario: 12.00, fuenteFinanciamiento: 'F2', stockActual: 150 },
  ];

  // Poblar medicamentos para las principales farmacias
  for (const farmacia of farmacias) {
    for (const med of medicamentosPlantilla) {
      await prisma.medicamento.create({
        data: {
          ...med,
          farmaciaId: farmacia.id,
        },
      });
    }
  }
  console.log('✓ Catálogos de medicamentos LINAME poblados en las farmacias.');

  console.log('--- Seed completado con éxito ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
