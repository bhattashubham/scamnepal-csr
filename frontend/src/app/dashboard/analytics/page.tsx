'use client'

import { useState } from 'react'
import { BarChart3, TrendingUp, Users, FileText, AlertTriangle, DollarSign, Calendar, Filter } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function AnalyticsPage() {
  const [timeframe, setTimeframe] = useState('month')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'NPR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive insights into scam reports and user activity</p>
        </div>
        <div className="flex items-center space-x-2">
          <select 
            value={timeframe} 
            onChange={(e) => setTimeframe(e.target.value)}
            className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(1247)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(892)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Amount Lost</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(2845000)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Risk Score</p>
                <p className="text-2xl font-bold text-gray-900">72</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Reports by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Reports by Category</CardTitle>
          <CardDescription>Distribution of scam reports across different categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <span className="font-medium">Phishing</span>
              <span className="text-blue-600 font-bold">456 (36.6%)</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <span className="font-medium">Investment Scams</span>
              <span className="text-green-600 font-bold">234 (18.8%)</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
              <span className="font-medium">Tech Support</span>
              <span className="text-yellow-600 font-bold">189 (15.2%)</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <span className="font-medium">Romance Scams</span>
              <span className="text-purple-600 font-bold">156 (12.5%)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trends</CardTitle>
          <CardDescription>Report volume over the last 8 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'].map((month, index) => (
              <div key={month} className="text-center">
                <div className="text-sm text-gray-600">{month}</div>
                <div className="text-lg font-bold text-gray-900">{89 + index * 2}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
