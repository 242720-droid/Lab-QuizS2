import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { MenuItem } from '../../menu-items/entities/menu-item.entity';

@Entity('restaurants')
export class Restaurant {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  address: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  cuisine: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone: string;

  // One-to-many relationship: Restaurant has many MenuItems
  @OneToMany(() => MenuItem, (menuItem) => menuItem.restaurant, {
    cascade: true,
  })
  menuItems: MenuItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
