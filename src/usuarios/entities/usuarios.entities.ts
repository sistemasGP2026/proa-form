import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Rol } from './rol.enum';


@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 150 })
  nombreCompleto!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  usuario!: string;

  @Column({ type: 'varchar', length: 255, select: false })
  contraseña!: string;

  @Column({ type: 'varchar', length: 30 })
  rol!: Rol;

  @Column({ type: 'bit', default: true })
  activo!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}