import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * One call that returns the whole make -> model tree, so a form can populate a
 * make select and a dependent model select without joining on the client.
 */
@Injectable()
export class CatalogueService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const makes = await this.prisma.make.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        models: {
          orderBy: { name: 'asc' },
          select: { id: true, name: true },
        },
      },
    });

    return { makes };
  }
}
