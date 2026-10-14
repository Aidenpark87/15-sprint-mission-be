import * as runtime from "@prisma/client/runtime/index-browser";
const Decimal = runtime.Decimal;
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
  likeCount: "likeCount",
  author: "author",
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
  ProductScalarFieldEnum,
  QueryMode,
  SortOrder,
  TransactionIsolationLevel,
  UserScalarFieldEnum
};
