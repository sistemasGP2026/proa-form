import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { toObjectId } from 'src/utils/mongo.util';

/**
 * Sustituye a ParseIntPipe: valida que el parámetro sea un ObjectId de MongoDB
 * y lo devuelve como string (las rutas no cambian).
 */
@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    return toObjectId(value, metadata.data ?? 'id').toString();
  }
}
