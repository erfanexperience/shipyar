import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const apiService = {
  // Auth endpoints
  async login(credentials) {
    const response = await api.post('/auth/login', credentials);
    if (response.data.access_token) {
      localStorage.setItem('token', response.data.access_token);
    }
    return response.data;
  },

  async register(userData) {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  // Location endpoints
  async getCountries() {
    const response = await api.get('/locations/countries');
    return response.data;
  },

  async getCitiesByCountry(countryCode) {
    const response = await api.get(`/locations/countries/${countryCode}/cities`);
    return response.data;
  },

  async searchCities(query, countryCode = null) {
    const params = { q: query };
    if (countryCode) params.country_code = countryCode;
    const response = await api.get('/locations/cities/search', { params });
    return response.data;
  },

  // Amazon endpoints
  async fetchAmazonProduct(amazonUrl) {
    const response = await api.post('/amazon/fetch-product', { url: amazonUrl });
    return response.data;
  },

  // Order endpoints
  async createOrder(orderData) {
    const response = await api.post('/orders/', orderData);
    return response.data;
  },

  async getMyOrders(asShopper = true, status = null) {
    const params = { as_shopper: asShopper };
    if (status) params.status = status;
    const response = await api.get('/orders/my', { params });
    return response.data;
  },

  async getActiveOrders(destinationCountry = null) {
    const params = {};
    if (destinationCountry) params.destination_country = destinationCountry;
    const response = await api.get('/orders/active', { params });
    return response.data;
  },

  async searchOrders(filters = {}) {
    const params = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params[key] = value;
      }
    });
    const response = await api.get('/orders/', { params });
    return response.data;
  },

  async getOrder(orderId) {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  async updateOrder(orderId, orderData) {
    const response = await api.put(`/orders/${orderId}`, orderData);
    return response.data;
  },

  async deleteOrder(orderId) {
    await api.delete(`/orders/${orderId}`);
  },

  async updateOrderStatus(orderId, status, notes = null) {
    const response = await api.post(`/orders/${orderId}/status`, { status, notes });
    return response.data;
  },

  // Offer endpoints
  async createOffer(orderId, offerData) {
    const response = await api.post(`/offers/${orderId}/offers`, offerData);
    return response.data;
  },

  async getOrderOffers(orderId) {
    const response = await api.get(`/offers/${orderId}/offers`);
    return response.data;
  },

  async getMyOffers() {
    const response = await api.get('/offers/');
    return response.data;
  },

  async getOffer(offerId) {
    const response = await api.get(`/offers/${offerId}`);
    return response.data;
  },

  async updateOffer(offerId, offerData) {
    const response = await api.put(`/offers/${offerId}`, offerData);
    return response.data;
  },

  async acceptOffer(offerId) {
    const response = await api.post(`/offers/${offerId}/accept`);
    return response.data;
  },

  async withdrawOffer(offerId) {
    await api.post(`/offers/${offerId}/withdraw`);
  },

  async rejectOffer(offerId) {
    await api.post(`/offers/${offerId}/reject`);
  },

  // Notification endpoints
  async getNotifications(unreadOnly = false) {
    const params = unreadOnly ? { unread_only: true } : {};
    const response = await api.get('/notifications/', { params });
    return response.data;
  },

  async getUnreadCount() {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  async markNotificationAsRead(notificationId) {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  async markAllNotificationsAsRead() {
    const response = await api.put('/notifications/mark-all-read');
    return response.data;
  },

  async deleteNotification(notificationId) {
    await api.delete(`/notifications/${notificationId}`);
  }
};

export default api;