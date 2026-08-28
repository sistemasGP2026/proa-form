import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Usuario } from './entities/usuarios.entities';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { ActualizarUsuario, CrearUsuario } from './dto/crearUsuario.dto';
type UsuarioSinContrasena = Omit<Usuario, 'contraseña'>;

@Injectable()
export class UsuariosService {
    constructor(
        @InjectRepository(Usuario) private readonly usuarioRepository: Repository<Usuario>) { }

    async getAllActive(): Promise<Usuario[]> {
        return this.usuarioRepository.find({ where: { activo: true } });
    }

    async getById(id: number): Promise<Usuario | null> {
        return this.usuarioRepository.findOne({ where: { id } });
    }

    async getAllUser(): Promise<Usuario[]> {
        return await this.usuarioRepository.find()
    }



    async getUserByUsuario(usuario: string): Promise<Usuario | null> {
        return await this.usuarioRepository
            .createQueryBuilder('usuario')
            .addSelect('usuario.contraseña')
            .where('usuario.usuario = :usuario', { usuario })
            .andWhere('usuario.activo = :activo', { activo: true })
            .getOne();
    }
    async createUsuario(data: CrearUsuario): Promise<Usuario> {
        const passwordHashed = await bcrypt.hash(data.contraseña, 10);

        const isUsuarioInUse = await this.usuarioRepository.findOne({ where: { usuario: data.usuario } })

        if (isUsuarioInUse) {
            throw new BadRequestException(`El usuario ${data.usuario} ya se encuentra en uso`)
        }

        const usuario = {
            usuario: data.usuario,
            nombreCompleto: data.nombreCompleto,
            rol: data.rol,
            contraseña: passwordHashed,
            activo: true,
            createdAt: new Date(),
            updatedAt: new Date()
        }

        this.usuarioRepository.create(usuario);

        const usuarioGuardado = await this.usuarioRepository.save(usuario);

        const usuarioSinPassword = await this.usuarioRepository.findOne({
            where: { id: usuarioGuardado.id }
        });

        if (!usuarioSinPassword) {
            throw new BadRequestException(
                'El usuario fue creado pero no pudo ser recuperado'
            );
        }

        return usuarioSinPassword;
    }

    async delete(id: number): Promise<boolean> {
        const usuario = await this.usuarioRepository.findOne({ where: { id } });
        if (!usuario) {
            throw new BadRequestException(`Usuario con id ${id} no existe o ya fue eliminado`);
        }

        usuario.activo = false;
        await this.usuarioRepository.save(usuario);

        return true;
    }

    async update(id: number, data: ActualizarUsuario): Promise<UsuarioSinContrasena> {
        const usuario = await this.usuarioRepository.findOne({ where: { id } });
        if (!usuario) {
            throw new BadRequestException(`Usuario con id ${id} no existe o ya fue eliminado`);
        }

        if (data.usuario) {
            const existente = await this.usuarioRepository.findOne({ where: { usuario: data.usuario } });
            if (existente && existente.id !== id) {
                throw new BadRequestException(`Ya existe un usuario con el nombre de usuario "${data.usuario}"`);
            }
        }

        const { contraseña, ...resto } = data;
        Object.assign(usuario, resto);

        if (contraseña) {
            usuario.contraseña = await bcrypt.hash(contraseña, 10);
        }

        const guardado = await this.usuarioRepository.save(usuario);
        const { contraseña: _omit, ...sinContrasena } = guardado;
        return sinContrasena;
    }
}
