const securitySchemes = {
  bearerAuth: {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
  },
};

const schemas = {
  Error: {
    type: 'object',
    properties: {
      success: { type: 'boolean', example: false },
      message: { type: 'string', example: '요청한 리소스를 찾을 수 없습니다.' },
    },
  },
  Product: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      name: { type: 'string', example: '한강 자전거' },
      description: { type: 'string', example: '거의 새것입니다.' },
      price: { type: 'integer', example: 120000 },
      tags: { type: 'array', items: { type: 'string' }, example: ['자전거'] },
      images: {
        type: 'array',
        items: { type: 'string' },
        example: ['/uploads/1730000000000-123456789.jpg'],
      },
      favoriteCount: { type: 'integer', example: 3 },
      isLiked: { type: 'boolean', example: false },
      ownerId: { type: 'integer', nullable: true, example: 1 },
      ownerNickname: { type: 'string', nullable: true, example: '판다' },
      comments: { type: 'array', items: { $ref: '#/components/schemas/Comment' } },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  Article: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      title: { type: 'string', example: '안녕하세요' },
      content: { type: 'string', example: '반갑습니다.' },
      images: { type: 'array', items: { type: 'string' } },
      likeCount: { type: 'integer', example: 2 },
      isLiked: { type: 'boolean', example: false },
      author: { type: 'string', nullable: true, example: '판다' },
      authorId: { type: 'integer', nullable: true, example: 1 },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  Comment: {
    type: 'object',
    properties: {
      id: { type: 'integer', example: 1 },
      content: { type: 'string', example: '문의드립니다.' },
      productId: { type: 'integer', nullable: true, example: 1 },
      articleId: { type: 'integer', nullable: true, example: null },
      writer: {
        type: 'object',
        nullable: true,
        properties: {
          id: { type: 'integer', nullable: true },
          nickname: { type: 'string', nullable: true },
          image: { type: 'string', nullable: true },
        },
      },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  ProductList: {
    type: 'object',
    properties: {
      list: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
      totalCount: { type: 'integer', example: 42 },
    },
  },
  ArticleList: {
    type: 'object',
    properties: {
      list: { type: 'array', items: { $ref: '#/components/schemas/Article' } },
      totalCount: { type: 'integer', example: 7 },
    },
  },
  CommentList: {
    type: 'object',
    properties: {
      list: { type: 'array', items: { $ref: '#/components/schemas/Comment' } },
      nextCursor: { type: 'integer', nullable: true, example: null },
    },
  },
  AuthResult: {
    type: 'object',
    properties: {
      accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
      refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
    },
  },
  UploadResult: {
    type: 'object',
    properties: {
      url: { type: 'string', example: '/uploads/1730000000000-123456789.jpg' },
    },
  },
};

const listQuery = [
  {
    name: 'offset',
    in: 'query',
    schema: { type: 'integer', default: 0 },
    description: '건너뛸 항목 수',
  },
  {
    name: 'limit',
    in: 'query',
    schema: { type: 'integer', default: 10 },
    description: '가져올 항목 수',
  },
  {
    name: 'keyword',
    in: 'query',
    schema: { type: 'string' },
    description: '검색어',
  },
];

const productListSort = [
  ...listQuery,
  {
    name: 'sort',
    in: 'query',
    schema: { type: 'string', enum: ['recent', 'oldest', 'favorite', 'like'], default: 'recent' },
    description: '정렬 기준',
  },
];

const articleListSort = [
  ...listQuery,
  {
    name: 'sort',
    in: 'query',
    schema: { type: 'string', enum: ['recent', 'oldest', 'like'], default: 'recent' },
    description: '정렬 기준',
  },
];

function success(schemaRef) {
  return {
    200: {
      description: '성공',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              success: { type: 'boolean', example: true },
              data: schemaRef ? { $ref: schemaRef } : { type: 'object' },
            },
          },
        },
      },
    },
  };
}

