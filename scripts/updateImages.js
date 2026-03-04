require('dotenv').config();
const mysql = require('mysql2/promise');

async function updateImages() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'TESdb'
  });

  try {
    console.log('📸 Updating property images...\n');

    const updates = [
      {
        title: 'Modern 3BR House in Quezon City',
        imageUrl: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop',
        images: [
          'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800&h=600&fit=crop'
        ]
      },
      {
        title: 'Cozy 2BR Condo in BGC',
        imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop',
        images: [
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop'
        ]
      },
      {
        title: 'Commercial Space in Makati',
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop',
        images: [
          'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&h=600&fit=crop'
        ]
      },
      {
        title: 'Beachfront Lot in Batangas',
        imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop',
        images: [
          'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
          'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop'
        ]
      }
    ];

    for (const update of updates) {
      // Update main image URL
      await connection.execute(
        'UPDATE properties SET image_url = ? WHERE title = ?',
        [update.imageUrl, update.title]
      );

      // Get property ID
      const [rows] = await connection.execute(
        'SELECT id FROM properties WHERE title = ?',
        [update.title]
      );

      if (rows.length > 0) {
        const propertyId = rows[0].id;

        // Delete old property_images entries
        await connection.execute(
          'DELETE FROM property_images WHERE property_id = ?',
          [propertyId]
        );

        // Insert new images
        const { v4: uuidv4 } = require('uuid');
        for (let i = 0; i < update.images.length; i++) {
          await connection.execute(
            'INSERT INTO property_images (id, property_id, image_url, is_primary, created_at) VALUES (?, ?, ?, ?, NOW())',
            [uuidv4(), propertyId, update.images[i], i === 0 ? 1 : 0]
          );
        }

        console.log(`  ✅ Updated: ${update.title} (${update.images.length} images)`);
      }
    }

    console.log('\n✅ All property images updated with real photos!\n');
    await connection.end();
  } catch (error) {
    console.error('Error updating images:', error);
    process.exit(1);
  }
}

updateImages();
