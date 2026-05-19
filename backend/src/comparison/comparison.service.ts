import { BadRequestException, Injectable } from '@nestjs/common';
import { MAX_COMPARISON_CARS } from '../common/constants/comparison.constants';
import { ComparisonRepository } from './comparison.repository';

@Injectable()
export class ComparisonService {
  constructor(private readonly comparisonRepository: ComparisonRepository) {}

  getIds(userId: number): string[] {
    return this.comparisonRepository.getIds(userId);
  }

  add(userId: number, carId: string): { ok: true; ids: string[] } {
    const ids = this.comparisonRepository.getIds(userId);

    if (ids.includes(carId)) {
      return { ok: true, ids };
    }

    if (ids.length >= MAX_COMPARISON_CARS) {
      throw new BadRequestException('Solo se pueden comparar hasta 4 autos.');
    }

    return {
      ok: true,
      ids: this.comparisonRepository.save(userId, [...ids, carId]),
    };
  }

  remove(userId: number, carId: string): { ok: true; ids: string[] } {
    const ids = this.comparisonRepository
      .getIds(userId)
      .filter((id) => id !== carId);
    return { ok: true, ids: this.comparisonRepository.save(userId, ids) };
  }

  toggle(
    userId: number,
    carId: string,
  ): { ok: true; selected: boolean; ids: string[] } {
    const ids = this.comparisonRepository.getIds(userId);

    if (ids.includes(carId)) {
      const updatedIds = ids.filter((id) => id !== carId);
      return {
        ok: true,
        selected: false,
        ids: this.comparisonRepository.save(userId, updatedIds),
      };
    }

    const result = this.add(userId, carId);
    return { ok: true, selected: true, ids: result.ids };
  }

  clear(userId: number): { ok: true; ids: string[] } {
    this.comparisonRepository.clear(userId);
    return { ok: true, ids: [] };
  }
}
