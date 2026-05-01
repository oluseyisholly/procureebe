export enum SwaggerApiEnumTags {
  APP = 'app',
  USER = 'User',
  PROCUREEINVITE = 'Procuree Invite',
  CATEGORY = 'Category',
  COMMODITY = 'Commodity',
  COMMODITYUNIT = 'Commodity Unit',
  PURCHASEPERIOD = 'Market Run ',
  PURCHASEPERIODITEM = 'Market Run Commodities',
  REQUEST = 'Request',
  REQUESTITEM = 'Request Items',
}

export enum RoleEnum {
  ADMIN = 'ADMIN',
  PATRON = 'PATRON',
  PROCUREE = 'PROCUREE',
}

export enum UnitType {
  SCIENTIFIC = 'SCIENTIFIC', // kilogram, litre, gram, millilitre
  COMMON_USE = 'COMMON_USE', // bag, derica, congo, crate, bunch, pack
}

export enum PurchasePeriodStatus {
  DRAFT = 'DRAFT', // Admin is still configuring prices
  OPEN = 'OPEN', // Procurees can place/modify requests
  CLOSED = 'CLOSED', // Requests locked; admin going to market
  FINALIZED = 'FINALIZED', // Allocations + fulfillment recorded
  PUBLISHED = 'PUBLISHED',
  SAVED = 'SAVED',
  RECONCILED = 'RECONCILED',
}

export enum PurchasePeriodItemStatus {
  ACTIVE = 'ACTIVE', // visible & orderable
  HIDDEN = 'HIDDEN', // not visible to Procurees (e.g., draft)
  DISABLED = 'DISABLED', // temporarily disabled for this period
}

export enum RequestStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  CANCELLED = 'CANCELLED',
  CONFIRMED = 'CONFIRMED',
}


export enum PriceVarianceAction {
  BUY_MAXIMUM = 'BUY_MAXIMUM',
  BUY_REQUESTED = 'BUY_REQUESTED',
  DO_NOT_BUY = 'DO_NOT_BUY',
}
