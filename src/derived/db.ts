import { Prisma } from '@prisma/client';

/**
 * Either the root client or the client handed to a `$transaction` callback.
 * Services that participate in a caller's transaction accept this.
 */
export type Db = Prisma.TransactionClient;
