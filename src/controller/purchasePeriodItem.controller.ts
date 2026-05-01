import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { RoleEnum, SwaggerApiEnumTags } from '../common/index.enum';
import {
  PurchasePeriodItemDto,
  PurchasePeriodItemFilterDto,
  UpdatePurchasePeriodItemDto,
} from 'src/dtos/purchasePeriodItem.dto';
import { PaginatedRecordsDto, PaginationDto } from 'src/dtos/pagination.dto';
import { StandardResopnse } from 'src/common';
import { DeleteResult } from 'typeorm';
import { Roles } from 'src/decorators/roles.decorator';
import { PurchasePeriodItem } from 'src/entities/purchasePeriodItem.entity';
import { PurchasePeriodItemService } from 'src/services/purchasedPeriodItem.service';

@Controller('market-run-commodities')
@ApiTags(SwaggerApiEnumTags.PURCHASEPERIODITEM)
@Roles(RoleEnum.ADMIN)
@ApiBearerAuth()
export class PurchasePeriodItemController {
  constructor(
    private readonly PurchasePeriodItemService: PurchasePeriodItemService,
  ) {}

  @Post()
  createPurchasePeriodItem(
    @Body() creatPurchasePeriodItem: PurchasePeriodItemDto,
  ): Promise<StandardResopnse<PurchasePeriodItemDto>> {
    return this.PurchasePeriodItemService.createPurchasePeriodItem(
      creatPurchasePeriodItem,
    );
  }

  @Patch(':id')
  updatePurchasePeriodItem(
    @Body() updatePurchasePeriodItem: UpdatePurchasePeriodItemDto,
    @Param('id') id: string,
  ): Promise<StandardResopnse<UpdatePurchasePeriodItemDto>> {
    return this.PurchasePeriodItemService.updatePurchasePeriodItem(
      id,
      updatePurchasePeriodItem,
    );
  }

  @Delete(':id')
  deletePurchasePeriodItem(
    @Param('id') id: string,
  ): Promise<StandardResopnse<DeleteResult>> {
    return this.PurchasePeriodItemService.deletePurchasePeriodItem(id);
  }

  @Get()
  async findPurchasePeriodItem(
    @Query() paginationDto: PaginationDto,
    @Query() PurchasePeriodItemFilterDto: PurchasePeriodItemFilterDto,
  ): Promise<StandardResopnse<PaginatedRecordsDto<PurchasePeriodItem>>> {
    return this.PurchasePeriodItemService.findpurchasePeriodItems(
      paginationDto,
      PurchasePeriodItemFilterDto,
    );
  }
}
