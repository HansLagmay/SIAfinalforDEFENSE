import { useState, useEffect } from 'react';
import PropertyList from '../components/customer/PropertyList';
import PropertyDetailModal from '../components/customer/PropertyDetailModal';
import InquiryModal from '../components/customer/InquiryModal';
import CustomerNavbar from '../components/customer/CustomerNavbar';
import type { Property } from '../types';
import { customerFeaturesAPI, propertiesAPI } from '../services/api';

const CustomerPortal = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [typeDropdown, setTypeDropdown] = useState('');
  const [city, setCity] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [minArea, setMinArea] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'area-desc'>('newest');
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [recommendedProperties, setRecommendedProperties] = useState<Property[]>([]);

  useEffect(() => {
    loadProperties();
  }, []);

  useEffect(() => {
    loadFavorites();
    loadRecommendations();
  }, []);

  const normalizeType = (value?: string) => {
    const normalized = (value || '').trim().toLowerCase();
    if (normalized === 'condominium') return 'condo';
    return normalized;
  };

  const typeOptions = Array.from(
    new Set(
      properties
        .map((property) => (property.type || '').trim())
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b));

  const loadProperties = async () => {
    try {
      const response = await propertiesAPI.getAllPaginated(1, 1000);
      const rows = response.data?.data || [];
      setProperties(rows);
    } catch (error) {
      console.error('Failed to load properties:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const loadFavorites = async () => {
    const token = localStorage.getItem('customer_token');
    if (!token) {
      setFavoriteIds([]);
      return;
    }

    try {
      const response = await customerFeaturesAPI.getFavorites(token);
      setFavoriteIds((response.data?.data || []).map((p: Property) => p.id));
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
  };

  const toggleType = (type: string) => {
    setSelectedTypes((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]);
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setTypeDropdown('');
    setCity('');
    setMinPrice('');
    setMaxPrice('');
    setBudgetRange('');
    setBedrooms('');
    setBathrooms('');
    setMinArea('');
    setSortBy('newest');
    setSearchTerm('');
  };

  const handleToggleFavorite = async (property: Property) => {
    const token = localStorage.getItem('customer_token');
    if (!token) {
      alert('Please login first to use favorites.');
      return;
    }

    try {
      if (favoriteIds.includes(property.id)) {
        await customerFeaturesAPI.removeFavorite(token, property.id);
        setFavoriteIds((prev) => prev.filter((id) => id !== property.id));
      } else {
        await customerFeaturesAPI.addFavorite(token, property.id);
        setFavoriteIds((prev) => [...prev, property.id]);
      }
    } catch (error) {
      console.error('Failed to update favorite:', error);
      alert('Failed to update favorites');
    }
  };

  const loadRecommendations = async () => {
    const token = localStorage.getItem('customer_token');
    if (!token) {
      setRecommendedProperties([]);
      return;
    }

    try {
      const [prefsRes, propertiesRes] = await Promise.all([
        customerFeaturesAPI.getPreferences(token),
        propertiesAPI.getAllPaginated(1, 1000)
      ]);

      const prefs = prefsRes.data || {};
      const all = propertiesRes.data?.data || [];

      const locations = Array.isArray(prefs.preferredLocations) ? prefs.preferredLocations : [];
      const types = Array.isArray(prefs.propertyTypes) ? prefs.propertyTypes : [];
      const minPrefPrice = prefs.minPrice ? Number(prefs.minPrice) : null;
      const maxPrefPrice = prefs.maxPrice ? Number(prefs.maxPrice) : null;
      const minPrefArea = prefs.minArea ? Number(prefs.minArea) : null;
      const maxPrefArea = prefs.maxArea ? Number(prefs.maxArea) : null;

      const matches = all.filter((p: Property) => {
        const locationPass = locations.length === 0 || locations.some((loc: string) => (p.location || '').toLowerCase().includes(String(loc).toLowerCase()));
        const typePass = types.length === 0 || types.some((type: string) => normalizeType(type) === normalizeType(p.type));
        const minPricePass = minPrefPrice === null || Number(p.price || 0) >= minPrefPrice;
        const maxPricePass = maxPrefPrice === null || Number(p.price || 0) <= maxPrefPrice;
        const minAreaPass = minPrefArea === null || Number(p.area || 0) >= minPrefArea;
        const maxAreaPass = maxPrefArea === null || Number(p.area || 0) <= maxPrefArea;

        return locationPass && typePass && minPricePass && maxPricePass && minAreaPass && maxAreaPass;
      });

      setRecommendedProperties(matches.slice(0, 6));
    } catch (error) {
      console.error('Failed to load recommendations:', error);
      setRecommendedProperties([]);
    }
  };

  const filteredProperties = [...properties]
    .filter((property) => {
      const title = (property.title || '').toLowerCase();
      const location = (property.location || '').toLowerCase();
      const type = (property.type || '').toLowerCase();
      const featureText = Array.isArray(property.features) ? property.features.join(' ').toLowerCase() : '';
      const normalizedType = normalizeType(property.type);
      const normalizedStatus = (property.status || '').trim().toLowerCase();
      const query = searchTerm.trim().toLowerCase();

      // Customer-facing status guard.
      const isAvailableToView = ['available', 'for-sale', 'for sale'].includes(normalizedStatus);
      if (!isAvailableToView) return false;

      const matchesSearch = !query || title.includes(query) || location.includes(query) || type.includes(query) || featureText.includes(query);
      const matchesTypePills = selectedTypes.length === 0 || selectedTypes.some((t) => normalizedType === normalizeType(t));
      const matchesTypeDropdown = !typeDropdown || normalizedType === normalizeType(typeDropdown);
      const matchesCity = !city || location.includes(city.toLowerCase());
      const matchesMinPrice = !minPrice || Number(property.price || 0) >= Number(minPrice);
      const matchesMaxPrice = !maxPrice || Number(property.price || 0) <= Number(maxPrice);
      const matchesBed = !bedrooms || (Number(bedrooms) >= 5 ? Number(property.bedrooms || 0) >= 5 : Number(property.bedrooms || 0) === Number(bedrooms));
      const matchesBath = !bathrooms || (Number(bathrooms) >= 5 ? Number(property.bathrooms || 0) >= 5 : Number(property.bathrooms || 0) === Number(bathrooms));
      const matchesMinArea = !minArea || Number(property.area || 0) >= Number(minArea);

      let matchesBudgetRange = true;
      if (budgetRange === 'starter') matchesBudgetRange = Number(property.price || 0) <= 3000000;
      if (budgetRange === 'mid') matchesBudgetRange = Number(property.price || 0) > 3000000 && Number(property.price || 0) <= 8000000;
      if (budgetRange === 'premium') matchesBudgetRange = Number(property.price || 0) > 8000000;

      return matchesSearch && matchesTypePills && matchesTypeDropdown && matchesCity && matchesMinPrice && matchesMaxPrice && matchesBed && matchesBath && matchesMinArea && matchesBudgetRange;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return Number(a.price || 0) - Number(b.price || 0);
      if (sortBy === 'price-desc') return Number(b.price || 0) - Number(a.price || 0);
      if (sortBy === 'area-desc') return Number(b.area || 0) - Number(a.area || 0);
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <CustomerNavbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Find Your Dream Property
          </h1>
          <p className="text-xl text-gray-600">
            Browse our collection of premium properties
          </p>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">{filteredProperties.length} properties found</p>
          <button onClick={clearFilters} className="text-sm text-blue-600 hover:text-blue-700 font-semibold">Clear All Filters</button>
        </div>

        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search by title, location, type, or features..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select value={typeDropdown} onChange={(e) => setTypeDropdown(e.target.value)} className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">All Property Types</option>
            {typeOptions.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="Min Price" type="number" className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="Max Price" type="number" className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <select value={budgetRange} onChange={(e) => setBudgetRange(e.target.value)} className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">Any Budget</option>
            <option value="starter">Starter (Up to P3M)</option>
            <option value="mid">Mid-range (P3M - P8M)</option>
            <option value="premium">Premium (Above P8M)</option>
          </select>
          <select value={bedrooms} onChange={(e) => setBedrooms(e.target.value)} className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">Bedrooms</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5+</option>
          </select>
          <select value={bathrooms} onChange={(e) => setBathrooms(e.target.value)} className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="">Bathrooms</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5+</option>
          </select>
          <input value={minArea} onChange={(e) => setMinArea(e.target.value)} placeholder="Min Area (sqm)" type="number" className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'newest' | 'price-asc' | 'price-desc' | 'area-desc')} className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            <option value="newest">Sort: Newest</option>
            <option value="price-asc">Sort: Price Low to High</option>
            <option value="price-desc">Sort: Price High to Low</option>
            <option value="area-desc">Sort: Largest Area</option>
          </select>
          <div className="lg:col-span-4 flex flex-wrap gap-2">
            {typeOptions.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => toggleType(type)}
                className={`px-3 py-1 rounded-full border text-sm ${selectedTypes.includes(type) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <section id="how-to-inquire" className="py-16 bg-blue-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">📋 How to Inquire About a Property</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl mb-2">🔍</div>
                <h3 className="text-lg font-semibold mb-2">Browse Properties</h3>
                <p className="text-gray-600">Explore our available properties using search and filters</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl mb-2">📸</div>
                <h3 className="text-lg font-semibold mb-2">View Details</h3>
                <p className="text-gray-600">Click on any property to see full information and photos</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl mb-2">✉️</div>
                <h3 className="text-lg font-semibold mb-2">Submit Inquiry</h3>
                <p className="text-gray-600">Click Inquire and fill out the contact form</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <div className="text-3xl mb-2">📞</div>
                <h3 className="text-lg font-semibold mb-2">Get Contacted</h3>
                <p className="text-gray-600">Our agents will contact you within 24 hours</p>
              </div>
            </div>
            <div className="text-center mt-8">
              <p className="text-gray-700 text-lg">
                Need immediate assistance?
                <a href="tel:+6328123456789" className="text-blue-600 font-semibold ml-2">📞 Call (02) 8123-4567</a>
              </p>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading properties...</p>
          </div>
        ) : (
          <section id="properties">
            {recommendedProperties.length > 0 && (
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Recommended for You</h2>
                <PropertyList
                  properties={recommendedProperties}
                  favoriteIds={favoriteIds}
                  onToggleFavorite={handleToggleFavorite}
                  onViewDetails={(property) => setSelectedProperty(property)}
                  onInquire={(property) => {
                    setSelectedProperty(property);
                    setShowInquiryModal(true);
                  }}
                />
              </div>
            )}
            <PropertyList
              properties={filteredProperties}
              favoriteIds={favoriteIds}
              onToggleFavorite={handleToggleFavorite}
              onViewDetails={(property) => setSelectedProperty(property)}
              onInquire={(property) => {
                setSelectedProperty(property);
                setShowInquiryModal(true);
              }}
            />
          </section>
        )}

        {selectedProperty && !showInquiryModal && (
          <PropertyDetailModal
            property={selectedProperty}
            onClose={() => setSelectedProperty(null)}
            onInquire={() => setShowInquiryModal(true)}
          />
        )}

        {showInquiryModal && selectedProperty && (
          <InquiryModal
            property={selectedProperty}
            onClose={() => {
              setShowInquiryModal(false);
              setSelectedProperty(null);
            }}
          />
        )}
      
        <section id="services" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">🛠️ Our Services</h2>
            <div className="grid md:grid-cols-4 gap-6">
              <div className="bg-gray-50 rounded-lg shadow p-6 text-center">
                <div className="text-3xl mb-2">🏡</div>
                <h3 className="text-lg font-semibold mb-2">Buying Assistance</h3>
                <p className="text-gray-600">End-to-end support from property selection to closing</p>
              </div>
              <div className="bg-gray-50 rounded-lg shadow p-6 text-center">
                <div className="text-3xl mb-2">📈</div>
                <h3 className="text-lg font-semibold mb-2">Selling Support</h3>
                <p className="text-gray-600">Professional marketing to sell your property faster</p>
              </div>
              <div className="bg-gray-50 rounded-lg shadow p-6 text-center">
                <div className="text-3xl mb-2">💳</div>
                <h3 className="text-lg font-semibold mb-2">Mortgage Guidance</h3>
                <p className="text-gray-600">Financing options and bank liaison assistance</p>
              </div>
              <div className="bg-gray-50 rounded-lg shadow p-6 text-center">
                <div className="text-3xl mb-2">🔧</div>
                <h3 className="text-lg font-semibold mb-2">Property Management</h3>
                <p className="text-gray-600">Tenant screening and maintenance coordination</p>
              </div>
            </div>
          </div>
        </section>

        <section id="testimonials" className="py-16 bg-blue-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">💬 What Our Clients Say</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">A</div>
                  <div>
                    <div className="font-semibold">Ana Santos</div>
                    <div className="text-sm text-gray-500">Manila</div>
                  </div>
                </div>
                <p className="text-gray-700">“TES Property helped us find the perfect home. Smooth process and very professional service.”</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">M</div>
                  <div>
                    <div className="font-semibold">Mark Dela Cruz</div>
                    <div className="text-sm text-gray-500">Taguig</div>
                  </div>
                </div>
                <p className="text-gray-700">“Great guidance with financing options. We closed on our condo in record time.”</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">J</div>
                  <div>
                    <div className="font-semibold">Jessa Ramirez</div>
                    <div className="text-sm text-gray-500">Batangas</div>
                  </div>
                </div>
                <p className="text-gray-700">“Highly recommended! The viewing schedule and negotiations were handled perfectly.”</p>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">❓ Frequently Asked Questions</h2>
            <div className="max-w-4xl mx-auto space-y-4">
              <div className="border rounded-lg p-4">
                <div className="font-semibold mb-2">Do I need to create an account to inquire?</div>
                <div className="text-gray-700">Yes. You need a customer account so your inquiry and appointments can be tracked in your dashboard.</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="font-semibold mb-2">How long before an agent contacts me?</div>
                <div className="text-gray-700">Within 24 hours via your preferred contact methods (Email/Phone/SMS).</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="font-semibold mb-2">How do I schedule a property viewing?</div>
                <div className="text-gray-700">After submitting an inquiry, our agents will contact you via SMS, email, or phone to arrange a convenient viewing time.</div>
              </div>
              <div className="border rounded-lg p-4">
                <div className="font-semibold mb-2">Do you offer mortgage assistance?</div>
                <div className="text-gray-700">Yes. We provide guidance and help coordinate with banks.</div>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">🏢 About TES Property</h2>
            <div className="grid md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-semibold mb-4">Who We Are</h3>
                <p className="text-gray-700 leading-relaxed mb-4">
                  TES Property has been serving the Philippine real estate market for over 15 years. We specialize in premium residential and commercial properties across Metro Manila and surrounding areas.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Our team of experienced agents is committed to helping you find your dream property with personalized service and expert guidance.
                </p>
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-4">Our Mission</h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  To provide exceptional real estate services through innovation, integrity, and customer satisfaction.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">15+</div>
                    <div className="text-sm text-gray-600">Years Experience</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">500+</div>
                    <div className="text-sm text-gray-600">Properties Sold</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">1000+</div>
                    <div className="text-sm text-gray-600">Happy Clients</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold">20+</div>
                    <div className="text-sm text-gray-600">Expert Agents</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      
        <section id="contact" className="py-12 md:py-14 bg-gray-50">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-3xl font-bold text-center mb-10">📍 Contact Us</h2>
            <div className="grid md:grid-cols-2 gap-8 items-stretch">
              <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-7 shadow-sm">
                <h3 className="text-2xl font-semibold mb-6">Get in Touch</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="text-xl">📍</div>
                    <div>
                      <div className="font-semibold">Office Address</div>
                      <div className="text-gray-700">123 Ayala Avenue, Makati City, Metro Manila 1226</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-xl">📞</div>
                    <div>
                      <div className="font-semibold">Phone</div>
                      <a href="tel:+6328123456789" className="text-blue-600">(02) 8123-4567</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-xl">📱</div>
                    <div>
                      <div className="font-semibold">Mobile</div>
                      <a href="tel:+639171234567" className="text-blue-600">+63 917 123 4567</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-xl">✉️</div>
                    <div>
                      <div className="font-semibold">Email</div>
                      <a href="mailto:info@tesproperty.com" className="text-blue-600">info@tesproperty.com</a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="text-xl">🕒</div>
                    <div>
                      <div className="font-semibold">Business Hours</div>
                      <div className="text-gray-700">Mon-Fri: 9:00 AM - 6:00 PM | Sat: 10:00 AM - 4:00 PM</div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 shadow-sm">
                <div className="bg-gray-200 h-64 rounded-lg flex items-center justify-center">
                  <p className="text-gray-500">🗺️ Google Maps Embed Here</p>
                </div>
              </div>
            </div>
          </div>
        </section>
      
        <footer className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen bg-slate-900 text-slate-200 border-t border-slate-700/60">
          <div className="container mx-auto px-4 py-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div>
                <h4 className="text-xl font-bold text-white mb-3">TES Property</h4>
                <p className="text-slate-400 text-sm leading-relaxed">Helping Filipino families and investors find the right property with transparent and reliable service.</p>
              </div>
              <div>
                <h4 className="text-sm font-semibold tracking-wide uppercase text-slate-300 mb-3">Quick Links</h4>
                <ul className="space-y-2 text-sm">
                  <li><a href="#properties" className="text-slate-400 hover:text-white transition">Properties</a></li>
                  <li><a href="#services" className="text-slate-400 hover:text-white transition">Services</a></li>
                  <li><a href="#about" className="text-slate-400 hover:text-white transition">About Us</a></li>
                  <li><a href="#contact" className="text-slate-400 hover:text-white transition">Contact</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold tracking-wide uppercase text-slate-300 mb-3">Contact</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li>(02) 8123-4567</li>
                  <li>+63 917 123 4567</li>
                  <li>info@tesproperty.com</li>
                  <li>Makati City, Metro Manila</li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold tracking-wide uppercase text-slate-300 mb-3">Follow Us</h4>
                <div className="flex flex-wrap gap-3 text-sm">
                  <a href="#" className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition">Facebook</a>
                  <a href="#" className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition">Twitter</a>
                  <a href="#" className="px-3 py-1 rounded-full bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition">Instagram</a>
                </div>
              </div>
            </div>
            <div className="mt-10 pt-6 border-t border-slate-700/70 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <p>© 2026 TES Property System. All rights reserved.</p>
              <div className="flex gap-4">
                <a href="/privacy" className="hover:text-white transition">Privacy Policy</a>
                <a href="/terms" className="hover:text-white transition">Terms of Service</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default CustomerPortal;
