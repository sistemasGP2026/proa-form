import { Column,CreateDateColumn,Entity,PrimaryGeneratedColumn,UpdateDateColumn } from 'typeorm';
import { TipoAntibiotico } from './tipoAntibiotico.enum';
import { AntibioticoState } from './antibiotico.state';

@Entity('antibioticos')
export class Antibiotico {

  @PrimaryGeneratedColumn()
  id!: number;

  @Column({type: 'varchar',length: 30,unique: true})
  codigo!: string;

  @Column({type: 'varchar',length: 200})
  nombre!: string;

  @Column({type: 'varchar',length: 20})
  tipo!: TipoAntibiotico;

  @Column({default: true})
  activo!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({type:'varchar', length: 20, default: AntibioticoState.APROBADO})
  state!: AntibioticoState;
}