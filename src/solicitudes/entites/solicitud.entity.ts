import {Entity,PrimaryGeneratedColumn,Column,CreateDateColumn,UpdateDateColumn,OneToOne,OneToMany,ManyToOne,JoinColumn} from 'typeorm';
import { SolicitudItem } from './solicitudItem.entity';
import { Sede } from 'src/catalogos/sedes/entities/sede.entity';
import { SolicitudEvaluacion } from './solicitudEvaluacion.entity';
import { Revision } from 'src/revisiones/entities/revision.entity';


@Entity('solicitudes')
export class Solicitud {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  sedeId!: number;

  @ManyToOne(() => Sede)
  @JoinColumn({ name: 'sedeId' })
  sede!: Sede;

  @Column({ type: 'varchar', length: 50 })
  servicio!: string;

  @Column({ type: 'varchar', length: 30 })
  habitacion!: string;

  @Column({ type: 'varchar', length: 100 })
  especialidad!: string;

  @Column({ type: 'varchar', length: 150 })
  medicoPrescribe!: string;

  @Column({ type: 'varchar', length: 150 })
  medicoRedacta!: string;

  @CreateDateColumn()
  submittedAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToOne(() => SolicitudEvaluacion, (evaluacion) => evaluacion.solicitud, { cascade: true })
  evaluacion!: SolicitudEvaluacion;

  @OneToMany(() => SolicitudItem, (item) => item.solicitud, { cascade: true })
  items!: SolicitudItem[];

  @OneToMany(() => Revision, (revision) => revision.solicitud)
  revisiones!: Revision[];
}