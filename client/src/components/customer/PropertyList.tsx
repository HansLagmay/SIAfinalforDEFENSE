import type { Property } from '../../types';
import { formatPrice, getPropertyImage } from '../../utils/formatters';

interface PropertyListProps {
  properties: Property[];
  onViewDetails: (property: Property) => void;
  onInquire: (property: Property) => void;
  favoriteIds?: string[];
  onToggleFavorite?: (property: Property) => void;
}

const PropertyList = ({ properties, onViewDetails, onInquire, favoriteIds = [], onToggleFavorite }: PropertyListProps) => {
  // Calculate days on market
  const daysOnMarket = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (properties.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-xl text-gray-600">No properties found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
      {properties.map((property, index) => {
        const primaryImage = property.images && property.images.length > 0 ? property.images[0] : property.imageUrl;

        return (
        <div
          key={property.id}
          className="card-interactive overflow-hidden"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="relative h-56 bg-gradient-to-br from-gray-200 to-gray-300 overflow-hidden group">
            <img
              src={getPropertyImage(primaryImage, property.type, property.id)}
              alt={property.title}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = getPropertyImage(undefined, property.type, property.id);
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              {onToggleFavorite && (
                <button
                  type="button"
                  onClick={() => onToggleFavorite(property)}
                  className="bg-white/90 hover:bg-white text-red-500 px-2 py-1 rounded-full shadow-lg"
                  title={favoriteIds.includes(property.id) ? 'Remove from favorites' : 'Add to favorites'}
                >
                  {favoriteIds.includes(property.id) ? '❤' : '♡'}
                </button>
              )}
              <span className="badge bg-white/90 backdrop-blur-sm text-gray-900 shadow-lg capitalize">
                {property.type}
              </span>
              {property.hasVerifiedDocuments && (
                <span className="badge bg-green-600 text-white shadow-lg text-xs">
                  Document Verified
                </span>
              )}
              {property.status === 'reserved' && (
                <span className="badge bg-orange-500 text-white shadow-lg">
                  ⏱️ Unavailable
                </span>
              )}
              {daysOnMarket(property.createdAt) <= 7 && (
                <span className="badge bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg animate-scale-in">
                  🔥 New!
                </span>
              )}
            </div>
            {daysOnMarket(property.createdAt) > 90 && (
              <div className="absolute bottom-4 left-4">
                <span className="badge bg-yellow-500 text-white shadow-md text-xs">
                  ⏳ {daysOnMarket(property.createdAt)} days
                </span>
              </div>
            )}
          </div>

          <div className="p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-primary-600 transition-colors">
              {property.title}
            </h3>
            
            <p className="text-gray-600 text-sm mb-3 flex items-center gap-1.5">
              <svg className="w-4 h-4 text-primary-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span className="line-clamp-1">{property.location}</span>
            </p>
            
            <p className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-4">
              {formatPrice(property.price)}
            </p>

            <div className="flex items-center gap-4 text-gray-700 text-sm mb-5 pb-5 border-b border-gray-100">
              {property.bedrooms > 0 && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                  </svg>
                  <span className="font-medium">{property.bedrooms}</span>
                </span>
              )}
              {property.bathrooms > 0 && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{property.bathrooms}</span>
                </span>
              )}
              {property.area && (
                <span className="flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{property.area} m²</span>
                </span>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => onViewDetails(property)}
                className="btn btn-primary flex-1"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  View
                </span>
              </button>
              <button
                onClick={() => onInquire(property)}
                className="btn btn-success flex-1"
                title="Submit inquiry for this property"
              >
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Inquire
                </span>
              </button>
            </div>
          </div>
        </div>
        );
      })}
    </div>
  );
};

export default PropertyList;
