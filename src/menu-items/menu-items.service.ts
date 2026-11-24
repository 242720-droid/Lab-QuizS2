import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MenuItem } from './entities/menu-item.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';

@Injectable()
export class MenuItemsService {
  constructor(
    @InjectRepository(MenuItem)
    private readonly menuItemRepository: Repository<MenuItem>,
    @InjectRepository(Restaurant)
    private readonly restaurantRepository: Repository<Restaurant>,
  ) {}

  async findAll(restaurantId?: number): Promise<MenuItem[]> {
    if (restaurantId) {
      return this.menuItemRepository.find({
        where: { restaurantId },
        relations: ['restaurant'],
        order: { id: 'ASC' },
      });
    }
    return this.menuItemRepository.find({
      relations: ['restaurant'],
      order: { id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<MenuItem> {
    const item = await this.menuItemRepository.findOne({
      where: { id },
      relations: ['restaurant'],
    });

    if (!item) {
      throw new NotFoundException(`Menu item with ID ${id} not found`);
    }

    return item;
  }

  async create(createMenuItemDto: CreateMenuItemDto): Promise<MenuItem> {
    const restaurant = await this.restaurantRepository.findOne({
      where: { id: createMenuItemDto.restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException(
        `Cannot create menu item: Restaurant with ID ${createMenuItemDto.restaurantId} not found`,
      );
    }

    const menuItem = this.menuItemRepository.create({
      ...createMenuItemDto,
      restaurant,
    });

    return this.menuItemRepository.save(menuItem);
  }

  async update(
    id: number,
    updateMenuItemDto: UpdateMenuItemDto,
  ): Promise<MenuItem> {
    const menuItem = await this.findOne(id);

    if (updateMenuItemDto.restaurantId) {
      const restaurant = await this.restaurantRepository.findOne({
        where: { id: updateMenuItemDto.restaurantId },
      });
      if (!restaurant) {
        throw new NotFoundException(
          `Restaurant with ID ${updateMenuItemDto.restaurantId} not found`,
        );
      }
      menuItem.restaurant = restaurant;
      menuItem.restaurantId = updateMenuItemDto.restaurantId;
    }

    Object.assign(menuItem, updateMenuItemDto);
    return this.menuItemRepository.save(menuItem);
  }

  async remove(id: number): Promise<{ message: string; id: number }> {
    const menuItem = await this.findOne(id);
    await this.menuItemRepository.remove(menuItem);
    return {
      message: `Menu item '${menuItem.name}' (ID: ${id}) deleted successfully`,
      id,
    };
  }
}
