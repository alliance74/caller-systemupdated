import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Play, Pause, Users, MessageSquare, Phone } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const Campaigns = () => {
  const [campaigns, setCampaigns] = useState([])
  const [scripts, setScripts] = useState([])
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'sms',
    scriptId: '',
    contacts: [],
    scheduledAt: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [campaignsRes, scriptsRes, contactsRes] = await Promise.all([
        axios.get('/api/campaigns'),
        axios.get('/api/scripts'),
        axios.get('/api/contacts')
      ])
      
      setCampaigns(campaignsRes.data)
      setScripts(scriptsRes.data)
      setContacts(contactsRes.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to fetch data')
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const campaignData = {
        ...formData,
        stats: {
          total: formData.contacts.length,
          sent: 0,
          delivered: 0,
          failed: 0,
          responded: 0
        }
      }

      if (editingCampaign) {
        await axios.put(`/api/campaigns/${editingCampaign._id}`, campaignData)
        toast.success('Campaign updated successfully')
      } else {
        await axios.post('/api/campaigns', campaignData)
        toast.success('Campaign created successfully')
      }
      
      setShowModal(false)
      setEditingCampaign(null)
      setFormData({ name: '', description: '', type: 'sms', scriptId: '', contacts: [], scheduledAt: '' })
      fetchData()
    } catch (error) {
      console.error('Error saving campaign:', error)
      toast.error('Failed to save campaign')
    }
  }

  const handleEdit = (campaign) => {
    setEditingCampaign(campaign)
    setFormData({
      name: campaign.name,
      description: campaign.description,
      type: campaign.type,
      scriptId: campaign.scriptId._id,
      contacts: campaign.contacts.map(c => c._id),
      scheduledAt: campaign.scheduledAt ? new Date(campaign.scheduledAt).toISOString().slice(0, 16) : ''
    })
    setShowModal(true)
  }

  const handleDelete = async (campaignId) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      try {
        await axios.delete(`/api/campaigns/${campaignId}`)
        toast.success('Campaign deleted successfully')
        fetchData()
      } catch (error) {
        console.error('Error deleting campaign:', error)
        toast.error('Failed to delete campaign')
      }
    }
  }

  const handleStartCampaign = async (campaignId) => {
    try {
      await axios.post(`/api/campaigns/${campaignId}/start`)
      toast.success('Campaign started successfully')
      fetchData()
    } catch (error) {
      console.error('Error starting campaign:', error)
      toast.error('Failed to start campaign')
    }
  }

  const handlePauseCampaign = async (campaignId) => {
    try {
      await axios.post(`/api/campaigns/${campaignId}/pause`)
      toast.success('Campaign paused successfully')
      fetchData()
    } catch (error) {
      console.error('Error pausing campaign:', error)
      toast.error('Failed to pause campaign')
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'scheduled': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'call': return <Phone className="h-5 w-5 text-green-500" />
      case 'sms': return <MessageSquare className="h-5 w-5 text-blue-500" />
      case 'whatsapp': return <MessageSquare className="h-5 w-5 text-green-600" />
      default: return <MessageSquare className="h-5 w-5 text-gray-500" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Campaign
        </button>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="overflow-x-auto">
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
                  Contacts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {campaigns.map((campaign) => (
                <tr key={campaign._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                    <div className="text-sm text-gray-500">{campaign.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getTypeIcon(campaign.type)}
                      <span className="ml-2 text-sm text-gray-900 capitalize">{campaign.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${campaign.stats.total ? (campaign.stats.sent / campaign.stats.total) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {campaign.stats.sent} / {campaign.stats.total}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-sm text-gray-900">{campaign.contacts.length}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {campaign.status === 'draft' || campaign.status === 'paused' ? (
                        <button
                          onClick={() => handleStartCampaign(campaign._id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                      ) : campaign.status === 'running' ? (
                        <button
                          onClick={() => handlePauseCampaign(campaign._id)}
                          className="text-yellow-600 hover:text-yellow-900"
                        >
                          <Pause className="h-4 w-4" />
                        </button>
                      ) : null}
                      <button
                        onClick={() => handleEdit(campaign)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(campaign._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="sms">SMS</option>
                    <option value="call">Call</option>
                    <option value="whatsapp">WhatsApp</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Script</label>
                  <select
                    value={formData.scriptId}
                    onChange={(e) => setFormData({ ...formData, scriptId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a script</option>
                    {scripts.filter(script => script.type === formData.type).map(script => (
                      <option key={script._id} value={script._id}>{script.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contacts</label>
                  <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md">
                    {contacts.map(contact => (
                      <label key={contact._id} className="flex items-center p-2 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={formData.contacts.includes(contact._id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, contacts: [...formData.contacts, contact._id] })
                            } else {
                              setFormData({ ...formData, contacts: formData.contacts.filter(id => id !== contact._id) })
                            }
                          }}
                          className="mr-2"
                        />
                        <span className="text-sm">{contact.firstName} {contact.lastName} - {contact.phone}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Schedule (Optional)</label>
                  <input
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingCampaign(null)
                      setFormData({ name: '', description: '', type: 'sms', scriptId: '', contacts: [], scheduledAt: '' })
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingCampaign ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Campaigns