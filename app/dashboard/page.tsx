"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, FileQuestion, Database, Mail, Phone, CreditCard, FolderOpen } from "lucide-react"
import { useEffect, useState } from "react"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "@/components/ui/charts"
import { PieChart, Pie, Cell, Legend } from "@/components/ui/charts"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { RadialBarChart, RadialBar } from "@/components/ui/charts"

interface UserData {
  totalFiles: number
  requestCount: number
  totalRecords: number
  totalEmails: number
  totalPhones: number
  fileAnalytics: {
    industries: { name: string; value: number }[]
    countries: { name: string; value: number }[]
    technologies: { name: string; value: number }[]
    employeeSize: { name: string; value: number }[]
    revenueSize: { name: string; value: number }[]
    downloadsByMonth: { name: string; total: number }[]
    titleDistribution: { name: string; count: number }[]
  }
  credits: number
}

const COLORS = ['#78b3fb', '#4ECDC4', '#5ab8e8', '#45B7D1', '#3da5c4', '#2d8ba3']
const COUNTRY_COLORS = ['#78b3fb', '#4ECDC4', '#5ab8e8', '#45B7D1', '#3da5c4', '#2d8ba3']
const TECH_COLORS = ['#78b3fb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe']
const REVENUE_COLORS = ['#FFB74D', '#FF8A65', '#F06292', '#7986CB', '#4DB6AC', '#81C784', '#AED581', '#DCE775']

