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
  PurchasePeriodDto,
  PurchasePeriodFilterDto,
  UpdatePurchasePeriodDto,
} from 'src/dtos/purchasePeriod.dto';
import { PurchasePeriodService } from 'src/services/purchasePeriod.service';
import { PaginatedRecordsDto, PaginationDto } from 'src/dtos/pagination.dto';
import { StandardResopnse } from 'src/common';
import { DeleteResult } from 'typeorm';
import { Roles } from 'src/decorators/roles.decorator';
import { PurchasePeriod } from 'src/entities/purchasePeriod.entity';
import {
  PurchasePeriodItemDto,
  PurchasePeriodItemFilterDto,
} from 'src/dtos/purchasePeriodItem.dto';
import { PurchasePeriodItem } from 'src/entities/purchasePeriodItem.entity';

@Controller('market-run')
@ApiTags(SwaggerApiEnumTags.PURCHASEPERIOD)
@Roles(RoleEnum.ADMIN)
@ApiBearerAuth()
export class PurchasePeriodController {
  constructor(private readonly PurchasePeriodService: PurchasePeriodService) {}

  @Post()
  createPurchasePeriod(
    @Body() creatPurchasePeriod: PurchasePeriodDto,
  ): Promise<StandardResopnse<PurchasePeriodDto>> {
    return this.PurchasePeriodService.createPurchasePeriod(creatPurchasePeriod);
  }
  @Post('create-publish')
  CreateAndPublishPurchasePeriod(
    @Body() creatPurchasePeriod: PurchasePeriodDto,
  ): Promise<StandardResopnse<PurchasePeriodDto>> {
    return this.PurchasePeriodService.createPurchasePeriod(
      creatPurchasePeriod,
      true,
    );
  }

  @Post('/:id/publish')
  PublishPurchasePeriod(
    @Param('id') id: string,
  ): Promise<StandardResopnse<PurchasePeriodDto>> {
    return this.PurchasePeriodService.publishPurchasePeriod(id);
  }

  @Patch(':id')
  updatePurchasePeriod(
    @Body() updatePurchasePeriod: UpdatePurchasePeriodDto,
    @Param('id') id: string,
  ): Promise<StandardResopnse<UpdatePurchasePeriodDto>> {
    return this.PurchasePeriodService.updatePurchasePeriod(
      id,
      updatePurchasePeriod,
    );
  }

  @Patch(':id/update-publish')
  updateAndPublishPurchasePeriod(
    @Body() updatePurchasePeriod: UpdatePurchasePeriodDto,
    @Param('id') id: string,
  ): Promise<StandardResopnse<UpdatePurchasePeriodDto>> {
    return this.PurchasePeriodService.updateAndPublishPurchasePeriod(
      id,
      updatePurchasePeriod,
    );
  }

  @Delete(':id')
  deletePurchasePeriod(
    @Param('id') id: string,
  ): Promise<StandardResopnse<DeleteResult>> {
    return this.PurchasePeriodService.deletePurchasePeriod(id);
  }

  @Get(':id')
  findSinglePurchasePeriod(
    @Param('id') id: string,
  ): Promise<StandardResopnse<PurchasePeriod>> {
    return this.PurchasePeriodService.findPurchasePeriodById(id);
  }

  @Get()
  async findPurchasePeriod(
    @Query() paginationDto: PaginationDto,
    @Query() PurchasePeriodFilterDto: PurchasePeriodFilterDto,
  ): Promise<StandardResopnse<PaginatedRecordsDto<PurchasePeriod>>> {
    return this.PurchasePeriodService.findpurchasePeriods(
      paginationDto,
      PurchasePeriodFilterDto,
    );
  }

  @Get(':id/market-run-commodities')
  async findPurchasePeriodUnit(
    @Query() paginationDto: PaginationDto,
    @Query() PurchasePeriodFilterDto: PurchasePeriodItemFilterDto,
    @Param('id') PurchasePeriodId: string,
  ): Promise<StandardResopnse<PaginatedRecordsDto<PurchasePeriodItem>>> {
    return this.PurchasePeriodService.findPurchasePeriodItems(
      paginationDto,
      PurchasePeriodFilterDto,
      PurchasePeriodId,
    );
  }
}
