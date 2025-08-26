'use client'

import { useState } from 'react'
import { Settings, User, Shield, Bell, Key, Globe, Database, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'

export default function SettingsPage() {
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
