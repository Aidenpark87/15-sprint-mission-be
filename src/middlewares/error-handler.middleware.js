import multer from 'multer';
import { isDevelopment } from '#config';
import { HTTP_STATUS, PRISMA_ERROR } from '#constants';
import { HttpException } from '#errors';
import { Prisma } from '#generated/prisma/client.js';

export const errorHandler = (error, _req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  console.error('error', error);

  if (
    error instanceof SyntaxError &&
    error.status === HTTP_STATUS.BAD_REQUEST
  ) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: '요청 본문이 올바른 JSON 형식이 아닙니다.',
    });
  }

  if (error instanceof HttpException) {
    return res.status(error.statusCode).json({
      ...(error.details ?? {}),
      success: false,
      message: error.message,
    });
  }

  if (error instanceof multer.MulterError) {
    const message =
      error.code === 'LIMIT_FILE_SIZE'
        ? '이미지는 10MB 이하만 업로드할 수 있어요'
        : '이미지 업로드에 실패했어요';

    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message,
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case PRISMA_ERROR.UNIQUE_CONSTRAINT: {
        return res.status(HTTP_STATUS.CONFLICT).json();
      }
      case PRISMA_ERROR.RECORD_NOT_FOUND: {
        return res.status(HTTP_STATUS.NOT_FOUND).json();
      }
    }
  }

  const result = {
    success: false,
    message: 'Internal Server Error',
  };

  if (isDevelopment) {
    result.details = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(result);
};