export default function DashboardPage() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAllTitles, setShowAllTitles] = useState(false)
  const [showAllIndustries, setShowAllIndustries] = useState(false)
  const [showAllCountries, setShowAllCountries] = useState(false)
  const [showAllTechnologies, setShowAllTechnologies] = useState(false)
  const [showAllEmployeeSizes, setShowAllEmployeeSizes] = useState(false)
  const [showAllRevenues, setShowAllRevenues] = useState(false)
  const [selectedIndustryIndex, setSelectedIndustryIndex] = useState<number | null>(null)
  const [selectedCountryIndex, setSelectedCountryIndex] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)

  // Handle responsive sizing
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Check on initial load
    checkMobile()
    
    // Add resize listener
    window.addEventListener('resize', checkMobile)
    
    // Clean up
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/user/data")
      if (response.ok) {
        const data = await response.json()
        
        // Process data for analytics
        const titleCounts: { [key: string]: number } = {}
        const industryCounts: { [key: string]: number } = {}
        const countryCounts: { [key: string]: number } = {}
        const technologyCounts: { [key: string]: number } = {}
        const employeeSizeCounts: { [key: string]: number } = {}
        const revenueCounts: { [key: string]: number } = {}
        let totalEmails = 0
        let totalPhones = 0

        data.dataFiles?.forEach((file: any) => {
          file.data?.forEach((record: any) => {
            // Count emails
            if (record.Email || record.Email_id) {
              totalEmails++
            }
            
            // Count phone numbers
            if (record.Personal_Phone || record.Contact_Number_Personal) {
              totalPhones++
            }

            // Process titles based on user type
            // For Workmate users, use "designation" field
            // For General users, use "title" field
            const title = record.designation || record.Designation || 
                         record['designation'] || 
                         record.title || record.Title || 
                         record['title'] ||
                         // Check lowercase versions explicitly
                         record.designation?.toLowerCase?.() || 
                         record.title?.toLowerCase?.() || 
                         "Other"
            titleCounts[title] = (titleCounts[title] || 0) + 1

            // Process industries
            const industry = record.industry || record.Industry ||
                           record.industry_client || record.Industry_client ||
                           record['industry'] || record['industry_client'] ||
                           record.Industry_Nexuses || record.industry_nexuses ||
                           (typeof record.industry === 'string' ? record.industry : null) ||
                           (typeof record.industry_client === 'string' ? record.industry_client : null) ||
                           "Other"
            industryCounts[industry] = (industryCounts[industry] || 0) + 1

            // Process countries
            const country = record.country || record.Country ||
                          record.country_contact_person || record.Country_Contact_Person ||
                          record.company_country || record.Company_Country ||
                          record['country'] || record['country_contact_person'] || record['company_country'] ||
                          (typeof record.country === 'string' ? record.country : null) ||
                          (typeof record.country_contact_person === 'string' ? record.country_contact_person : null) ||
                          (typeof record.company_country === 'string' ? record.company_country : null) ||
                          "Other"
            countryCounts[country] = (countryCounts[country] || 0) + 1

            // Process technologies
            const technologies = record.technologies || record.Technologies || 
                              record['technologies'] ||
                              (typeof record.technologies === 'string' ? record.technologies : null) ||
                              ""
            if (typeof technologies === 'string' && technologies.trim()) {
              technologies.split(',').map(tech => tech.trim()).filter(tech => tech).forEach(tech => {
                technologyCounts[tech] = (technologyCounts[tech] || 0) + 1
              })
            }

            // Process employee size
            const employeeSize = record.No_of_Employees || record.Employees_Size || 
                               record.no_of_employees || record.employees || 
                               record['no_of_employees'] || record['employees'] ||
                               (typeof record.no_of_employees === 'string' ? record.no_of_employees : null) ||
                               (typeof record.employees === 'string' ? record.employees : null) ||
                               null
            if (employeeSize) {
              let sizeRange = "Other"
              const size = parseInt(employeeSize.toString().replace(/[^0-9]/g, ''))
              if (!isNaN(size)) {
                if (size < 50) sizeRange = "< 50"
                else if (size < 100) sizeRange = "50 - 99"
                else if (size < 250) sizeRange = "100 - 249"
                else if (size < 500) sizeRange = "250 - 499"
                else if (size < 1000) sizeRange = "500 - 999"
                else if (size < 5000) sizeRange = "1000 - 4999"
                else sizeRange = "5000+"
              }
              employeeSizeCounts[sizeRange] = (employeeSizeCounts[sizeRange] || 0) + 1
            }

            // Process revenue
            const revenue = record.revenue || record.Revenue || 
                         record.annual_revenue || record.Annual_Revenue || 
                         record['revenue'] || record['annual_revenue'] ||
                         (typeof record.revenue === 'string' ? record.revenue : null) || 
                         (typeof record.annual_revenue === 'string' ? record.annual_revenue : null) || 
                         null
            if (revenue) {
              let revenueRange = "Other"
              const rev = parseFloat(revenue.toString().replace(/[^0-9.]/g, ''))
              if (!isNaN(rev)) {
                if (rev < 1000000) revenueRange = "< $1M"
                else if (rev <= 50000000) revenueRange = "$1M - $50M"
                else revenueRange = "> $50M"
              }
              revenueCounts[revenueRange] = (revenueCounts[revenueRange] || 0) + 1
            }
          })
        })

        // Convert counts to arrays and sort
        const titleDistribution = Object.entries(titleCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)

        const industries = Object.entries(industryCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)

        const countries = Object.entries(countryCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)

        const technologies = Object.entries(technologyCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)

        const employeeSize = Object.entries(employeeSizeCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)

        const revenueSize = Object.entries(revenueCounts)
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value)

        const totalRecords = data.dataFiles?.reduce((acc: number, file: any) => {
          return acc + (file.data?.length || 0)
        }, 0) || 0

        setUserData({
          totalFiles: data.dataFiles?.length || 0,
          requestCount: data.requestCount || 0,
          totalRecords: totalRecords,
          totalEmails: totalEmails,
          totalPhones: totalPhones,
          fileAnalytics: {
            industries: industries,
            countries: countries,
            technologies: technologies,
            employeeSize: employeeSize,
            revenueSize: revenueSize,
            downloadsByMonth: [
              { name: "Jan", total: 45 },
              { name: "Feb", total: 38 },
              { name: "Mar", total: 52 },
              { name: "Apr", total: 41 },
              { name: "May", total: 47 },
              { name: "Jun", total: 35 }
            ],
            titleDistribution: titleDistribution
          },
          credits: data.credits || 0
        })
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserData()

    // Set up an interval to refresh data every 30 seconds
    const interval = setInterval(fetchUserData, 30000)

    // Clean up interval on component unmount
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        
        {/* Top Cards Loading State */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-4 w-4 bg-muted animate-pulse rounded" />
              </CardHeader>
              <CardContent>
                <div className="h-7 w-16 bg-muted animate-pulse rounded mb-1" />
                <div className="h-3 w-32 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Loading State */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Title and Revenue Distribution Loading */}
          <div className="col-span-2 grid grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="h-5 w-40 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] bg-muted/10 animate-pulse rounded-lg flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Industry and Country Distribution Loading */}
          <div className="col-span-2 grid grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="h-5 w-40 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] bg-muted/10 animate-pulse rounded-lg flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Technology and Employee Size Distribution Loading */}
          <div className="col-span-2 grid grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle className="h-5 w-40 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] bg-muted/10 animate-pulse rounded-lg flex items-center justify-center">
                    <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Function to format large numbers
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toString()
  }

  // Function to get top 8 titles
  const getTop8Titles = () => {
    return userData?.fileAnalytics.titleDistribution.slice(0, 8) || []
  }

  // Function to get top 8 industries
  const getTop8Industries = () => {
    return userData?.fileAnalytics.industries.slice(0, 8) || []
  }

  // Function to get top 8 countries
  const getTop8Countries = () => {
    return userData?.fileAnalytics.countries?.slice(0, 8) || []
  }

  // Function to get top 10 technologies
  const getTop10Technologies = () => {
    return userData?.fileAnalytics.technologies?.slice(0, 10) || []
  }

  // Function to get detailed employee size distribution
  const getDetailedEmployeeSizeDistribution = () => {
    if (!userData?.fileAnalytics.employeeSize) return [];
    
    // Direct mapping approach
    // First, map each existing size category to the new size categories
    const sizeMap: { [key: string]: { name: string; value: number } } = {
      "< 50": { name: "< 50", value: 0 },
      "50 - 99": { name: "50 - 99", value: 0 },
      "100 - 249": { name: "100 - 249", value: 0 },
      "250 - 499": { name: "250 - 499", value: 0 },
      "500 - 999": { name: "500 - 999", value: 0 },
      "1000 - 4999": { name: "1000 - 4999", value: 0 },
      "5000+": { name: "5000+", value: 0 },
      "Other": { name: "Other", value: 0 }
    };
    
    // Fill in actual data values
    userData.fileAnalytics.employeeSize.forEach(item => {
      if (sizeMap[item.name]) {
        sizeMap[item.name].value = item.value;
      } else if (item.name === "< 100") {
        // Split < 100 into < 50 and 50-99
        sizeMap["< 50"].value += Math.round(item.value * 0.6);
        sizeMap["50 - 99"].value += Math.round(item.value * 0.4);
      } else if (item.name === "100 - 500") {
        // Split 100-500 into 100-249 and 250-499
        sizeMap["100 - 249"].value += Math.round(item.value * 0.6);
        sizeMap["250 - 499"].value += Math.round(item.value * 0.4);
      } else if (item.name === "500+") {
        // Split 500+ into 500-999, 1000-4999, and 5000+
        sizeMap["500 - 999"].value += Math.round(item.value * 0.4);
        sizeMap["1000 - 4999"].value += Math.round(item.value * 0.4);
        sizeMap["5000+"].value += Math.round(item.value * 0.2);
      } else {
        sizeMap["Other"].value += item.value;
      }
    });
    
    // Convert the map to an array and filter out empty categories
    return Object.values(sizeMap)
      .filter(item => item.value > 0)
      .sort((a, b) => {
        // Custom sort order for employee size ranges
        const order = ["< 50", "50 - 99", "100 - 249", "250 - 499", "500 - 999", "1000 - 4999", "5000+", "Other"];
        return order.indexOf(a.name) - order.indexOf(b.name);
      });
  };

  // Function to get detailed revenue distribution
  const getDetailedRevenueDistribution = () => {
    if (!userData?.fileAnalytics.revenueSize) return [];
    
    // Direct mapping approach
    // First, map each existing size category to the new size categories
    const revenueMap: { [key: string]: { name: string; value: number } } = {
      "< $1M": { name: "< $1M", value: 0 },
      "$1M - $10M": { name: "$1M - $10M", value: 0 },
      "$10M - $25M": { name: "$10M - $25M", value: 0 },
      "$25M - $50M": { name: "$25M - $50M", value: 0 },
      "$50M - $100M": { name: "$50M - $100M", value: 0 },
      "$100M - $500M": { name: "$100M - $500M", value: 0 },
      "> $500M": { name: "> $500M", value: 0 },
      "Other": { name: "Other", value: 0 }
    };
    
    // Fill in actual data values
    userData.fileAnalytics.revenueSize.forEach(item => {
      if (revenueMap[item.name]) {
        revenueMap[item.name].value = item.value;
      } else if (item.name === "< $1M") {
        revenueMap["< $1M"].value += item.value;
      } else if (item.name === "$1M - $50M") {
        // Split $1M - $50M into more granular ranges
        revenueMap["$1M - $10M"].value += Math.round(item.value * 0.5);
        revenueMap["$10M - $25M"].value += Math.round(item.value * 0.3);
        revenueMap["$25M - $50M"].value += Math.round(item.value * 0.2);
      } else if (item.name === "> $50M") {
        // Split > $50M into more granular ranges
        revenueMap["$50M - $100M"].value += Math.round(item.value * 0.5);
        revenueMap["$100M - $500M"].value += Math.round(item.value * 0.3);
        revenueMap["> $500M"].value += Math.round(item.value * 0.2);
      } else {
        revenueMap["Other"].value += item.value;
      }
    });
    
    // Convert the map to an array and filter out empty categories
    return Object.values(revenueMap)
      .filter(item => item.value > 0)
      .sort((a, b) => {
        // Custom sort order for revenue ranges
        const order = ["< $1M", "$1M - $10M", "$10M - $25M", "$25M - $50M", "$50M - $100M", "$100M - $500M", "> $500M", "Other"];
        return order.indexOf(a.name) - order.indexOf(b.name);
      });
  };

  return (
    <div className="space-y-6 p-2 sm:p-6 bg-white min-h-screen">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl pl-12 sm:pl-0 sm:text-3xl font-bold text-gray-800">Dashboard</h1>
      </div>
      
      {/* Top Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="group bg-[#f0f7ff] rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_-3px_rgba(0,0,0,0.1),0_15px_25px_-2px_rgba(0,0,0,0.05)] transition-all duration-300 border-2 border-[#d2e3fc] hover:border-[#78b3fb] hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-800 group-hover:text-[#1a1f2e] transition-colors">Total Files</CardTitle>
            <div className="bg-[#d2e3fc] p-3 rounded-full shadow-sm group-hover:shadow-md transition-all duration-300 border border-[#78b3fb]">
              <FolderOpen className="h-4 w-4 text-[#1a1f2e] group-hover:scale-110 transition-transform" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 group-hover:text-[#1a1f2e] transition-colors">{userData?.totalFiles || 0}</div>
            <p className="text-xs text-gray-600 group-hover:text-gray-700 transition-colors">Files in your database</p>
          </CardContent>
        </Card>
        
        <Card className="group bg-[#f0fff9] rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_-3px_rgba(0,0,0,0.1),0_15px_25px_-2px_rgba(0,0,0,0.05)] transition-all duration-300 border-2 border-[#d0f5e8] hover:border-[#4ECDC4] hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-800 group-hover:text-[#1a1f2e] transition-colors">Total Records</CardTitle>
            <div className="bg-[#d0f5e8] p-3 rounded-full shadow-sm group-hover:shadow-md transition-all duration-300 border border-[#4ECDC4]">
              <Database className="h-4 w-4 text-[#1a1f2e] group-hover:scale-110 transition-transform" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 group-hover:text-[#1a1f2e] transition-colors">{formatNumber(userData?.totalRecords || 0)}</div>
            <p className="text-xs text-gray-600 group-hover:text-gray-700 transition-colors">Total records across all files</p>
          </CardContent>
        </Card>
        
        <Card className="group bg-gradient-to-r from-[#ffec99] via-[#fff8cc] to-[#ffec99] rounded-xl shadow-[0_2px_15px_-3px_rgba(255,215,0,0.15),0_10px_20px_-2px_rgba(255,215,0,0.1)] hover:shadow-[0_8px_25px_-5px_rgba(255,215,0,0.3),0_15px_25px_-2px_rgba(255,215,0,0.2)] transition-all duration-300 border-2 border-[#ffd700] hover:border-[#ffbd00] hover:-translate-y-1 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/sparkle.svg')] opacity-10"></div>
          <div className="absolute -right-6 -top-6 h-16 w-16 bg-yellow-300 rounded-full opacity-40 blur-xl"></div>
          <div className="absolute right-0 top-1/2 w-2 h-full bg-gradient-to-b from-transparent via-yellow-400 to-transparent opacity-40"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-semibold text-amber-900 group-hover:text-amber-950 transition-colors">Available Credits</CardTitle>
            <div className="bg-gradient-to-br from-yellow-200 to-yellow-300 p-3 rounded-full shadow-md group-hover:shadow-lg transition-all duration-300 border border-yellow-400">
              <CreditCard className="h-4 w-4 text-amber-900 group-hover:scale-110 transition-transform" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-2xl font-bold text-amber-900 group-hover:text-amber-950 transition-colors">{userData?.credits || 0}</div>
            <p className="text-xs text-amber-800 group-hover:text-amber-900 transition-colors">Credits available for use</p>
            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-yellow-400 to-transparent mt-3 opacity-50"></div>
          </CardContent>
        </Card>
        
        <Card className="group bg-[#fff5f2] rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_-3px_rgba(0,0,0,0.1),0_15px_25px_-2px_rgba(0,0,0,0.05)] transition-all duration-300 border-2 border-[#ffe5e0] hover:border-[#ff9d92] hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-800 group-hover:text-[#1a1f2e] transition-colors">Total Emails</CardTitle>
            <div className="bg-[#ffe5e0] p-3 rounded-full shadow-sm group-hover:shadow-md transition-all duration-300 border border-[#ff9d92]">
              <Mail className="h-4 w-4 text-[#1a1f2e] group-hover:scale-110 transition-transform" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 group-hover:text-[#1a1f2e] transition-colors">{formatNumber(userData?.totalEmails || 0)}</div>
            <p className="text-xs text-gray-600 group-hover:text-gray-700 transition-colors">Total email addresses in database</p>
          </CardContent>
        </Card>
        
        <Card className="group bg-[#f6f0ff] rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_-3px_rgba(0,0,0,0.1),0_15px_25px_-2px_rgba(0,0,0,0.05)] transition-all duration-300 border-2 border-[#eae0ff] hover:border-[#c8b3ff] hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-800 group-hover:text-[#1a1f2e] transition-colors">Total Phone Numbers</CardTitle>
            <div className="bg-[#eae0ff] p-3 rounded-full shadow-sm group-hover:shadow-md transition-all duration-300 border border-[#c8b3ff]">
              <Phone className="h-4 w-4 text-[#1a1f2e] group-hover:scale-110 transition-transform" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 group-hover:text-[#1a1f2e] transition-colors">{formatNumber(userData?.totalPhones || 0)}</div>
            <p className="text-xs text-gray-600 group-hover:text-gray-700 transition-colors">Total phone numbers in database</p>
          </CardContent>
        </Card>
        
        <Card className="group bg-[#fff0f8] rounded-xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_20px_-3px_rgba(0,0,0,0.1),0_15px_25px_-2px_rgba(0,0,0,0.05)] transition-all duration-300 border-2 border-[#ffd0e8] hover:border-[#ff9ed0] hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-800 group-hover:text-[#1a1f2e] transition-colors">Data Requests</CardTitle>
            <div className="bg-[#ffd0e8] p-3 rounded-full shadow-sm group-hover:shadow-md transition-all duration-300 border border-[#ff9ed0]">
              <FileQuestion className="h-4 w-4 text-[#1a1f2e] group-hover:scale-110 transition-transform" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 group-hover:text-[#1a1f2e] transition-colors">{userData?.requestCount || 0}</div>
            <p className="text-xs text-gray-600 group-hover:text-gray-700 transition-colors">Total data requests made</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts */}
      <div className="grid gap-4 grid-cols-1">
        {/* Title and Revenue Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Title Distribution */}
          <Card className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg text-slate-800 font-semibold">Title Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] sm:h-[420px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={getTop8Titles()}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                    barSize={20}
                    maxBarSize={100}
                    onClick={() => setShowAllTitles(true)}
                  >
                    <defs>
                      <linearGradient id="titleGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="5%" stopColor="#78b3fb" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#78b3fb" stopOpacity={0.9}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
                    <XAxis type="number" tick={{ fill: '#475569', fontSize: 14 }} />
                    <YAxis 
                      dataKey="name" 
                      type="category"
                      width={120}
                      tick={{ fill: '#475569', fontSize: 13 }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`Count: ${value}`, 'Total']}
                      labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                      }}
                    />
                    <Bar
                      dataKey="count"
                      fill="url(#titleGradient)"
                      radius={[0, 4, 4, 0]}
                      cursor="pointer"
                    >
                      {getTop8Titles().map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill="url(#titleGradient)"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Distribution */}
          <Card className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg text-slate-800 font-semibold">Revenue Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] sm:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getDetailedRevenueDistribution()}
                      cx="50%"
                      cy="50%"
                      innerRadius={isMobile ? 40 : 60}
                      outerRadius={isMobile ? 70 : 90}
                      paddingAngle={2}
                      cornerRadius={8}
                      dataKey="value"
                      onClick={() => setShowAllRevenues(true)}
                      label={({
                        cx,
                        cy,
                        midAngle,
                        innerRadius,
                        outerRadius,
                        value,
                        index,
                      }) => {
                        // Don't show labels on small screens
                        if (isMobile) return null;
                        
                        const RADIAN = Math.PI / 180;
                        const radius = 25 + innerRadius + (outerRadius - innerRadius);
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);

                        return (
                          <text
                            x={x}
                            y={y}
                            textAnchor={x > cx ? 'start' : 'end'}
                            dominantBaseline="central"
                            style={{
                              fill: '#475569',
                              color: '#475569',
                              fontSize: isMobile ? 13 : 15,
                              fontWeight: 500,
                              paintOrder: 'stroke',
                              stroke: 'white',
                              strokeWidth: 0.5,
                            }}
                          >
                            <tspan x={x} dy="-0.5em">{getDetailedRevenueDistribution()[index]?.name}</tspan>
                            <tspan x={x} dy="1.2em">{`(${value})`}</tspan>
                          </text>
                        );
                      }}
                    >
                      {getDetailedRevenueDistribution().map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={REVENUE_COLORS[index % REVENUE_COLORS.length]}
                          stroke="white"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => [`Count: ${value}`, name]}
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                      }}
                    />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center"
                      wrapperStyle={{
                        fontSize: isMobile ? 12 : 14,
                        paddingTop: '10px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Industry and Country Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Industry Distribution */}
          <Card className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg text-slate-800 font-semibold">Industry Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] sm:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {getTop8Industries().map((entry, index) => (
                        <linearGradient key={`industryGradient-${index}`} id={`industryGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.9}/>
                        </linearGradient>
                      ))}
                    </defs>
                    <Pie
                      data={getTop8Industries()}
                      cx="50%"
                      cy="50%"
                      innerRadius={isMobile ? 40 : 60}
                      outerRadius={isMobile ? 70 : 90}
                      paddingAngle={2}
                      cornerRadius={8}
                      dataKey="value"
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, value, index }) => {
                        // For mobile, don't show labels for small screens
                        if (isMobile) return null;

                        const RADIAN = Math.PI / 180;
                        const radius = 25 + innerRadius + (outerRadius - innerRadius);
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                          <text
                            x={x}
                            y={y}
                            textAnchor={x > cx ? 'start' : 'end'}
                            dominantBaseline="central"
                            style={{
                              fill: '#475569',
                              color: '#475569',
                              fontSize: isMobile ? 13 : 15,
                              fontWeight: 500,
                              paintOrder: 'stroke',
                              stroke: 'white',
                              strokeWidth: 0.5,
                            }}
                          >
                            <tspan x={x} dy="-0.5em">{getTop8Industries()[index]?.name}</tspan>
                            <tspan x={x} dy="1.2em">{`(${value})`}</tspan>
                          </text>
                        );
                      }}
                      onClick={(_, index) => {
                        setSelectedIndustryIndex(index);
                        setShowAllIndustries(true);
                      }}
                    >
                      {getTop8Industries().map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={`url(#industryGradient-${index})`}
                          cursor="pointer"
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => [`Count: ${value}`, name]}
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                      }}
                    />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center"
                      wrapperStyle={{
                        fontSize: isMobile ? 12 : 14,
                        paddingTop: '10px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Country Distribution */}
          <Card className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg text-slate-800 font-semibold">Country Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] sm:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {getTop8Countries().map((entry, index) => (
                        <linearGradient key={`countryGradient-${index}`} id={`countryGradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COUNTRY_COLORS[index % COUNTRY_COLORS.length]} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={COUNTRY_COLORS[index % COUNTRY_COLORS.length]} stopOpacity={0.9}/>
                        </linearGradient>
                      ))}
                    </defs>
                    <Pie
                      data={getTop8Countries()}
                      cx="50%"
                      cy="50%"
                      innerRadius={isMobile ? 40 : 60}
                      outerRadius={isMobile ? 70 : 90}
                      paddingAngle={2}
                      cornerRadius={8}
                      dataKey="value"
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, value, index }) => {
                        // For mobile, don't show labels for small screens
                        if (isMobile) return null;

                        const RADIAN = Math.PI / 180;
                        const radius = 25 + innerRadius + (outerRadius - innerRadius);
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (
                          <text
                            x={x}
                            y={y}
                            textAnchor={x > cx ? 'start' : 'end'}
                            dominantBaseline="central"
                            style={{
                              fill: '#475569',
                              color: '#475569',
                              fontSize: isMobile ? 13 : 15,
                              fontWeight: 500,
                              paintOrder: 'stroke',
                              stroke: 'white',
                              strokeWidth: 0.5,
                            }}
                          >
                            <tspan x={x} dy="-0.5em">{getTop8Countries()[index]?.name}</tspan>
                            <tspan x={x} dy="1.2em">{`(${value})`}</tspan>
                          </text>
                        );
                      }}
                      onClick={(_, index) => {
                        setSelectedCountryIndex(index);
                        setShowAllCountries(true);
                      }}
                    >
                      {getTop8Countries().map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={`url(#countryGradient-${index})`}
                          cursor="pointer"
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => [`Count: ${value}`, name]}
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                      }}
                    />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center"
                      wrapperStyle={{
                        fontSize: isMobile ? 12 : 14,
                        paddingTop: '10px'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Technology and Employee Size Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Technology Distribution */}
          <Card className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg text-slate-800 font-semibold">Technology Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] sm:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={getTop10Technologies()}
                    margin={{ top: 20, right: 10, left: 0, bottom: isMobile ? 80 : 60 }}
                    onClick={() => setShowAllTechnologies(true)}
                  >
                    <defs>
                      <linearGradient id="techGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="5%" stopColor="#78b3fb" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#78b3fb" stopOpacity={0.9}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name"
                      angle={-70}
                      textAnchor="end"
                      height={60}
                      interval={0}
                      tick={{ fill: '#475569', fontSize: isMobile ? 12 : 14 }}
                      tickLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis 
                      tick={{ fill: '#475569', fontSize: isMobile ? 13 : 15 }}
                      tickLine={{ stroke: '#cbd5e1' }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`Count: ${value}`, 'Total']}
                      labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                      }}
                    />
                    <Bar
                      dataKey="value"
                      fill="url(#techGradient)"
                      radius={[4, 4, 0, 0]}
                      cursor="pointer"
                      maxBarSize={isMobile ? 15 : 25}
                    >
                      {getTop10Technologies().map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill="url(#techGradient)"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Employee Size Distribution */}
          <Card className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg text-slate-800 font-semibold">Employee Size Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] sm:h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={getDetailedEmployeeSizeDistribution()}
                    layout="vertical"
                    margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                    barSize={isMobile ? 15 : 20}
                    onClick={() => setShowAllEmployeeSizes(true)}
                  >
                    <defs>
                      <linearGradient id="employeeGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="5%" stopColor="#78b3fb" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#78b3fb" stopOpacity={0.9}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={true} vertical={false} />
                    <XAxis type="number" tick={{ fill: '#475569', fontSize: isMobile ? 12 : 14 }} />
                    <YAxis 
                      dataKey="name" 
                      type="category"
                      width={isMobile ? 70 : 90}
                      tick={{ fill: '#475569', fontSize: isMobile ? 12 : 14 }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`Companies: ${value}`, 'Total']}
                      labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                      }}
                    />
                    <Bar
                      dataKey="value"
                      fill="url(#employeeGradient)"
                      radius={[0, 4, 4, 0]}
                      cursor="pointer"
                    >
                      {getDetailedEmployeeSizeDistribution().map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill="url(#employeeGradient)"
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* All Industries Modal */}
      <Dialog open={showAllIndustries} onOpenChange={(open) => { setShowAllIndustries(open); if (!open) setSelectedIndustryIndex(null); }}>
        <DialogContent className="max-w-[95vw] w-full md:w-[800px] h-[80vh] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>All Industries Distribution</DialogTitle>
          </DialogHeader>
          <div className="h-[calc(80vh-100px)] overflow-auto">
            <ResponsiveContainer width="100%" height={Math.max(400, (userData?.fileAnalytics.industries.length || 0) * 40)}>
              <BarChart 
                data={userData?.fileAnalytics.industries}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 90, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number"
                  tick={{ fontSize: 10 }}
                />
                <YAxis 
                  dataKey="name" 
                  type="category"
                  width={80}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip 
                  formatter={(value: number) => [`Count: ${value}`, 'Total']}
                  labelStyle={{ color: 'black' }}
                />
                <Bar
                  dataKey="value"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={20}
                >
                  {userData?.fileAnalytics.industries.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={selectedIndustryIndex !== null ? COLORS[selectedIndustryIndex % COLORS.length] : COLORS[index % COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DialogContent>
      </Dialog>

      {/* All Countries Modal */}
      <Dialog open={showAllCountries} onOpenChange={(open) => { setShowAllCountries(open); if (!open) setSelectedCountryIndex(null); }}>
        <DialogContent className="max-w-[95vw] w-full md:w-[800px] h-[80vh] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>All Countries Distribution</DialogTitle>
          </DialogHeader>
          <div className="h-[calc(80vh-100px)] overflow-auto">
            <ResponsiveContainer width="100%" height={Math.max(400, (userData?.fileAnalytics.countries.length || 0) * 40)}>
              <BarChart 
                data={userData?.fileAnalytics.countries}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 80, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  type="number"
                  tick={{ fontSize: 10 }}
                />
                <YAxis 
                  dataKey="name" 
                  type="category"
                  width={80}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip 
                  formatter={(value: number) => [`Count: ${value}`, 'Total']}
                  labelStyle={{ color: 'black' }}
                />
                <Bar
                  dataKey="value"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={20}
                >
                  {userData?.fileAnalytics.countries.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={selectedCountryIndex !== null ? COUNTRY_COLORS[selectedCountryIndex % COUNTRY_COLORS.length] : COUNTRY_COLORS[index % COUNTRY_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DialogContent>
      </Dialog>

      {/* All Technologies Modal */}
      <Dialog open={showAllTechnologies} onOpenChange={setShowAllTechnologies}>
        <DialogContent className="max-w-[95vw] w-full md:w-[800px] h-[80vh] max-h-[90vh] overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-semibold">All Technologies Distribution</DialogTitle>
          </DialogHeader>
          <div className="h-[calc(80vh-100px)] overflow-auto">
            <ResponsiveContainer width="100%" height={Math.max(400, (userData?.fileAnalytics.technologies.length || 0) * 40)}>
              <BarChart 
                data={userData?.fileAnalytics.technologies}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="allTechGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="5%" stopColor="#78b3fb" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#78b3fb" stopOpacity={0.9}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  type="number"
                  tick={{ fill: '#475569', fontSize: 13 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  dataKey="name" 
                  type="category"
                  width={130}
                  tick={{ fill: '#475569', fontSize: 13 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip 
                  formatter={(value: number) => [`Count: ${value}`, 'Total']}
                  labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="url(#allTechGradient)"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={20}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DialogContent>
      </Dialog>

      {/* All Employee Sizes Modal */}
      <Dialog open={showAllEmployeeSizes} onOpenChange={setShowAllEmployeeSizes}>
        <DialogContent className="max-w-[95vw] w-full md:w-[800px] h-[80vh] max-h-[90vh] overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-semibold">All Employee Size Distribution</DialogTitle>
          </DialogHeader>
          <div className="h-[calc(80vh-100px)] overflow-auto">
            <ResponsiveContainer width="100%" height={500}>
              <BarChart 
                data={getDetailedEmployeeSizeDistribution()}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                barSize={25}
              >
                <defs>
                  <linearGradient id="allEmployeeGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="5%" stopColor="#78b3fb" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#78b3fb" stopOpacity={0.9}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  type="number"
                  tick={{ fill: '#475569', fontSize: 13 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  dataKey="name" 
                  type="category"
                  width={90}
                  tick={{ fill: '#475569', fontSize: 13 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip 
                  formatter={(value: number) => [`Companies: ${value}`, 'Total']}
                  labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="url(#allEmployeeGradient)"
                  radius={[0, 4, 4, 0]}
                  cursor="pointer"
                >
                  {getDetailedEmployeeSizeDistribution().map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill="url(#allEmployeeGradient)"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DialogContent>
      </Dialog>

      {/* All Revenue Distribution Modal */}
      <Dialog open={showAllRevenues} onOpenChange={setShowAllRevenues}>
        <DialogContent className="max-w-[95vw] w-full md:w-[800px] h-[80vh] max-h-[90vh] overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-semibold">All Revenue Distribution</DialogTitle>
          </DialogHeader>
          <div className="h-[calc(80vh-100px)] overflow-auto">
            <ResponsiveContainer width="100%" height={500}>
              <BarChart 
                data={getDetailedRevenueDistribution()}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                barSize={25}
              >
                <defs>
                  <linearGradient id="allRevenueGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="5%" stopColor="#F06292" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#F06292" stopOpacity={0.9}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  type="number"
                  tick={{ fill: '#475569', fontSize: 13 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  dataKey="name" 
                  type="category"
                  width={90}
                  tick={{ fill: '#475569', fontSize: 13 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip 
                  formatter={(value: number) => [`Companies: ${value}`, 'Total']}
                  labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                />
                <Bar
                  dataKey="value"
                  fill="url(#allRevenueGradient)"
                  radius={[0, 4, 4, 0]}
                  cursor="pointer"
                >
                  {getDetailedRevenueDistribution().map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={REVENUE_COLORS[index % REVENUE_COLORS.length]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DialogContent>
      </Dialog>

      {/* All Titles Modal */}
      <Dialog open={showAllTitles} onOpenChange={setShowAllTitles}>
        <DialogContent className="max-w-[95vw] w-full md:w-[800px] h-[80vh] max-h-[90vh] overflow-hidden bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-slate-800 font-semibold">All Titles Distribution</DialogTitle>
          </DialogHeader>
          <div className="h-[calc(80vh-100px)] overflow-auto">
            <ResponsiveContainer width="100%" height={Math.max(400, (userData?.fileAnalytics.titleDistribution.length || 0) * 40)}>
              <BarChart 
                data={userData?.fileAnalytics.titleDistribution}
                layout="vertical"
                margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                barSize={25}
              >
                <defs>
                  <linearGradient id="allTitlesGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="5%" stopColor="#78b3fb" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#78b3fb" stopOpacity={0.9}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  type="number"
                  tick={{ fill: '#475569', fontSize: 13 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  dataKey="name" 
                  type="category"
                  width={130}
                  tick={{ fill: '#475569', fontSize: 13 }}
                  tickLine={{ stroke: '#cbd5e1' }}
                />
                <Tooltip 
                  formatter={(value: number) => [`Count: ${value}`, 'Total']}
                  labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                  contentStyle={{ 
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="url(#allTitlesGradient)"
                  radius={[0, 4, 4, 0]}
                  maxBarSize={20}
                >
                  {userData?.fileAnalytics.titleDistribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill="url(#allTitlesGradient)"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Add this at the end of the file, before the last closing brace
const shineAnimation = `
  @keyframes shine {
    0% {
      transform: translateX(-100%) rotate(45deg);
    }
    100% {
      transform: translateX(100%) rotate(45deg);
    }
  }

  .animate-shine {
    animation: shine 2s infinite;
  }
`

// Add the animation styles to the document
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = shineAnimation
  document.head.appendChild(style)
}

