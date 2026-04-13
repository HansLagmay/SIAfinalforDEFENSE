require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

const DEMO_PROPERTIES = [
  {
    title: 'Skyline 1BR Starter Condo in Pasig',
    type: 'Condo',
    price: 2900000,
    location: 'Pasig City, Metro Manila',
    bedrooms: 1,
    bathrooms: 1,
    area: 38,
    description: 'Compact starter condo near transport hubs and offices. Ideal for first-time buyers.',
    status: 'available',
    imageUrl: 'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=800&h=600&fit=crop',
    features: ['Near MRT', 'Gym', '24/7 Security', 'Function Room']
  },
  {
    title: 'Family 5BR House with Pool in Cavite',
    type: 'House',
    price: 9800000,
    location: 'Bacoor, Cavite',
    bedrooms: 5,
    bathrooms: 4,
    area: 310,
    description: 'Large family home with private pool and entertainment patio in a gated village.',
    status: 'available',
    imageUrl: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800&h=600&fit=crop',
    features: ['Swimming Pool', '2-Car Garage', 'Lanai', 'Maid Room']
  },
  {
    title: 'Studio Condo Near University Belt',
    type: 'Condo',
    price: 2100000,
    location: 'Sampaloc, Manila',
    bedrooms: 1,
    bathrooms: 1,
    area: 24,
    description: 'Affordable studio unit ideal for students and rental investors.',
    status: 'available',
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop',
    features: ['Fiber Ready', 'Study Area', 'Laundry Area']
  },
  {
    title: 'Mid-Rise 3BR Townhouse in Marikina',
    type: 'House',
    price: 5600000,
    location: 'Marikina City, Metro Manila',
    bedrooms: 3,
    bathrooms: 3,
    area: 145,
    description: 'Flood-conscious design townhouse with flexible office room and roof deck.',
    status: 'available',
    imageUrl: 'https://images.unsplash.com/photo-1600573472592-401b489a3cdc?w=800&h=600&fit=crop',
    features: ['Roof Deck', 'Home Office Nook', '2-Car Parking']
  },
  {
    title: 'Strategic Development Lot in Santa Rosa',
    type: 'Lot',
    price: 4300000,
    location: 'Santa Rosa, Laguna',
    bedrooms: 0,
    bathrooms: 0,
    area: 620,
    description: 'Corner lot near commercial area suited for mixed-use or residential project.',
    status: 'available',
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop',
    features: ['Corner Lot', 'Main Road Access', 'High Foot Traffic']
  },
  {
    title: 'Boutique Office Floor in Ortigas CBD',
    type: 'Commercial',
    price: 15500000,
    location: 'Ortigas Center, Pasig',
    bedrooms: 0,
    bathrooms: 2,
    area: 280,
    description: 'Whole office floor with reception and executive rooms in central business district.',
    status: 'available',
    imageUrl: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600&fit=crop',
    features: ['Reception Area', 'Backup Power', 'High-Speed Elevators']
  }
];

const DOC_TYPES = [
  'title-deed',
  'tax-declaration',
  'building-permit',
  'occupancy-certificate'
];

const ensureColumn = async (conn, table, column, definition) => {
  const [rows] = await conn.query(
    `SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1`,
    [table, column]
  );
  if (rows.length === 0) {
    await conn.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    console.log(`Added column ${table}.${column}`);
  }
};

