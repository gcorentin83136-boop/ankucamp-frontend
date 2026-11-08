import httpClient from './httpClient'

export const reelsApi = {
  feed: async (): Promise<{ success: boolean; reels: any[] }> => {
    const { data } = await httpClient.get('/reels')
    return data
  },
  create: async (payload: any) => {
    const { data } = await httpClient.post('/reels', payload)
    return data
  },
  like: async (id: number): Promise<{ success: boolean; liked: boolean }> => {
    const { data } = await httpClient.post(`/reels/${id}/like`)
    return data
  },
}

export default reelsApi