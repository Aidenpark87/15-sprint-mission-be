// 이 스크립트는 서버를 직접 띄운 뒤 API 검증을 한 번에 돌리고 결과 표를 출력합니다.
// 실행: pnpm verify:api        (내 컴퓨터에서 서버를 새로 띄워 검증)
//       pnpm verify:api --base=https://내-배포주소   (이미 떠 있는 서버를 검증)
// 검증이 하나라도 실패하면 종료 코드 1을 돌려줍니다.

import { swaggerSpec } from '../src/docs/swagger.js';

const baseArg = process.argv.find((arg) => arg.startsWith('--base='));
const externalBase = baseArg ? baseArg.slice('--base='.length) : null;

let pass = 0;
let fail = 0;
const failures = [];

function check(name, condition, detail = '') {
  if (condition) {
    pass += 1;
    console.log(`  \u2713 ${name}`);
  } else {
    fail += 1;
    failures.push(`${name}${detail ? ` — ${detail}` : ''}`);
    console.log(`  \u2717 ${name}${detail ? ` — ${detail}` : ''}`);
  }
}

function section(title) {
  console.log(`\n${title}`);
}

async function call(BASE, method, path, { token, body } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let json;
  const text = await res.text();
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }

  return { status: res.status, json };
}

async function runChecks(BASE) {
  const stamp = Date.now();

  section('[1] 기본 · 목록 · 쿼리 검증');
  let r = await call(BASE, 'GET', '/api/');
  check('GET /api/ 200', r.status === 200);
  r = await call(BASE, 'GET', '/api-docs/');
  check('GET /api-docs 200 (Swagger UI)', r.status === 200);
  r = await call(BASE, 'GET', '/api/products');
  check('GET /api/products 200', r.status === 200);
  r = await call(BASE, 'GET', '/api/products?sort=bogus');
  check('잘못된 sort 400', r.status === 400);
  r = await call(BASE, 'GET', '/api/products?offset=-1');
  check('잘못된 offset 400', r.status === 400);
  r = await call(BASE, 'GET', '/api/articles');
  check('GET /api/articles 200', r.status === 200);
  r = await call(BASE, 'GET', '/api/products/99999999');
  check('없는 상품 404', r.status === 404);
  r = await call(BASE, 'GET', '/api/articles/99999999');
  check('없는 게시글 404', r.status === 404);
  r = await call(BASE, 'GET', '/api/products/abc');
  check('잘못된 id 400', r.status === 400);

  section('[2] 인증 · 토큰 (회원가입/로그인/재발급)');
  const email = `verify_${stamp}@test.com`;
  r = await call(BASE, 'POST', '/api/auth/signUp', {
    body: {
      email,
      nickname: `검증${String(stamp).slice(-6)}`,
      password: 'password123',
      passwordConfirmation: 'password123',
    },
  });
  check('회원가입 201 + 토큰 발급', r.status === 201 && Boolean(r.json?.data?.accessToken));
  const token = r.json?.data?.accessToken;
  const refreshToken = r.json?.data?.refreshToken;

  r = await call(BASE, 'POST', '/api/auth/signUp', {
    body: {
      email,
      nickname: `다른${String(stamp).slice(-6)}`,
      password: 'password123',
      passwordConfirmation: 'password123',
    },
  });
  check('이메일 중복 409', r.status === 409);

  r = await call(BASE, 'POST', '/api/auth/signUp', {
    body: { email: 'x@test.com', nickname: 'n', password: 'short', passwordConfirmation: 'nomatch' },
  });
  check('가입 입력값 오류 400', r.status === 400);

  r = await call(BASE, 'POST', '/api/auth/signIn', { body: { email, password: 'password123' } });
  check('로그인 200', r.status === 200 && Boolean(r.json?.data?.accessToken));
  r = await call(BASE, 'POST', '/api/auth/signIn', { body: { email, password: 'wrongpass' } });
  check('비밀번호 불일치 401', r.status === 401);

  r = await call(BASE, 'POST', '/api/auth/refresh', { body: { refreshToken } });
  check('리프레시 토큰 재발급 200 (회전)', r.status === 200 && Boolean(r.json?.data?.accessToken));
  r = await call(BASE, 'POST', '/api/auth/refresh', { body: { refreshToken: token } });
  check('액세스 토큰으로 재발급 시도 401', r.status === 401);
  r = await call(BASE, 'POST', '/api/auth/refresh', { body: {} });
  check('리프레시 토큰 누락 400', r.status === 400);

  r = await call(BASE, 'POST', '/api/auth/google', { body: { code: 'x' } });
  check('구글 OAuth 미설정 400 (안내)', r.status === 400);

  r = await call(BASE, 'GET', '/api/users/me', { token });
  check('내 정보 조회 200', r.status === 200 && r.json?.data?.email === email);
  r = await call(BASE, 'GET', '/api/users/me');
  check('인증 없이 내 정보 401', r.status === 401);

  section('[3] 상품 CRUD · 좋아요 · 인가');
  r = await call(BASE, 'POST', '/api/products', {
    token,
    body: { name: '검증상품', description: '설명', price: 1000 },
  });
  check('상품 등록 201', r.status === 201 && Boolean(r.json?.data?.id));
  const productId = r.json?.data?.id;

  r = await call(BASE, 'POST', '/api/products', { body: { name: 'x', description: 'y', price: 1 } });
  check('인증 없이 등록 401', r.status === 401);
  r = await call(BASE, 'POST', '/api/products', {
    token,
    body: { name: 'x', description: 'y', price: -1 },
  });
  check('음수 가격 400', r.status === 400);
  r = await call(BASE, 'POST', '/api/products', {
    token,
    body: { name: '가'.repeat(11), description: 'y', price: 1 },
  });
  check('상품명 10자 초과 400', r.status === 400);

  r = await call(BASE, 'PATCH', `/api/products/${productId}`, { token, body: {} });
  check('수정 필드 없음 400', r.status === 400);
  r = await call(BASE, 'PATCH', `/api/products/${productId}`, { token, body: { name: '수정상품' } });
  check('상품 수정 200', r.status === 200 && r.json?.data?.name === '수정상품');
  r = await call(BASE, 'PATCH', `/api/products/${productId}`, {
    token: 'invalid.token.here',
    body: { name: 'x' },
  });
  check('잘못된 토큰 401', r.status === 401);

  r = await call(BASE, 'POST', `/api/products/${productId}/like`, { token });
  check('상품 좋아요 200 (isLiked true)', r.status === 200 && r.json?.data?.isLiked === true);
  r = await call(BASE, 'POST', `/api/products/${productId}/like`, { token });
  check('중복 좋아요 409', r.status === 409);
  r = await call(BASE, 'DELETE', `/api/products/${productId}/like`, { token });
  check('좋아요 취소 200 (isLiked false)', r.status === 200 && r.json?.data?.isLiked === false);
  r = await call(BASE, 'DELETE', `/api/products/${productId}/like`, { token });
  check('좋아요 없음 취소 404', r.status === 404);

  section('[4] 댓글 · 문의 (작성/조회/수정/삭제)');
  r = await call(BASE, 'POST', `/api/products/${productId}/comments`, {
    token,
    body: { content: '문의합니다' },
  });
  check('상품 문의 등록 201', r.status === 201 && Boolean(r.json?.data?.id));
  const productCommentId = r.json?.data?.id;
  r = await call(BASE, 'GET', `/api/products/${productId}/comments`);
  check('상품 문의 목록 200', r.status === 200 && Array.isArray(r.json?.data?.list));
  r = await call(BASE, 'POST', `/api/products/${productId}/comments`, {
    token,
    body: { content: '가'.repeat(301) },
  });
  check('댓글 300자 초과 400', r.status === 400);
  r = await call(BASE, 'PATCH', `/api/comments/${productCommentId}`, {
    token,
    body: { content: '수정된 문의' },
  });
  check('댓글 수정 200', r.status === 200);
  r = await call(BASE, 'DELETE', `/api/comments/${productCommentId}`, { token });
  check('댓글 삭제 204', r.status === 204);

  section('[5] 게시글 CRUD · 좋아요 · 댓글');
  r = await call(BASE, 'POST', '/api/articles', { token, body: { title: '검증글', content: '내용' } });
  check('게시글 등록 201', r.status === 201 && Boolean(r.json?.data?.id));
  const articleId = r.json?.data?.id;
  r = await call(BASE, 'POST', '/api/articles', {
    token,
    body: { title: '가'.repeat(31), content: 'x' },
  });
  check('제목 30자 초과 400', r.status === 400);
  r = await call(BASE, 'POST', '/api/articles', { token, body: { title: '', content: '' } });
  check('필수값 누락 400', r.status === 400);
  r = await call(BASE, 'PATCH', `/api/articles/${articleId}`, { token, body: { content: '수정내용' } });
  check('게시글 수정 200', r.status === 200 && r.json?.data?.content === '수정내용');
  r = await call(BASE, 'POST', `/api/articles/${articleId}/like`, { token });
  check('게시글 좋아요 200', r.status === 200 && r.json?.data?.isLiked === true);
  r = await call(BASE, 'DELETE', `/api/articles/${articleId}/like`, { token });
  check('게시글 좋아요 취소 200', r.status === 200 && r.json?.data?.isLiked === false);
  r = await call(BASE, 'POST', `/api/articles/${articleId}/comments`, {
    token,
    body: { content: '댓글' },
  });
  check('게시글 댓글 등록 201', r.status === 201);
  const articleCommentId = r.json?.data?.id;
  r = await call(BASE, 'GET', `/api/articles/${articleId}/comments`);
  check('게시글 댓글 목록 200', r.status === 200);
  r = await call(BASE, 'PATCH', `/api/comments/${articleCommentId}`, {
    token,
    body: { content: '댓글수정' },
  });
  check('게시글 댓글 수정 200', r.status === 200);

  section('[6] 이미지 업로드 가드');
  r = await fetch(`${BASE}/api/images/upload`, { method: 'POST', body: new FormData() });
  check('파일 없이 업로드 400', r.status === 400);

  section('[7] 정리 (등록한 데이터 삭제)');
  r = await call(BASE, 'DELETE', `/api/articles/${articleId}`, { token });
  check('게시글 삭제 204', r.status === 204);
  r = await call(BASE, 'DELETE', `/api/products/${productId}`, { token });
  check('상품 삭제 204', r.status === 204);

  section('[8] Swagger 명세');
  const pathCount = Object.keys(swaggerSpec.paths).length;
  const schemaCount = Object.keys(swaggerSpec.components.schemas).length;
  check(`paths ${pathCount}개 (>= 15)`, pathCount >= 15, `실측 ${pathCount}`);
  check(`schemas ${schemaCount}개 (>= 9)`, schemaCount >= 9, `실측 ${schemaCount}`);
  check('bearerAuth 보안 스키마', Boolean(swaggerSpec.components.securitySchemes.bearerAuth));
}

