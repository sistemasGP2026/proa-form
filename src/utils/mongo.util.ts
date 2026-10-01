import { BadRequestException } from '@nestjs/common';
import { Types } from 'mongoose';

/**
 * Convierte y valida un identificador de MongoDB.
 * Reemplaza el uso de ParseIntPipe / Number(id) que existía con SQL Server.
 */
export function toObjectId(value: unknown, campo = 'id'): Types.ObjectId {
  if (value instanceof Types.ObjectId) return value;

  const raw = typeof value === 'string' ? value.trim() : String(value ?? '');

  if (!Types.ObjectId.isValid(raw) || new Types.ObjectId(raw).toString() !== raw) {
    throw new BadRequestException(`El valor de "${campo}" no es un identificador válido`);
  }

  return new Types.ObjectId(raw);
}

export function isObjectId(value: unknown): boolean {
  const raw = typeof value === 'string' ? value.trim() : String(value ?? '');
  return Types.ObjectId.isValid(raw) && new Types.ObjectId(raw).toString() === raw;
}

/**
 * Normaliza documentos lean() de Mongoose para Handlebars:
 *  - ObjectId  -> string
 *  - _id       -> agrega también "id" (las vistas usan {{this.id}})
 *  - Date      -> se conserva tal cual (los helpers hbs esperan Date)
 *
 * Es necesario porque Handlebars bloquea el acceso a propiedades del prototipo,
 * y los documentos hidratados de Mongoose exponen sus campos por el prototipo.
 */
export function toPlain<T = any>(value: any): T {
  if (value === null || value === undefined) return value as T;

  if (value instanceof Types.ObjectId) return value.toString() as unknown as T;
  if (value instanceof Date) return value as unknown as T;

  if (Array.isArray(value)) return value.map((item) => toPlain(item)) as unknown as T;

  if (typeof value === 'object') {
    const salida: Record<string, any> = {};

    for (const [clave, contenido] of Object.entries(value)) {
      if (clave === '__v') continue;
      salida[clave] = toPlain(contenido);
    }

    if (salida._id !== undefined && salida.id === undefined) {
      salida.id = String(salida._id);
    }

    return salida as T;
  }

  return value as T;
}
