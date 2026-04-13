const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const API = 'http://localhost:3000/api';

async function http(method, path, body, token) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) })
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch (_e) {
    data = text;
  }
  return { ok: res.ok, status: res.status, data };
}

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'TESdb'
  });

  const stamp = Date.now();
  const customerEmail = `full.customer.${stamp}@example.com`;
  const agentEmail = `full.agent.${stamp}@example.com`;
  const adminEmail = `full.admin.${stamp}@example.com`;
  const password = 'Password123!';
  const phone = '09171234567';

  const created = {
    customerId: null,
    agentId: null,
    adminId: null,
    inquiryId: null,
    appointmentId: null,
    propertyId: null
  };

  const report = [];
  const push = (name, pass, detail = '') => {
    report.push({ name, pass, detail });
    const marker = pass ? 'PASS' : 'FAIL';
    console.log(`${marker} | ${name}${detail ? ` | ${detail}` : ''}`);
  };

  try {
    // Baseline checks
    const health = await http('GET', '/health');
    push('Backend health', health.status === 200);

    const publicProps = await http('GET', '/properties');
    push('Public properties endpoint', publicProps.status === 200);

    const noAuthInquiries = await http('GET', '/inquiries');
    push('Protected inquiries require auth', noAuthInquiries.status === 401, `status=${noAuthInquiries.status}`);

    // Seed role accounts
    const [propertyRows] = await db.execute('SELECT id, title, price, location FROM properties LIMIT 1');
    if (!propertyRows.length) {
      throw new Error('No properties available in DB for inquiry flow test.');
    }
    const property = propertyRows[0];

    const hash = await bcrypt.hash(password, 10);
    created.agentId = uuidv4();
    created.adminId = uuidv4();

    await db.execute(
      'INSERT INTO users (id, email, password, name, role, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [created.agentId, agentEmail, hash, 'Full E2E Agent', 'agent']
    );
    push('Seed temp agent', true, agentEmail);

    await db.execute(
      'INSERT INTO users (id, email, password, name, role, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [created.adminId, adminEmail, hash, 'Full E2E Admin', 'admin']
    );
    push('Seed temp admin', true, adminEmail);

    // Customer role flow
    const signup = await http('POST', '/customers/signup', {
      name: 'Full E2E Customer',
      email: customerEmail,
      password,
      phone
    });
    push('Customer signup', signup.status === 201, `status=${signup.status}`);
    created.customerId = signup.data?.customerId || null;

    const customerLogin = await http('POST', '/customers/login', { email: customerEmail, password });
    const customerToken = customerLogin.data?.token;
    push('Customer login', customerLogin.status === 200 && !!customerToken);

    const sendOtp = await http('POST', '/customers/send-phone-otp', {}, customerToken);
    push('Customer send OTP', sendOtp.status === 200, `status=${sendOtp.status}`);

    const [otpRows] = await db.execute('SELECT phone_verification_token FROM customers WHERE id = ?', [created.customerId]);
    const otp = otpRows[0]?.phone_verification_token;
    push('OTP stored in DB', !!otp);

    const verifyOtp = await http('POST', '/customers/verify-phone', { otp }, customerToken);
    push('Customer verify OTP', verifyOtp.status === 200, `status=${verifyOtp.status}`);

    const customerProfile = await http('GET', '/customers/me', undefined, customerToken);
    const phoneVerified = customerProfile.data?.phoneVerified;
    push('Customer profile fetch', customerProfile.status === 200 && (phoneVerified === true || phoneVerified === 1), `phoneVerified=${phoneVerified}`);

    const createInquiry = await http('POST', '/inquiries', {
      name: 'Full E2E Customer',
      email: customerEmail,
      phone,
      message: 'I am very interested and want to schedule an immediate viewing for this listing.',
      propertyId: property.id,
      propertyTitle: property.title,
      propertyPrice: property.price,
      propertyLocation: property.location
    }, customerToken);
    created.inquiryId = createInquiry.data?.id;
    push('Customer create inquiry', createInquiry.status === 201 && !!created.inquiryId, `status=${createInquiry.status}`);

    const duplicateInquiry = await http('POST', '/inquiries', {
      name: 'Full E2E Customer',
      email: customerEmail,
      phone,
      message: 'This is a duplicate inquiry attempt for the same property and customer.',
      propertyId: property.id,
      propertyTitle: property.title,
      propertyPrice: property.price,
      propertyLocation: property.location
    }, customerToken);
    push('Duplicate inquiry blocked', duplicateInquiry.status === 409, `status=${duplicateInquiry.status}`);

    const customerInquiries = await http('GET', '/customers/inquiries', undefined, customerToken);
    push('Customer inquiries list', customerInquiries.status === 200 && Array.isArray(customerInquiries.data?.data));

    // Agent role flow
    const agentLogin = await http('POST', '/login', { email: agentEmail, password });
    const agentToken = agentLogin.data?.token;
    push('Agent login', agentLogin.status === 200 && !!agentToken);

    const claim = await http('POST', `/inquiries/${created.inquiryId}/claim`, {}, agentToken);
    push('Agent claim inquiry', claim.status === 200, `status=${claim.status}`);

    const start = new Date(Date.now() + 60 * 60 * 1000);
    const end = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const isoLike = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      const ss = String(d.getSeconds()).padStart(2, '0');
      return `${y}-${m}-${day}T${hh}:${mm}:${ss}`;
    };

    const createViewing = await http('POST', '/calendar', {
      title: `Viewing ${stamp}`,
      description: `Ticket: ${createInquiry.data?.ticketNumber || 'N/A'} | E2E schedule test`,
      type: 'viewing',
      start: isoLike(start),
      end: isoLike(end),
      inquiryId: created.inquiryId,
      propertyId: property.id,
      agentId: created.agentId
    }, agentToken);

    created.appointmentId = createViewing.data?.id || null;
    push('Agent create viewing schedule', createViewing.status === 201 && !!created.appointmentId, `status=${createViewing.status}`);

    const markDone = await http('POST', `/calendar/${created.appointmentId}/mark-done`, {
      inquiryStatus: 'viewed-interested'
    }, agentToken);
    push('Agent mark viewing done', markDone.status === 200, `status=${markDone.status}`);

    // Customer post-viewing flows
    const customerAppointments = await http('GET', '/customers/appointments', undefined, customerToken);
    const appointmentFound = customerAppointments.status === 200 && Array.isArray(customerAppointments.data?.data) && customerAppointments.data.data.some((a) => a.id === created.appointmentId);
    push('Customer sees appointment', appointmentFound, `status=${customerAppointments.status}`);

    const feedback = await http('POST', `/customers/appointments/${created.appointmentId}/feedback`, {
      rating: 5,
      comment: 'Agent was helpful and on time.'
    }, customerToken);
    push('Customer submit feedback', feedback.status === 200, `status=${feedback.status}`);

    const cancelInquiry = await http('POST', `/customers/inquiries/${created.inquiryId}/cancel`, {
      reason: 'Testing cancel flow after viewing'
    }, customerToken);
    push('Customer cancel inquiry', cancelInquiry.status === 200, `status=${cancelInquiry.status}`);

    // Admin role flow
    const adminLogin = await http('POST', '/login', { email: adminEmail, password });
    const adminToken = adminLogin.data?.token;
    push('Admin login', adminLogin.status === 200 && !!adminToken);

    const adminAssign = await http('POST', `/inquiries/${created.inquiryId}/assign`, {
      agentId: created.agentId,
      agentName: 'Full E2E Agent'
    }, adminToken);
    push('Admin assign inquiry', adminAssign.status === 200, `status=${adminAssign.status}`);

    const adminCreateProperty = await http('POST', '/properties', {
      title: `E2E Property ${stamp}`,
      type: 'House',
      price: 1234567,
      location: 'E2E City',
      bedrooms: 2,
      bathrooms: 1,
      area: 60,
      description: 'This is an end-to-end generated property used for automated flow testing only.',
      status: 'available',
      imageUrl: '',
      features: ['garage']
    }, adminToken);
    created.propertyId = adminCreateProperty.data?.id || null;
    push('Admin create property', adminCreateProperty.status === 201 && !!created.propertyId, `status=${adminCreateProperty.status}`);

    if (created.propertyId) {
      const adminDeleteProperty = await http('DELETE', `/properties/${created.propertyId}`, undefined, adminToken);
      push('Admin delete property', adminDeleteProperty.status === 200, `status=${adminDeleteProperty.status}`);
    }

    const usersList = await http('GET', '/users', undefined, adminToken);
    push('Admin list users', usersList.status === 200, `status=${usersList.status}`);

    const performance = await http('GET', '/users/agents/performance', undefined, adminToken);
    push('Admin agent performance', performance.status === 200 && Array.isArray(performance.data?.data), `status=${performance.status}`);

    const activityLog = await http('GET', '/activity-log', undefined, adminToken);
    push('Admin activity logs', activityLog.status === 200, `status=${activityLog.status}`);

    const dbOverview = await http('GET', '/database/overview', undefined, adminToken);
    push('Admin database overview', dbOverview.status === 200, `status=${dbOverview.status}`);

    // Summary
    const passed = report.filter(r => r.pass).length;
    const failed = report.filter(r => !r.pass).length;
    console.log('SUMMARY |', JSON.stringify({ total: report.length, passed, failed }, null, 2));

    if (failed > 0) {
      process.exitCode = 2;
    }
  } catch (e) {
    console.error('CRASH |', e.message);
    process.exitCode = 1;
  } finally {
    // Cleanup
    try {
      if (created.inquiryId) {
        await db.execute('DELETE FROM appointment_feedback WHERE inquiry_id = ?', [created.inquiryId]);
        await db.execute('DELETE FROM calendar_events WHERE inquiry_id = ?', [created.inquiryId]);
        await db.execute('DELETE FROM inquiries WHERE id = ?', [created.inquiryId]);
      }
      if (created.propertyId) {
        await db.execute('DELETE FROM property_images WHERE property_id = ?', [created.propertyId]);
        await db.execute('DELETE FROM properties WHERE id = ?', [created.propertyId]);
      }
      if (created.customerId) {
        await db.execute('DELETE FROM phone_verification_attempts WHERE customer_id = ?', [created.customerId]);
        await db.execute('DELETE FROM phone_verification_log WHERE customer_id = ?', [created.customerId]);
        await db.execute('DELETE FROM customers WHERE id = ?', [created.customerId]);
      }
      if (created.agentId) {
        await db.execute('DELETE FROM users WHERE id = ?', [created.agentId]);
      }
      if (created.adminId) {
        await db.execute('DELETE FROM users WHERE id = ?', [created.adminId]);
      }
    } catch (cleanupErr) {
      console.error('CLEANUP_WARN |', cleanupErr.message);
    }
    await db.end();
  }
}

run();