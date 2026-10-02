import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { Usuario } from './entities/usuarios.entities';
import { ActualizarUsuario, CrearUsuario } from './dto/crearUsuario.dto';
import { toObjectId, toPlain } from 'src/utils/mongo.util';

/**
 * Contraseña con la que nace toda cuenta creada por el administrador.
 * No es un secreto: la persona la cambia al ingresar por primera vez.
 */
export const CLAVE_INICIAL = '123456';

@Injectable()
export class UsuariosService {
  constructor(@InjectModel(Usuario.name) private readonly usuarioModel: Model<Usuario>) {}

  async getAllActive(): Promise<any[]> {
    const usuarios = await this.usuarioModel
      .find({ activo: true })
      .sort({ nombreCompleto: 1 })
      .lean()
      .exec();
    return toPlain(usuarios);
  }

  async getById(id: string): Promise<any | null> {
    const usuario = await this.usuarioModel.findById(toObjectId(id, 'usuario')).lean().exec();
    return usuario ? toPlain(usuario) : null;
  }

  async getAllUser(): Promise<any[]> {
    const usuarios = await this.usuarioModel.find().sort({ nombreCompleto: 1 }).lean().exec();
    return toPlain(usuarios);
  }

  /** Incluye la contraseña (select:false en el schema); solo para autenticación. */
  async getUserByUsuario(usuario: string): Promise<any | null> {
    const encontrado = await this.usuarioModel
      .findOne({ usuario, activo: true })
      .select('+contraseña')
      .lean()
      .exec();

    return encontrado ? toPlain(encontrado) : null;
  }

  async createUsuario(data: CrearUsuario): Promise<any> {
    const isUsuarioInUse = await this.usuarioModel.exists({ usuario: data.usuario });
    if (isUsuarioInUse) {
      throw new BadRequestException(`El usuario ${data.usuario} ya se encuentra en uso`);
    }

    // Sin contraseña explicita la cuenta nace con la inicial y queda
    // marcada para que la persona la cambie al ingresar.
    const usaInicial = !data.contraseña;
    const passwordHashed = await bcrypt.hash(data.contraseña ?? CLAVE_INICIAL, 10);

    const creado = await this.usuarioModel.create({
      usuario: data.usuario,
      nombreCompleto: data.nombreCompleto,
      rol: data.rol,
      contraseña: passwordHashed,
      activo: data.activo ?? true,
      debeCambiarClave: usaInicial,
    });

    const usuarioSinPassword = await this.usuarioModel.findById(creado._id).lean().exec();

    if (!usuarioSinPassword) {
      throw new BadRequestException('El usuario fue creado pero no pudo ser recuperado');
    }

    return toPlain(usuarioSinPassword);
  }

  async delete(id: string): Promise<boolean> {
    const actualizado = await this.usuarioModel
      .findByIdAndUpdate(toObjectId(id, 'usuario'), { $set: { activo: false } })
      .lean()
      .exec();

    if (!actualizado) {
      throw new BadRequestException(`Usuario con id ${id} no existe o ya fue eliminado`);
    }

    return true;
  }

  async update(id: string, data: ActualizarUsuario): Promise<any> {
    const _id = toObjectId(id, 'usuario');

    const usuario = await this.usuarioModel.findById(_id).lean().exec();
    if (!usuario) {
      throw new BadRequestException(`Usuario con id ${id} no existe o ya fue eliminado`);
    }

    if (data.usuario) {
      const existente = await this.usuarioModel
        .findOne({ usuario: data.usuario, _id: { $ne: _id } })
        .lean()
        .exec();
      if (existente) {
        throw new BadRequestException(
          `Ya existe un usuario con el nombre de usuario "${data.usuario}"`,
        );
      }
    }

    const { contraseña, ...resto } = data;
    const cambios: Record<string, any> = { ...resto };

    if (contraseña) {
      cambios.contraseña = await bcrypt.hash(contraseña, 10);
      // La reasigna el administrador: la persona debera cambiarla.
      cambios.debeCambiarClave = true;
    }

    const guardado = await this.usuarioModel
      .findByIdAndUpdate(_id, { $set: cambios }, { new: true })
      .lean()
      .exec();

    return toPlain(guardado);
  }

  /**
   * Cambio de contraseña hecho por la propia persona.
   * Exige la contraseña actual: nadie puede cambiarsela a otro por aqui.
   */
  async cambiarClavePropia(id: string, actual: string, nueva: string): Promise<void> {
    const _id = toObjectId(id, 'usuario');

    const usuario = await this.usuarioModel
      .findOne({ _id, activo: true })
      .select('+contraseña')
      .lean()
      .exec();

    if (!usuario) {
      throw new BadRequestException('La cuenta no existe o esta inhabilitada');
    }

    const coincide = await bcrypt.compare(actual, (usuario as any).contraseña ?? '');
    if (!coincide) {
      throw new BadRequestException('La contraseña actual no es correcta');
    }

    if (actual === nueva) {
      throw new BadRequestException('La contraseña nueva debe ser distinta de la actual');
    }

    await this.usuarioModel
      .findByIdAndUpdate(_id, {
        $set: {
          contraseña: await bcrypt.hash(nueva, 10),
          debeCambiarClave: false,
        },
      })
      .exec();
  }
}
