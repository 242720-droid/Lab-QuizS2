import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Restaurant } from '../../restaurants/entities/restaurant.entity';

@Entity('menu_items')
export class MenuItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  // Store price with precision 10, scale 2; transformed to number
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  price: number;

  @Column({ type: 'varchar', length: 100, default: 'General' })
  category: string;

  @Column({ type: 'boolean', default: true })
  isAvailable: boolean;

  @Column({ type: 'int' })
  restaurantId: number;

  // Many-to-one relationship: MenuItem belongs to Restaurant
  @ManyToOne(() => Restaurant, (restaurant) => restaurant.menuItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'restaurantId' })
  restaurant: Restaurant;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
