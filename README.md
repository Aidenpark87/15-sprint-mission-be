# 판다마켓 백엔드 (Panda Market Backend)

> **한줄 압축**: Express 5 + Awilix DI + Prisma 8(contract) 기반 판다마켓 REST API — `pnpm verify` 한 번으로 API 51개 검증 · DB 계약 일치 · 린트를 모두 확인할 수 있습니다.

이 문서는 실행 방법과 **검증 방법**을 한 곳에 모아 둔 안내서예요. 리뷰하시는 분은 [3. 한 번에 검증하기](#sec-3)만 보셔도 됩니다.

## 목차

- [1. 기술 스택](#sec-1)
- [2. 빠른 시작 (설치·실행)](#sec-2)
- [3. 한 번에 검증하기](#sec-3)
- [4. 검증 항목 (무엇을 증명하나)](#sec-4)
- [5. 프로젝트 구조](#sec-5)
- [6. 아키텍처 노트](#sec-6)
- [7. 참고 자료](#sec-7)

<a id="sec-1"></a>
## 1. 기술 스택

| 구분 | 사용 기술 |
|---|---|
| 런타임 | Node.js 24+ (`engines: 24.x`), ESM (`"type": "module"`) |
| 서버 | Express 5 |
| 의존성 주입 | Awilix (class 생성자 주입, `PROXY` 모드) |
| 데이터베이스 | PostgreSQL + **Prisma 8** (`@prisma/orm-postgres` contract 방식) |
| 인증 | JWT (access 1h / refresh 14d 회전) + bcrypt |
| 업로드 | multer + heic-convert (HEIC→JPEG, 10MB 제한) |
| 문서 | Swagger UI (`/api-docs`) |
| 검증 | `scripts/verify-api.js` + ESLint |

<a id="sec-2"></a>
## 2. 빠른 시작 (설치·실행)

```bash
# 1) 의존성 설치
pnpm install

# 2) 환경변수 준비 — env/.env.development 에 아래 값을 채워 주세요
#    DATABASE_URL, JWT_SECRET(32자 이상)  (env/.env.example 참고)
pnpm contract:emit        # Prisma 8 계약 → contract.json / contract.d.ts 생성

# 3) DB 스키마 적용 (migrations/app 를 순서대로 적용)
pnpm db:migrate

# 4) (선택) 한글 시드 데이터 넣기 — 로컬 DB만 초기화합니다
pnpm seed

# 5) 개발 서버 실행
pnpm dev                  # http://localhost:5001  (문서: http://localhost:5001/api-docs)
```

> [!NOTE]
> `pnpm db:migrate` 는 마이그레이션을 적용하면서 DB에 "계약과 일치한다"는 표시(marker)도 함께 남깁니다. 그래서 `pnpm verify` 안의 `pnpm db:verify` 가 통과합니다. DB를 처음 세팅하는 경우에도 이 순서만 지키면 됩니다.

<a id="sec-3"></a>
## 3. 한 번에 검증하기

```bash
pnpm verify
```

이 명령 하나가 아래 3가지를 순서대로 실행합니다.

| 단계 | 명령 | 확인하는 것 |
|---|---|---|
| 1 | `pnpm lint` | ESLint 오류 0 |
| 2 | `pnpm db:verify` | DB 스키마가 `contract.prisma` 와 일치 |
| 3 | `pnpm verify:api` | 서버를 직접 띄워 **API 51개 검증** + Swagger 개수 |

이미 떠 있는 서버(예: 배포 주소)를 검증하고 싶다면 주소를 넘겨 주세요.

```bash
pnpm verify:api --base=https://내-배포주소
```

`pnpm verify:api` 는 검증용 서버를 임시 포트로 직접 띄웠다가 끝나면 스스로 종료합니다. 별도로 `pnpm dev` 를 켜 두지 않아도 됩니다.

<a id="sec-4"></a>
## 4. 검증 항목 (무엇을 증명하나)

`pnpm verify:api` 는 아래를 실제 HTTP 요청으로 확인합니다(총 51개).

| 영역 | 대표 검증 | 기대 결과 |
|---|---|---|
| 기본·목록 | `/api`, `/api-docs`, 목록 조회, 잘못된 `sort`/`offset`/`id` | 200 / 400 / 404 |
| 인증·토큰 | 회원가입·로그인·토큰 재발급(회전), 중복 이메일, 잘못된 비밀번호 | 201 / 200 / 409 / 401 |
| 상품 | 등록·수정·삭제, 인증 없음, 음수 가격, 이름 10자 초과 | 201 / 200 / 204 / 401 / 400 |
| 좋아요 | 상품·게시글 좋아요/취소, 중복 좋아요, 없는 좋아요 취소 | 200 / 409 / 404 |
| 댓글·문의 | 등록·목록·수정·삭제, 300자 초과 | 201 / 200 / 204 / 400 |
| 게시글 | 등록·수정·삭제, 제목 30자 초과, 필수값 누락 | 201 / 200 / 204 / 400 |
| 이미지 | 파일 없이 업로드 | 400 |
| Swagger | `paths`, `schemas`, `bearerAuth` | 15 · 9 · 존재 |

성공하면 마지막에 `결과: 51 통과 / 0 실패` 와 함께 **모든 검증을 통과했습니다.** 를 출력하고 종료 코드 0을 돌려줍니다.

<a id="sec-5"></a>
## 5. 프로젝트 구조

```text
backend/
├─ src/
│  ├─ app.js                       # Express 앱 조립(미들웨어·라우터·에러 핸들러)
│  ├─ main.js                      # 부트스트랩: 컨테이너 → App.listen → graceful shutdown
│  ├─ server.js                    # Vercel 배포용 어댑터(export default app, listen 없음)
│  ├─ common/
│  │  ├─ constants/                # HTTP 상태 · 에러 메시지 · DB 에러 코드 · 글자수 제한
│  │  ├─ exceptions/               # HttpException 계열(400·401·403·404·409)
│  │  ├─ utils/query-parsers.js    # offset·limit·sort·cursor·id 파싱/검증
│  │  ├─ di/container.js           # Awilix 컨테이너(의존성 등록)
│  │  └─ lifecycle/graceful-shutdown.js
│  ├─ config/config.js             # 환경변수 zod 검증
│  ├─ controllers/                 # 요청/응답 담당(class, BaseController 상속)
│  ├─ services/                    # 비즈니스 규칙
│  ├─ repositories/                # DB 접근(Prisma 8)
│  ├─ providers/                   # password · token · google
│  ├─ middlewares/                 # 인증 · 입력 검증 · 에러 핸들러
│  ├─ prisma/
│  │  ├─ contract.prisma           # 데이터 계약(첫 줄 // use prisma-8)
│  │  ├─ contract.json             # emit 산출물 — 런타임이 읽음
│  │  ├─ contract.d.ts             # emit 산출물 — 타입
│  │  └─ db.js                     # Prisma 8 클라이언트(UTC 고정)
│  └─ docs/swagger.js              # OpenAPI 명세
├─ scripts/
│  ├─ verify-api.js                # pnpm verify:api 실행 스크립트
│  ├─ seed.js                      # 시드 데이터 생성
│  └─ seed-safety.js               # 시드 대상 안전 검사(로컬 DB만)
├─ migrations/                     # Prisma 8 마이그레이션(app/…, snapshots/…)
├─ prisma.config.ts                # Prisma 8 설정(계약 경로·DB 연결)
├─ package.json
└─ vercel.json
```

**폴더별 설명**

| 경로 | 하는 일 |
|---|---|
| `src/controllers/` | URL과 응답을 담당합니다. 서비스에 일을 넘기고 `{ success, data }`로 응답해요. |
| `src/services/` | "본인 글만 수정" 같은 비즈니스 규칙을 담습니다. |
| `src/repositories/` | 실제 DB 쿼리(Prisma 8)만 담당합니다. 다른 계층은 SQL을 몰라도 됩니다. |
| `src/common/di/` | 각 클래스가 필요로 하는 의존성을 한 곳에서 만들어 넣어 줍니다. |
| `src/prisma/` | Prisma 8 계약과 클라이언트. 계약을 고치면 `pnpm contract:emit` 을 다시 실행해요. |

<a id="sec-6"></a>
## 6. 아키텍처 노트

- **계층 구조**: `controllers → services → repositories → prisma(db)`. 각 계층은 생성자 주입으로만 연결되어 테스트·교체가 쉽습니다.
- **의존성 주입(Awilix)**: `src/common/di/container.js` 에서 `asValue`/`asClass` 로 등록하고 `container.cradle` 을 돌려줍니다. 새 저장소를 추가하면 여기에 한 줄 등록하면 됩니다.
- **Prisma 8 contract**: `schema.prisma` 대신 `contract.prisma` 를 쓰고, `prisma contract emit` 이 만든 `contract.json` 을 런타임이 읽습니다. 마이그레이션은 `migrations/app/` 에 쌓입니다.
- **타임존(UTC 고정)**: Prisma 7은 세션 타임존을 UTC로 고정해 `timestamp` 컬럼을 UTC로 저장했습니다. Prisma 8은 접속 세션 기본값을 쓰므로, `src/prisma/db.js` 에서 연결 옵션(`-c timezone=UTC`)으로 UTC를 유지해 기존 데이터와 기준을 맞췄습니다.
- **좋아요 카운터**: PostgreSQL의 `update()` 에는 증가 연산자가 없어서, `db.transaction` 안에서 `db.raw.sql` 로 `likeCount = likeCount + 1` 을 원자적으로 처리합니다.

<a id="sec-7"></a>
## 7. 참고 자료

- [Express 5 문서](https://expressjs.com/)
- [Awilix 문서](https://github.com/jeffijoe/awilix)
- [Prisma ORM client reference](https://www.prisma.io/docs/orm/reference/orm-client)
- [Prisma 8 마이그레이션 가이드(7 → 8)](https://www.prisma.io/docs/guides/upgrade-prisma-orm/postgresql)
- [Prisma 릴리스 상태](https://www.prisma.io/docs/orm/release-status)
- Swagger UI: 서버 실행 후 `http://localhost:5001/api-docs`
