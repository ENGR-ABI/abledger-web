"use client"

import { useState, useEffect, useRef } from "react"
import { Save, Loader2, Image as ImageIcon, Palette, Building2, Upload, X, Sparkles, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTenantSettings } from "@/contexts/tenant-settings-context"
import { tenantsApi } from "@/lib/api/tenants"
import { useAuth } from "@/contexts/auth-context"
import { usePermissions } from "@/hooks/use-permissions"
import { RouteProtection } from "@/components/auth/route-protection"
import { toast } from "sonner"

export default function BrandingSettingsContent() {
  const { user } = useAuth()
  const { canView } = usePermissions()


  const { refreshSettings } = useTenantSettings()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState({
    name: '',
    logoUrl: '',
    primaryColor: '#093c93',
    accentColor: '#28a2fd',
    bankName: '',
    accountName: '',
    accountNumber: '',
    currency: 'NGN',
    timezone: 'Africa/Lagos',
    dateFormat: 'DD/MM/YYYY',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploadingLogo, setIsUploadingLogo] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  useEffect(() => {
    fetchBranding()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.tenantId])

  // Protect route - branding requires view permission
  if (!canView('branding')) {
    return (
      <RouteProtection resource="branding" requiredPermission="view">
        <div />
      </RouteProtection>
    )
  }

  const fetchBranding = async () => {
    if (!user?.tenantId) {
      setIsLoading(false)
      return
    }

    try {
      // Get tenant settings which includes name, logo, colors, and regional settings
      const settings = await tenantsApi.getTenantSettings(user.tenantId)
      setFormData({
        name: settings.name || '',
        logoUrl: settings.logoUrl || '',
        primaryColor: settings.primaryColor || '#093c93',
        accentColor: settings.accentColor || '#28a2fd',
        bankName: settings.bankName || '',
        accountName: settings.accountName || '',
        accountNumber: settings.accountNumber || '',
        currency: settings.currency || 'NGN',
        timezone: settings.timezone || 'Africa/Lagos',
        dateFormat: settings.dateFormat || 'DD/MM/YYYY',
      })

      // Set logo preview if logo URL exists
      if (settings.logoUrl) {
        // Construct full URL for logo preview
        // Logo URLs are stored as relative paths like /uploads/logos/logo.png
        // Full URL: http://localhost:4000/api/uploads/logos/logo.png
        let logoUrl = settings.logoUrl
        if (!logoUrl.startsWith('http')) {
          const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
          const normalizedPath = logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`
          // Check if baseUrl already ends with /api
          logoUrl = baseUrl.endsWith('/api')
            ? `${baseUrl}${normalizedPath}`
            : `${baseUrl}/api${normalizedPath}`
        }
        setLogoPreview(logoUrl)
      } else {
        setLogoPreview(null)
      }
    } catch (error: any) {
      console.error('Failed to fetch branding:', error)
      toast.error('Failed to load branding settings')
      // Keep defaults if fetch fails
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogoFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload an image (JPEG, PNG, GIF, WebP, or SVG).')
      return
    }

    // Validate file size (500KB)
    if (file.size > 500 * 1024) {
      toast.error('File size must be less than 500KB.')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload file
    if (!user?.tenantId) {
      toast.error('No tenant ID available')
      return
    }

    try {
      setIsUploadingLogo(true)
      const response = await tenantsApi.uploadLogo(user.tenantId, file)
      // Update form data with the returned URL
      setFormData({ ...formData, logoUrl: response.url })

      // Update logo preview with the server URL (construct full URL)
      // Logo URLs are stored as relative paths like /uploads/logos/logo.png
      // Full URL: http://localhost:4000/api/uploads/logos/logo.png
      let logoUrl = response.url
      if (!logoUrl.startsWith('http')) {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
        const normalizedPath = logoUrl.startsWith('/') ? logoUrl : `/${logoUrl}`
        // Check if baseUrl already ends with /api
        logoUrl = baseUrl.endsWith('/api')
          ? `${baseUrl}${normalizedPath}`
          : `${baseUrl}/api${normalizedPath}`
      }
      setLogoPreview(logoUrl)

      toast.success('Logo uploaded successfully')
      // Refresh settings to ensure consistency
      await refreshSettings()
    } catch (error: any) {
      console.error('Failed to upload logo:', error)
      toast.error(error.message || 'Failed to upload logo')
      setLogoPreview(null)
    } finally {
      setIsUploadingLogo(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveLogo = () => {
    setFormData({ ...formData, logoUrl: '' })
    setLogoPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user?.tenantId) {
      toast.error('No tenant ID available')
      return
    }

    // Validate hex colors
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    if (formData.primaryColor && !hexColorRegex.test(formData.primaryColor)) {
      toast.error('Primary color must be a valid hex color (e.g., #093c93)')
      return
    }
    if (formData.accentColor && !hexColorRegex.test(formData.accentColor)) {
      toast.error('Accent color must be a valid hex color (e.g., #28a2fd)')
      return
    }

    try {
      setIsSaving(true)
      // Don't send name in update - it's read-only
      await tenantsApi.updateTenantSettings(user.tenantId, {
        logoUrl: formData.logoUrl || undefined,
        primaryColor: formData.primaryColor || undefined,
        accentColor: formData.accentColor || undefined,
        bankName: formData.bankName || undefined,
        accountName: formData.accountName || undefined,
        accountNumber: formData.accountNumber || undefined,
        currency: formData.currency || undefined,
        timezone: formData.timezone || undefined,
        dateFormat: formData.dateFormat || undefined,
      })
      // Refresh settings context
      await refreshSettings()
      // Refetch branding data to ensure form shows saved values
      await fetchBranding()
      toast.success('Branding settings updated successfully')
    } catch (error: any) {
      console.error('Failed to update branding:', error)
      toast.error(error.message || 'Failed to update branding settings')
    } finally {
      setIsSaving(false)
    }
  }

  const handleColorChange = (field: 'primaryColor' | 'accentColor', value: string) => {
    // Allow hex input
    if (value.startsWith('#') || value === '') {
      setFormData({ ...formData, [field]: value })
    } else if (!value.startsWith('#')) {
      setFormData({ ...formData, [field]: '#' + value })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#28a2fd]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Branding Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Customize your organization's visual identity and branding elements
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Company Name Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#28a2fd]" />
              <CardTitle>Company Name</CardTitle>
            </div>
            <CardDescription>
              Your organization's display name
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="name">Company Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your Company Name"
                maxLength={255}
                readOnly
                className="bg-gray-50 dark:bg-gray-900/50 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Company name cannot be changed for security and configuration reasons
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Logo Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-[#28a2fd]" />
              <CardTitle>Logo</CardTitle>
            </div>
            <CardDescription>
              Upload your organization's logo image
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Logo Image</Label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                  onChange={handleLogoFileSelect}
                  className="hidden"
                  id="logo-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingLogo}
                  className="flex items-center gap-2"
                >
                  {isUploadingLogo ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      {logoPreview ? 'Change Logo' : 'Upload Logo'}
                    </>
                  )}
                </Button>
                {logoPreview && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveLogo}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Recommended size: 200x200px or larger. Max file size: 500KB. Supported formats: JPEG, PNG, GIF, WebP, SVG.
              </p>
            </div>

            {logoPreview && (
              <div className="mt-4 p-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-3">Logo Preview</p>
                <div className="flex items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="max-h-32 max-w-64 object-contain"
                    onError={(e) => {
                      const target = e.currentTarget
                      target.style.display = 'none'
                      const parent = target.parentElement
                      if (parent) {
                        parent.innerHTML = '<p class="text-sm text-red-500">Failed to load image.</p>'
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Color Scheme Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-[#28a2fd]" />
              <CardTitle>Color Scheme</CardTitle>
            </div>
            <CardDescription>
              Define your brand's primary and accent colors
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Primary Color */}
              <div className="space-y-3">
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-3 items-center">
                  <div className="relative">
                    <input
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value.toUpperCase() })}
                      className="w-16 h-16 rounded-lg border-2 border-gray-200 dark:border-gray-700 cursor-pointer"
                      style={{ backgroundColor: formData.primaryColor }}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      id="primaryColor"
                      type="text"
                      value={formData.primaryColor}
                      onChange={(e) => handleColorChange('primaryColor', e.target.value.toUpperCase())}
                      placeholder="#093c93"
                      pattern="^#[0-9A-Fa-f]{6}$"
                      maxLength={7}
                      className="font-mono"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Main brand color
                    </p>
                  </div>
                </div>
              </div>

              {/* Accent Color */}
              <div className="space-y-3">
                <Label htmlFor="accentColor">Accent Color</Label>
                <div className="flex gap-3 items-center">
                  <div className="relative">
                    <input
                      type="color"
                      value={formData.accentColor}
                      onChange={(e) => setFormData({ ...formData, accentColor: e.target.value.toUpperCase() })}
                      className="w-16 h-16 rounded-lg border-2 border-gray-200 dark:border-gray-700 cursor-pointer"
                      style={{ backgroundColor: formData.accentColor }}
                    />
                  </div>
                  <div className="flex-1">
                    <Input
                      id="accentColor"
                      type="text"
                      value={formData.accentColor}
                      onChange={(e) => handleColorChange('accentColor', e.target.value.toUpperCase())}
                      placeholder="#28a2fd"
                      pattern="^#[0-9A-Fa-f]{6}$"
                      maxLength={7}
                      className="font-mono"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      For buttons and highlights
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Color Preview */}
            <div className="mt-6 p-6 border rounded-lg bg-gray-50 dark:bg-gray-900/50">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-4">Color Preview</p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div
                    className="h-20 rounded-lg flex items-center justify-center text-white font-medium shadow-md"
                    style={{ backgroundColor: formData.primaryColor }}
                  >
                    Primary Color
                  </div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400 font-mono">
                    {formData.primaryColor}
                  </p>
                </div>
                <div className="space-y-2">
                  <div
                    className="h-20 rounded-lg flex items-center justify-center text-white font-medium shadow-md"
                    style={{ backgroundColor: formData.accentColor }}
                  >
                    Accent Color
                  </div>
                  <p className="text-xs text-center text-gray-600 dark:text-gray-400 font-mono">
                    {formData.accentColor}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  className="w-full"
                  style={{
                    background: `linear-gradient(135deg, ${formData.primaryColor} 0%, ${formData.accentColor} 100%)`,
                  }}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Example Button with Your Colors
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Regional Settings Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-[#28a2fd]" />
              <CardTitle>Regional Settings</CardTitle>
            </div>
            <CardDescription>
              Configure currency, timezone, and date format for your platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Currency */}
            <div>
              <Label htmlFor="currency">Currency *</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NGN">Nigerian Naira (NGN)</SelectItem>
                  <SelectItem value="USD">US Dollar (USD)</SelectItem>
                  <SelectItem value="GBP">British Pound (GBP)</SelectItem>
                  <SelectItem value="EUR">Euro (EUR)</SelectItem>
                  <SelectItem value="KES">Kenyan Shilling (KES)</SelectItem>
                  <SelectItem value="GHS">Ghanaian Cedi (GHS)</SelectItem>
                  <SelectItem value="ZAR">South African Rand (ZAR)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                This currency will be used throughout the platform for displaying amounts
              </p>
            </div>

            {/* Timezone */}
            <div>
              <Label htmlFor="timezone">Timezone *</Label>
              <Select
                value={formData.timezone}
                onValueChange={(value) => setFormData({ ...formData, timezone: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Africa/Lagos">Africa/Lagos (WAT)</SelectItem>
                  <SelectItem value="Africa/Nairobi">Africa/Nairobi (EAT)</SelectItem>
                  <SelectItem value="Africa/Johannesburg">Africa/Johannesburg (SAST)</SelectItem>
                  <SelectItem value="Africa/Accra">Africa/Accra (GMT)</SelectItem>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                  <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                All dates and times will be displayed in this timezone
              </p>
            </div>

            {/* Date Format */}
            <div>
              <Label htmlFor="dateFormat">Date Format *</Label>
              <Select
                value={formData.dateFormat}
                onValueChange={(value) => setFormData({ ...formData, dateFormat: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select date format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (e.g., 25/12/2024)</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (e.g., 12/25/2024)</SelectItem>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD (e.g., 2024-12-25)</SelectItem>
                  <SelectItem value="DD-MM-YYYY">DD-MM-YYYY (e.g., 25-12-2024)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Choose how dates are displayed across the platform
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account Details Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#28a2fd]" />
              <CardTitle>Payment Account Details</CardTitle>
            </div>
            <CardDescription>
              Bank account information to display on invoices for payment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                placeholder="e.g., First Bank, GTBank, Access Bank"
                maxLength={255}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountName">Account Name</Label>
              <Input
                id="accountName"
                type="text"
                value={formData.accountName}
                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                placeholder="Account holder name"
                maxLength={255}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                type="number"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder="Account number"
                maxLength={100}
              />
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              These details will be displayed on invoices when there is an amount due.
            </p>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData({
                name: '',
                logoUrl: '',
                primaryColor: '#093c93',
                accentColor: '#28a2fd',
                bankName: '',
                accountName: '',
                accountNumber: '',
                currency: 'NGN',
                timezone: 'Africa/Lagos',
                dateFormat: 'DD/MM/YYYY',
              })
              setLogoPreview(null)
            }}
          >
            Reset
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-gradient-to-r from-[#093c93] to-[#28a2fd] hover:opacity-90 min-w-[120px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
