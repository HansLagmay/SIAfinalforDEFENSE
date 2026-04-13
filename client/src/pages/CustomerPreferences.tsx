import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerNavbar from '../components/customer/CustomerNavbar';
import { customerFeaturesAPI } from '../services/api';

const CustomerPreferences = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const availablePropertyTypes = ['House', 'Condo', 'Lot', 'Commercial'];
  const availableAmenities = ['Parking', 'Garden', 'Pool', 'Gym', 'Balcony', 'Air Conditioning', 'Modern Kitchen', 'CCTV', 'Security', 'High Ceiling'];

  const [form, setForm] = useState({
    preferredLocations: '',
    propertyTypes: [] as string[],
    minPrice: '',
    maxPrice: '',
    minArea: '',
    maxArea: '',
    preferredBedrooms: '',
    preferredBathrooms: '',
    amenities: [] as string[]
  });

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem('customer_token');
      if (!token) {
        navigate('/');
        return;
      }

      try {
        const response = await customerFeaturesAPI.getPreferences(token);
        const data = response.data || {};

        setForm({
          preferredLocations: (data.preferredLocations || []).join(', '),
          propertyTypes: Array.isArray(data.propertyTypes) ? data.propertyTypes : [],
          minPrice: data.minPrice ? String(data.minPrice) : '',
          maxPrice: data.maxPrice ? String(data.maxPrice) : '',
          minArea: data.minArea ? String(data.minArea) : '',
          maxArea: data.maxArea ? String(data.maxArea) : '',
          preferredBedrooms: data.preferredBedrooms ? String(data.preferredBedrooms) : '',
          preferredBathrooms: data.preferredBathrooms ? String(data.preferredBathrooms) : '',
          amenities: Array.isArray(data.amenities) ? data.amenities : []
        });
      } catch (error) {
        console.error('Failed to load preferences:', error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('customer_token');
    if (!token) return;

    setSaving(true);
    setMessage('');

    try {
      await customerFeaturesAPI.savePreferences(token, {
        preferredLocations: form.preferredLocations.split(',').map((v) => v.trim()).filter(Boolean),
        propertyTypes: form.propertyTypes,
        minPrice: form.minPrice ? Number(form.minPrice) : null,
        maxPrice: form.maxPrice ? Number(form.maxPrice) : null,
        minArea: form.minArea ? Number(form.minArea) : null,
        maxArea: form.maxArea ? Number(form.maxArea) : null,
        preferredBedrooms: form.preferredBedrooms ? Number(form.preferredBedrooms) : null,
        preferredBathrooms: form.preferredBathrooms ? Number(form.preferredBathrooms) : null,
        amenities: form.amenities
      });

      setMessage('Preferences saved successfully.');
    } catch (error) {
      console.error('Failed to save preferences:', error);
      setMessage('Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavbar />
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Preferences</h1>
        <p className="text-gray-600 mb-6">Store your preferences for personalized recommendations</p>

        {loading ? (
          <div className="text-gray-600">Loading preferences...</div>
        ) : (
          <form onSubmit={submit} className="bg-white rounded-xl shadow p-6 space-y-4">
            <input className="w-full border rounded-lg px-4 py-3" placeholder="Preferred locations (comma separated)" value={form.preferredLocations} onChange={(e) => setForm({ ...form, preferredLocations: e.target.value })} />
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Property Types *</label>
              <div className="grid grid-cols-2 gap-3">
                {availablePropertyTypes.map(type => (
                  <label key={type} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.propertyTypes.includes(type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setForm({ ...form, propertyTypes: [...form.propertyTypes, type] });
                        } else {
                          setForm({ ...form, propertyTypes: form.propertyTypes.filter(t => t !== type) });
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="number" className="border rounded-lg px-4 py-3" placeholder="Min price" value={form.minPrice} onChange={(e) => setForm({ ...form, minPrice: e.target.value })} />
              <input type="number" className="border rounded-lg px-4 py-3" placeholder="Max price" value={form.maxPrice} onChange={(e) => setForm({ ...form, maxPrice: e.target.value })} />
              <input type="number" className="border rounded-lg px-4 py-3" placeholder="Min area" value={form.minArea} onChange={(e) => setForm({ ...form, minArea: e.target.value })} />
              <input type="number" className="border rounded-lg px-4 py-3" placeholder="Max area" value={form.maxArea} onChange={(e) => setForm({ ...form, maxArea: e.target.value })} />
              <input type="number" className="border rounded-lg px-4 py-3" placeholder="Preferred bedrooms" value={form.preferredBedrooms} onChange={(e) => setForm({ ...form, preferredBedrooms: e.target.value })} />
              <input type="number" className="border rounded-lg px-4 py-3" placeholder="Preferred bathrooms" value={form.preferredBathrooms} onChange={(e) => setForm({ ...form, preferredBathrooms: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Amenities</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availableAmenities.map(amenity => (
                  <label key={amenity} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.amenities.includes(amenity)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setForm({ ...form, amenities: [...form.amenities, amenity] });
                        } else {
                          setForm({ ...form, amenities: form.amenities.filter(a => a !== amenity) });
                        }
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>

            {message && <p className="text-sm text-blue-700">{message}</p>}

            <button type="submit" disabled={saving} className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CustomerPreferences;
