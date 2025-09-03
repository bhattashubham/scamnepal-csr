'use client'

import { useState, useRef, useEffect } from 'react'
import { Settings, User, Shield, Bell, Key, Globe, Database, Save, Upload, Camera } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/stores/auth'
import { useUploadProfileImage } from '@/hooks/useUsers'

export default function SettingsPage() {
  const { user, getProfile } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadProfileImageMutation = useUploadProfileImage()
  const [profileSettings, setProfileSettings] = useState({
    firstName: 'Bhatta',
    lastName: 'Shubham',
    email: 'bhattashubham@gmail.com',
    phone: '+977 1234567890'
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    reportUpdates: true,
    moderationAlerts: true,
    weeklyDigest: false
  })

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordExpiry: 90
  })

  const handleProfileSave = () => {
    // Handle profile save
    console.log('Profile saved:', profileSettings)
  }

  const handleNotificationSave = () => {
    // Handle notification settings save
    console.log('Notification settings saved:', notificationSettings)
  }

  const handleSecuritySave = () => {
    // Handle security settings save
    console.log('Security settings saved:', securitySettings)
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) {
      console.log('No file selected')
      return
    }

    console.log('File selected:', file.name, file.size, file.type)

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    try {
      console.log('Starting upload...')
      const result = await uploadProfileImageMutation.mutateAsync(file)
      console.log('Upload result:', result)
      
      // Refresh user profile to get updated profile image
      console.log('Refreshing profile...')
      await getProfile()
      console.log('Profile refreshed')
      
      alert('Profile image updated successfully!')
    } catch (error: any) {
      console.error('Upload error:', error)
      alert(`Error uploading image: ${error.message}`)
    }
  }

  const handleImageClick = () => {
    console.log('Image click - current user:', user)
    console.log('Image click - user.profileImage:', user?.profileImage)
    fileInputRef.current?.click()
  }

  // Debug: Log user data changes
  useEffect(() => {
    console.log('Settings page - User data changed:', user)
    console.log('Settings page - Profile image:', user?.profileImage)
  }, [user])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">Manage your account preferences and security settings</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="h-5 w-5 mr-2" />
            Profile Settings
          </CardTitle>
          <CardDescription>Update your personal information and contact details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Profile Image Upload */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              {user?.profileImage ? (
                <img 
                  src={`http://localhost:3001${user.profileImage}`} 
                  alt={user.email}
                  className="w-20 h-20 rounded-full object-cover border-4 border-gray-200 cursor-pointer hover:border-indigo-300 transition-colors"
                  onClick={handleImageClick}
                  onError={(e) => {
                    console.error('Image failed to load:', e.currentTarget.src)
                    e.currentTarget.style.display = 'none'
                  }}
                  onLoad={() => console.log('Image loaded successfully:', user.profileImage)}
                />
              ) : (
                <div 
                  className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border-4 border-gray-200 cursor-pointer hover:border-indigo-300 transition-colors"
                  onClick={handleImageClick}
                >
                  <Camera className="h-8 w-8 text-gray-400" />
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 bg-indigo-600 rounded-full p-1 cursor-pointer hover:bg-indigo-700 transition-colors">
                <Upload className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">Profile Picture</h3>
              <p className="text-sm text-gray-500">Click to upload a new profile image</p>
              <p className="text-xs text-gray-400">JPG, PNG, GIF up to 5MB</p>
              <div className="mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={async () => {
                    console.log('Manual refresh clicked')
                    await getProfile()
                    console.log('Manual refresh completed')
                  }}
                >
                  Refresh Profile
                </Button>
              </div>
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={profileSettings.firstName}
                onChange={(e) => setProfileSettings({...profileSettings, firstName: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={profileSettings.lastName}
                onChange={(e) => setProfileSettings({...profileSettings, lastName: e.target.value})}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profileSettings.email}
                onChange={(e) => setProfileSettings({...profileSettings, email: e.target.value})}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={profileSettings.phone}
                onChange={(e) => setProfileSettings({...profileSettings, phone: e.target.value})}
              />
            </div>
          </div>
          
          <Button onClick={handleProfileSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Profile
          </Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Configure how you receive notifications and updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Notifications</Label>
                <p className="text-sm text-gray-500">Receive notifications via email</p>
              </div>
              <Switch
                checked={notificationSettings.emailNotifications}
                onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, emailNotifications: checked})}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label>SMS Notifications</Label>
                <p className="text-sm text-gray-500">Receive notifications via SMS</p>
              </div>
              <Switch
                checked={notificationSettings.smsNotifications}
                onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, smsNotifications: checked})}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Report Updates</Label>
                <p className="text-sm text-gray-500">Get notified when your reports are updated</p>
              </div>
              <Switch
                checked={notificationSettings.reportUpdates}
                onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, reportUpdates: checked})}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Moderation Alerts</Label>
                <p className="text-sm text-gray-500">Receive alerts for moderation tasks</p>
              </div>
              <Switch
                checked={notificationSettings.moderationAlerts}
                onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, moderationAlerts: checked})}
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Weekly Digest</Label>
                <p className="text-sm text-gray-500">Receive weekly summary emails</p>
              </div>
              <Switch
                checked={notificationSettings.weeklyDigest}
                onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, weeklyDigest: checked})}
              />
            </div>
          </div>
          
          <Button onClick={handleNotificationSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Notifications
          </Button>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Security Settings
          </CardTitle>
          <CardDescription>Manage your account security and authentication</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Two-Factor Authentication</Label>
                <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
              </div>
              <Switch
                checked={securitySettings.twoFactorAuth}
                onCheckedChange={(checked) => setSecuritySettings({...securitySettings, twoFactorAuth: checked})}
              />
            </div>
            
            <Separator />
            
            <div>
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={securitySettings.sessionTimeout}
                onChange={(e) => setSecuritySettings({...securitySettings, sessionTimeout: parseInt(e.target.value)})}
                className="w-32"
              />
              <p className="text-sm text-gray-500">How long to keep you logged in</p>
            </div>
            
            <Separator />
            
            <div>
              <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
              <Input
                id="passwordExpiry"
                type="number"
                value={securitySettings.passwordExpiry}
                onChange={(e) => setSecuritySettings({...securitySettings, passwordExpiry: parseInt(e.target.value)})}
                className="w-32"
              />
              <p className="text-sm text-gray-500">How often to require password changes</p>
            </div>
          </div>
          
          <Button onClick={handleSecuritySave}>
            <Save className="h-4 w-4 mr-2" />
            Save Security Settings
          </Button>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            System Information
          </CardTitle>
          <CardDescription>View system details and version information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">App Version:</span> 1.0.0
            </div>
            <div>
              <span className="font-medium">Database:</span> PostgreSQL 15
            </div>
            <div>
              <span className="font-medium">Environment:</span> Development
            </div>
            <div>
              <span className="font-medium">Last Updated:</span> {new Date().toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
