import { env } from '@/shared/config/env';
import { registerLoaderKey } from '@/shared/data/loaderKeys';
import { invalidateAfterMutation } from '@/shared/data/mutationInvalidation';
import { listQueryKey, resourceFromEndpoint } from '@/shared/data/queryKeys';
import httpClient from '@/shared/services/httpClient';

const MOCK_DELAY_MS = 400;

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isPositiveId(value) {
  const id = Number(value);
  return Number.isFinite(id) && id > 0;
}

function asRecordId(value, fallbackId) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const id = isPositiveId(value.id) ? Number(value.id) : Number(fallbackId);
    if (isPositiveId(id)) {
      return { ...value, id };
    }
  }

  if (isPositiveId(value)) {
    return { id: Number(value) };
  }

  return { id: Number(fallbackId) };
}

function matchesParams(item, params) {
  if (!params || typeof params !== 'object') return true;

  return Object.entries(params).every(([key, value]) => {
    if (value === undefined || key === 'incluirInhabilitados') return true;
    const actual = item[key];
    if (actual === value) return true;
    if (actual == null || value == null) return actual === value;
    if (typeof actual === 'boolean' || typeof value === 'boolean') {
      return String(actual) === String(value);
    }
    if (typeof actual === 'number' || typeof value === 'number') {
      return Number(actual) === Number(value);
    }
    return String(actual) === String(value);
  });
}

export function createMockCrudService({ endpoint, seed, delayMs = MOCK_DELAY_MS }) {
  let items = clone(seed);
  const usesHabilitado = seed.some((item) => Object.hasOwn(item, 'habilitado'));
  const resource = resourceFromEndpoint(endpoint);

  async function getAll(params, { signal } = {}) {
    if (env.useApiMock) {
      await wait(delayMs);
      return clone(items).filter((item) => matchesParams(item, params));
    }

    const response = await httpClient.get(endpoint, {
      params: { incluirInhabilitados: true, ...params },
      signal,
    });
    return response.data;
  }

  // Clave base sin params: [resource, 'list'].
  // WeakMap solo admite una key por función; getAll(params) NO puede deducir params.
  // Cualquier llamada con filtros exige key explícito en el call site:
  //   useResource(() => service.getAll(params), { key: listQueryKey(resource, params) })
  registerLoaderKey(getAll, listQueryKey(resource, {}));

  async function getById(id, { signal } = {}) {
    if (!isPositiveId(id)) {
      const error = new Error('El registro no existe o fue retirado del catálogo.');
      error.status = 404;
      throw error;
    }

    if (env.useApiMock) {
      await wait(delayMs);
      const found = items.find((item) => item.id === Number(id));

      if (!found) {
        const error = new Error('No se encontró el registro solicitado.');
        error.status = 404;
        throw error;
      }

      return clone(found);
    }

    const response = await httpClient.get(`${endpoint}/${id}`, { signal });
    return response.data;
  }

  async function create(data) {
    if (env.useApiMock) {
      await wait(delayMs);
      const nextId = items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
      const created = { ...data, id: nextId };

      if (usesHabilitado) {
        created.habilitado = data.habilitado ?? true;
      }

      items = [...items, created];
      invalidateAfterMutation(resource);
      return clone(created);
    }

    const response = await httpClient.post(endpoint, data);
    const created = asRecordId(response.data, null);
    invalidateAfterMutation(resource);
    return created;
  }

  async function update(id, data) {
    if (env.useApiMock) {
      await wait(delayMs);
      const numericId = Number(id);
      const current = items.find((item) => item.id === numericId);

      if (!current) {
        const error = new Error('No se encontró el registro solicitado.');
        error.status = 404;
        throw error;
      }

      const updated = { ...current, ...data, id: numericId };
      items = items.map((item) => (item.id === numericId ? updated : item));
      invalidateAfterMutation(resource);
      return clone(updated);
    }

    const numericId = Number(id);
    const payload = { ...data, id: numericId };
    const response = await httpClient.put(`${endpoint}/${id}`, payload);
    const body = response.data;
    const merged =
      body && typeof body === 'object' && !Array.isArray(body) ? { ...payload, ...body } : payload;
    const result = asRecordId(merged, numericId);
    invalidateAfterMutation(resource);
    return result;
  }

  async function remove(id) {
    if (env.useApiMock) {
      await wait(delayMs);
      const numericId = Number(id);
      const current = items.find((item) => item.id === numericId);

      if (!current) {
        const error = new Error('No se encontró el registro solicitado.');
        error.status = 404;
        throw error;
      }

      if (usesHabilitado) {
        const updated = { ...current, habilitado: false };
        items = items.map((item) => (item.id === numericId ? updated : item));
        invalidateAfterMutation(resource);
        return clone(updated);
      }

      items = items.filter((item) => item.id !== numericId);
      invalidateAfterMutation(resource);
      return clone(current);
    }

    const numericId = Number(id);
    if (usesHabilitado) {
      await httpClient.post(`${endpoint}/${id}/disable`);
    } else {
      await httpClient.delete(`${endpoint}/${id}`);
    }
    invalidateAfterMutation(resource);
    return { id: numericId };
  }

  return { getAll, getById, create, update, remove };
}

export function createReadService(options) {
  const { getAll, getById } = createMockCrudService(options);
  return { getAll, getById };
}
