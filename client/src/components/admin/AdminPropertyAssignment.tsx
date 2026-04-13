import React, { useState, useEffect } from 'react';
import { propertiesAPI, usersAPI } from '../../services/api';

interface Property {
  id: string;
  title: string;
  type: string;
  price: number;
  location: string;
  primaryAgentId: string | null;
  primaryAgentName: string | null;
  activeInquiryCount: number;
  canReassign: boolean;
  createdAt: string;
}

interface Agent {
  id: string;
  name: string;
  specialization?: string;
}

export const AdminPropertyAssignment: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [reassigning, setReassigning] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<{ [key: string]: string }>({});
  const [reason, setReason] = useState<{ [key: string]: string }>({});
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [propsRes, agentsRes] = await Promise.all([
        propertiesAPI.getAssignmentStatus(),
        usersAPI.getAgents()
      ]);

      const propsData = propsRes.data?.data || [];
      const serverAgents = propsRes.data?.agents || [];
      const fallbackAgents = agentsRes.data || [];

      setProperties(propsData);
      setAgents(
        (serverAgents.length > 0 ? serverAgents : fallbackAgents).map((agent: Agent) => ({
          id: agent.id,
          name: agent.name,
          specialization: agent.specialization || 'General'
        }))
      );
    } catch (error) {
      console.error('Failed to load data:', error);
      setMessage({ type: 'error', text: 'Failed to load properties or agents' });
    } finally {
      setLoading(false);
    }
  };

  const handleReassign = async (propertyId: string) => {
    const newAgentId = selectedAgent[propertyId];
    const reassignReason = reason[propertyId] || 'Admin reassignment';

    if (!newAgentId) {
      setMessage({ type: 'error', text: 'Please select an agent' });
      return;
    }

    try {
      setReassigning(propertyId);
      const res = await propertiesAPI.assignAgent(propertyId, {
        newAgentId,
        reason: reassignReason
      });

      setMessage({ type: 'success', text: `Property assigned to ${res.data.newAgentName}` });
      setSelectedAgent({ ...selectedAgent, [propertyId]: '' });
      setReason({ ...reason, [propertyId]: '' });
      loadData();
    } catch (error) {
      console.error('Error reassigning property:', error);
      setMessage({ type: 'error', text: 'Network error during reassignment' });
    } finally {
      setReassigning(null);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Property Agent Assignment</h2>

      {message && (
        <div
          className={`mb-4 p-4 rounded ${
            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="text-left p-3 font-semibold">Property</th>
              <th className="text-left p-3 font-semibold">Type</th>
              <th className="text-left p-3 font-semibold">Location</th>
              <th className="text-left p-3 font-semibold">Current Agent</th>
              <th className="text-left p-3 font-semibold">Active Inquiries</th>
              <th className="text-left p-3 font-semibold">Status</th>
              <th className="text-left p-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody>
            {properties.map((prop) => (
              <tr key={prop.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{prop.title}</td>
                <td className="p-3">{prop.type}</td>
                <td className="p-3">{prop.location}</td>
                <td className="p-3">
                  {prop.primaryAgentName || (
                    <span className="text-gray-400 italic">Unassigned</span>
                  )}
                </td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-sm ${
                      prop.activeInquiryCount > 0
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {prop.activeInquiryCount}
                  </span>
                </td>
                <td className="p-3">
                  {prop.canReassign ? (
                    <span className="text-green-600 font-semibold">Can reassign</span>
                  ) : (
                    <span className="text-red-600 font-semibold">Locked (active inquiries)</span>
                  )}
                </td>
                <td className="p-3">
                  {prop.canReassign ? (
                    <div className="flex gap-2 flex-wrap">
                      <select
                        className="border rounded px-2 py-1 text-sm"
                        value={selectedAgent[prop.id] || ''}
                        onChange={(e) =>
                          setSelectedAgent({ ...selectedAgent, [prop.id]: e.target.value })
                        }
                      >
                        <option value="">Select agent...</option>
                        {agents
                          .filter((a) => a.id !== prop.primaryAgentId)
                          .sort((a, b) => {
                            const aMatch = (a.specialization || '').toLowerCase() === prop.type.toLowerCase() ? 0 : 1;
                            const bMatch = (b.specialization || '').toLowerCase() === prop.type.toLowerCase() ? 0 : 1;
                            return aMatch - bMatch || a.name.localeCompare(b.name);
                          })
                          .map((agent) => (
                            <option key={agent.id} value={agent.id}>
                              {agent.name} ({agent.specialization || 'General'})
                            </option>
                          ))}
                      </select>
                      <button
                        onClick={() => handleReassign(prop.id)}
                        disabled={!selectedAgent[prop.id] || reassigning === prop.id}
                        className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                      >
                        {reassigning === prop.id ? 'Assigning...' : 'Assign'}
                      </button>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">Not available</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold text-blue-900 mb-2">Assignment Rules</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✓ Only properties with zero active inquiries can be reassigned</li>
          <li>✓ All agent inquiries for a property are handled by that property's assigned agent</li>
          <li>✓ Customers can inquire about any property; their inquiry goes to that property's assigned agent</li>
          <li>✓ Agent reassignment is logged for audit purposes</li>
        </ul>
      </div>
    </div>
  );
};
