import * as path from "node:path";
import { fileURLToPath } from "node:url";
globalThis["__dirname"] = path.dirname(fileURLToPath(import.meta.url));
import * as $Class from "./internal/class.js";
import * as Prisma from "./internal/prismaNamespace.js";
import * as $Enums2 from "./enums.js";
export * from "./enums.js";
const PrismaClient = $Class.getPrismaClientClass();
export {
  $Enums2 as $Enums,
  Prisma,
  PrismaClient
};
