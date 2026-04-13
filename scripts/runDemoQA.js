const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mysql = require('mysql2/promise');

const BASE_URL = process.env.QA_API_URL || `http://localhost:${process.env.PORT || 3000}/api`;

const results = [];

const record = (role, feature, ok, details) => {
  results.push({ role, feature, ok, details });
  const icon = ok ? 'PASS' : 'FAIL';
  console.log(`[${icon}] [${role}] ${feature}${details ? ` - ${details}` : ''}`);
};

const safe = async (role, feature, fn) => {
  try {
    const details = await fn();
    record(role, feature, true, details || '');
    return true;
  } catch (error) {
    const msg = error.response?.data?.error || error.response?.data?.message || error.message;
    record(role, feature, false, msg);
    return false;
  }
};

const buildUrl = (route, params) => {
  const url = new URL(`${BASE_URL}${route}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, String(v));
      }
    });
  }
  return url.toString();
};

const request = async ({
  method = 'GET',
  route,
  token,
  body,
  params,
  binary = false
}) => {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(buildUrl(route, params), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  if (!res.ok) {
    let errorPayload = null;
    try {
      errorPayload = await res.json();
    } catch (_) {
      errorPayload = { error: `HTTP ${res.status}` };
    }
    const err = new Error(errorPayload?.error || errorPayload?.message || `HTTP ${res.status}`);
    err.response = { status: res.status, data: errorPayload };
    throw err;
  }

  if (binary) {
    const ab = await res.arrayBuffer();
    return { data: Buffer.from(ab) };
  }

  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    return { data: await res.json() };
  }
  return { data: await res.text() };
};

(async () => {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'TESdb'
  });

  let adminToken = '';
  let adminId = '';
  let agentToken = '';
  let agentId = '';
  let customerToken = '';
  let customerId = '';
  let propertyId = '';
  let inquiryId = '';
  let documentId = '';

  await safe('System', 'API health', async () => {
    const res = await request({ route: '/health' });
    if (!res.data) throw new Error('No health response');
    return 'health endpoint reachable';
  });

  await safe('Admin', 'Login', async () => {
    const res = await request({
      method: 'POST',
      route: '/login',
      body: { email: 'admin@tesproperty.com', password: 'admin123' }
    });
    adminToken = res.data.token;
    adminId = res.data.user?.id;
    if (!adminToken) throw new Error('No admin token');
    return `admin ${res.data.user?.email}`;
  });

  await safe('Agent', 'Login', async () => {
    const res = await request({
      method: 'POST',
      route: '/login',
      body: { email: 'maria@tesproperty.com', password: 'agent123' }
    });
    agentToken = res.data.token;
    agentId = res.data.user?.id;
    if (!agentToken) throw new Error('No agent token');
    return `agent ${res.data.user?.email}`;
  });

  const qaSeed = Date.now();
  const qaCustomerEmail = `qa.customer.${qaSeed}@example.com`;
  const qaCustomerPhone = `09${String(qaSeed).slice(-9)}`;
  await safe('Customer', 'Signup', async () => {
    const res = await request({
      method: 'POST',
      route: '/customers/signup',
      body: {
      name: 'QA Customer',
      email: qaCustomerEmail,
      phone: qaCustomerPhone,
      password: 'customer123'
      }
    });
    return res.data.message || 'signup ok';
  });

  await safe('Customer', 'Login', async () => {
    const res = await request({
      method: 'POST',
      route: '/customers/login',
      body: {
        email: qaCustomerEmail,
        password: 'customer123'
      }
    });
    customerToken = res.data.token;
    customerId = res.data.user?.id;
    if (!customerToken) throw new Error('No customer token');
    return `customer ${res.data.user?.email}`;
  });

  await safe('Customer', 'Phone verification', async () => {
    await request({ method: 'POST', route: '/customers/send-phone-otp', token: customerToken });

    const [rows] = await db.execute(
      'SELECT phone_verification_token FROM customers WHERE id = ? LIMIT 1',
      [customerId]
    );

    const otp = rows[0]?.phone_verification_token;
    if (!otp) throw new Error('No OTP token found for customer');

    const res = await request({
      method: 'POST',
      route: '/customers/verify-phone',
      token: customerToken,
      body: { otp }
    });

    return res.data?.message || 'phone verified';
  });

  await safe('Shared', 'Properties list with filters', async () => {
    const res = await request({
      route: '/properties',
      params: {
        type: 'Condo,House',
        minPrice: 2000000,
        maxPrice: 10000000,
        bedrooms: 3,
        city: 'Metro Manila',
        minArea: 30
      }
    });
    const list = res.data?.data || [];
    if (!Array.isArray(list)) throw new Error('Invalid properties list');
    propertyId = list[0]?.id;
    if (!propertyId) {
      const allRes = await request({ route: '/properties', params: { limit: 100 } });
      propertyId = allRes.data?.data?.[0]?.id;
    }
    if (!propertyId) throw new Error('No property found for tests');
    return `filtered results: ${list.length}`;
  });

  await safe('Shared', 'Create inquiry for workflow tests', async () => {
    const res = await request({
      method: 'POST',
      route: '/inquiries',
      token: customerToken,
      body: {
        name: 'QA Customer',
        email: qaCustomerEmail,
        phone: qaCustomerPhone,
        message: 'QA end-to-end inquiry for scheduling and ownership checks',
        propertyId,
        propertyTitle: 'QA Property',
        propertyPrice: 2500000,
        propertyLocation: 'QA Location'
      }
    });

    inquiryId = res.data?.id;
    if (!inquiryId) throw new Error('Inquiry not created');
    return `inquiry: ${inquiryId}`;
  });

  await safe('Customer', 'Add favorite', async () => {
    const res = await request({ method: 'POST', route: `/customers/favorites/${propertyId}`, token: customerToken });
    return res.data.message || 'favorite added';
  });

  await safe('Customer', 'List favorites', async () => {
    const res = await request({ route: '/customers/favorites', token: customerToken });
    const rows = res.data?.data || [];
    const found = rows.some((r) => r.id === propertyId);
    if (!found) throw new Error('Added favorite not found');
    return `favorites: ${rows.length}`;
  });

  await safe('Customer', 'Save preferences', async () => {
    const res = await request({
      method: 'PUT',
      route: '/customers/preferences',
      token: customerToken,
      body: {
      preferredLocations: ['Pasig', 'Taguig'],
      propertyTypes: ['Condo', 'House'],
      minPrice: 1500000,
      maxPrice: 9000000,
      minArea: 30,
      maxArea: 250,
      preferredBedrooms: 2,
      preferredBathrooms: 1,
      amenities: ['Gym', 'Parking']
      }
    });
    return res.data.message || 'preferences saved';
  });

  await safe('Customer', 'Get preferences', async () => {
    const res = await request({ route: '/customers/preferences', token: customerToken });
    if (!Array.isArray(res.data?.preferredLocations)) throw new Error('Invalid preference payload');
    return `locations: ${res.data.preferredLocations.length}`;
  });

  await safe('Customer', 'List property documents', async () => {
    const res = await request({ route: `/properties/${propertyId}/documents`, token: customerToken });
    const docs = res.data?.data || [];
    documentId = docs[0]?.id;
    if (!documentId) throw new Error('No demo property document found');
    return `docs: ${docs.length}`;
  });

  await safe('Customer', 'Download property document', async () => {
    const res = await request({ route: `/documents/${documentId}/download`, token: customerToken, binary: true });
    if (!res.data || res.data.byteLength <= 0) throw new Error('Empty download');
    return `bytes: ${res.data.byteLength}`;
  });

  await safe('Admin', 'Inquiries list', async () => {
    const res = await request({ route: '/inquiries', token: adminToken, params: { limit: 20 } });
    if (!inquiryId) {
      inquiryId = res.data?.data?.[0]?.id;
    }
    if (!inquiryId) throw new Error('No inquiry found');
    return `inquiries: ${res.data?.data?.length || 0}`;
  });

  await safe('Admin', 'Create viewing requires inquiryId', async () => {
    const noInquiryStart = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const noInquiryEnd = new Date(noInquiryStart.getTime() + 60 * 60 * 1000);
    let blocked = false;
    try {
      await request({ method: 'POST', route: '/calendar', token: adminToken, body: {
        title: 'QA Viewing Without Inquiry',
        type: 'viewing',
        start: noInquiryStart.toISOString(),
        end: noInquiryEnd.toISOString(),
        agentId
      }});
    } catch (err) {
      blocked = (err.response?.status === 400);
    }
    if (!blocked) throw new Error('Viewing without inquiryId was not blocked');
    return 'validation enforced';
  });

  await safe('Admin', 'Create viewing with inquiryId', async () => {
    const baseStart = Date.now() + 48 * 60 * 60 * 1000;
    const maxAttempts = 6;

    for (let i = 0; i < maxAttempts; i += 1) {
      const withInquiryStart = new Date(baseStart + i * 4 * 60 * 60 * 1000);
      const withInquiryEnd = new Date(withInquiryStart.getTime() + 60 * 60 * 1000);

      try {
        const res = await request({ method: 'POST', route: '/calendar', token: adminToken, body: {
          title: `QA Viewing With Inquiry #${i + 1}`,
          type: 'viewing',
          start: withInquiryStart.toISOString(),
          end: withInquiryEnd.toISOString(),
          agentId,
          inquiryId,
          propertyId
        }});

        if (!res.data?.id) throw new Error('Event not created');
        return `event: ${res.data.id} (attempt ${i + 1})`;
      } catch (error) {
        const msg = String(error?.response?.data?.error || error.message || '').toLowerCase();
        if (!msg.includes('schedule conflict') || i === maxAttempts - 1) {
          throw error;
        }
      }
    }

    throw new Error('Unable to create viewing after retries');
  });

  await safe('Admin', 'Commission settings update', async () => {
    const res = await request({ method: 'PUT', route: '/commissions/settings', token: adminToken, body: { defaultRate: 5.5 } });
    return res.data.message || 'settings updated';
  });

  await safe('Admin', 'License compliance report', async () => {
    const res = await request({ route: '/users/reports/licenses', token: adminToken });
    const rows = res.data?.data || [];
    if (!rows.length) throw new Error('No license rows found');
    return `rows: ${rows.length}`;
  });

  await safe('Agent', 'Read own license', async () => {
    const res = await request({ route: `/users/agents/${agentId}/license`, token: agentToken });
    if (!res.data?.license_number) throw new Error('Missing license number');
    return res.data.license_number;
  });

  await safe('Agent', 'Download own license file', async () => {
    const res = await request({ route: `/users/agents/${agentId}/license/download`, token: agentToken, binary: true });
    if (!res.data || res.data.byteLength <= 0) throw new Error('Empty file');
    return `bytes: ${res.data.byteLength}`;
  });

  await safe('Agent', 'Notifications list', async () => {
    const res = await request({ route: '/notifications', token: agentToken });
    if (!Array.isArray(res.data?.data)) throw new Error('Invalid notifications payload');
    return `notifications: ${res.data.data.length}`;
  });

  await safe('Customer', 'Remove favorite', async () => {
    const res = await request({ method: 'DELETE', route: `/customers/favorites/${propertyId}`, token: customerToken });
    return res.data.message || 'favorite removed';
  });

  await safe('System', 'QA cleanup artifacts', async () => {
    await db.beginTransaction();
    try {
      if (inquiryId) {
        await db.execute('DELETE FROM calendar_events WHERE inquiry_id = ?', [inquiryId]);
        await db.execute("DELETE FROM notifications WHERE related_type = 'inquiry' AND related_id = ?", [inquiryId]);
        await db.execute('DELETE FROM inquiries WHERE id = ?', [inquiryId]);
      }

      if (customerId) {
        await db.execute("DELETE FROM notifications WHERE user_role = 'customer' AND user_id = ?", [customerId]);
        await db.execute('DELETE FROM phone_verification_attempts WHERE customer_id = ?', [customerId]);
        await db.execute('DELETE FROM phone_verification_log WHERE customer_id = ?', [customerId]);
        await db.execute('DELETE FROM customer_favorites WHERE customer_id = ?', [customerId]);
        await db.execute('DELETE FROM customer_preferences WHERE customer_id = ?', [customerId]);
        await db.execute('DELETE FROM customers WHERE id = ?', [customerId]);
      }

      // Safety net in case IDs were not captured.
      await db.execute('DELETE FROM inquiries WHERE LOWER(email) = LOWER(?)', [qaCustomerEmail]);
      await db.execute('DELETE FROM customers WHERE LOWER(email) = LOWER(?)', [qaCustomerEmail]);

      // Broader safety net for previous qa:demo leftovers.
      await db.execute('DELETE FROM calendar_events WHERE title LIKE \'QA Viewing %\'');
      await db.execute("DELETE FROM notifications WHERE related_type = 'inquiry' AND related_id IN (SELECT id FROM inquiries WHERE LOWER(email) LIKE 'qa.customer.%@example.com')");
      await db.execute("DELETE FROM inquiries WHERE LOWER(email) LIKE 'qa.customer.%@example.com'");
      await db.execute("DELETE FROM phone_verification_attempts WHERE customer_id IN (SELECT id FROM customers WHERE LOWER(email) LIKE 'qa.customer.%@example.com')");
      await db.execute("DELETE FROM phone_verification_log WHERE customer_id IN (SELECT id FROM customers WHERE LOWER(email) LIKE 'qa.customer.%@example.com')");
      await db.execute("DELETE FROM customer_favorites WHERE customer_id IN (SELECT id FROM customers WHERE LOWER(email) LIKE 'qa.customer.%@example.com')");
      await db.execute("DELETE FROM customer_preferences WHERE customer_id IN (SELECT id FROM customers WHERE LOWER(email) LIKE 'qa.customer.%@example.com')");
      await db.execute("DELETE FROM notifications WHERE user_role = 'customer' AND user_id IN (SELECT id FROM customers WHERE LOWER(email) LIKE 'qa.customer.%@example.com')");
      await db.execute("DELETE FROM customers WHERE LOWER(email) LIKE 'qa.customer.%@example.com'");

      await db.commit();
      return 'QA inquiry/customer artifacts removed';
    } catch (error) {
      await db.rollback();
      throw error;
    }
  });

  const summary = results.reduce(
    (acc, r) => {
      acc.total += 1;
      if (r.ok) acc.passed += 1;
      else acc.failed += 1;
      return acc;
    },
    { total: 0, passed: 0, failed: 0 }
  );

  console.log('\n=== QA SUMMARY ===');
  console.log(`Total: ${summary.total}`);
  console.log(`Passed: ${summary.passed}`);
  console.log(`Failed: ${summary.failed}`);

  if (summary.failed > 0) {
    await db.end();
    process.exit(1);
  }

  await db.end();
})();
