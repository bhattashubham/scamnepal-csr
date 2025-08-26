'use client'

import { useState } from 'react'
import { HelpCircle, Search, BookOpen, MessageCircle, FileText, Video, Mail, Phone, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const faqs = [
  {
    question: "How do I report a scam?",
    answer: "To report a scam, go to the Reports section and click 'New Report'. Fill out the form with details about the incident, including the scammer's information, amount lost, and any evidence you have."
  },
  {
    question: "What information do I need to report a scam?",
    answer: "You'll need the scammer's contact details (phone, email, social media), the amount lost, incident date, and a description of what happened. Evidence like screenshots or documents can also be uploaded."
  },
  {
    question: "How long does it take to review a report?",
    answer: "Reports are typically reviewed within 24-48 hours by our moderation team. High-priority cases may be reviewed sooner."
  },
  {
    question: "Can I update my report after submission?",
    answer: "Yes, you can update your report at any time. Go to the Reports section, find your report, and click 'Edit' to make changes."
  },
  {
    question: "How do I know if my report was verified?",
    answer: "You'll receive email notifications when your report status changes. You can also check the status in your Reports dashboard."
  }
]

const helpCategories = [
  {
    title: "Getting Started",
    icon: BookOpen,
    description: "Learn the basics of using the platform",
    items: [
      "Creating your first report",
      "Understanding the dashboard",
      "Setting up notifications"
    ]
  },
  {
    title: "Reporting Scams",
    icon: FileText,
    description: "Everything about submitting and managing reports",
    items: [
      "Report submission guide",
      "Evidence upload tips",
      "Report status tracking"
    ]
  },
  {
    title: "Moderation",
    icon: MessageCircle,
    description: "How reports are reviewed and verified",
    items: [
      "Moderation process",
      "Community verification",
      "Appeal process"
    ]
  },
  {
    title: "Account Management",
    icon: HelpCircle,
    description: "Managing your account and settings",
    items: [
      "Profile settings",
      "Security preferences",
      "Privacy controls"
    ]
  }
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)

  const filteredFaqs = faqs.filter(faq => 
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
        <p className="text-gray-600">Find answers to common questions and get help when you need it</p>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search for help topics, questions, or guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Quick Help Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {helpCategories.map((category, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3 mb-3">
                <category.icon className="h-6 w-6 text-indigo-600" />
                <h3 className="font-medium text-gray-900">{category.title}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">{category.description}</p>
              <ul className="text-xs text-gray-500 space-y-1">
                {category.items.map((item, itemIndex) => (
                  <li key={itemIndex}>• {item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* FAQ Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <HelpCircle className="h-5 w-5 mr-2" />
            Frequently Asked Questions
          </CardTitle>
          <CardDescription>Find quick answers to common questions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredFaqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50"
                >
                  <span className="font-medium">{faq.question}</span>
                  {expandedFaq === index ? (
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  )}
                </button>
                {expandedFaq === index && (
                  <div className="px-4 pb-4">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact Support */}
      <Card>
        <CardHeader>
          <CardTitle>Still Need Help?</CardTitle>
          <CardDescription>Our support team is here to help you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <Mail className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900">Email Support</h3>
              <p className="text-sm text-gray-600">support@scamnepal.org</p>
              <p className="text-xs text-gray-500">Response within 24 hours</p>
            </div>
            
            <div className="text-center">
              <Phone className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900">Phone Support</h3>
              <p className="text-sm text-gray-600">+977 1-4-123456</p>
              <p className="text-xs text-gray-500">Mon-Fri, 9 AM - 6 PM</p>
            </div>
            
            <div className="text-center">
              <MessageCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900">Live Chat</h3>
              <p className="text-sm text-gray-600">Available on website</p>
              <p className="text-xs text-gray-500">Real-time assistance</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Resources */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Resources</CardTitle>
          <CardDescription>External resources and documentation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <Video className="h-5 w-5 text-red-600" />
              <div>
                <h4 className="font-medium text-gray-900">Video Tutorials</h4>
                <p className="text-sm text-gray-600">Step-by-step video guides</p>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
            </div>
            
            <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <h4 className="font-medium text-gray-900">User Manual</h4>
                <p className="text-sm text-gray-600">Comprehensive documentation</p>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
            </div>
            
            <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <HelpCircle className="h-5 w-5 text-green-600" />
              <div>
                <h4 className="font-medium text-gray-900">Community Forum</h4>
                <p className="text-sm text-gray-600">Ask questions to other users</p>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
            </div>
            
            <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <BookOpen className="h-5 w-5 text-purple-600" />
              <div>
                <h4 className="font-medium text-gray-900">Knowledge Base</h4>
                <p className="text-sm text-gray-600">Detailed articles and guides</p>
              </div>
              <ExternalLink className="h-4 w-4 text-gray-400 ml-auto" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
