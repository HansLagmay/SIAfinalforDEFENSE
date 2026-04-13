import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerNavbar from '../components/customer/CustomerNavbar';
import { customerFeaturesAPI } from '../services/api';
import type { Property } from '../types';
import { formatPrice, getPropertyImage } from '../utils/formatters';

const CustomerFavorites = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = async () => {
    const token = localStorage.getItem('customer_token');
    if (!token) {
      navigate('/');
      return;
    }

    try {
      const response = await customerFeaturesAPI.getFavorites(token);
      setFavorites(response.data?.data || []);
    } catch (error) {
      console.error('Failed to load favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const removeFavorite = async (propertyId: string) => {
    const token = localStorage.getItem('customer_token');
    if (!token) return;

    try {
      await customerFeaturesAPI.removeFavorite(token, propertyId);
      setFavorites((prev) => prev.filter((p) => p.id !== propertyId));
    } catch (error) {
      console.error('Failed to remove favorite:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Favorites</h1>
        <p className="text-gray-600 mb-6">Properties you saved for quick access</p>

        {loading ? (
          <div className="text-center py-12 text-gray-600">Loading favorites...</div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow text-gray-600">
            You have no favorites yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {favorites.map((property) => (
              <div key={property.id} className="bg-white rounded-xl shadow overflow-hidden">
                <img
                  src={getPropertyImage(property.imageUrl, property.type)}
                  alt={property.title}
                  className="w-full h-52 object-cover"
                />
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900">{property.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{property.location}</p>
                  <p className="text-xl font-bold text-blue-700 mt-2">{formatPrice(property.price)}</p>
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => navigate(`/?property=${property.id}`)}
                      className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      View
                    </button>
                    <button
                      onClick={() => removeFavorite(property.id)}
                      className="px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerFavorites;
