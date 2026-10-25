# 🏥 Sistema Nacional de Farmacias (Bolivia)

Sistema web multi-sede para el control, dispensación de medicamentos y generación de reportes clínicos y contables, optimizado para **costo $0** mediante arquitectura serverless en **Next.js**, **PostgreSQL (Supabase/Neon)** y **Vercel**.

---

## 🚀 Características Principales

1. **Aislamiento Multisede (15 Farmacias Departamentales)**:
   - Usuarios asignados estrictamente a su respectiva farmacia.
   - Perfil de Administrador Central con supervisión nacional.
2. **Población Beneficiaria & Regla de Vigencia**:
   - Padrón con matrícula y `codigoPersona`.
   - **Regla Clínica Estricta**: El sistema bloquea de inmediato la emisión de recetas a beneficiarios no vigentes.
3. **Control de Recetas**:
   - Atención en **Consulta Externa**, **Odontología** y **Emergencia** por periodos de tiempo.
   - Atención en **Internación** vinculada a paciente y sala/cama.
   - Congelamiento histórico de costos y fuentes al momento de la dispensación.
4. **Reportes Clínicos y Contables**:
   - Agrupados por tipo de atención y diferenciados por **Fuente de Financiamiento F1 y F2**.
   - Reporte de internaciones por paciente.
   - **Exportación en 1 clic**: Imprimir directamente, descargar en **PDF** y exportar a **Excel**.
5. **Módulo de Integración Masiva (Excel)**:
   - Exportación e importación de Pacientes (`codigoPersona`) y Medicamentos (`codigoMedicamento` y `codigoLiname`) sin duplicados.
6. **Pruebas Automatizadas y Calidad (CI/CD)**:
   - Pipeline en **GitHub Actions** (`.github/workflows/ci.yml`).
   - Suite de pruebas de reglas de negocio (`tests/reglasNegocio.test.mjs`).

---

## 🛠️ Tecnologías

- **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Actions, TypeScript)
- **Base de Datos**: PostgreSQL ([Supabase](https://supabase.com/) o [Neon](https://neon.tech/) - Free Tier)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Estilos & UI**: [Tailwind CSS](https://tailwindcss.com/) + Lucide Icons
- **Reportes**: SheetJS (`xlsx`) + `jspdf` & `jspdf-autotable`
- **Testing**: Node Native Test Runner (`node:test`)

---

## 📦 Puesta en Marcha Local

### 1. Clonar y configurar entorno
```bash
git clone <url-del-repositorio>
cd "03 Sistema Farmacia"
cp .env.example .env
```

Configura en tu archivo `.env` la cadena de conexión de tu base de datos PostgreSQL:
```env
DATABASE_URL="postgresql://usuario:password@host:5432/db"
JWT_SECRET="clave-secreta-para-tokens"
```

### 2. Instalar dependencias y migrar base de datos
```bash
npm install
npx prisma db push
node scripts/seed.mjs
```

### 3. Ejecutar Pruebas Automatizadas
```bash
npm test
```

### 4. Iniciar Servidor de Desarrollo
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## 🔑 Cuentas de Acceso Rápido para Pruebas

| Rol | Usuario | Contraseña | Alcance |
| :--- | :--- | :--- | :--- |
| **Admin Central** | `admin` | `Password123!` | Nacional (15 farmacias) |
| **Farmacéutico La Paz** | `farm_lapaz` | `Password123!` | Sede La Paz |
| **Farmacéutico Santa Cruz** | `farm_scz` | `Password123!` | Sede Santa Cruz |
| **Farmacéutico Cochabamba** | `farm_cbb` | `Password123!` | Sede Cochabamba |
| **Farmacéutico Sucre** | `farm_sucre` | `Password123!` | Sede Chuquisaca |

---

## 🌐 Despliegue en Vercel (Gratuito)

1. Sube este repositorio a tu cuenta de **GitHub**:
   ```bash
   git remote add origin https://github.com/TU_USUARIO/sistema-farmacia.git
   git push -u origin main
   ```
2. Ingresa a [Vercel](https://vercel.com/) y selecciona **Add New Project** -> Importa tu repositorio.
3. Agrega las variables de entorno en Vercel:
   - `DATABASE_URL` (cadena de conexión de Supabase o Neon)
   - `JWT_SECRET`
4. Presiona **Deploy**. ¡Tu sistema estará en línea sin costos de servidor!
