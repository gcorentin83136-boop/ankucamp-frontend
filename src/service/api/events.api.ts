// ============================================================
// ANKU — API Events
// ============================================================

import httpClient from './httpClient'
import type {
  EventResponse,
  EventsListResponse,
  RegistrationsListResponse,
  CreateEventPayload,
  UpdateEventPayload,
  ListEventsParams,
  NearbyEventsParams,
} from '../../types/event'

export const eventsApi = {
  list: async (params?: ListEventsParams): Promise<EventsListResponse> => {
    const { data } = await httpClient.get<EventsListResponse>('/events', {
      params,
    })
    return data
  },

  nearby: async (params: NearbyEventsParams): Promise<EventsListResponse> => {
    const { data } = await httpClient.get<EventsListResponse>(
      '/events/nearby',
      { params }
    )
    return data
  },

  getById: async (id: number): Promise<EventResponse> => {
    const { data } = await httpClient.get<EventResponse>(`/events/${id}`)
    return data
  },

  listMine: async (): Promise<EventsListResponse> => {
    const { data } = await httpClient.get<EventsListResponse>('/events/me')
    return data
  },

  feed: async (): Promise<EventsListResponse> => {
    const { data } = await httpClient.get<EventsListResponse>('/events/feed')
    return data
  },

  registrations: async (
    eventId: number
  ): Promise<RegistrationsListResponse> => {
    const { data } = await httpClient.get<RegistrationsListResponse>(
      `/events/${eventId}/registrations`
    )
    return data
  },

  create: async (payload: CreateEventPayload): Promise<EventResponse> => {
    const { data } = await httpClient.post<EventResponse>('/events', payload)
    return data
  },

  update: async (
    id: number,
    payload: UpdateEventPayload
  ): Promise<EventResponse> => {
    const { data } = await httpClient.put<EventResponse>(
      `/events/${id}`,
      payload
    )
    return data
  },

  cancel: async (id: number, reason?: string): Promise<any> => {
    const { data } = await httpClient.put(`/events/${id}/cancel`, { reason })
    return data
  },

  delete: async (id: number): Promise<void> => {
    await httpClient.delete(`/events/${id}`)
  },

  register: async (id: number): Promise<any> => {
    const { data } = await httpClient.post(`/events/${id}/register`)
    return data
  },

  unregister: async (id: number): Promise<any> => {
    const { data } = await httpClient.delete(`/events/${id}/register`)
    return data
  },

  share: async (
    eventId: number,
    payload: { share_comment?: string | null; visibility?: string }
  ): Promise<any> => {
    const { data } = await httpClient.post(
      `/posts/share-event/${eventId}`,
      payload
    )
    return data
  },

  uploadCover: async (
    file: File
  ): Promise<{ success: boolean; url: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await httpClient.post<{
      success: boolean
      url: string
    }>('/uploads/event-cover', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  toggleLike: async (eventId: number): Promise<any> => {
    const { data } = await httpClient.post(`/posts/events/${eventId}/like`)
    return data
  },
}

export default eventsApi
