import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DeleteResult } from 'typeorm';
import { StandardResopnse } from 'src/common';
import { RequestContext } from 'src/common/context/requestContext';
import { RequestStatus } from 'src/common/index.enum';
import { PaginatedRecordsDto, PaginationDto } from 'src/dtos/pagination.dto';
import {
  RequestDto,
  RequestFilterDto,
} from 'src/dtos/request.dto';
import { RequestItemFilterDto } from 'src/dtos/requestItem.dto';
import { PurchasePeriodItem } from 'src/entities/purchasePeriodItem.entity';
import { Request } from 'src/entities/request.entity';
import { RequestItem, RequestItemStatus } from 'src/entities/requestItem.entity';
import { RequestItemRepository } from 'src/repositories/requestItem.repository';
import { RequestRepository } from 'src/repositories/request.repository';

@Injectable()
export class requestService {
  constructor(
    private requestRepository: RequestRepository,
    private requestItemRepository: RequestItemRepository,
  ) {}

  async createrequest(
    requestDto: RequestDto,
    publish: boolean = false,
  ): Promise<StandardResopnse<RequestDto>> {
    const groupId = RequestContext.get('groupId');
    const userId = RequestContext.get('userId');

    if (!groupId || !userId) {
      throw new UnauthorizedException('Invalid Request Context');
    }

    await this.requestItemRepository.transaction(async (txRepo) => {
      const { requestItems, purchasePeriodId } = requestDto;

      const requestTxRepo = txRepo.manager.getRepository(Request);
      const requestItemTxRepo = txRepo.manager.getRepository(RequestItem);
      const purchasePeriodItemTxRepo =
        txRepo.manager.getRepository(PurchasePeriodItem);

      const existingRequest = await requestTxRepo.findOne({
        where: {
          groupId,
          purchasePeriodId,
          userId,
        },
      });

      if (existingRequest) {
        throw new UnprocessableEntityException(
          'A request already exists for this market run',
        );
      }

      const selectedPeriodItems = Array.isArray(requestItems)
        ? requestItems
        : [];

      const purchasePeriodItemIds = selectedPeriodItems.map(
        (item) => item.purchasePeriodItemId,
      );

      let purchasePeriodItems: PurchasePeriodItem[] = [];
      if (purchasePeriodItemIds.length > 0) {
        purchasePeriodItems = await purchasePeriodItemTxRepo.find({
          where: purchasePeriodItemIds.map((id) => ({
            id,
            groupId,
            purchasePeriodId,
          })),
        });

        if (purchasePeriodItems.length !== purchasePeriodItemIds.length) {
          throw new UnprocessableEntityException(
            'One or more request items do not belong to this market run',
          );
        }
      }

      const periodItemMap = new Map(
        purchasePeriodItems.map((item) => [item.id, item]),
      );

      const hydratedItems = selectedPeriodItems.map((item) => {
        const purchasePeriodItem = periodItemMap.get(item.purchasePeriodItemId);
        if (!purchasePeriodItem) {
          throw new UnprocessableEntityException(
            'One or more request items are invalid',
          );
        }

        const pricePerUnitAtRequest = Number(purchasePeriodItem.pricePerUnit);
        const lineEstimatedTotal = Number(
          (Number(item.requestedQty) * pricePerUnitAtRequest).toFixed(2),
        );

        return {
          ...item,
          groupId,
          userId,
          purchasePeriodId,
          pricePerUnitAtRequest,
          lineEstimatedTotal,
          status: publish ? RequestItemStatus.SUBMITTED : RequestItemStatus.DRAFT,
        };
      });

      const totalEstimatedCost = Number(
        hydratedItems
          .reduce((sum, item) => sum + item.lineEstimatedTotal, 0)
          .toFixed(2),
      );

      const requestData = {
        groupId,
        userId,
        purchasePeriodId,
        totalItems: hydratedItems.length,
        totalEstimatedCost,
        status: publish ? RequestStatus.SUBMITTED : RequestStatus.DRAFT,
      };

      const request = requestTxRepo.create(requestData);
      const requestCreated = await requestTxRepo.save(request);

      if (hydratedItems.length > 0) {
        const items = hydratedItems.map((item) =>
          requestItemTxRepo.create({
            ...item,
            requestId: requestCreated.id,
          }),
        );

        await requestItemTxRepo.save(items);
      }
    });

    return {
      data: requestDto,
      code: 200,
      message: 'Success',
    };
  }

  async deleterequest(id: string): Promise<StandardResopnse<DeleteResult>> {
    const existingrequest = await this.requestRepository.findById(id);

    if (!existingrequest) {
      throw new NotFoundException('request Not found');
    }

    await this.requestRepository.delete(id);

    return {
      data: null,
      code: 200,
      message: 'Success',
    };
  }

  async findrequests(
    paginationDto: PaginationDto,
    requestFilterDto: RequestFilterDto,
  ): Promise<StandardResopnse<PaginatedRecordsDto<Request>>> {
    const result = (await this.requestRepository.findAllRequests(
      paginationDto,
      requestFilterDto,
    )) as PaginatedRecordsDto<Request>;

    return {
      data: result,
      code: 200,
      message: 'Success',
    };
  }

  async findrequestItems(
    paginationDto: PaginationDto,
    requestUnitFilterDto: RequestItemFilterDto,
    requestId: string,
  ): Promise<StandardResopnse<PaginatedRecordsDto<RequestItem>>> {
    const result = (await this.requestItemRepository.findAllRequestItems(
      paginationDto,
      requestUnitFilterDto,
      requestId,
    )) as PaginatedRecordsDto<RequestItem>;

    return {
      data: result,
      code: 200,
      message: 'Success',
    };
  }
}
