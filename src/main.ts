import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import cookieParser from 'cookie-parser';
import hbs from 'hbs';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { tieneAcceso } from './auth/permisos';
import { ROL_ETIQUETA, Rol } from './usuarios/entities/rol.enum';

hbs.registerHelper('isExpired', function (fechaFin) {
  if (!fechaFin) return false;

  const hoy = new Date();
  const fin = new Date(fechaFin);

  hoy.setHours(0, 0, 0, 0);
  fin.setHours(0, 0, 0, 0);

  return hoy > fin;
});

hbs.registerHelper('eq', function (a, b) {
  return a === b;
});

hbs.registerHelper('formatDate', (date: Date | string) => {
  if (!date) return '';
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return '';

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(parsedDate);
});

hbs.registerHelper('formatOnlyDate', (date: Date | string) => {
  if (!date) return '';
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return '';

  return new Intl.DateTimeFormat('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'UTC',
  }).format(parsedDate);
});

hbs.registerHelper('formatDateTime', (fecha: Date | string | null) => {
  if (!fecha) return '—';
  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return '—';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()} ${hh}:${min}`;
});

hbs.registerHelper('statusClass', (status: string) => {
  switch (String(status ?? '').toUpperCase()) {
    case 'PENDIENTE':
      return 'pendiente';
    case 'APROBADO':
      return 'aprobado';
    case 'RECHAZADO':
      return 'rechazado';
    case 'OBSERVADO':
      return 'observado';
    case 'SUSPENDIDO':
      return 'suspendido';
    case 'FINALIZADO':
      return 'finalizado';
    default:
      return 'desconocido';
  }
});

hbs.registerHelper('eq', (a: unknown, b: unknown) => a === b);
hbs.registerHelper('puedeVer', (rol: unknown, modulo: unknown) => tieneAcceso(rol, modulo));

hbs.registerHelper('nombreRol', (rol: unknown) => ROL_ETIQUETA[rol as Rol] ?? 'Usuario PROA');


async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const viewsPath = join(__dirname, '..', 'views');
  const publicPath = join(__dirname, '..', 'public');
  const partialsPath = join(viewsPath, 'partials');

  app.use(cookieParser());

  app.useStaticAssets(publicPath);
  app.useStaticAssets(viewsPath);

  app.setBaseViewsDir(viewsPath);
  app.setViewEngine('hbs');

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  hbs.registerHelper('lower', (str: unknown) => {
    if (typeof str !== 'string') return '';
    return str.toLowerCase();
  });

  hbs.registerPartials(partialsPath);
  hbs.registerPartials(join(partialsPath, 'components'));
  hbs.registerPartials(join(partialsPath, 'layout'));

  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  console.log(`PROA escuchando en http://localhost:${port}`);
}

bootstrap();