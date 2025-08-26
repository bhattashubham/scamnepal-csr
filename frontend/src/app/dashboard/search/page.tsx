'use client'

import { useState, useEffect } from 'react'
import { 
  Search, 
  Filter, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  Star, 
  MapPin,
  Calendar,
  ExternalLink,
  Eye,
  Bookmark,
  Share2,
  Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useSearch, useAutocomplete, useTrending, useSavedSearches, useSaveSearch } from '@/hooks/useSearch'
import { formatRelativeTime, formatRiskScore } from '@/lib/utils'
import { SearchFilters, SearchResult } from '@/types'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<'relevance' | 'date' | 'risk_score' | 'title'>('relevance')
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('DESC')

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  // API hooks
  const { data: searchData, isLoading } = useSearch(
    debouncedQuery,
    filters,
    page,
    20,
    sortBy,
    sortOrder
  )
  
  const { data: autocompleteData } = useAutocomplete(query, 5)
  const { data: trendingData } = useTrending('day', 10)
  const { data: savedSearchesData } = useSavedSearches()
  const saveSearchMutation = useSaveSearch()

  const searchResults = searchData?.data?.results || []
  const totalResults = searchData?.data?.total || 0
  const suggestions = autocompleteData?.data?.suggestions || []
  const trending = trendingData?.data || []
  const savedSearches = savedSearchesData?.data || []

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery)
    setPage(1)
  }

  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    setFilters({ ...filters, ...newFilters })
    setPage(1)
  }

  const handleSaveSearch = async () => {
    if (query.trim()) {
      try {
        await saveSearchMutation.mutateAsync({
          query: query.trim(),
          filters,
          name: `Search: ${query.slice(0, 30)}${query.length > 30 ? '...' : ''}`
        })
      } catch (error) {
        console.error('Failed to save search:', error)
      }
    }
  }

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'report':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />
      case 'entity':
        return <Star className="h-5 w-5 text-red-500" />
      case 'identifier':
        return <MapPin className="h-5 w-5 text-blue-500" />
      default:
        return <Search className="h-5 w-5 text-gray-500" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'report':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'entity':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'identifier':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Search Registry</h1>
        <p className="text-gray-600">
          Search across reports, entities, and identifiers to find scam information
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Search Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Search Input */}
          <Card>
            <CardContent className="p-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Search by phone number, email, website, or description..."
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 pr-12 h-12 text-lg"
                />
                {query && (
                  <Button
                    onClick={handleSaveSearch}
                    disabled={saveSearchMutation.isPending}
                    className="absolute right-2 top-2 h-8"
                    size="sm"
                  >
                    <Bookmark className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Autocomplete Suggestions */}
              {suggestions.length > 0 && query && (
                <div className="mt-4 border border-gray-200 rounded-lg p-2 bg-white shadow-sm">
                  <p className="text-xs text-gray-500 px-2 py-1">Suggestions:</p>
                  <div className="space-y-1">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearch(suggestion.text)}
                        className="w-full text-left px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded flex items-center justify-between"
                      >
                        <span>{suggestion.text}</span>
                        <span className="text-xs text-gray-500">{suggestion.count} results</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search Controls */}
              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {Object.keys(filters).length > 0 && (
                      <span className="ml-2 bg-indigo-600 text-white rounded-full px-2 py-0.5 text-xs">
                        {Object.keys(filters).length}
                      </span>
                    )}
                  </Button>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                  >
                    <option value="relevance">Most Relevant</option>
                    <option value="date">Most Recent</option>
                    <option value="risk_score">Highest Risk</option>
                    <option value="title">Alphabetical</option>
                  </select>
                </div>

                {searchResults.length > 0 && (
                  <div className="text-sm text-gray-600">
                    {totalResults.toLocaleString()} results found
                  </div>
                )}
              </div>

              {/* Advanced Filters */}
              {showFilters && (
                <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <h4 className="font-medium text-gray-900 mb-4">Advanced Filters</h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Content Type
                      </label>
                      <div className="space-y-2">
                        {['report', 'entity', 'identifier'].map((type) => (
                          <label key={type} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={filters.types?.includes(type) || false}
                              onChange={(e) => {
                                const currentTypes = filters.types || []
                                const newTypes = e.target.checked
                                  ? [...currentTypes, type]
                                  : currentTypes.filter(t => t !== type)
                                handleFilterChange({ types: newTypes })
                              }}
                              className="mr-2"
                            />
                            <span className="text-sm capitalize">{type}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Risk Score Range
                      </label>
                      <div className="space-y-2">
                        <Input
                          type="number"
                          placeholder="Min score"
                          min="0"
                          max="100"
                          value={filters.riskScoreMin || ''}
                          onChange={(e) => handleFilterChange({
                            riskScoreMin: e.target.value ? parseInt(e.target.value) : undefined
                          })}
                        />
                        <Input
                          type="number"
                          placeholder="Max score"
                          min="0"
                          max="100"
                          value={filters.riskScoreMax || ''}
                          onChange={(e) => handleFilterChange({
                            riskScoreMax: e.target.value ? parseInt(e.target.value) : undefined
                          })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date Range
                      </label>
                      <div className="space-y-2">
                        <Input
                          type="date"
                          value={filters.dateFrom || ''}
                          onChange={(e) => handleFilterChange({ dateFrom: e.target.value })}
                        />
                        <Input
                          type="date"
                          value={filters.dateTo || ''}
                          onChange={(e) => handleFilterChange({ dateTo: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFilters({})
                        setShowFilters(false)
                      }}
                    >
                      Clear Filters
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setShowFilters(false)}
                    >
                      Apply Filters
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Search Results */}
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Searching...</p>
              </CardContent>
            </Card>
          ) : searchResults.length > 0 ? (
            <div className="space-y-4">
              {searchResults.map((result: SearchResult) => {
                const riskScore = result.metadata?.riskScore
                const riskInfo = riskScore ? formatRiskScore(riskScore) : null

                return (
                  <Card key={result.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            {getResultIcon(result.type)}
                            <div className={`px-2 py-1 rounded text-xs font-medium border ${getTypeColor(result.type)}`}>
                              {result.type}
                            </div>
                            {riskInfo && (
                              <div className={`px-2 py-1 rounded text-xs font-medium border ${riskInfo.bgColor} ${riskInfo.color}`}>
                                Risk: {riskScore}
                              </div>
                            )}
                            <div className="text-xs text-gray-500">
                              {formatRelativeTime(result.timestamp)}
                            </div>
                          </div>

                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            {result.title}
                          </h3>
                          
                          <p className="text-gray-600 mb-3 line-clamp-2">
                            {result.description}
                          </p>

                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span>Relevance: {Math.round(result.relevance * 100)}%</span>
                            {result.metadata?.category && (
                              <span>Category: {result.metadata.category}</span>
                            )}
                            {result.metadata?.reportCount && (
                              <span>Reports: {result.metadata.reportCount}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 ml-4">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}

              {/* Pagination */}
              {totalResults > 20 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-700">
                    Showing {(page - 1) * 20 + 1} to {Math.min(page * 20, totalResults)} of {totalResults} results
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page * 20 >= totalResults}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : query && !isLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                <p className="text-gray-600">
                  Try adjusting your search terms or filters
                </p>
              </CardContent>
            </Card>
          ) : null}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Saved Searches */}
          {savedSearches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bookmark className="h-5 w-5 mr-2" />
                  Saved Searches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {savedSearches.slice(0, 5).map((saved) => (
                    <button
                      key={saved.id}
                      onClick={() => {
                        setQuery(saved.query)
                        setFilters(saved.filters)
                      }}
                      className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                    >
                      <div className="font-medium truncate">{saved.name}</div>
                      <div className="text-xs text-gray-500">{saved.query}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trending Searches */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Trending Today
              </CardTitle>
              <CardDescription>
                Most searched items in the last 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {trending.slice(0, 8).map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(item.value)}
                    className="w-full text-left p-2 hover:bg-gray-50 rounded flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium truncate">{item.value}</p>
                      <p className="text-xs text-gray-500">{item.count} searches</p>
                    </div>
                    <div className="text-xs text-blue-600 font-medium">
                      {item.type}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Searches */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Recent Searches
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {['investment scam', 'fake bank email', '+91-9876543210', 'crypto fraud'].map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(search)}
                    className="w-full text-left p-2 text-sm text-gray-700 hover:bg-gray-100 rounded"
                  >
                    {search}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Results
              </Button>
              
              <Button 
                className="w-full justify-start" 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/dashboard/reports/new'}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Report Missing Item
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
