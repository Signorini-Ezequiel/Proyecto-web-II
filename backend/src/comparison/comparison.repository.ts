import { Injectable } from '@nestjs/common';

@Injectable()
export class ComparisonRepository {
  private readonly comparisonByUser = new Map<number, string[]>();

  getIds(userId: number): string[] {
    return [...(this.comparisonByUser.get(userId) ?? [])];
  }

  save(userId: number, ids: string[]): string[] {
    const uniqueIds = [...new Set(ids)];
    this.comparisonByUser.set(userId, uniqueIds);
    return this.getIds(userId);
  }

  clear(userId: number): void {
    this.comparisonByUser.delete(userId);
  }
}
