import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { paginated, Paginated } from '../common/types';
import { toCanonicalName } from '../common/utils/strings';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMakeDto, QueryMakesDto, UpdateMakeDto } from './dto/make.dto';

const MAKE_SELECT = {
  id: true,
  name: true,
  _count: { select: { models: true } },
} satisfies Prisma.MakeSelect;

/**
 * Makes are reference data, not history: an unused make is hard-deleted so the
 * catalogue stays clean. A make with models can't be deleted (409) — that is
 * the `onDelete: Restrict` on Model.makeId doing its job.
 */
@Injectable()
export class MakesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryMakesDto): Promise<Paginated<unknown>> {
    const where: Prisma.MakeWhereInput = query.q
      ? { name: { contains: query.q, mode: 'insensitive' } }
      : {};

    const [total, rows] = await Promise.all([
      this.prisma.make.count({ where }),
      this.prisma.make.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: query.offset,
        take: query.limit,
        select: MAKE_SELECT,
      }),
    ]);

    return paginated(rows, total, query.limit, query.offset);
  }

  async findOne(id: string) {
    const make = await this.prisma.make.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        models: {
          orderBy: { name: 'asc' },
          select: { id: true, name: true },
        },
      },
    });

    if (!make) throw new NotFoundException(`Make "${id}" does not exist.`);

    return make;
  }

  async create(dto: CreateMakeDto) {
    const name = toCanonicalName(dto.name);
    await this.assertNameFree(name);

    return this.prisma.make.create({ data: { name }, select: MAKE_SELECT });
  }

  async update(id: string, dto: UpdateMakeDto) {
    const existing = await this.prisma.make.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) throw new NotFoundException(`Make "${id}" does not exist.`);
    if (dto.name === undefined) return this.findOne(id);

    const name = toCanonicalName(dto.name);
    await this.assertNameFree(name, id);

    await this.prisma.make.update({ where: { id }, data: { name } });

    return this.findOne(id);
  }

  async remove(id: string) {
    const make = await this.prisma.make.findUnique({
      where: { id },
      select: { id: true, name: true, _count: { select: { models: true } } },
    });

    if (!make) throw new NotFoundException(`Make "${id}" does not exist.`);

    if (make._count.models > 0) {
      throw new ConflictException(
        `Cannot delete "${make.name}": ${make._count.models} model(s) still belong to it. Delete the models first.`,
      );
    }

    await this.prisma.make.delete({ where: { id } });

    return { id, deleted: true };
  }

  /**
   * `Make.name` is unique but case-sensitive, so "Toyota" and "toyota" would
   * both fit. This check closes that gap without an unexpressable index.
   */
  private async assertNameFree(name: string, exceptId?: string) {
    const clash = await this.prisma.make.findFirst({
      where: {
        name: { equals: name, mode: 'insensitive' },
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
      select: { id: true, name: true },
    });

    if (clash) {
      throw new ConflictException(
        `Make "${clash.name}" already exists (${clash.id}).`,
      );
    }
  }
}
