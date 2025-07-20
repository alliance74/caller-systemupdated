import React, { useState, useEffect } from 'react';
import { Phone, MessageSquare, Users, FileText, Play, Send, TrendingUp, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
// import toast from 'react-hot-toast';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeCampaigns: 0,
    totalContacts: 0,
    totalScripts: 0,
    messagesSent: 0,
    callsMade: 0
  });

  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [campaignsRes, contactsRes, scriptsRes] = await Promise.all([
        axios.get('/api/campaigns'),
        axios.get('/api/contacts'),
        axios.get('/api/scripts')
      ]);

      const campaigns = campaignsRes.data;
      const contacts = contactsRes.data;
      const scripts = scriptsRes.data;

      setStats({
        totalCampaigns: campaigns.length,
        activeCampaigns: campaigns.filter((c: any) => c.status === 'running').length,
        totalContacts: contacts.length,
        totalScripts: scripts.length,
        messagesSent: campaigns.reduce((sum: number, c: any) => sum + c.stats.sent, 0),
        callsMade: campaigns.reduce((sum: number, c: any) => sum + c.stats.delivered, 0)
      });

      setRecentCampaigns(campaigns.slice(0, 5));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // toast.error('Failed to fetch dashboard data');
      setLoading(false);
    }
  };

  const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value.toLocaleString()}</p>
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="h-4 w-4 mr-2 text-green-500" />;
      case 'sms': return <MessageSquare className="h-4 w-4 mr-2 text-blue-500" />;
      case 'whatsapp': return <MessageSquare className="h-4 w-4 mr-2 text-green-500" />;
      default: return <MessageSquare className="h-4 w-4 mr-2 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex items-center space-x-3">
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh Data
          </button>
          <div className="flex items-center text-sm text-gray-500">
            <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
            System Online
          </div>
        </div>
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
          title="Messages Sent Today" 
          value={stats.messagesSent} 
          icon={MessageSquare} 
          color="bg-indigo-500" 
        />
        <StatCard 
          title="Calls Made Today" 
          value={stats.callsMade} 
          icon={Phone} 
          color="bg-red-500" 
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Campaigns */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Campaigns</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentCampaigns.map((campaign) => (
                <div key={campaign._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center">
                    {getTypeIcon(campaign.type)}
                    <div>
                      <div className="text-sm font-medium text-gray-900">{campaign.name}</div>
                      <div className="text-xs text-gray-500">{campaign.description}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(campaign.status)}`}>
                      {campaign.status}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      {campaign.stats.sent} / {campaign.stats.total}
                    </div>
                  </div>
                </div>
              ))}
              {recentCampaigns.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No campaigns yet. Create your first campaign to get started.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              <button className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Send className="h-5 w-5 mr-2" />
                Create New Campaign
              </button>
              <button className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <FileText className="h-5 w-5 mr-2" />
                Add New Script
              </button>
              <button className="w-full flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                <Users className="h-5 w-5 mr-2" />
                Import Contacts
              </button>
              <button className="w-full flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                <TrendingUp className="h-5 w-5 mr-2" />
                View Analytics
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Phone className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-sm font-medium text-gray-900">Twilio API</div>
              <div className="text-xs text-green-600">Connected</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-sm font-medium text-gray-900">SMS Service</div>
              <div className="text-xs text-green-600">Active</div>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <MessageSquare className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-sm font-medium text-gray-900">WhatsApp</div>
              <div className="text-xs text-green-600">Ready</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;