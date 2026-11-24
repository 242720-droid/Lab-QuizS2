import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MenuItemsController } from './menu-items.controller';
import { MenuItemsService } from './menu-items.service';
import { MenuItem } from './entities/menu-item.entity';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@Module({
  imports: [TypeOrmModule.forFeature([MenuItem, Restaurant])],
  controllers: [MenuItemsController],
  providers: [MenuItemsService, ApiKeyGuard],
  exports: [MenuItemsService, TypeOrmModule],
})
export class MenuItemsModule {}
