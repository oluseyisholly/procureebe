// src/common/context/request-context.ts
import { AsyncLocalStorage } from 'async_hooks';

export interface ContextData {
  userId?: string;
  groupId?: string;
  membershipId?: string;
  role?: string;
}

const asyncLocalStorage = new AsyncLocalStorage<ContextData>();

export class RequestContext {
  static run(data: ContextData, callback: () => any) {
    asyncLocalStorage.run(data, callback);
  }

  static get<T extends keyof ContextData>(key: T): ContextData[T] | undefined {
    return asyncLocalStorage.getStore()?.[key];
  }
}
