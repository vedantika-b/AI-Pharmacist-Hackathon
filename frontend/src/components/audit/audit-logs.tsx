'use client'

import { useState } from 'react'
import { useAuditLogs } from '@/stores/audit'
import { useAuth } from '@/stores/auth'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  Shield,
  User,
  Package,
  FileText,
  Calendar as CalendarIcon,
  ExternalLink
} from 'lucide-react'
import { cn, formatDateTime } from '@/lib/utils'
import { AuditLog } from '@/types'

const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    action: 'order_created',
    user_id: 'user_1',
    user_email: 'john@example.com',
    resource_type: 'order',
    resource_id: 'ord_123',
    details: {
      order_number: 'ORD-2024-001',
      total_amount: 45.99,
      items_count: 2,
      ai_confidence: 0.95
    },
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: '2024-01-20T14:30:00Z',
    severity: 'info'
  },
  {
    id: '2',
    action: 'prescription_validated',
    user_id: 'pharm_1',
    user_email: 'pharmacist@example.com',
    resource_type: 'prescription',
    resource_id: 'presc_456',
    details: {
      prescription_id: 'PRX-2024-456',
      patient_id: 'pat_789',
      medication: 'Metformin 500mg',
      validation_result: 'approved',
      warnings: ['Drug interaction check passed']
    },
    ip_address: '192.168.1.101',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: '2024-01-20T13:15:00Z',
    severity: 'info'
  },
  {
    id: '3',
    action: 'inventory_updated',
    user_id: 'admin_1',
    user_email: 'admin@example.com',
    resource_type: 'inventory',
    resource_id: 'inv_789',
    details: {
      product_name: 'Lisinopril 10mg',
      old_quantity: 100,
      new_quantity: 150,
      change_reason: 'Stock replenishment'
    },
    ip_address: '192.168.1.102',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: '2024-01-20T12:00:00Z',
    severity: 'info'
  },
  {
    id: '4',
    action: 'login_failed',
    user_id: null,
    user_email: 'invalid@example.com',
    resource_type: 'auth',
    resource_id: null,
    details: {
      reason: 'Invalid credentials',
      attempts: 3
    },
    ip_address: '192.168.1.200',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: '2024-01-20T10:45:00Z',
    severity: 'warning'
  },
  {
    id: '5',
    action: 'data_export',
    user_id: 'admin_1',
    user_email: 'admin@example.com',
    resource_type: 'report',
    resource_id: 'rpt_001',
    details: {
      export_type: 'prescription_report',
      date_range: '2024-01-01 to 2024-01-20',
      record_count: 1250
    },
    ip_address: '192.168.1.102',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    timestamp: '2024-01-20T09:30:00Z',
    severity: 'critical'
  }
]

const actionLabels = {
  'order_created': 'Order Created',
  'order_updated': 'Order Updated',
  'order_cancelled': 'Order Cancelled',
  'prescription_validated': 'Prescription Validated',
  'prescription_rejected': 'Prescription Rejected',
  'inventory_updated': 'Inventory Updated',
  'user_created': 'User Created',
  'user_updated': 'User Updated',
  'login_success': 'Login Success',
  'login_failed': 'Login Failed',
  'data_export': 'Data Export',
  'settings_changed': 'Settings Changed'
}

const severityColors = {
  'info': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  'warning': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  'error': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  'critical': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
}

const getActionIcon = (action: string) => {
  if (action.includes('order')) return <Package className="h-4 w-4" />
  if (action.includes('prescription')) return <FileText className="h-4 w-4" />
  if (action.includes('user') || action.includes('login')) return <User className="h-4 w-4" />
  if (action.includes('inventory')) return <Package className="h-4 w-4" />
  return <Info className="h-4 w-4" />
}

export function AuditLogs() {
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [dateRange, setDateRange] = useState<{from?: Date; to?: Date}>({})
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const { user } = useAuth()

  // Mock audit logs state - in real app, this would come from useAuditLogs store
  const { logs = mockAuditLogs, isLoading = false } = useAuditLogs()

  const isAdmin = user?.role === 'admin'

  if (!isAdmin) {
    return (
      <Card className="p-8 text-center">
        <Shield className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Access Restricted
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          You need admin privileges to access audit logs.
        </p>
      </Card>
    )
  }

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.resource_type?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter
    const matchesSeverity = severityFilter === 'all' || log.severity === severityFilter
    
    const logDate = new Date(log.timestamp)
    const matchesDateRange = (!dateRange.from || logDate >= dateRange.from) &&
                            (!dateRange.to || logDate <= dateRange.to)

    return matchesSearch && matchesAction && matchesSeverity && matchesDateRange
  })

  const uniqueActions = [...new Set(logs.map(log => log.action))]

  const handleExportLogs = () => {
    // Mock export functionality
    const csvContent = [
      ['Timestamp', 'Action', 'User', 'Resource Type', 'Resource ID', 'Severity', 'IP Address'].join(','),
      ...filteredLogs.map(log => [
        log.timestamp,
        log.action,
        log.user_email || 'N/A',
        log.resource_type || 'N/A',
        log.resource_id || 'N/A',
        log.severity,
        log.ip_address
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log)
    setIsDetailsDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Audit Logs
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            Monitor system activity and security events
          </p>
        </div>
        <Button onClick={handleExportLogs}>
          <Download className="h-4 w-4 mr-2" />
          Export Logs
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Events</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{logs.length}</p>
            </div>
            <Info className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Warnings</p>
              <p className="text-2xl font-bold text-yellow-600">
                {logs.filter(log => log.severity === 'warning').length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Errors</p>
              <p className="text-2xl font-bold text-red-600">
                {logs.filter(log => log.severity === 'error').length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Critical</p>
              <p className="text-2xl font-bold text-purple-600">
                {logs.filter(log => log.severity === 'critical').length}
              </p>
            </div>
            <Shield className="h-8 w-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by action, user, or resource..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>
                    {actionLabels[action as keyof typeof actionLabels] || action}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Date Range
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </Card>

      {/* Audit Logs Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  </TableRow>
                ))
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <FileText className="h-8 w-8 mx-auto text-gray-400 dark:text-gray-600 mb-2" />
                    <p className="text-gray-500 dark:text-gray-400">No audit logs found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="text-sm">
                        {formatDateTime(log.timestamp)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span className="font-medium">
                          {actionLabels[log.action as keyof typeof actionLabels] || log.action}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {log.user_email || 'System'}
                        </div>
                        {log.user_id && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            ID: {log.user_id}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {log.resource_type && (
                        <div>
                          <Badge variant="outline">{log.resource_type}</Badge>
                          {log.resource_id && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {log.resource_id}
                            </div>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={severityColors[log.severity]}>
                        {log.severity.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">{log.ip_address}</span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Log Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                    Timestamp
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDateTime(selectedLog.timestamp)}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                    Severity
                  </h4>
                  <Badge className={severityColors[selectedLog.severity]}>
                    {selectedLog.severity.toUpperCase()}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                    User
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {selectedLog.user_email || 'System'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                    IP Address
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                    {selectedLog.ip_address}
                  </p>
                </div>
                <div className="col-span-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
                    User Agent
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all">
                    {selectedLog.user_agent}
                  </p>
                </div>
              </div>
              
              {selectedLog.details && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Event Details
                  </h4>
                  <Card className="p-4 bg-gray-50 dark:bg-gray-800">
                    <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                      {JSON.stringify(selectedLog.details, null, 2)}
                    </pre>
                  </Card>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}