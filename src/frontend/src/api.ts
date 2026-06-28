import axios from 'axios';

const API_URL = '/crm/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Автоматически прикрепляем токен авторизации к каждому запросу
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Materials
export const getMaterials = (params?: { category_id?: number; material_type?: string; search?: string }) => api.get('/materials/', { params });
export const getMaterial = (id: number) => api.get(`/materials/${id}`);
export const createMaterial = (data: any) => api.post('/materials/', data);
export const updateMaterial = (id: number, data: any) => api.put(`/materials/${id}`, data);
export const deleteMaterial = (id: number) => api.delete(`/materials/${id}`);
export const getUnitTypes = () => api.get('/materials/units/');
export const getMaterialBatches = (materialId: number) => api.get(`/materials/${materialId}/batches/`);
export const addMaterialBatch = (materialId: number, data: any) => api.post(`/materials/${materialId}/batches/`, data);
export const updateMaterialBatch = (materialId: number, batchId: number, data: any) => api.put(`/materials/${materialId}/batches/${batchId}`, data);
export const deleteMaterialBatch = (materialId: number, batchId: number) => api.delete(`/materials/${materialId}/batches/${batchId}`);

// Products
export const getProducts = () => api.get('/products/');
export const getProduct = (id: number) => api.get(`/products/${id}`);
export const createProduct = (data: any) => api.post('/products/', data);
export const updateProduct = (id: number, data: any) => api.put(`/products/${id}`, data);
export const deleteProduct = (id: number) => api.delete(`/products/${id}`);

// Customers
export const getCustomers = () => api.get('/customers/');
export const getCustomer = (id: number) => api.get(`/customers/${id}`);
export const createCustomer = (data: any) => api.post('/customers/', data);
export const updateCustomer = (id: number, data: any) => api.put(`/customers/${id}`, data);
export const deleteCustomer = (id: number) => api.delete(`/customers/${id}`);

// Equipment
export const getEquipment = () => api.get('/equipment/');
export const getEquipmentById = (id: number) => api.get(`/equipment/${id}`);
export const createEquipment = (data: any) => api.post('/equipment/', data);
export const updateEquipment = (id: number, data: any) => api.put(`/equipment/${id}`, data);
export const deleteEquipment = (id: number) => api.delete(`/equipment/${id}`);
export const addEquipmentSpecification = (equipmentId: number, data: any) => api.post(`/equipment/${equipmentId}/specification/`, data);
export const removeEquipmentSpecification = (equipmentId: number, specId: number) => api.delete(`/equipment/${equipmentId}/specification/${specId}/`);
export const replenishEquipmentResource = (equipmentId: number, specId: number, data: any) => api.post(`/equipment/${equipmentId}/specification/${specId}/replenish/`, data);
export const getEquipmentConsumption = (equipmentId: number, days: number = 30) => api.get(`/equipment/${equipmentId}/consumption/?days=${days}`);

// Specifications (управление материалами и оборудованием продукта)
export const getProductSpecification = (productId: number) => api.get(`/products/${productId}/specification/`);
export const addMaterialToSpecification = (productId: number, data: any) => api.post(`/products/${productId}/specification/materials/`, data);
export const addEquipmentToSpecification = (productId: number, data: any) => api.post(`/products/${productId}/specification/equipment/`, data);
export const updateMaterialSpec = (productId: number, specId: number, data: any) => api.put(`/products/${productId}/specification/materials/${specId}/`, data);
export const updateEquipmentSpec = (productId: number, specId: number, data: any) => api.put(`/products/${productId}/specification/equipment/${specId}/`, data);
export const removeFromSpecification = (productId: number, specType: string, specId: number) => api.delete(`/products/${productId}/specification/${specType}/${specId}/`);

// Sales
export const getOrders = () => api.get('/sales/orders/');
export const getOrder = (id: number) => api.get(`/sales/orders/${id}`);
export const createOrder = (data: any) => api.post('/sales/orders/', data);
export const updateOrder = (id: number, data: any) => api.put(`/sales/orders/${id}`, data);
export const deleteOrder = (id: number) => api.delete(`/sales/orders/${id}`);

// Categories
export const getCategories = () => api.get('/categories/');
export const getCategory = (id: number) => api.get(`/categories/${id}`);
export const createCategory = (data: any) => api.post('/categories/', data);
export const updateCategory = (id: number, data: any) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id: number) => api.delete(`/categories/${id}`);

// Attributes
export const getAttributes = (categoryId: number) => api.get(`/categories/${categoryId}/attributes`);
export const createAttribute = (categoryId: number, data: any) => api.post(`/categories/${categoryId}/attributes`, data);
export const updateAttribute = (categoryId: number, attributeId: number, data: any) => api.put(`/categories/${categoryId}/attributes/${attributeId}`, data);
export const deleteAttribute = (categoryId: number, attributeId: number) => api.delete(`/categories/${categoryId}/attributes/${attributeId}`);

// Attribute Values
export const getAttributeValues = (categoryId: number, attributeId: number) => api.get(`/categories/${categoryId}/attributes/${attributeId}/values`);
export const createAttributeValue = (categoryId: number, attributeId: number, data: any) => api.post(`/categories/${categoryId}/attributes/${attributeId}/values`, data);
export const deleteAttributeValue = (categoryId: number, attributeId: number, valueId: number) => api.delete(`/categories/${categoryId}/attributes/${attributeId}/values/${valueId}`);

// Reports
export const getMaterialStocks = () => api.get('/reports/material-stocks/');
export const getProductsReport = () => api.get('/reports/products/');

// Units
export const getUnits = () => api.get('/units/');
export const createUnit = (data: any) => api.post('/units/', data);
export const updateUnit = (id: number, data: any) => api.put(`/units/${id}`, data);
export const deleteUnit = (id: number) => api.delete(`/units/${id}`);

// Order Items
export const getOrderItems = (orderId: number) => api.get(`/sales/orders/${orderId}/items/`);
export const addOrderItem = (orderId: number, data: any) => api.post(`/sales/orders/${orderId}/items/`, data);
export const deleteOrderItem = (orderId: number, itemId: number) => api.delete(`/sales/orders/${orderId}/items/${itemId}/`);

// Product Info (for order modal)
export const getProductMaterials = (productId: number) => api.get(`/products/${productId}/materials/`);
export const getProductEquipment = (productId: number) => api.get(`/products/${productId}/equipment/`);

// Sales Analytics
export const getSalesSummary = () => api.get('/sales/analytics/sales-summary/');
export const getTopProducts = (limit: number = 10) => api.get(`/sales/analytics/top-products/?limit=${limit}`);
export const getTopCustomers = (limit: number = 10) => api.get(`/sales/analytics/top-customers/?limit=${limit}`);

// Shipping Methods
export const getShippingMethods = () => api.get('/shipping-methods/');
export const createShippingMethod = (data: any) => api.post('/shipping-methods/', data);
export const updateShippingMethod = (id: number, data: any) => api.put(`/shipping-methods/${id}`, data);
export const deleteShippingMethod = (id: number) => api.delete(`/shipping-methods/${id}`);

export default api;