export const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: '판다마켓 API',
    version: '1.0.0',
    description:
      '판다마켓 중고마켓·자유게시판 백엔드 REST API 문서입니다. 인증이 필요한 요청은 Authorize 에 accessToken 을 입력해 주세요.',
  },
  servers: [{ url: '/api', description: 'API root' }],
  tags: [
    { name: 'Auth', description: '인증' },
    { name: 'Users', description: '사용자' },
    { name: 'Products', description: '중고마켓 상품' },
    { name: 'Articles', description: '자유게시판 게시글' },
    { name: 'Comments', description: '댓글·문의' },
    { name: 'Images', description: '이미지 업로드' },
  ],
  components: { securitySchemes, schemas },
  paths: {
    '/auth/signUp': {
      post: {
        tags: ['Auth'],
        summary: '회원가입',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'nickname', 'password', 'passwordConfirmation'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  nickname: { type: 'string', maxLength: 20 },
                  password: { type: 'string', minLength: 8 },
                  passwordConfirmation: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: '가입 성공',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { $ref: '#/components/schemas/AuthResult' },
                  },
                },
              },
            },
          },
          400: { description: '입력값 오류', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          409: { description: '이메일·닉네임 중복', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/signIn': {
      post: {
        tags: ['Auth'],
        summary: '로그인',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          ...success('#/components/schemas/AuthResult'),
          401: { description: '이메일 또는 비밀번호 불일치', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: '액세스 토큰 재발급',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: { refreshToken: { type: 'string' } },
              },
            },
          },
        },
        responses: {
          ...success('#/components/schemas/AuthResult'),
          401: { description: '리프레시 토큰 무효', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/auth/google': {
      post: {
        tags: ['Auth'],
        summary: '구글 OAuth 로그인',
        description:
          'GOOGLE_CLIENT_ID·GOOGLE_CLIENT_SECRET 이 설정된 경우에만 동작합니다. 미설정 시 400 을 반환합니다.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['code'],
                properties: { code: { type: 'string', description: '구글 인가 코드' } },
              },
            },
          },
        },
        responses: {
          ...success('#/components/schemas/AuthResult'),
          400: { description: '구글 로그인 미설정 또는 코드 오류', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: '구글 인증 실패', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/users/me': {
      get: {
        tags: ['Users'],
        summary: '내 정보 조회',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: '성공',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        email: { type: 'string' },
                        nickname: { type: 'string' },
                        image: { type: 'string', nullable: true },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: '인증 필요', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/products': {
      get: {
        tags: ['Products'],
        summary: '상품 목록 조회',
        parameters: productListSort,
        responses: success('#/components/schemas/ProductList'),
      },
      post: {
        tags: ['Products'],
        summary: '상품 등록',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'description', 'price'],
                properties: {
                  name: { type: 'string', maxLength: 10 },
                  description: { type: 'string', maxLength: 100 },
                  price: { type: 'integer', minimum: 0 },
                  tags: { type: 'array', items: { type: 'string' } },
                  images: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: '등록 성공',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Product' } },
                },
              },
            },
          },
          400: { description: '입력값 오류', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: '인증 필요', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/products/{productId}': {
      get: {
        tags: ['Products'],
        summary: '상품 상세 조회 (댓글·isLiked 포함)',
        parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: {
            description: '성공',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Product' } },
                },
              },
            },
          },
          404: { description: '상품 없음', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      patch: {
        tags: ['Products'],
        summary: '상품 수정 (등록자만)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', maxLength: 10 },
                  description: { type: 'string', maxLength: 100 },
                  price: { type: 'integer', minimum: 0 },
                  tags: { type: 'array', items: { type: 'string' } },
                  images: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          ...success('#/components/schemas/Product'),
          400: { description: '수정할 필드 없음·입력값 오류', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: '인증 필요', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: '권한 없음', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: '상품 없음', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        tags: ['Products'],
        summary: '상품 삭제 (등록자만)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          204: { description: '삭제 성공' },
          401: { description: '인증 필요', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: '권한 없음', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: '상품 없음', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/products/{productId}/like': {
      post: {
        tags: ['Products'],
        summary: '상품 좋아요',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          ...success('#/components/schemas/Product'),
          401: { description: '인증 필요', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: '상품 없음', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          409: { description: '이미 좋아요 함', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        tags: ['Products'],
        summary: '상품 좋아요 취소',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          ...success('#/components/schemas/Product'),
          401: { description: '인증 필요', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: '상품 또는 좋아요 없음', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/products/{productId}/comments': {
      get: {
        tags: ['Comments'],
        summary: '상품 문의 목록',
        parameters: [
          { name: 'productId', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'cursor', in: 'query', schema: { type: 'integer' } },
        ],
        responses: success('#/components/schemas/CommentList'),
      },
      post: {
        tags: ['Comments'],
        summary: '상품 문의 등록',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'productId', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content'],
                properties: { content: { type: 'string', maxLength: 300 } },
              },
            },
          },
        },
        responses: {
          201: {
            description: '등록 성공',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Comment' } },
                },
              },
            },
          },
          400: { description: '내용 없음·길이 초과', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: '인증 필요', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: '상품 없음', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/articles': {
      get: {
        tags: ['Articles'],
        summary: '게시글 목록 조회',
        parameters: articleListSort,
        responses: success('#/components/schemas/ArticleList'),
      },
      post: {
        tags: ['Articles'],
        summary: '게시글 등록 (이미지 최대 3장)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'content'],
                properties: {
                  title: { type: 'string', maxLength: 30 },
                  content: { type: 'string', maxLength: 1000 },
                  images: { type: 'array', maxItems: 3, items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: '등록 성공',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Article' } },
                },
              },
            },
          },
          400: { description: '입력값 오류', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: '인증 필요', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/articles/{articleId}': {
      get: {
        tags: ['Articles'],
        summary: '게시글 상세 조회',
        parameters: [{ name: 'articleId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          200: {
            description: '성공',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Article' } },
                },
              },
            },
          },
          404: { description: '게시글 없음', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      patch: {
        tags: ['Articles'],
        summary: '게시글 수정 (작성자만)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'articleId', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string', maxLength: 30 },
                  content: { type: 'string', maxLength: 1000 },
                  images: { type: 'array', maxItems: 3, items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          ...success('#/components/schemas/Article'),
          400: { description: '수정할 필드 없음·입력값 오류', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: '인증 필요', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: '권한 없음', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: '게시글 없음', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        tags: ['Articles'],
        summary: '게시글 삭제 (작성자만)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'articleId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          204: { description: '삭제 성공' },
          401: { description: '인증 필요', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: '권한 없음', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: '게시글 없음', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/articles/{articleId}/like': {
      post: {
        tags: ['Articles'],
        summary: '게시글 좋아요',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'articleId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          ...success('#/components/schemas/Article'),
          401: { description: '인증 필요', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: '게시글 없음', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          409: { description: '이미 좋아요 함', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        tags: ['Articles'],
        summary: '게시글 좋아요 취소',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'articleId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          ...success('#/components/schemas/Article'),
          401: { description: '인증 필요', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: '게시글 또는 좋아요 없음', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/articles/{articleId}/comments': {
      get: {
        tags: ['Comments'],
        summary: '게시글 댓글 목록',
        parameters: [
          { name: 'articleId', in: 'path', required: true, schema: { type: 'integer' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
          { name: 'cursor', in: 'query', schema: { type: 'integer' } },
        ],
        responses: success('#/components/schemas/CommentList'),
      },
      post: {
        tags: ['Comments'],
        summary: '게시글 댓글 등록',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'articleId', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content'],
                properties: { content: { type: 'string', maxLength: 300 } },
              },
            },
          },
        },
        responses: {
          201: {
            description: '등록 성공',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/Comment' } },
                },
              },
            },
          },
          400: { description: '내용 없음·길이 초과', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: '인증 필요', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: '게시글 없음', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/comments/{commentId}': {
      patch: {
        tags: ['Comments'],
        summary: '댓글·문의 수정 (작성자만)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'commentId', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content'],
                properties: { content: { type: 'string', maxLength: 300 } },
              },
            },
          },
        },
        responses: {
          ...success('#/components/schemas/Comment'),
          400: { description: '내용 없음·길이 초과', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          401: { description: '인증 필요', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: '권한 없음', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: '댓글 없음', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
      delete: {
        tags: ['Comments'],
        summary: '댓글·문의 삭제 (작성자만)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'commentId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          204: { description: '삭제 성공' },
          401: { description: '인증 필요', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          403: { description: '권한 없음', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          404: { description: '댓글 없음', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/images/upload': {
      post: {
        tags: ['Images'],
        summary: '이미지 업로드 (multer·최대 10MB·HEIC 자동 변환)',
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: { image: { type: 'string', format: 'binary' } },
              },
            },
          },
        },
        responses: {
          201: {
            description: '업로드 성공',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { success: { type: 'boolean' }, data: { $ref: '#/components/schemas/UploadResult' } },
                },
              },
            },
          },
          400: {
            description: '파일 없음·확장자 미지원·용량 초과·HEIC 변환 실패',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
          },
        },
      },
    },
  },
};

export const swaggerSpec = swaggerDefinition;
