// --- file: tests/auth.spec.ts
import { test, expect, Page } from "@playwright/test";

// 统一的伪邮箱/密码（注册用）
const unique = Date.now();
const EMAIL_VERIFIED = `verified_${unique}@example.com`;
const EMAIL_UNVERIFIED = `unverified_${unique}@example.com`;
const PASSWORD = "SuperSafe123!";

type ApiHandler = Parameters<Page["route"]>[1];

// 简单的接口 Mock：根据 URL 返回不同结果
function mockAuthApi(page: Page) {
  // 注册
  page.route("**/api/register", async (route) => {
    const body = await route.request().postDataJSON();
    // 统一返回 { ok: true }（与你的 axios 拦截器兼容）
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });

  // 重发验证邮件（如果你的页面会触发）
  page.route("**/api/resend-verify-email", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });

  // 登录
  page.route("**/api/login", async (route) => {
    const req = route.request();
    const body = (await req.postDataJSON()) as { email: string; password: string };

    // 未验证用户
    if (body.email.startsWith("unverified_")) {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          code: "EMAIL_NOT_VERIFIED",
          message: "Bitte bestätige zuerst deine E-Mail-Adresse.",
        }),
      });
      return;
    }

    // 验证过的用户
    await route.fulfill({
      status: 200,
      headers: {
        // 你的前端只依赖 cookie 时，可以模拟一个 Set-Cookie
        "Set-Cookie": "session=fake; Path=/; HttpOnly",
      },
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });

  // 退出
  page.route("**/api/logout", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });

  // 邮件验证（/api/verify-email）
  page.route("**/api/verify-email", async (route) => {
    const body = await route.request().postDataJSON();
    // 你后端通常会接收 token 并返回 { verified: true, email }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ verified: true, email: body?.email || EMAIL_VERIFIED }),
    });
  });

  // 仪表盘数据
  page.route("**/api/positions", async (route) => {
    // 空列表
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [],
        total: 0,
        pagination: { page: 1, pageSize: 20, total: 0, totalPages: 1 },
      }),
    });
  });
}

test.describe("Auth flows (Register / Verify / Login)", () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthApi(page);
  });

  test("Register → Verify link → Login success → Redirect to /dashboard", async ({ page }) => {
    // 1) 访问注册页
    await page.goto("/auth?mode=register");

    // 2) 填表并提交
    const email = EMAIL_VERIFIED;
    const password = PASSWORD;

    const emailInput =
      (await page.$('[data-testid="register-email"]')) ||
      (await page.$('input[name="email"]'));

    const passInput =
      (await page.$('[data-testid="register-password"]')) ||
      (await page.$('input[name="password"]'));

    await emailInput?.fill(email);
    await passInput?.fill(password);

    const submitBtn =
      (await page.$('[data-testid="register-submit"]')) ||
      (await page.getByRole("button", { name: /registrieren/i }));

    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/register") && r.status() === 200),
      submitBtn!.click(),
    ]);

    // 3) UI 提示“验证邮件已发送”或你的成功提示（根据实际文本微调）
    await expect(page.locator("body")).toContainText(/(E-Mail.*(gesendet|bestätigen)|verify|Bestätigung)/i);

    // 4) 模拟点击邮件中的验证链接 → 打开验证页
    await page.goto(`/verify?token=fake-token&email=${encodeURIComponent(email)}`);

    // 5) 验证页应显示成功，并 5 秒倒计时（我们只断言成功 UI）
    const verifyOk =
      page.getByTestId("verify-success") ||
      page.getByText(/(verifiziert|erfolgreich|success)/i);
    await expect(verifyOk).toBeVisible();

    // 6) 直接去登录页并登录
    await page.goto("/auth?mode=login");
    const loginEmail =
      (await page.$('[data-testid="login-email"]')) ||
      (await page.$('input[name="email"]'));
    const loginPass =
      (await page.$('[data-testid="login-password"]')) ||
      (await page.$('input[name="password"]'));
    await loginEmail?.fill(email);
    await loginPass?.fill(password);

    const loginBtn =
      (await page.$('[data-testid="login-submit"]')) ||
      (await page.getByRole("button", { name: /anmelden|login/i }));

    await Promise.all([
      // 登录请求返回 200
      page.waitForResponse((r) => r.url().includes("/api/login") && r.status() === 200),
      loginBtn!.click(),
    ]);

    // 7) 登录成功后应跳转到 /dashboard
    await page.waitForURL(/\/dashboard/i);
    await expect(page).toHaveURL(/\/dashboard/i);

    // 并且看到你的概览标题
    await expect(page.getByText(/übersicht/i)).toBeVisible();
  });

  test("Login with UNVERIFIED account shows EMAIL_NOT_VERIFIED hint", async ({ page }) => {
    await page.goto("/auth?mode=login");

    const email = EMAIL_UNVERIFIED;
    const emailInput =
      (await page.$('[data-testid="login-email"]')) ||
      (await page.$('input[name="email"]'));
    const passInput =
      (await page.$('[data-testid="login-password"]')) ||
      (await page.$('input[name="password"]'));

    await emailInput?.fill(email);
    await passInput?.fill(PASSWORD);

    const loginBtn =
      (await page.$('[data-testid="login-submit"]')) ||
      (await page.getByRole("button", { name: /anmelden|login/i }));

    await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/login") && r.status() === 401),
      loginBtn!.click(),
    ]);

    // 你拦截器会 toast 一条 EMAIL_NOT_VERIFIED 的提示
    // 在页面正文或 toast 容器断言（根据你的 UI 组件微调选择器）
    await expect(page.locator("body")).toContainText(/(bestätige.*E-Mail|EMAIL_NOT_VERIFIED)/i);
  });

  test("Logout clears session and protected page redirects to /auth", async ({ page }) => {
    // 先让用户“已登录”：直接访问 /dashboard（接口都已 mock）
    await page.goto("/dashboard");
    await expect(page.getByText(/übersicht/i)).toBeVisible();

    // 调用退出（如果有按钮，建议加 data-testid。如果没有，这里直接打 API）
    await page.request.post("/api/logout");
    // 访问受保护页时，后端会返回 401；我们这里简单模拟前端刷新后的跳转。
    await page.goto("/dashboard");
    // 你的 401 拦截器会跳转到 /auth?next=...
    await page.waitForURL(/\/auth/i);
    await expect(page).toHaveURL(/\/auth/i);
  });
});
