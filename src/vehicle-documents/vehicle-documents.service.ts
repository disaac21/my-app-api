import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { paginated, Paginated } from '../common/types';
import { VehicleGuardService } from '../derived/vehicle-guard.service';
import { ParamsService } from '../params/params.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateVehicleDocumentDto,
  QueryVehicleDocumentsDto,
  UpdateVehicleDocumentDto,
} from './dto/vehicle-document.dto';

type DocumentState = {
  group: string;
  type: string;
  vehicleId?: string | null;
};

/**
 * Documents are the one resource where `isActive = false` doubles as
 * "superseded": replacing an expired insurance policy is archive + insert, so
 * the old policy stays readable. Deleting a vehicle archives its vehicle
 * documents but never the personal ones (a driver's licence has no vehicle).
 */
@Injectable()
export class VehicleDocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly params: ParamsService,
    private readonly guard: VehicleGuardService,
  ) {}

  async findAll(query: QueryVehicleDocumentsDto): Promise<Paginated<unknown>> {
    const where: Prisma.VehicleDocumentWhereInput = {
      isActive: query.isActive,
      ...(query.group ? { group: query.group } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.vehicleId ? { vehicleId: query.vehicleId } : {}),
      ...(query.expiringBefore
        ? { expiresAt: { lte: query.expiringBefore } }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.vehicleDocument.count({ where }),
      this.prisma.vehicleDocument.findMany({
        where,
        orderBy: [{ expiresAt: 'asc' }, { createdAt: 'desc' }],
        skip: query.offset,
        take: query.limit,
        include: { vehicle: { select: { id: true, plate: true } } },
      }),
    ]);

    return paginated(rows, total, query.limit, query.offset);
  }

  async findOne(id: string) {
    const document = await this.prisma.vehicleDocument.findUnique({
      where: { id },
      include: { vehicle: { select: { id: true, plate: true } } },
    });

    if (!document) {
      throw new NotFoundException(`Document "${id}" does not exist.`);
    }

    return document;
  }

  async create(dto: CreateVehicleDocumentDto) {
    await this.assertCoherent(dto);
    this.assertDateOrder(dto.issuedAt, dto.expiresAt);

    return this.prisma.vehicleDocument.create({
      data: { ...dto },
      include: { vehicle: { select: { id: true, plate: true } } },
    });
  }

  async update(id: string, dto: UpdateVehicleDocumentDto) {
    const existing = await this.prisma.vehicleDocument.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Document "${id}" does not exist.`);
    }

    const group = dto.group ?? existing.group;
    const type = dto.type ?? existing.type;
    const vehicleId =
      dto.vehicleId !== undefined ? dto.vehicleId : existing.vehicleId;

    await this.assertCoherent({ group, type, vehicleId });

    const issuedAt =
      dto.issuedAt !== undefined ? dto.issuedAt : existing.issuedAt;
    const expiresAt =
      dto.expiresAt !== undefined ? dto.expiresAt : existing.expiresAt;
    this.assertDateOrder(issuedAt, expiresAt);

    return this.prisma.vehicleDocument.update({
      where: { id },
      data: { ...dto, group, type, vehicleId },
      include: { vehicle: { select: { id: true, plate: true } } },
    });
  }

  async remove(id: string) {
    return this.setActive(id, false);
  }

  async restore(id: string) {
    return this.setActive(id, true);
  }

  private async setActive(id: string, isActive: boolean) {
    const existing = await this.prisma.vehicleDocument.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException(`Document "${id}" does not exist.`);
    }

    return this.prisma.vehicleDocument.update({
      where: { id },
      data: { isActive },
      include: { vehicle: { select: { id: true, plate: true } } },
    });
  }

  /**
   * The DB has a CHECK for the group/vehicle rule, but it would surface as a
   * 500. This validates first, and also enforces the type -> group mapping
   * declared on the DOCUMENT_TYPE params row.
   */
  private async assertCoherent(state: DocumentState) {
    await this.params.assertCode('DOCUMENT_GROUP', state.group, 'group');
    await this.params.assertCode('DOCUMENT_TYPE', state.type, 'type');

    const type = await this.params.option('DOCUMENT_TYPE', state.type);

    if (type?.groups?.length && !type.groups.includes(state.group)) {
      throw new BadRequestException(
        `Document type "${state.type}" belongs to group ${type.groups.join(' or ')}, not "${state.group}".`,
      );
    }

    const hasVehicle =
      state.vehicleId !== null && state.vehicleId !== undefined;

    if (state.group === 'VEHICLE' && !hasVehicle) {
      throw new BadRequestException('A VEHICLE document requires a vehicleId.');
    }

    if (state.group === 'PERSONAL' && hasVehicle) {
      throw new BadRequestException(
        'A PERSONAL document must not reference a vehicle.',
      );
    }

    if (hasVehicle && state.vehicleId) {
      await this.guard.ensureActive(state.vehicleId);
    }
  }

  private assertDateOrder(issuedAt?: Date | null, expiresAt?: Date | null) {
    if (issuedAt && expiresAt && issuedAt.getTime() > expiresAt.getTime()) {
      throw new BadRequestException('issuedAt must be on or before expiresAt.');
    }
  }
}
