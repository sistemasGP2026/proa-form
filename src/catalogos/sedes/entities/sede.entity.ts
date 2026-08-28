import { Column,CreateDateColumn,Entity,PrimaryGeneratedColumn,UpdateDateColumn } from 'typeorm';

@Entity('sedes')
export class Sede {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'varchar',
    length: 30,
    unique: true,
  })
  codigo!: string;

  @Column({
    type: 'varchar',
    length: 100,
    unique: true
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