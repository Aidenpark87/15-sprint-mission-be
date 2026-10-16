import * as runtime from "@prisma/client/runtime/client";
const PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError;
const PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError;
const PrismaClientRustPanicError = runtime.PrismaClientRustPanicError;
const PrismaClientInitializationError = runtime.PrismaClientInitializationError;
const PrismaClientValidationError = runtime.PrismaClientValidationError;
const sql = runtime.sqltag;
const empty = runtime.empty;
const join = runtime.join;
const raw = runtime.raw;
const Sql = runtime.Sql;
const Decimal = runtime.Decimal;
const getExtensionContext = runtime.Extensions.getExtensionContext;
const prismaVersion = {
  client: "7.10.0",
  engine: "0edf323efd1d98336f3f0a68684b56f689b900d3"
};
const NullTypes = {
  DbNull: runtime.NullTypes.DbNull,
  JsonNull: runtime.NullTypes.JsonNull,
  AnyNull: runtime.NullTypes.AnyNull
};
const DbNull = runtime.DbNull;
const JsonNull = runtime.JsonNull;
const AnyNull = runtime.AnyNull;
const ModelName = {
  User: "User",
  Like: "Like",
  Product: "Product",
  Article: "Article",
  Comment: "Comment"
};
const TransactionIsolationLevel = runtime.makeStrictEnum({
  ReadUncommitted: "ReadUncommitted",
  ReadCommitted: "ReadCommitted",
  RepeatableRead: "RepeatableRead",
  Serializable: "Serializable"
});
const UserScalarFieldEnum = {
  id: "id",
  email: "email",
  nickname: "nickname",
  image: "image",
  encryptedPassword: "encryptedPassword",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
const LikeScalarFieldEnum = {
  id: "id",
  userId: "userId",
  productId: "productId",
  articleId: "articleId",
  createdAt: "createdAt"
};
const ProductScalarFieldEnum = {
  id: "id",
  name: "name",
  description: "description",
  price: "price",
  tags: "tags",
  images: "images",
  ownerId: "ownerId",
  favoriteCount: "favoriteCount",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
const ArticleScalarFieldEnum = {
  id: "id",
  title: "title",
  content: "content",
  images: "images",
  likeCount: "likeCount",
  author: "author",
  authorId: "authorId",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
const CommentScalarFieldEnum = {
  id: "id",
  content: "content",
  productId: "productId",
  articleId: "articleId",
  authorId: "authorId",
  createdAt: "createdAt",
  updatedAt: "updatedAt"
};
const SortOrder = {
  asc: "asc",
  desc: "desc"
};
const QueryMode = {
  default: "default",
  insensitive: "insensitive"
};
const NullsOrder = {
  first: "first",
  last: "last"
};
const defineExtension = runtime.Extensions.defineExtension;
export {
  AnyNull,
  ArticleScalarFieldEnum,
  CommentScalarFieldEnum,
  DbNull,
  Decimal,
  JsonNull,
  LikeScalarFieldEnum,
  ModelName,
  NullTypes,
  NullsOrder,
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientRustPanicError,
  PrismaClientUnknownRequestError,
  PrismaClientValidationError,
  ProductScalarFieldEnum,
  QueryMode,
  SortOrder,
  Sql,
  TransactionIsolationLevel,
  UserScalarFieldEnum,
  defineExtension,
  empty,
  getExtensionContext,
  join,
  prismaVersion,
  raw,
  sql
};
