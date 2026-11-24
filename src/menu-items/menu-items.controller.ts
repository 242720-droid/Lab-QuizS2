import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { MenuItemsService } from './menu-items.service';
import { CreateMenuItemDto } from './dto/create-menu-item.dto';
import { UpdateMenuItemDto } from './dto/update-menu-item.dto';
import { ApiKeyGuard } from '../common/guards/api-key.guard';

@Controller('menu-items')
@UseGuards(ApiKeyGuard) // Protected by simple API-key header guard
export class MenuItemsController {
  constructor(private readonly menuItemsService: MenuItemsService) {}

  // GET /menu-items (optionally filter by ?restaurantId=)
  @Get()
  findAll(@Query('restaurantId') restaurantId?: string) {
    const parsedId = restaurantId ? parseInt(restaurantId, 10) : undefined;
    return this.menuItemsService.findAll(parsedId);
  }

  // GET /menu-items/:id
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.menuItemsService.findOne(id);
  }

  // POST /menu-items
  @Post()
  create(@Body() createMenuItemDto: CreateMenuItemDto) {
    return this.menuItemsService.create(createMenuItemDto);
  }

  // PATCH /menu-items/:id
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateMenuItemDto: UpdateMenuItemDto,
  ) {
    return this.menuItemsService.update(id, updateMenuItemDto);
  }

  // DELETE /menu-items/:id
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.menuItemsService.remove(id);
  }
}
