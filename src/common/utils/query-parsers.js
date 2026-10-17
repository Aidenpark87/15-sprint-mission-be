import { ERROR_MESSAGES } from '#constants';
import { BadRequestException } from '#exceptions';

const SORT_OPTIONS = ['recent', 'like', 'oldest'];

export function parseListQuery(query, { allowedSorts = SORT_OPTIONS } = {}) {
  const offset = Number(query.offset ?? 0);
  const limit = Number(query.limit ?? 10);
  const keyword = typeof query.keyword === 'string' ? query.keyword : '';
  const sort = query.sort ?? 'recent';

  if (!Number.isInteger(offset) || offset < 0) {
    throw new BadRequestException(ERROR_MESSAGES.LIST_QUERY_INVALID);
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new BadRequestException(ERROR_MESSAGES.LIST_QUERY_INVALID);
  }
  if (!allowedSorts.includes(sort)) {
    throw new BadRequestException(ERROR_MESSAGES.SORT_OPTION_INVALID);
  }

  return { offset, limit, keyword, sort };
}

export function parseCursorQuery(query) {
  const limit = Number(query.limit ?? 10);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new BadRequestException(ERROR_MESSAGES.LIST_QUERY_INVALID);
  }

  const { cursor } = query;
  if (cursor != null && (!/^\d+$/.test(String(cursor)) || Number(cursor) < 1)) {
    throw new BadRequestException(ERROR_MESSAGES.CURSOR_QUERY_INVALID);
  }

  return { limit, cursor: cursor != null ? Number(cursor) : null };
}

export function parseIdParam(value) {
  if (!/^\d+$/.test(String(value))) {
    throw new BadRequestException(ERROR_MESSAGES.ID_PARAM_INVALID);
  }

  return Number(value);
}
