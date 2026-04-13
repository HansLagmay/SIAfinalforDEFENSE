import { useEffect, useMemo, useState } from 'react';
import { commissionsAPI } from '../../services/api';

interface CommissionRow {
  propertyId: string;
  propertyTitle: string;
  propertyLocation: string;
  soldAt: string;
  salePrice: number;
  commissionRate: number;
  commissionAmount: number;
  commissionStatus: 'pending' | 'paid';
  agentId: string;
  agentName: string;
}

const AdminCommissions = () => {
  const [rows, setRows] = useState<CommissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [defaultRate, setDefaultRate] = useState(5);
  const [saving, setSaving] = useState(false);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);
  const [editingRates, setEditingRates] = useState<Record<string, number>>({});
  const [monthlyTrend, setMonthlyTrend] = useState<Array<{ month: number; totalCommission: number }>>([]);

  const load = async () => {
    setLoading(true);
    try {
      const [listRes, settingsRes] = await Promise.all([
        commissionsAPI.getAll(),
        commissionsAPI.getSettings()
      ]);

      const year = new Date().getFullYear();
      const monthPromises = Array.from({ length: 12 }, (_, idx) => commissionsAPI.getReport(idx + 1, year));
      const monthResults = await Promise.all(monthPromises);
      const trend = monthResults.map((res, idx) => {
        const totalCommission = (res.data?.data || []).reduce((sum: number, row: any) => sum + Number(row.totalCommission || 0), 0);
        return { month: idx + 1, totalCommission };
      });

      setRows(listRes.data?.data || []);
      setDefaultRate(Number(settingsRes.data?.defaultRate || 5));
      setMonthlyTrend(trend);
    } catch (error) {
      console.error('Failed to load commissions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const map: Record<string, { agentName: string; items: CommissionRow[] }> = {};
    rows.forEach((row) => {
      if (!map[row.agentId]) {
        map[row.agentId] = { agentName: row.agentName, items: [] };
      }
      map[row.agentId].items.push(row);
    });
    return map;
  }, [rows]);

  const saveRate = async () => {
    setSaving(true);
    try {
      await commissionsAPI.updateSettings(defaultRate);
      await load();
    } catch (error) {
      console.error('Failed to update default rate:', error);
      alert('Failed to update default commission rate');
    } finally {
      setSaving(false);
    }
  };

  const savePropertyCommission = async (propertyId: string, markPaid?: boolean) => {
    const rate = editingRates[propertyId];

    try {
      await commissionsAPI.updatePropertyCommission(propertyId, {
        commissionRate: Number.isFinite(rate) ? rate : undefined,
        markPaid
      });
      await load();
    } catch (error) {
      console.error('Failed to update property commission:', error);
      alert('Failed to update property commission');
    }
  };

  if (loading) {
    return <div className="p-8">Loading commissions...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Payroll and Commissions</h1>
          <p className="text-gray-600 mt-2">Track sold properties, agent earnings, and commission settings</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Default Commission Rate</h2>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={0}
            max={100}
            step="0.1"
            value={defaultRate}
            onChange={(e) => setDefaultRate(Number(e.target.value || 0))}
            className="w-32 px-3 py-2 border rounded-lg"
          />
          <span className="text-gray-600">%</span>
          <button onClick={saveRate} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">12-Month Commission Trend</h2>
        <div className="space-y-2">
          {monthlyTrend.map((m) => {
            const max = Math.max(...monthlyTrend.map((x) => x.totalCommission), 1);
            const width = Math.max(4, Math.round((m.totalCommission / max) * 100));
            return (
              <div key={m.month} className="flex items-center gap-3">
                <span className="w-16 text-sm text-gray-600">Month {m.month}</span>
                <div className="flex-1 bg-gray-100 rounded h-3 overflow-hidden">
                  <div className="h-full bg-blue-600" style={{ width: `${width}%` }} />
                </div>
                <span className="w-32 text-right text-sm font-medium text-gray-800">₱{m.totalCommission.toLocaleString()}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-gray-600">No sold-property commission data yet.</div>
        ) : Object.entries(grouped).map(([agentId, group]) => {
          const totalSales = group.items.reduce((sum, r) => sum + Number(r.salePrice || 0), 0);
          const totalCommission = group.items.reduce((sum, r) => sum + Number(r.commissionAmount || 0), 0);
          const isExpanded = expandedAgent === agentId;

          return (
            <div key={agentId} className="bg-white rounded-lg shadow overflow-hidden">
              <button
                onClick={() => setExpandedAgent(isExpanded ? null : agentId)}
                className="w-full p-5 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-gray-900">{group.agentName}</h3>
                  <p className="text-sm text-gray-600">{group.items.length} sold properties</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">Sales: ₱{totalSales.toLocaleString()}</p>
                  <p className="font-semibold text-green-700">Commission: ₱{totalCommission.toLocaleString()}</p>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t bg-gray-50 p-4 space-y-3">
                  {group.items.map((row) => (
                    <div key={row.propertyId} className="bg-white border rounded-lg p-3 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-gray-900">{row.propertyTitle}</p>
                        <p className="text-xs text-gray-500">{row.propertyLocation}</p>
                        <p className="text-xs text-gray-500">{row.soldAt ? new Date(row.soldAt).toLocaleDateString() : '-'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-700">Sale: ₱{Number(row.salePrice || 0).toLocaleString()}</p>
                        <div className="flex items-center justify-end gap-2 my-1">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step="0.1"
                            value={editingRates[row.propertyId] ?? Number(row.commissionRate || 0)}
                            onChange={(e) => setEditingRates((prev) => ({ ...prev, [row.propertyId]: Number(e.target.value || 0) }))}
                            className="w-24 px-2 py-1 border rounded text-sm"
                          />
                          <button
                            onClick={() => savePropertyCommission(row.propertyId)}
                            className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                          >
                            Save
                          </button>
                        </div>
                        <p className="font-semibold text-green-700">₱{Number(row.commissionAmount || 0).toLocaleString()}</p>
                        <button
                          onClick={() => savePropertyCommission(row.propertyId, true)}
                          disabled={row.commissionStatus === 'paid'}
                          className="mt-1 px-2 py-1 text-xs border rounded disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {row.commissionStatus === 'paid' ? 'Paid' : 'Mark Paid'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminCommissions;
