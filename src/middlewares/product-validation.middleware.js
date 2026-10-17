import { ERROR_MESSAGES, TEXT_LIMITS } from '#constants';
import { BadRequestException } from '#exceptions';

function assertLength(name, description) {
  if (name != null && name.length > TEXT_LIMITS.PRODUCT_NAME) {
    throw new BadRequestException(ERROR_MESSAGES.PRODUCT_NAME_TOO_LONG);
  }

  if (description != null && description.length > TEXT_LIMITS.PRODUCT_DESCRIPTION) {
    throw new BadRequestException(ERROR_MESSAGES.PRODUCT_DESCRIPTION_TOO_LONG);
  }
}

function validateProduct(req, _res, next) {
  const { name, description, price } = req.body ?? {};

  if (!name || !description || price == null || (typeof price !== 'number' && Number.isNaN(Number(price))) ) {
    throw new BadRequestException(ERROR_MESSAGES.PRODUCT_REQUIRED_FIELDS);
  }

  if (Number(price) < 0) {
    throw new BadRequestException(ERROR_MESSAGES.PRODUCT_REQUIRED_FIELDS);
  }

  assertLength(name, description);

  next();
}

function validateProductUpdate(req, _res, next) {
  const { name, description } = req.body ?? {};

  assertLength(name, description);

  next();
}

export { validateProduct, validateProductUpdate };
