import { PrismaClient } from "@prisma/client";
import { loadServerEnvironment } from "../src/server/env";

const prismaClientSingleton = () => {
  loadServerEnvironment();
  return new PrismaClient();
};

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
