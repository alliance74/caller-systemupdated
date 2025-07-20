import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, FileText, Phone, MessageSquare } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const Scripts = () => {
  const [scripts, setScripts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingScript, setEditingScript] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    content: '',
    type: 'sms',
    variables: []
  })

  useEffect(() => {
    fetchScripts()
  }, [])

  const fetchScripts = async () => {
    try {
      const response = await axios.get('/api/scripts')
      setScripts(response.data)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching scripts:', error)
      toast.error('Failed to fetch scripts')
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingScript) {
        await axios.put(`/api/scripts/${editingScript._id}`, formData)
        toast.success('Script updated successfully')
      } else {
        await axios.post('/api/scripts', formData)
        toast.success('Script created successfully')
      }
      setShowModal(false)
      setEditingScript(null)
      setFormData({ name: '', description: '', content: '', type: 'sms', variables: [] })
      fetchScripts()
    } catch (error) {
      console.error('Error saving script:', error)
      toast.error('Failed to save script')
    }
  }

  const handleEdit = (script) => {
    setEditingScript(script)
    setFormData({
      name: script.name,
      description: script.description,
      content: script.content,
      type: script.type,
      variables: script.variables
    })
    setShowModal(true)
  }

  const handleDelete = async (scriptId) => {
    if (window.confirm('Are you sure you want to delete this script?')) {
      try {
        await axios.delete(`/api/scripts/${scriptId}`)
        toast.success('Script deleted successfully')
        fetchScripts()
      } catch (error) {
        console.error('Error deleting script:', error)
        toast.error('Failed to delete script')
      }
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'call': return <Phone className="h-5 w-5 text-green-500" />
      case 'sms': return <MessageSquare className="h-5 w-5 text-blue-500" />
      case 'whatsapp': return <MessageSquare className="h-5 w-5 text-green-600" />
      default: return <FileText className="h-5 w-5 text-gray-500" />
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
        <h1 className="text-2xl font-bold text-gray-900">Scripts</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Script
        </button>
      </div>

      {/* Scripts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {scripts.map((script) => (
          <div key={script._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                {getTypeIcon(script.type)}
                <span className="ml-2 text-sm font-medium text-gray-600 capitalize">{script.type}</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEdit(script)}
                  className="text-gray-400 hover:text-blue-500"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(script._id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{script.name}</h3>
            <p className="text-sm text-gray-600 mb-4">{script.description}</p>
            
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-sm text-gray-700 line-clamp-3">{script.content}</p>
            </div>
            
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Variables: {script.variables.length}</span>
              <span>{new Date(script.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingScript ? 'Edit Script' : 'Create New Script'}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    rows={8}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your script content here..."
                    required
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingScript(null)
                      setFormData({ name: '', description: '', content: '', type: 'sms', variables: [] })
                    }}
                    className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingScript ? 'Update' : 'Create'}
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

export default Scripts