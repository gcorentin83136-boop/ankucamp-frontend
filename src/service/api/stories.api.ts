import httpClient from './httpClient'

export const storiesApi = {
  feed: async (): Promise<{ success: boolean; stories: any[] }> => {
    const { data } = await httpClient.get('/stories')
    return data
  },
  create: async (payload: any) => {
    const { data } = await httpClient.post('/stories', payload)
    return data
  },
  delete: async (id: number) => {
    const { data } = await httpClient.delete(`/stories/${id}`)
    return data
  },
  updateVisibility: async (id: number, visibility: string) => {
    const { data } = await httpClient.patch(`/stories/${id}/visibility`, { visibility })
    return data
  }
}

export default storiesApi