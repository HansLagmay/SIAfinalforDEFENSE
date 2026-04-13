import { useEffect, useState } from 'react';
import type { Property } from '../../types';
import { documentsAPI, propertiesAPI } from '../../services/api';
import ImageGallery from './ImageGallery';
import { formatPrice, getPropertyShowcaseImages } from '../../utils/formatters';

interface PropertyDetailModalProps {
  property: Property;
  onClose: () => void;
  onInquire: () => void;
}

const PropertyDetailModal = ({ property, onClose, onInquire }: PropertyDetailModalProps) => {
  const [documents, setDocuments] = useState<Array<{ id: string; file_name: string; document_type: string }>>([]);

  // Increment view count when modal opens
  useEffect(() => {
    const incrementViewCount = async () => {
      try {
        await propertiesAPI.update(property.id, {
          viewCount: (property.viewCount || 0) + 1,
          lastViewedAt: new Date().toISOString(),
          viewHistory: [
            ...(property.viewHistory || []),
            {
              viewedAt: new Date().toISOString()
            }
          ]
        });
      } catch (error) {
        console.error('Failed to increment view count:', error);
      }
    };
    
    incrementViewCount();
  }, [property.id]);

  useEffect(() => {
    const loadDocuments = async () => {
      const customerToken = localStorage.getItem('customer_token');
      if (!customerToken) {
        setDocuments([]);
        return;
      }

      try {
        const response = await documentsAPI.listByPropertyWithToken(property.id, customerToken);
        setDocuments(response.data?.data || []);
      } catch (error) {
        console.error('Failed to load property documents:', error);
        setDocuments([]);
      }
    };

    loadDocuments();
  }, [property.id]);

  const downloadDocument = async (id: string, fileName: string) => {
    const customerToken = localStorage.getItem('customer_token');
    if (!customerToken) return;

    try {
      const response = await documentsAPI.downloadWithToken(id, customerToken);
      const blob = new Blob([response.data]);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download document:', error);
    }
  };

  // Calculate days on market
  const daysOnMarket = () => {
    const created = new Date(property.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Build a richer gallery even when only one image exists.
  const sourceImages = property.images && property.images.length > 0
    ? property.images
    : [property.imageUrl];
  const allImages = getPropertyShowcaseImages(sourceImages, property.type, property.id || property.title, 4);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-glow animate-scale-in">
        <div className="relative">
          <ImageGallery images={allImages} title={property.title} />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 hover:bg-white shadow-elevated z-10 transition-all hover:scale-110"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-bold text-gray-900">{property.title}</h2>
            <div className="flex gap-2">
              <span className="badge badge-primary">
                {property.type}
              </span>
              {property.status === 'reserved' && (
                <span className="badge bg-orange-500 text-white shadow-lg">
                  ⏱️ Unavailable
                </span>
              )}
              {daysOnMarket() <= 7 && (
                <span className="badge badge-danger animate-pulse">
                  🔥 New Listing
                </span>
              )}
              {property.hasVerifiedDocuments && (
                <span className="badge bg-green-600 text-white">✅ Document Verified</span>
              )}
              {daysOnMarket() > 90 && (
                <span className="badge badge-warning text-xs">
                  ⏳ {daysOnMarket()} days on market
                </span>
              )}
            </div>
          </div>

          <p className="text-gray-600 mb-4 flex items-center text-lg">
            <svg className="w-5 h-5 mr-2 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            {property.location}
          </p>

          <div className="flex items-center justify-between mb-6 p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl border border-primary-100">
            <p className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              {formatPrice(property.price)}
            </p>
            <div className="text-right text-sm text-gray-600">
              <p className="flex items-center justify-end gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                {property.viewCount || 0} views
              </p>
              <p className="flex items-center justify-end gap-1">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
                Listed {daysOnMarket()} days ago
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-gradient-to-br from-primary-50 to-white rounded-xl border border-primary-100 hover:shadow-soft transition-shadow">
              <div className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">{property.bedrooms}</div>
              <div className="text-gray-600 font-medium">Bedrooms</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-secondary-50 to-white rounded-xl border border-secondary-100 hover:shadow-soft transition-shadow">
              <div className="text-3xl font-bold bg-gradient-to-r from-secondary-600 to-primary-600 bg-clip-text text-transparent">{property.bathrooms}</div>
              <div className="text-gray-600 font-medium">Bathrooms</div>
            </div>
            <div className="text-center p-4 bg-gradient-to-br from-primary-50 to-white rounded-xl border border-primary-100 hover:shadow-soft transition-shadow">
              <div className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">{property.area}</div>
              <div className="text-gray-600 font-medium">sqm</div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
              </svg>
              Description
            </h3>
            <p className="text-gray-600 leading-relaxed">{property.description}</p>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Features
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {property.features.map((feature, index) => (
                <div key={index} className="flex items-center text-gray-700 p-2 rounded-lg hover:bg-success-50 transition-colors">
                  <svg className="w-5 h-5 mr-2 text-success-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {documents.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Compliance Documents</h3>
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                    <div>
                      <p className="font-medium text-gray-800">{doc.file_name}</p>
                      <p className="text-xs text-gray-500">{doc.document_type}</p>
                    </div>
                    <button
                      onClick={() => downloadDocument(doc.id, doc.file_name)}
                      className="px-3 py-1 border rounded text-sm hover:bg-gray-100"
                    >
                      Download
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="btn btn-outline flex-1 py-3"
            >
              Close
            </button>
            <button
              onClick={onInquire}
              className="btn btn-success flex-1 py-3 shadow-elevated hover:shadow-glow"
              title="Send your inquiry"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Send Inquiry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetailModal;
