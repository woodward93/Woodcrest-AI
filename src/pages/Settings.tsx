import React, { useState, useEffect } from 'react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useSubscription } from '../hooks/useSubscription'
import { User, Mail, Save, AlertCircle, CheckCircle, Building, MapPin, Globe, Briefcase, FileText } from 'lucide-react'

export function Settings() {
  const { user } = useAuth()
  const { subscriptionPlan } = useSubscription()
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    bio: '',
    company: '',
    job_title: '',
    location: '',
    website: ''
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  useEffect(() => {
    loadProfile()
  }, [user])

  const loadProfile = async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setProfile({
          full_name: data.full_name || '',
          email: data.email || user.email || '',
          bio: data.bio || '',
          company: data.company || '',
          job_title: data.job_title || '',
          location: data.location || '',
          website: data.website || ''
        })
      } else {
        // Create profile if it doesn't exist
        setProfile({
          full_name: user.user_metadata?.full_name || '',
          email: user.email || '',
          bio: '',
          company: '',
          job_title: '',
          location: '',
          website: ''
        })
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      setMessage({ type: 'error', text: 'Failed to load profile' })
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    setMessage(null)

    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: profile.email,
          full_name: profile.full_name,
          bio: profile.bio,
          company: profile.company,
          job_title: profile.job_title,
          location: profile.location,
          website: profile.website,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      setMessage({ type: 'success', text: 'Profile updated successfully!' })
    } catch (error) {
      console.error('Error saving profile:', error)
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-primary-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <User className="h-5 w-5 mr-2 text-primary-600" />
                Basic Information
              </h2>
            
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Full Name"
                  type="text"
                  value={profile.full_name}
                  onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                  icon={<User className="h-4 w-4" />}
                  placeholder="Enter your full name"
                />

                <Input
                  label="Email"
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                  icon={<Mail className="h-4 w-4" />}
                  placeholder="Enter your email"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-start pt-3 pointer-events-none text-gray-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <textarea
                    value={profile.bio}
                    onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself..."
                    rows={3}
                    className="block w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2 text-sm placeholder-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors duration-200 resize-none"
                  />
                </div>
              </div>
            </Card>

            {/* Professional Information */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <Briefcase className="h-5 w-5 mr-2 text-primary-600" />
                Professional Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Company"
                  type="text"
                  value={profile.company}
                  onChange={(e) => setProfile(prev => ({ ...prev, company: e.target.value }))}
                  icon={<Building className="h-4 w-4" />}
                  placeholder="Your company name"
                />

                <Input
                  label="Job Title"
                  type="text"
                  value={profile.job_title}
                  onChange={(e) => setProfile(prev => ({ ...prev, job_title: e.target.value }))}
                  icon={<Briefcase className="h-4 w-4" />}
                  placeholder="Your job title"
                />

                <Input
                  label="Location"
                  type="text"
                  value={profile.location}
                  onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
                  icon={<MapPin className="h-4 w-4" />}
                  placeholder="City, Country"
                />

                <Input
                  label="Website"
                  type="url"
                  value={profile.website}
                  onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
                  icon={<Globe className="h-4 w-4" />}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </Card>

            {/* Save Button */}
            <Card>
              {message && (
                <div className={`p-3 rounded-lg flex items-center space-x-2 ${
                  message.type === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-700' 
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {message.type === 'success' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <span className="text-sm">{message.text}</span>
                </div>
              )}

              <Button onClick={saveProfile} loading={saving} className="w-full">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </Card>
          </div>

          {/* Account Info */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Account Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <p className="text-sm text-gray-600">
                  {profile.full_name || 'Not provided'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Plan
                </label>
                <div className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  subscriptionPlan === 'premium' 
                    ? 'bg-gradient-to-r from-primary-100 to-secondary-100 text-primary-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {subscriptionPlan === 'premium' ? 'Premium' : 'Free'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <p className="text-sm text-gray-600">
                  {profile.company || 'Not provided'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Created
                </label>
                <p className="text-sm text-gray-600">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
                </p>
              </div>

            </div>
          </Card>
        </div>

        {/* Danger Zone */}
        <Card>
          <h2 className="text-lg font-semibold text-red-900 mb-4">Danger Zone</h2>
          <div className="border border-red-200 rounded-lg p-4">
            <h3 className="font-medium text-red-900 mb-2">Delete Account</h3>
            <p className="text-red-700 text-sm mb-4">
              Once you delete your account, there is no going back. This will permanently delete your account and all your data.
            </p>
            <Button variant="outline" className="text-red-700 border-red-300 hover:bg-red-50">
              Delete Account
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}