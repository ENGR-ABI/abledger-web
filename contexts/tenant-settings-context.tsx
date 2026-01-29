"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from './auth-context'
import { tenantsApi, TenantSettings } from '@/lib/api/tenants'
import { setTenantCurrency } from '@/lib/utils/currency'
import { toast } from 'sonner'

interface TenantSettingsContextType {
  settings: TenantSettings | null
  loading: boolean
  updateSettings: (settings: Partial<TenantSettings>) => Promise<void>
  refreshSettings: () => Promise<void>
}

const TenantSettingsContext = createContext<TenantSettingsContextType | undefined>(undefined)

export function TenantSettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [settings, setSettings] = useState<TenantSettings | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSettings = async () => {
    if (!user?.tenantId) {
      setLoading(false)
      return
    }

    try {
      const data = await tenantsApi.getTenantSettings(user.tenantId)
      setSettings(data)
      // Update currency utility
      if (data.currency) {
        setTenantCurrency(data.currency)
      }
    } catch (error: any) {
      console.error('Failed to fetch tenant settings:', error)
      // Set defaults on error
      const defaults: TenantSettings = {
        currency: 'NGN',
        timezone: 'Africa/Lagos',
        dateFormat: 'DD/MM/YYYY',
      }
      setSettings(defaults)
      setTenantCurrency(defaults.currency)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [user?.tenantId])

  const updateSettings = async (updates: Partial<TenantSettings>) => {
    if (!user?.tenantId) {
      throw new Error('No tenant ID available')
    }

    try {
      const updated = await tenantsApi.updateTenantSettings(user.tenantId, updates)
      setSettings(updated)
      // Update currency utility
      if (updates.currency || updated.currency) {
        setTenantCurrency(updated.currency)
      }
      toast.success('Settings updated successfully')
    } catch (error: any) {
      console.error('Failed to update settings:', error)
      toast.error(error.message || 'Failed to update settings')
      throw error
    }
  }

  const refreshSettings = async () => {
    await fetchSettings()
  }

  return (
    <TenantSettingsContext.Provider
      value={{
        settings,
        loading,
        updateSettings,
        refreshSettings,
      }}
    >
      {children}
    </TenantSettingsContext.Provider>
  )
}

export function useTenantSettings() {
  const context = useContext(TenantSettingsContext)
  if (context === undefined) {
    throw new Error('useTenantSettings must be used within a TenantSettingsProvider')
  }
  return context
}

