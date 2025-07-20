import React, { useState, useEffect } from 'react'
import { Phone, MessageSquare, Users, FileText, Play, Pause, TrendingUp, Send } from 'lucide-react'
import axios from 'axios'
import TestCall from '../components/TestCall'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalContacts: 0,
    totalScripts: 0,
    messagesSent: 0,
    callsMade: 0
  })

  const [recentCampaigns, setRecentCampaigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setError(null)
      setLoading(true)

      const [campaignsRes, contactsRes, scriptsRes] = await Promise.all([
        axios.get('/api/campaigns'),
        axios.get('/api/contacts'),
        axios.get('/api/scripts')
      ])

      const campaigns = campaignsRes.data || []
      const contacts = contactsRes.data || []
      const scripts = scriptsRes.data || []

      setStats({
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter(c => c.status === 'running').length,
        totalContacts: contacts.length,
        totalScripts: scripts.length,
        messagesSent: campaigns.reduce((sum, c) => sum + (c.stats?.sent || 0), 0),
        callsMade: campaigns.reduce((sum, c) => sum + (c.stats?.delivered || 0), 0)
      })

      setRecentCampaigns(campaigns.slice(0, 5))
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  )

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'scheduled': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Campaigns" 
          value={stats.totalCampaigns} 
          icon={Send} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Active Campaigns" 
          value={stats.activeCampaigns} 
          icon={Play} 
          color="bg-green-500" 
        />
        <StatCard 
          title="Total Contacts" 
          value={stats.totalContacts} 
          icon={Users} 
          color="bg-purple-500" 
        />
        <StatCard 
          title="Scripts" 
          value={stats.totalScripts} 
          icon={FileText} 
          color="bg-orange-500" 
        />
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StatCard 
          title="Messages Sent" 
          value={stats.messagesSent} 
          icon={MessageSquare} 
          color="bg-indigo-500" 
        />
        <StatCard 
          title="Calls Made" 
          value={stats.callsMade} 
          icon={Phone} 
          color="bg-red-500" 
        />
      </div>

      {/* Recent Campaigns */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Campaigns</h2>
        </div>
        <div className="overflow-x-auto">
          {recentCampaigns.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campaign
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentCampaigns.map((campaign) => (
                  <tr key={campaign._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                      <div className="text-sm text-gray-500">{campaign.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {campaign.type === 'sms' && <MessageSquare className="h-4 w-4 mr-2 text-blue-500" />}
                        {campaign.type === 'call' && <Phone className="h-4 w-4 mr-2 text-green-500" />}
                        {campaign.type === 'whatsapp' && <MessageSquare className="h-4 w-4 mr-2 text-green-500" />}
                        <span className="text-sm text-gray-900 capitalize">{campaign.type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(campaign.stats?.sent || 0)} / {(campaign.stats?.total || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {campaign.createdAt ? new Date(campaign.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No campaigns found
            </div>
          )}
        </div>
      </div>

      {/* Add TestCall component */}
      <TestCall />
    </div>
  )
}

export default Dashboard