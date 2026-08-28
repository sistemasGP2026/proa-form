import { Solicitud } from "src/solicitudes/entites/solicitud.entity";
import { Usuario } from "src/usuarios/entities/usuarios.entities";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('revisiones')
export class Revision {

  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  solicitudId!: number;

  @ManyToOne(() => Solicitud, solicitud => solicitud.revisiones)
  @JoinColumn({ name: 'solicitudId' })
  solicitud!: Solicitud;

  @Column({ type: 'int' })
  usuarioId!: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuarioId' })
  usuario!: Usuario;

  @Column({ type: 'varchar', length: 2000, nullable: true })
  observacion!: string | null;

  @CreateDateColumn()
  createdAt!: Date;
}