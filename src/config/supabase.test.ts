import { describe, it, expect } from 'vitest'
import { supabase } from './supabase'

describe('Supabase Connection', () => {
  it('should connect to Supabase successfully', async () => {
    const { data, error } = await supabase.from('employees').select('count')
    expect(error).toBeNull()
    expect(data).toBeDefined()
  })
}) 