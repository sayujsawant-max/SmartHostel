import { test, expect } from '@playwright/test';
import {
  login,
  loginViaApi,
  createLeaveViaApi,
  futureDateISO,
  SEED_USERS,
} from './helpers';

test.describe('Cross-Role Leave Approval Workflow', () => {
  let leaveId: string;

  test.beforeAll(async ({ request }) => {
    // Student submits a leave via API (faster than UI for setup)
    const studentCookies = await loginViaApi(
      request,
      SEED_USERS.student.email,
      SEED_USERS.student.password,
    );
    const leave = await createLeaveViaApi(request, studentCookies, {
      type: 'OVERNIGHT',
      startDate: futureDateISO(2),
      endDate: futureDateISO(3),
      reason: 'E2E test — cross-role leave approval workflow',
    });
    leaveId = leave._id;
    expect(leave.status).toBe('PENDING');
  });

  test('warden approves the leave via UI', async ({ page }) => {
    await login(page, 'warden');

    // Navigate to leave management (warden/students page)
    await page.goto('/warden/students');

    // Wait for the page to load and show leave data
    await expect(page.getByText('Leave Management')).toBeVisible({ timeout: 10_000 });

    // Ensure the "Pending" filter is active (default)
    const filterSelect = page.locator('select').first();
    await filterSelect.selectOption('PENDING');

    // Wait for pending leaves to render — look for our test leave by reason text
    await expect(
      page.getByText('E2E test — cross-role leave approval workflow'),
    ).toBeVisible({ timeout: 10_000 });

    // Click the Approve button on the leave card containing our reason
    const leaveCard = page
      .locator('div')
      .filter({ hasText: 'E2E test — cross-role leave approval workflow' })
      .first();
    await leaveCard.getByRole('button', { name: /Approve/i }).click();

    // Wait for the success toast or the leave to disappear from pending
    // The leave status should change — it should no longer show as PENDING
    await expect(
      page.getByText('Leave approved'),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('student sees approved status', async ({ request }) => {
    // Verify via API that the leave is now APPROVED
    const studentCookies = await loginViaApi(
      request,
      SEED_USERS.student.email,
      SEED_USERS.student.password,
    );
    const res = await request.get('http://localhost:5000/api/leaves', {
      headers: { cookie: studentCookies },
    });
    expect(res.ok()).toBeTruthy();

    const body = await res.json();
    const approvedLeave = body.data.leaves.find(
      (l: { _id: string }) => l._id === leaveId,
    );
    expect(approvedLeave).toBeTruthy();
    expect(approvedLeave.status).toBe('APPROVED');
  });
});
