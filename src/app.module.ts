import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configService } from './config/config.service';
import { UserController } from './controller/user.controller';
import { UserService } from './services/user.services';
import { User } from './entities/user.entity';
import { UserRepository } from './repositories/user.repositoty';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { HttpExceptionFilter } from './middleware/exception.filter';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from './guards/authGuard';
import { GroupRepository } from './repositories/group.repository';
import { UserGroupRepository } from './repositories/userGroup.repository';
import { Group } from './entities/group.entity';
import { UserGroup } from './entities/user_group.entity';
import { RolesGuard } from './guards/roleGuard';
import { CommodityService } from './services/commodity.service';
import { CategoryService } from './services/category.service';
import { CommodityRepository } from './repositories/commodity.repository';
import { CategoryRepository } from './repositories/category.repository';
import { CommodityController } from './controller/commodity.controller';
import { CategoryController } from './controller/category.controller';
import { Commodity } from './entities/commodity.entity';
import { Category } from './entities/category.entity';
import { CommodityUnitRepository } from './repositories/commodityUnits.repository';
import { CommodityUnitService } from './services/commodityUnit.service';
import { CommodityUnitController } from './controller/commodityUnit.controler';
import { CommodityUnit } from './entities/commodityUnit.entity';
import { PurchasePeriod } from './entities/purchasePeriod.entity';
import { PurchasePeriodRepository } from './repositories/purchasePeriod.repository';
import { PurchasePeriodItem } from './entities/purchasePeriodItem.entity';
import { PurchasePeriodItemRepository } from './repositories/purchasePeriodItems.repository';
import { PurchasePeriodService } from './services/purchasePeriod.service';
import { PurchasePeriodItemService } from './services/purchasedPeriodItem.service';
import { PurchasePeriodController } from './controller/purchasePeriod.controller';
import { PurchasePeriodItemController } from './controller/purchasePeriodItem.controller';
import { MailModule } from './mail/mail.module';
import { Request } from './entities/request.entity';
import { RequestItem } from './entities/requestItem.entity';
import { RequestRepository } from './repositories/request.repository';
import { RequestItemRepository } from './repositories/requestItem.repository';
import { requestService } from './services/request.service';
import { RequestItemService } from './services/requestItem.service';
import { RequestController } from './controller/request.controller';
import { RequestItemController } from './controller/requestItem.controller';
import { ProcureeInvite } from './entities/procureeInvite.entity';
import { ProcureeInviteRepository } from './repositories/procureeInvite.repository';
import { ProcureeInviteService } from './services/procureeInvite.service';
import { ProcureeInviteController } from './controller/procureeInvite.controller';

@Module({
  imports: [
    TypeOrmModule.forRoot(configService.createTypeOrmOptions()),
    TypeOrmModule.forFeature([
      User,
      Group,
      UserGroup,
      Commodity,
      Category,
      CommodityUnit,
      PurchasePeriod,
      PurchasePeriodItem,
      Request,
      RequestItem,
      ProcureeInvite,
    ]),
    JwtModule.register({
      global: true,
      secret: 'value',
      signOptions: { expiresIn: '600000s' },
    }),
    MailModule, // 👈 ADD THIS
  ],
  controllers: [
    UserController,
    CommodityController,
    CategoryController,
    CommodityUnitController,
    PurchasePeriodController,
    PurchasePeriodItemController,
    RequestController,
    RequestItemController,
    ProcureeInviteController,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },

    UserService,
    CommodityService,
    CategoryService,
    CommodityUnitService,
    PurchasePeriodService,
    PurchasePeriodItemService,
    requestService,
    RequestItemService,
    ProcureeInviteService,

    CommodityRepository,
    CategoryRepository,
    UserRepository,
    GroupRepository,
    UserGroupRepository,
    CommodityUnitRepository,
    PurchasePeriodRepository,
    PurchasePeriodItemRepository,
    RequestRepository,
    RequestItemRepository,
    ProcureeInviteRepository,
  ],
})
export class AppModule {}