const toDbDate = (date) => {
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const buildMinimalPdf = (title) => Buffer.from(`%PDF-1.1\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n4 0 obj\n<< /Length 70 >>\nstream\nBT /F1 16 Tf 72 720 Td (${title.replace(/[()]/g, '')}) Tj ET\nendstream\nendobj\n5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000010 00000 n \n0000000062 00000 n \n0000000120 00000 n \n0000000246 00000 n \n0000000366 00000 n \ntrailer\n<< /Root 1 0 R /Size 6 >>\nstartxref\n445\n%%EOF`, 'utf8');

async function seedDemoShowcaseData() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'TESdb'
  });

  try {
    console.log('Starting demo showcase data seeding...');

    await ensureColumn(conn, 'users', 'license_file_path', 'VARCHAR(512) DEFAULT NULL');

    const [agents] = await conn.query("SELECT id, name, email FROM users WHERE role = 'agent' ORDER BY created_at ASC");
    if (agents.length === 0) {
      throw new Error('No agent users found. Seed agents first.');
    }

    const [admins] = await conn.query("SELECT id, name FROM users WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1");
    const adminName = admins[0]?.name || 'Admin User';

    const docsRoot = path.join(__dirname, '../server/uploads/documents');
    const licenseRoot = path.join(__dirname, '../server/uploads/licenses');
    fs.mkdirSync(docsRoot, { recursive: true });
    fs.mkdirSync(licenseRoot, { recursive: true });

    for (let i = 0; i < DEMO_PROPERTIES.length; i++) {
      const p = DEMO_PROPERTIES[i];
      const [existing] = await conn.query('SELECT id FROM properties WHERE title = ? LIMIT 1', [p.title]);
      if (existing.length > 0) continue;

      const id = uuidv4();
      await conn.query(
        `INSERT INTO properties
          (id, title, type, price, location, bedrooms, bathrooms, area, description, status, image_url, features, created_by, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [id, p.title, p.type, p.price, p.location, p.bedrooms, p.bathrooms, p.area, p.description, p.status, p.imageUrl, JSON.stringify(p.features), adminName]
      );

      await conn.query(
        'INSERT INTO property_images (id, property_id, image_url, is_primary, created_at) VALUES (?, ?, ?, 1, NOW())',
        [uuidv4(), id, p.imageUrl]
      );

      console.log(`Added property: ${p.title}`);
    }

    const [allProperties] = await conn.query('SELECT id, title FROM properties ORDER BY created_at ASC');

    for (const property of allProperties) {
      const propertyDir = path.join(docsRoot, property.id);
      fs.mkdirSync(propertyDir, { recursive: true });

      for (const docType of DOC_TYPES) {
        const [existingDoc] = await conn.query(
          'SELECT id FROM property_documents WHERE property_id = ? AND document_type = ? LIMIT 1',
          [property.id, docType]
        );
        if (existingDoc.length > 0) continue;

        const fileName = `${docType}-${property.id.slice(0, 8)}.pdf`;
        const filePath = path.join(propertyDir, fileName);
        fs.writeFileSync(filePath, buildMinimalPdf(`${property.title} - ${docType}`));

        const relative = `/uploads/documents/${property.id}/${fileName}`;
        await conn.query(
          `INSERT INTO property_documents
            (id, property_id, document_type, file_name, file_path, file_size, uploaded_by, uploaded_by_name, uploaded_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [
            uuidv4(),
            property.id,
            docType,
            fileName,
            relative,
            fs.statSync(filePath).size,
            agents[0].id,
            agents[0].name
          ]
        );
      }
    }

    for (let i = 0; i < agents.length; i++) {
      const agent = agents[i];
      const licenseNumber = `PRC-2026-${String(i + 1).padStart(5, '0')}`;
      const issuedDate = new Date();
      issuedDate.setFullYear(issuedDate.getFullYear() - 1);
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 2);

      const licenseFileName = `agent-license-${agent.id.slice(0, 8)}.pdf`;
      const licenseFilePath = path.join(licenseRoot, licenseFileName);
      if (!fs.existsSync(licenseFilePath)) {
        fs.writeFileSync(licenseFilePath, buildMinimalPdf(`License - ${agent.name}`));
      }

      const licenseRelative = `/uploads/licenses/${licenseFileName}`;

      await conn.query(
        `UPDATE users
         SET license_number = ?,
             license_type = 'PRC',
             license_issued_date = ?,
             license_expiry_date = ?,
             license_verified = 1,
             license_status = 'active',
             broker_id = ?,
             license_file_path = ?
         WHERE id = ?`,
        [
          licenseNumber,
          toDbDate(issuedDate),
          toDbDate(expiryDate),
          `BRK-${String(i + 101)}`,
          licenseRelative,
          agent.id
        ]
      );

      const [historyExists] = await conn.query(
        'SELECT id FROM agent_licenses_history WHERE agent_id = ? AND license_number = ? LIMIT 1',
        [agent.id, licenseNumber]
      );

      if (historyExists.length === 0) {
        await conn.query(
          `INSERT INTO agent_licenses_history
            (id, agent_id, license_number, license_type, issued_date, expiry_date, status, verified_by, verified_at, notes, created_at)
           VALUES (?, ?, ?, 'PRC', ?, ?, 'active', ?, NOW(), ?, NOW())`,
          [
            uuidv4(),
            agent.id,
            licenseNumber,
            toDbDate(issuedDate),
            toDbDate(expiryDate),
            admins[0]?.id || null,
            `Demo license file: ${licenseRelative}`
          ]
        );
      }

      console.log(`Updated license demo for agent: ${agent.email}`);
    }

    const [propertyCountRows] = await conn.query('SELECT COUNT(*) AS cnt FROM properties');
    const [documentCountRows] = await conn.query('SELECT COUNT(*) AS cnt FROM property_documents');

    console.log('Demo seeding complete.');
    console.log(`Total properties: ${propertyCountRows[0].cnt}`);
    console.log(`Total property documents: ${documentCountRows[0].cnt}`);
  } catch (error) {
    console.error('Demo seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    await conn.end();
  }
}

seedDemoShowcaseData();
