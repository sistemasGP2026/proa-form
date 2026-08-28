import {Entity,PrimaryGeneratedColumn,Column,OneToOne,JoinColumn,} from 'typeorm';
import { Solicitud } from './solicitud.entity';

@Entity('solicitud_evaluaciones')
export class SolicitudEvaluacion {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  solicitudId!: number;

  @OneToOne(() => Solicitud, (solicitud) => solicitud.evaluacion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'solicitudId' })
  solicitud!: Solicitud;

  @Column({ type: 'varchar', length: 150 })
  pacienteNombre!: string;

  @Column({ type: 'varchar', length: 30 })
  pacienteDocumento!: string;

  @Column({ type: 'varchar', length: 255 })
  diagnosticoPrincipal!: string;

  @Column({ type: 'varchar', length: 100 })
  diagnosticoRelacionado!: string;

  @Column({ type: 'bit' })
  pacienteInfectado!: boolean;

  @Column({ type: 'bit' })
  tratamientoPrevio!: boolean;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  tratamientoPrevioDesc!: string | null;

  @Column({ type: 'bit' })
  cultivosPrevios!: boolean;

  @Column({ type: 'bit' })
  ajustadoGuiaProa!: boolean;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  guiaIndicacion!: string | null;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  antecedentes!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  creatininaReporte!: string;
}