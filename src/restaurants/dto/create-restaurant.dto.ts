import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRestaurantDto {
  @IsNotEmpty({ message: 'Restaurant name must not be empty' })
  @IsString({ message: 'Restaurant name must be a string' })
  name: string;

  @IsNotEmpty({ message: 'Address must not be empty' })
  @IsString({ message: 'Address must be a string' })
  address: string;

  @IsOptional()
  @IsString({ message: 'Cuisine must be a string' })
  cuisine?: string;

  @IsOptional()
  @IsString({ message: 'Phone must be a string' })
  phone?: string;
}
