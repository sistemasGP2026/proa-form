import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Solicitud } from './solicitud.entity';
import { Antibiotico } from '../../antibiotico/entities/antibioticos.entity';


@Entity('solicitud_items')
export class SolicitudItem {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  solicitudId!: number;

  @ManyToOne(() => Solicitud, (solicitud) => solicitud.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'solicitudId' })
  solicitud!: Solicitud;

  @Column({ type: 'int' })
  antibioticoId!: number;

  @ManyToOne(() => Antibiotico)
  @JoinColumn({ name: 'antibioticoId' })
  antibiotico!: Antibiotico;

  @Column({ type: 'varchar', length: 50 })
  indicacion!: string;

  @Column({ type: 'varchar', length: 50 })
  dosis!: string;

  @Column({ type: 'varchar', length: 50 })
  frecuencia!: string;

  @Column({ type: 'varchar', length: 50 })
  duracion!: string;

  @Column({ type: 'varchar', length: 50 })
  viaAdministracion!: string;

  @Column({ type: 'date' })
  fechaInicio!: Date;

  @Column({ type: 'date' })
  fechaFin!: Date;
}