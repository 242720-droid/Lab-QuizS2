import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMenuItemDto {
  @IsNotEmpty({ message: 'Name must not be empty' })
  @IsString({ message: 'Name must be a string' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @Type(() => Number)
  @IsNumber({}, { message: 'Price must be a valid number' })
  @IsPositive({ message: 'Price must be a positive number' })
  price: number;

  @IsNotEmpty({ message: 'Category must not be empty' })
  @IsString({ message: 'Category must be a string' })
  category: string;

  @Type(() => Number)
  @IsNotEmpty({ message: 'Restaurant ID is required' })
  @IsNumber({}, { message: 'Restaurant ID must be a number' })
  restaurantId: number;

  @IsOptional()
  @IsBoolean({ message: 'isAvailable must be a boolean' })
  isAvailable?: boolean;
}
