import { test, expect } from "@playwright/test";

test("job CRUD flow", async ({ page }) => {
  // 登录
  await page.goto("http://localhost:3000/auth");
  await page.fill("input[name=email]", "123@123.com");
  await page.fill("input[name=password]", "12345678");
  await page.click("button[type=submit]");

  // 新建职位
  await page.goto("http://localhost:3000/jobs");
  await page.click("button:has-text('Neu')");
  await page.fill("input[name=title]", "Frontend Developer");
  await page.fill("input[name=company]", "Acme Inc");
  await page.click("button:has-text('Speichern')");
  await expect(page.getByText("Frontend Developer")).toBeVisible();

  // 修改状态
  await page.getByText("Frontend Developer").click();
  await page.selectOption("select[name=status]", "interview");
  await page.click("button:has-text('Update')");
  await expect(page.getByText("Interview")).toBeVisible();

  // 删除职位
  await page.click("button:has-text('Löschen')");
  await expect(page.getByText("Frontend Developer")).not.toBeVisible();
});
