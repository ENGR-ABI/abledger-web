"use client"

import { useState } from "react"
import { Menu, Search, Bell, Settings, User, ChevronDown, Home, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ThemeToggle } from "../theme-toggle"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function AdminTopNav() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false)

  const handleMenuToggle = () => {
    if (typeof window !== "undefined" && (window as any).toggleMenuState) {
      ;(window as any).toggleMenuState()
    }
  }

  const handleMobileMenuToggle = () => {
    if (typeof window !== "undefined" && (window as any).setIsMobileMenuOpen) {
      const currentState = (window as any).isMobileMenuOpen || false
      ;(window as any).setIsMobileMenuOpen(!currentState)
    }
  }

  // Get current page name for breadcrumb
  const getPageName = () => {
    const parts = pathname.split('/').filter(Boolean)
    if (parts.length > 1) {
      const pageName = parts[parts.length - 1]
      // Capitalize first letter and replace hyphens with spaces
      return pageName.charAt(0).toUpperCase() + pageName.slice(1).replace(/-/g, ' ')
    }
    return 'Dashboard'
  }

  // Get user initials for avatar fallback
  const getInitials = (name?: string | null, email?: string | null) => {
    if (name) {
      const parts = name.trim().split(' ')
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      }
      return name.substring(0, 2).toUpperCase()
    }
    if (email) {
      const parts = email.split('@')
      if (parts[0]) {
        return parts[0].substring(0, 2).toUpperCase()
      }
    }
    return 'A'
  }

  // Construct full avatar URL from relative path
  // Handles both cases: base URL with /api and without /api
  const getAvatarUrl = (avatarUrl?: string | null) => {
    if (!avatarUrl) return undefined
    if (avatarUrl.startsWith('http')) return avatarUrl
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
    const normalizedPath = avatarUrl.startsWith('/') ? avatarUrl : `/${avatarUrl}`
    
    // Check if baseUrl already ends with /api
    if (baseUrl.endsWith('/api')) {
      return `${baseUrl}${normalizedPath}`
    } else {
      return `${baseUrl}/api${normalizedPath}`
    }
  }

  return (
    <div className="flex items-center justify-between h-full px-4 lg:px-6">
      {/* Left side - Menu toggle and Breadcrumbs */}
        <div className="flex items-center space-x-4">
        {/* Desktop Menu Toggle */}
        <Button variant="ghost" size="sm" onClick={handleMenuToggle} className="hidden lg:flex p-2" title="Toggle Menu">
          <Menu className="h-4 w-4" />
        </Button>

        {/* Mobile Menu Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMobileMenuToggle}
          className="lg:hidden p-2"
          title="Toggle Mobile Menu"
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Breadcrumbs */}
        <nav className="hidden sm:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
          <Link href="/admin" className="flex items-center hover:text-gray-900 dark:hover:text-white">
            <Home className="h-4 w-4 mr-1" />
            Dashboard
          </Link>
          {pathname !== '/admin' && (
            <>
              <span>/</span>
              <span className="text-gray-900 dark:text-white font-medium">{getPageName()}</span>
            </>
          )}
        </nav>
        </div>

      {/* Right side - Actions and Profile */}
      <div className="flex items-center space-x-2">
        {/* Mobile Search */}
        <Button variant="ghost" size="sm" className="md:hidden p-2">
          <Search className="h-4 w-4" />
        </Button>

        {/* Theme Toggle */}
          <ThemeToggle />

        {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center space-x-2 p-2">
              <Avatar className="h-8 w-8 bg-gray-200 dark:bg-gray-700">
                <AvatarImage 
                  src={getAvatarUrl(user?.avatarUrl)} 
                  alt={user?.fullName || user?.email || 'Admin'} 
                />
                <AvatarFallback className="text-xs">
                  {getInitials(user?.fullName, user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden lg:flex flex-col items-start">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {user?.fullName || user?.email || 'Admin'}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Platform Admin
                </span>
              </div>
              <ChevronDown className="hidden lg:block h-4 w-4 text-gray-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/admin/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/admin/settings" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
           
              <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={() => setIsLogoutDialogOpen(true)}>
                <LogOut className="mr-2 h-4 w-4" />
              Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out? You'll need to log in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setIsLogoutDialogOpen(false)
                logout()
              }}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
  )
}
