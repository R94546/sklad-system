import api from './axios';

export const listOrganizations = () =>
  api.get('/admin/organizations').then((res) => res.data.data);

export const createOrganization = (payload) =>
  api.post('/admin/organizations', payload).then((res) => res.data.data);

export const setOrganizationActive = (id, isActive) =>
  api.patch(`/admin/organizations/${id}/active`, { isActive }).then((res) => res.data.data);
