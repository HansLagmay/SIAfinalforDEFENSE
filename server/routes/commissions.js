const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

const DEFAULT_RATE = 5;

const getDefaultRate = async () => {
  const [rows] = await pool.execute(
    'SELECT default_rate FROM commission_settings WHERE id = ? LIMIT 1',
    ['default-commission-setting']
  );

  return Number(rows[0]?.default_rate || DEFAULT_RATE);
};

const buildCommissionRows = async (whereSql = '', params = []) => {
  const defaultRate = await getDefaultRate();

  const [rows] = await pool.execute(
    `SELECT
      p.id AS property_id,
      p.title AS property_title,
      p.location AS property_location,
      p.sold_at,
      p.sale_price,
      p.commission_rate,
      p.commission_paid_at,
      p.commission_paid_by,
      u.id AS agent_id,
      u.name AS agent_name,
      u.email AS agent_email
     FROM properties p
     LEFT JOIN users u ON u.id = p.sold_by_agent_id
     WHERE p.status = 'sold' AND p.sold_by_agent_id IS NOT NULL
     ${whereSql}
     ORDER BY p.sold_at DESC`,
    params
  );

  return rows.map((row) => {
    const salePrice = Number(row.sale_price || 0);
    const rate = Number(row.commission_rate ?? defaultRate);
    const amount = Number(((salePrice * rate) / 100).toFixed(2));

    return {
      propertyId: row.property_id,
      propertyTitle: row.property_title,
      propertyLocation: row.property_location,
      soldAt: row.sold_at,
      salePrice,
      commissionRate: rate,
      commissionAmount: amount,
      commissionStatus: row.commission_paid_at ? 'paid' : 'pending',
      commissionPaidAt: row.commission_paid_at,
      commissionPaidBy: row.commission_paid_by,
      agentId: row.agent_id,
      agentName: row.agent_name,
      agentEmail: row.agent_email
    };
  });
};

router.get('/settings', authenticateToken, requireRole(['admin']), async (_req, res) => {
  try {
    const rate = await getDefaultRate();
    return res.json({ defaultRate: rate });
  } catch (error) {
    console.error('Failed to fetch commission settings:', error);
    return res.status(500).json({ error: 'Failed to fetch commission settings' });
  }
});

router.put('/settings', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const rate = Number(req.body.defaultRate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      return res.status(400).json({ error: 'defaultRate must be between 0 and 100' });
    }

    await pool.execute(
      `INSERT INTO commission_settings (id, default_rate, updated_by, updated_by_name, updated_at)
       VALUES (?, ?, ?, ?, NOW())
       ON DUPLICATE KEY UPDATE
         default_rate = VALUES(default_rate),
         updated_by = VALUES(updated_by),
         updated_by_name = VALUES(updated_by_name),
         updated_at = NOW()`,
      ['default-commission-setting', rate, req.user.id, req.user.name]
    );

    return res.json({ message: 'Commission settings updated', defaultRate: rate });
  } catch (error) {
    console.error('Failed to update commission settings:', error);
    return res.status(500).json({ error: 'Failed to update commission settings' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'agent') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const whereSql = req.user.role === 'agent' ? 'AND p.sold_by_agent_id = ?' : '';
    const params = req.user.role === 'agent' ? [req.user.id] : [];

    const data = await buildCommissionRows(whereSql, params);

    const totalCommission = data.reduce((sum, item) => sum + item.commissionAmount, 0);

    return res.json({
      data,
      summary: {
        totalDeals: data.length,
        totalCommission,
        totalSales: data.reduce((sum, item) => sum + item.salePrice, 0)
      }
    });
  } catch (error) {
    console.error('Failed to fetch commissions:', error);
    return res.status(500).json({ error: 'Failed to fetch commissions' });
  }
});

router.get('/agent/:agentId', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const data = await buildCommissionRows('AND p.sold_by_agent_id = ?', [req.params.agentId]);
    return res.json({ data });
  } catch (error) {
    console.error('Failed to fetch agent commissions:', error);
    return res.status(500).json({ error: 'Failed to fetch agent commissions' });
  }
});

router.get('/report', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const month = Number(req.query.month);
    const year = Number(req.query.year);

    if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 2000) {
      return res.status(400).json({ error: 'Valid month and year are required' });
    }

    const [rows] = await pool.execute(
      `SELECT
        u.id AS agent_id,
        u.name AS agent_name,
        COUNT(*) AS sold_count,
        SUM(COALESCE(p.sale_price, 0)) AS total_sales,
        AVG(COALESCE(p.commission_rate, ?)) AS avg_rate
       FROM properties p
       INNER JOIN users u ON u.id = p.sold_by_agent_id
       WHERE p.status = 'sold'
         AND p.sold_at IS NOT NULL
         AND MONTH(p.sold_at) = ?
         AND YEAR(p.sold_at) = ?
       GROUP BY u.id, u.name
       ORDER BY total_sales DESC`,
      [await getDefaultRate(), month, year]
    );

    const normalized = rows.map((row) => {
      const totalSales = Number(row.total_sales || 0);
      const avgRate = Number(row.avg_rate || 0);
      return {
        agentId: row.agent_id,
        agentName: row.agent_name,
        soldCount: Number(row.sold_count || 0),
        totalSales,
        averageRate: avgRate,
        totalCommission: Number(((totalSales * avgRate) / 100).toFixed(2))
      };
    });

    return res.json({ data: normalized, month, year });
  } catch (error) {
    console.error('Failed to generate commission report:', error);
    return res.status(500).json({ error: 'Failed to generate commission report' });
  }
});

router.patch('/property/:propertyId', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const commissionRate = req.body.commissionRate !== undefined ? Number(req.body.commissionRate) : null;
    const markPaid = req.body.markPaid === true;

    if (commissionRate !== null && (!Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 100)) {
      return res.status(400).json({ error: 'commissionRate must be between 0 and 100' });
    }

    const [rows] = await pool.execute(
      `SELECT id, status FROM properties WHERE id = ? LIMIT 1`,
      [req.params.propertyId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    if (rows[0].status !== 'sold') {
      return res.status(400).json({ error: 'Commission updates apply only to sold properties' });
    }

    const fields = [];
    const values = [];

    if (commissionRate !== null) {
      fields.push('commission_rate = ?');
      values.push(commissionRate);
    }

    if (markPaid) {
      fields.push('commission_paid_at = NOW()');
      fields.push('commission_paid_by = ?');
      values.push(req.user.id);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No changes provided' });
    }

    values.push(req.params.propertyId);
    await pool.execute(`UPDATE properties SET ${fields.join(', ')} WHERE id = ?`, values);

    return res.json({ message: 'Commission updated successfully' });
  } catch (error) {
    console.error('Failed to update property commission:', error);
    return res.status(500).json({ error: 'Failed to update commission' });
  }
});

module.exports = router;
