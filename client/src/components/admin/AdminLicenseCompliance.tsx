import { useEffect, useState } from 'react';
import { usersAPI } from '../../services/api';

interface LicenseRow {
  id: string;
  name: string;
  email: string;
  license_number?: string;
  license_type?: string;
  license_expiry_date?: string;
  license_verified?: number;
  license_status?: string;
  days_to_expiry?: number;
}

const AdminLicenseCompliance = () => {
  const [rows, setRows] = useState<LicenseRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const response = await usersAPI.getLicenseReport();
      setRows(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load license report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const downloadLicense = async (agentId: string, name: string) => {
    try {
      const response = await usersAPI.downloadAgentLicense(agentId);
      const blob = new Blob([response.data]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}-license.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download license:', error);
      alert('No demo license file found for this agent yet.');
    }
  };

  if (loading) {
    return <div className="p-8">Loading license compliance report...</div>;
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">License Compliance</h1>
          <p className="text-gray-600 mt-2">Agents with expired and expiring licenses</p>
        </div>
        <button onClick={load} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Refresh</button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-6 text-gray-600">No license records found.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agent</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">License</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expiry</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Left</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">License File</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 text-sm text-gray-900">{row.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{row.license_number || '-'} ({row.license_type || '-'})</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{row.license_expiry_date ? new Date(row.license_expiry_date).toLocaleDateString() : '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{row.days_to_expiry ?? '-'}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      row.license_status === 'expired' ? 'bg-red-100 text-red-700' :
                      row.license_status === 'active' ? 'bg-green-100 text-green-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {row.license_status || 'pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => downloadLicense(row.id, row.name)}
                      className="px-2 py-1 border rounded text-xs hover:bg-gray-100"
                    >
                      Download
                    </button>
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

export default AdminLicenseCompliance;
