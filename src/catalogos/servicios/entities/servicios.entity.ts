import { Column,CreateDateColumn,Entity,PrimaryGeneratedColumn,UpdateDateColumn } from 'typeorm';

@Entity('servicios')
export class Servicios {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'varchar',
    length: 100,
    unique:true
  })
  nombre!: string;

  @Column({
    default: true,
  })
  activo!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}