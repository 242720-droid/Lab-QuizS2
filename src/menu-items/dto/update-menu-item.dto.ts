import {
  IsOptional,
  IsString,
  IsNumber,
  IsPositive,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateMenuItemDto {
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Price must be a valid number' })
  @IsPositive({ message: 'Price must be a positive number' })
  price?: number;

  @IsOptional()
  @IsString({ message: 'Category must be a string' })
  category?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({}, { message: 'Restaurant ID must be a number' })
  restaurantId?: number;

  @IsOptional()
  @IsBoolean({ message: 'isAvailable must be a boolean' })
  isAvailable?: boolean;
}
