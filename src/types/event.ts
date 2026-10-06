// ============================================================
// ANKU — Types Events
// ============================================================

export const EVENT_TYPES = [
  'marche',
  'atelier',
  'salon',
  'porte_ouverte',
  'degustation',
  'autre',
] as const
export type EventType = (typeof EVENT_TYPES)[number]

export type EventStatus = 'draft' | 'published' | 'cancelled' | 'completed'

export type RegistrationStatus = 'registered' | 'waitlist' | 'cancelled' | 'attended'

export interface EventOrganizer {
  id: number
  first_name: string
  last_name: string
  username: string
  avatar_url: string | null
}

export interface Event {
  id: number
  organizer_id: number
  shop_id: number | null
  title: string
  description: string | null
  cover_url: string | null
  type: EventType
  start_at: string
  end_at: string | null
  address: string | null
  city: string | null
  postal_code: string | null
  latitude: number | null
  longitude: number | null
  capacity: number | null
  is_free: boolean
  price: number | null
  status: EventStatus
  created_at: string
  updated_at: string
  organizer?: EventOrganizer | null
  likes_count?: number
  registered_count?: number
  is_registered?: boolean
  is_liked?: boolean
}

export interface EventRegistration {
  id: number
  event_id: number
  user_id: number
  status: RegistrationStatus
  created_at: string
  user?: {
    id: number
    first_name: string
    last_name: string
    username: string
    avatar_url: string | null
  }
}

export interface CreateEventPayload {
  title: string
  description?: string | null
  cover_url?: string | null
  type: EventType
  start_at: string
  end_at?: string | null
  shop_id?: number | null
  address?: string | null
  city?: string | null
  postal_code?: string | null
  latitude?: number | null
  longitude?: number | null
  capacity?: number | null
  is_free?: boolean
  price?: number | null
  status?: 'draft' | 'published'
}

export type UpdateEventPayload = Partial<CreateEventPayload>

export interface ListEventsParams {
  type?: EventType | 'all'
  city?: string
  from?: string
  to?: string
  upcoming?: boolean
  limit?: number
  offset?: number
}

export interface NearbyEventsParams {
  lat: number
  lng: number
  radius?: number
  upcoming?: boolean
  limit?: number
  offset?: number
}

export interface EventsListResponse {
  success: boolean
  count: number
  events: Event[]
}

export interface EventResponse {
  success: boolean
  event: Event
}

export interface RegistrationsListResponse {
  success: boolean
  count: number
  registrations: EventRegistration[]
}
