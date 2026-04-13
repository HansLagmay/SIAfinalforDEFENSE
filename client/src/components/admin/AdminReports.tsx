import { useState, useEffect } from 'react';
import { usersAPI } from '../../services/api';

interface AgentMetrics {
  agentId: string;
  agentName: string;
  totalInquiries: number;
  activeInquiries: number;
  successfulInquiries: number;
  conversionRate: number;
  propertiesSold: number;
  totalSalesValue: number;
  averageRating: number;
  feedbackCount: number;
}

const AdminReports = () => {
  const [agentMetrics, setAgentMetrics] = useState<AgentMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAgentMetrics();
  }, []);

  const loadAgentMetrics = async () => {
    setLoading(true);
    try {
      const performanceRes = await usersAPI.getAgentPerformance();
      const rows = performanceRes.data?.data || [];

      const metrics = rows.map((row: any) => {
        const soldProperties = Array.isArray(row.soldProperties) ? row.soldProperties : [];
        const totalSalesValue = soldProperties.reduce((sum: number, p: any) => sum + Number(p.sale_price || 0), 0);

        return {
          agentId: row.agentId,
          agentName: row.agentName,
          totalInquiries: Number(row.totalInquiries || 0),
          activeInquiries: Math.max(0, Number(row.totalInquiries || 0) - Number(row.closedInquiries || 0)),
          successfulInquiries: Number(row.successfulInquiries || 0),
          conversionRate: Number(row.conversionRate || 0),
          propertiesSold: soldProperties.length,
          totalSalesValue,
          averageRating: Number(row.averageRating || 0),
          feedbackCount: Number(row.feedbackCount || 0)
        };
      });
      
      setAgentMetrics(metrics);
    } catch (error: any) {
      console.error('Failed to load agent metrics:', error);
      alert(`Failed to load agent metrics: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8">Loading agent performance...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Agent Performance</h1>
          <p className="text-gray-600 mt-2">Track agent metrics, sales, and conversion rates</p>
        </div>
        <button
          onClick={loadAgentMetrics}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold shadow-md transition flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {agentMetrics.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            No agent metrics available.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Inquiries
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Active
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Successful
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Conversion Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Properties Sold
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Sales Value
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {agentMetrics.map((metric) => (
                <tr key={metric.agentId}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {metric.agentName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {metric.totalInquiries}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {metric.activeInquiries}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {metric.successfulInquiries}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      metric.conversionRate >= 50 ? 'bg-green-100 text-green-800' :
                      metric.conversionRate >= 30 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {metric.conversionRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {metric.feedbackCount > 0 ? `${metric.averageRating.toFixed(2)} / 5 (${metric.feedbackCount})` : 'No ratings'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {metric.propertiesSold}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    ₱{metric.totalSalesValue.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminReports;
