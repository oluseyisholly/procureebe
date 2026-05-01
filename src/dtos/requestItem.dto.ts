import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
} from 'class-validator';
import { BaseFilterDto } from './baseFilter.dto';
import { MaxGreaterThanMin } from 'src/decorators/maxGreaterThanMin.decorator';
import { PriceVarianceAction } from 'src/common/index.enum';

export class RequestItemDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  purchasePeriodId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  purchasePeriodItemId: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  requestedQty: number;

  @ApiProperty({ enum: PriceVarianceAction })
  @IsEnum(PriceVarianceAction)
  ifPriceHigherAction: PriceVarianceAction;

  @ApiProperty({ enum: PriceVarianceAction })
  @IsEnum(PriceVarianceAction)
  ifPriceLowerAction: PriceVarianceAction;
}

export class UpdateRequestItemDto extends PartialType(RequestItemDto) {}

export class RequestItemFilterDto extends BaseFilterDto {}
