import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RestaurantsModule } from './restaurants/restaurants.module';
import { MenuItemsModule } from './menu-items/menu-items.module';
import { Restaurant } from './restaurants/entities/restaurant.entity';
import { MenuItem } from './menu-items/entities/menu-item.entity';
import { RequestLoggerMiddleware } from './common/middleware/logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get<number>('DB_PORT', 5432)),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_NAME', 'food_ordering_db'),
        entities: [Restaurant, MenuItem],
        synchronize: config.get<string>('DB_SYNCHRONIZE', 'true') === 'true',
        logging: config.get<string>('DB_LOGGING', 'false') === 'true',
      }),
    }),
    RestaurantsModule,
    MenuItemsModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply request logger middleware across all endpoints
    consumer
      .apply(RequestLoggerMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
