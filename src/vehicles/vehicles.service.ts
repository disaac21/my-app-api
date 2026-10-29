import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { paginated, Paginated } from '../common/types';
import { ParamsService } from '../params/params.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateVehicleDto,
  QueryVehiclesDto,
  UpdateVehicleDto,
} from './dto/vehicle.dto';

const VEHICLE_INCLUDE = {
  model: {
    select: {
      id: true,
      name: true,
      make: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.VehicleInclude;

const VEHICLE_DETAIL_INCLUDE = {
  ...VEHICLE_INCLUDE,
  _count: {
    select: {
      readings: true,
      fuelEntries: true,
      maintenanceEntries: true,
      maintenancePlans: true,
      documents: true,
    },
  },
} satisfies Prisma.VehicleInclude;

/**
 * Deleting a vehicle archives it: `isActive = false` plus the same flag on its
 * documents. Measurements and maintenance are left alone — they are already
 * reachable through the vehicle, and archiving them too would mean a restore
 * could not bring the history back.
 */
@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly params: ParamsService,
  ) {}

  async findAll(query: QueryVehiclesDto): Promise<Paginated<unknown>> {
    const where: Prisma.VehicleWhereInput = {
      isActive: query.isActive,
      ...(query.modelId ? { modelId: query.modelId } : {}),
      ...(query.makeId ? { model: { is: { makeId: query.makeId } } } : {}),
    };

    if (query.q) {
      where.OR = [
        { plate: { contains: query.q, mode: 'insensitive' } },
        { nickname: { contains: query.q, mode: 'insensitive' } },
        { model: { is: { name: { contains: query.q, mode: 'insensitive' } } } },
        {
          model: {
            is: {
              make: {
                is: { name: { contains: query.q, mode: 'insensitive' } },
              },
            },
          },
        },
      ];
    }

    const [total, rows] = await Promise.all([
      this.prisma.vehicle.count({ where }),
      this.prisma.vehicle.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.offset,
        take: query.limit,
        include: VEHICLE_INCLUDE,
      }),
    ]);

    return paginated(rows, total, query.limit, query.offset);
  }

  async findOne(id: string, includeArchived = false) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id, ...(includeArchived ? {} : { isActive: true }) },
      include: VEHICLE_DETAIL_INCLUDE,
    });

    if (!vehicle) {
      const exists = await this.prisma.vehicle.count({ where: { id } });
      throw new NotFoundException(
        exists > 0
          ? `Vehicle "${id}" is archived. Pass ?includeArchived=true to read it, or POST /vehicles/${id}/restore to reactivate it.`
          : `Vehicle "${id}" does not exist.`,
      );
    }

    return vehicle;
  }

  async create(dto: CreateVehicleDto) {
    await this.assertModelExists(dto.modelId);
    await this.assertParamCodes(dto);
    await this.assertPlateFree(dto.plate);

    return this.prisma.vehicle.create({
      data: { ...dto },
      include: VEHICLE_INCLUDE,
    });
  }

  async update(id: string, dto: UpdateVehicleDto) {
    const existing = await this.prisma.vehicle.findUnique({
      where: { id },
      select: { id: true, plate: true },
    });

    if (!existing)
      throw new NotFoundException(`Vehicle "${id}" does not exist.`);

    if (dto.modelId) await this.assertModelExists(dto.modelId);
    await this.assertParamCodes(dto);

    if (dto.plate && dto.plate !== existing.plate) {
      await this.assertPlateFree(dto.plate, id);
    }

    await this.prisma.vehicle.update({ where: { id }, data: { ...dto } });

    return this.findOne(id, true);
  }

  /** DELETE — archive. Never removes rows. */
  async remove(id: string) {
    const existing = await this.prisma.vehicle.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    });

    if (!existing)
      throw new NotFoundException(`Vehicle "${id}" does not exist.`);

    if (!existing.isActive) {
      return { id, isActive: false, archived: true, documentsArchived: 0 };
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.vehicle.update({ where: { id }, data: { isActive: false } });

      const documents = await tx.vehicleDocument.updateMany({
        where: { vehicleId: id, isActive: true },
        data: { isActive: false },
      });

      return {
        id,
        isActive: false,
        archived: true,
        documentsArchived: documents.count,
      };
    });
  }

  /**
   * Restore reactivates the vehicle but not its documents: `isActive = false`
   * on a document also means "superseded policy", and reviving expired
   * insurance on restore would be wrong. Reactivate those individually.
   */
  async restore(id: string) {
    const existing = await this.prisma.vehicle.findUnique({
      where: { id },
      select: { id: true, isActive: true },
    });

    if (!existing)
      throw new NotFoundException(`Vehicle "${id}" does not exist.`);

    if (!existing.isActive) {
      await this.prisma.vehicle.update({
        where: { id },
        data: { isActive: true },
      });
    }

    return this.findOne(id);
  }

  private async assertModelExists(modelId: string) {
    const model = await this.prisma.model.count({ where: { id: modelId } });

    if (model === 0) {
      throw new NotFoundException(`Model "${modelId}" does not exist.`);
    }
  }

  private async assertParamCodes(
    dto: Pick<CreateVehicleDto, 'fuelType' | 'transmission' | 'driveType'>,
  ) {
    await this.params.assertCode('FUEL_TYPE', dto.fuelType, 'fuelType');
    await this.params.assertCode(
      'TRANSMISSION_TYPE',
      dto.transmission,
      'transmission',
    );
    await this.params.assertCode('DRIVE_TYPE', dto.driveType, 'driveType');
  }

  /**
   * A plate stays reserved by an archived vehicle, so re-registering it is a
   * 409 that points at restore rather than looking like a bug.
   */
  private async assertPlateFree(plate: string, exceptId?: string) {
    const clash = await this.prisma.vehicle.findFirst({
      where: {
        plate: { equals: plate, mode: 'insensitive' },
        ...(exceptId ? { id: { not: exceptId } } : {}),
      },
      select: { id: true, plate: true, isActive: true },
    });

    if (!clash) return;

    if (clash.isActive) {
      throw new ConflictException(
        `Plate "${clash.plate}" is already registered to vehicle ${clash.id}.`,
      );
    }

    throw new ConflictException(
      `Plate "${clash.plate}" belongs to archived vehicle ${clash.id}. Restore it with POST /vehicles/${clash.id}/restore instead of creating a duplicate.`,
    );
  }
}