async function main() {
  let BASE = externalBase;
  let server = null;
  let db = null;

  if (!BASE) {
    const { createContainer } = await import('#common/di/container.js');
    const { App } = await import('../src/app.js');

    const container = createContainer();
    db = container.db;
    const app = new App(container.controller, container.config);

    server = await new Promise((resolve, reject) => {
      const listener = app.app.listen(0, () => resolve(listener));
      listener.once('error', reject);
    });
    const { port } = server.address();
    BASE = `http://127.0.0.1:${port}`;
    console.log(`검증용 서버를 띄웠습니다: ${BASE}`);
  } else {
    console.log(`이미 실행 중인 서버를 검증합니다: ${BASE}`);
  }

  console.log('='.repeat(60));
  console.log('판다마켓 백엔드 API 검증');
  console.log('='.repeat(60));

  // 검증 중에는 400 같은 "예상된 오류"도 서버가 콘솔에 찍습니다.
  // 결과를 읽기 편하도록 잠시 모아두었다가, 실패가 있을 때만 마지막에 함께 보여줍니다.
  const originalConsoleError = console.error;
  const capturedServerLogs = [];
  console.error = (...args) => capturedServerLogs.push(args);

  try {
    await runChecks(BASE);
  } finally {
    console.error = originalConsoleError;
    if (server) await new Promise((resolve) => server.close(resolve));
    if (db) await db.close();
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(`결과: ${pass} 통과 / ${fail} 실패 (총 ${pass + fail})`);
  if (fail > 0) {
    console.log('\n실패 목록:');
    for (const item of failures) console.log(` - ${item}`);
    if (capturedServerLogs.length > 0) {
      console.log('\n서버 로그(디버깅 참고):');
      for (const args of capturedServerLogs) {
        console.log(' -', args.map((arg) => String(arg?.message ?? arg)).join(' '));
      }
    }
    process.exitCode = 1;
  } else {
    console.log('모든 검증을 통과했습니다.');
  }
  console.log('='.repeat(60));
}

main().catch((error) => {
  console.error('\n검증 실행 중 오류가 발생했습니다:');
  console.error(error);
  process.exitCode = 1;
});
