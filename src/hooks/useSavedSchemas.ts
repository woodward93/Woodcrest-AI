import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabase'

export interface SavedSchema {
  id: string
  name: string
  description: string | null
  tables: any[]
  created_at: string
  updated_at: string
}

export function useSavedSchemas() {
  const { user } = useAuth()
  const [schemas, setSchemas] = useState<SavedSchema[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadSchemas()
    }
  }, [user])

  const loadSchemas = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('saved_schemas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setSchemas(data || [])
    } catch (error) {
      console.error('Error loading saved schemas:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSchema = async (name: string, description: string, tables: any[]): Promise<boolean> => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from('saved_schemas')
        .insert({
          user_id: user.id,
          name,
          description,
          tables
        })

      if (error) throw error
      
      await loadSchemas() // Refresh the list
      return true
    } catch (error) {
      console.error('Error saving schema:', error)
      return false
    }
  }

  const updateSchema = async (id: string, name: string, description: string, tables: any[]): Promise<boolean> => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from('saved_schemas')
        .update({
          name,
          description,
          tables,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      
      await loadSchemas() // Refresh the list
      return true
    } catch (error) {
      console.error('Error updating schema:', error)
      return false
    }
  }

  const deleteSchema = async (id: string): Promise<boolean> => {
    if (!user) return false

    try {
      const { error } = await supabase
        .from('saved_schemas')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      
      await loadSchemas() // Refresh the list
      return true
    } catch (error) {
      console.error('Error deleting schema:', error)
      return false
    }
  }

  return {
    schemas,
    loading,
    saveSchema,
    updateSchema,
    deleteSchema,
    refreshSchemas: loadSchemas
  }
}