"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { toast } from '@/components/ui/toast'
import { Skeleton } from '@/components/ui/skeleton'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Calendar, ChevronDown, Info, Settings, User, AlertCircle, CheckCircle, XCircle, Search, Mail, Phone, Copy, Home, Plus, Minus, Star, Palette } from 'lucide-react'
import { Toggle } from '@/components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from '@/components/ui/command'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator, ContextMenuShortcut } from '@/components/ui/context-menu'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { ThemeSelector } from '@/components/ui/theme-selector'
import { useThemeConfig } from '@/components/ui/active-theme'
import { DataTable } from '@/components/ui/data-table'
import { PageHeader, PageHeaderActions, PageHeaderContent } from '@/components/ui/page-header'
import { ActionList, ActionListItem, ActionListSeparator, ActionListSection } from '@/components/ui/action-list'

export default function UIPreview() {
  const [progress, setProgress] = useState(65)
  const [sliderValue, setSliderValue] = useState([50])
  const [commandOpen, setCommandOpen] = useState(false)
  const [otpValue, setOtpValue] = useState("")
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(false)
  const { activeTheme } = useThemeConfig()

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Modern ERP UI Components
          </h1>
          <p className="text-lg text-muted-foreground">
            Professional, clean, and modern component library for enterprise applications
          </p>
        </div>

        {/* Theme Selection */}
        <ComponentSection title="Theme Selection" description="Interactive theme switching with Claude theme support">
          <div className="space-y-6">
            {/* Current Theme Status */}
            <div className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl border border-primary/20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold">Active Theme Selector</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Choose from different themes including the new Claude theme with modern OKLCH colors
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      Current: {activeTheme || 'default'}
                    </Badge>
                    {activeTheme === 'claude' && (
                      <Badge className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                        OKLCH Colors
                      </Badge>
                    )}
                  </div>
                </div>
                <ThemeSelector />
              </div>
            </div>
            
            {/* Theme Color Palette Demo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Primary Colors</h4>
                <div className="space-y-2">
                  <div className="h-12 bg-primary rounded-md flex items-center justify-center text-primary-foreground text-xs font-medium">
                    Primary
                  </div>
                  <div className="h-8 bg-secondary rounded-md flex items-center justify-center text-secondary-foreground text-xs">
                    Secondary
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Status Colors</h4>
                <div className="space-y-2">
                  <div className="h-8 bg-destructive rounded-md flex items-center justify-center text-destructive-foreground text-xs">
                    Destructive
                  </div>
                  <div className="h-8 bg-muted rounded-md flex items-center justify-center text-muted-foreground text-xs">
                    Muted
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Surface Colors</h4>
                <div className="space-y-2">
                  <div className="h-8 bg-card border rounded-md flex items-center justify-center text-card-foreground text-xs">
                    Card
                  </div>
                  <div className="h-8 bg-accent rounded-md flex items-center justify-center text-accent-foreground text-xs">
                    Accent
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-medium">Interactive</h4>
                <div className="space-y-2">
                  <div className="h-8 border-2 border-ring rounded-md flex items-center justify-center text-xs">
                    Ring/Focus
                  </div>
                  <div className="h-8 bg-input border rounded-md flex items-center justify-center text-xs">
                    Input
                  </div>
                </div>
              </div>
            </div>

            {/* Theme Comparison Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-6">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Claude Theme Features
                  </CardTitle>
                  <CardDescription>
                    Modern theme with OKLCH color space for better color perception
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    OKLCH color space support
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Modern color palette
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Dark mode optimized
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Accessibility focused
                  </div>
                </CardContent>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-primary" />
                    Theme Integration
                  </CardTitle>
                  <CardDescription>
                    Seamlessly integrated with your existing component system
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 space-y-3">
                  <Badge variant="secondary" className="w-fit">Settings Integration</Badge>
                  <Badge variant="outline" className="w-fit">Local Storage</Badge>
                  <Badge className="w-fit">Live Preview</Badge>
                  <p className="text-sm text-muted-foreground mt-3">
                    Change themes instantly and see the effects across all components
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Theme Details - Show when Claude theme is active */}
            {activeTheme === 'claude' && (
              <Card className="p-6 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                    <Palette className="h-5 w-5" />
                    Claude Theme Active - OKLCH Color Values
                  </CardTitle>
                  <CardDescription className="text-orange-700 dark:text-orange-300">
                    Currently using the Claude theme with modern OKLCH color space
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-orange-800 dark:text-orange-200">Light Mode Colors</h4>
                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border" style={{backgroundColor: 'oklch(0.6171 0.1375 39.0427)'}}></div>
                          <span>Primary: oklch(0.6171 0.1375 39.0427)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border" style={{backgroundColor: 'oklch(0.9818 0.0054 95.0986)'}}></div>
                          <span>Background: oklch(0.9818 0.0054 95.0986)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border" style={{backgroundColor: 'oklch(0.9245 0.0138 92.9892)'}}></div>
                          <span>Secondary: oklch(0.9245 0.0138 92.9892)</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-orange-800 dark:text-orange-200">Dark Mode Colors</h4>
                      <div className="space-y-2 text-xs font-mono">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border" style={{backgroundColor: 'oklch(0.6724 0.1308 38.7559)'}}></div>
                          <span>Primary: oklch(0.6724 0.1308 38.7559)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border" style={{backgroundColor: 'oklch(0.2679 0.0036 106.6427)'}}></div>
                          <span>Background: oklch(0.2679 0.0036 106.6427)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 rounded border" style={{backgroundColor: 'oklch(0.9818 0.0054 95.0986)'}}></div>
                          <span>Secondary: oklch(0.9818 0.0054 95.0986)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-orange-100 dark:bg-orange-800 rounded-lg">
                    <p className="text-xs text-orange-800 dark:text-orange-200">
                      <strong>OKLCH Benefits:</strong> Better color perception, consistent appearance across devices, 
                      future-proof color technology, and improved accessibility.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Instructions for other themes */}
            {activeTheme !== 'claude' && (
              <Card className="p-6 border-dashed border-2 border-muted-foreground/20">
                <CardContent className="p-0 text-center space-y-3">
                  <div className="p-3 bg-muted/20 rounded-full w-fit mx-auto">
                    <Palette className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">Switch to Claude Theme</h3>
                  <p className="text-sm text-muted-foreground max-w-md mx-auto">
                    Select "Claude" from the theme selector above to see the modern OKLCH color values 
                    and experience the enhanced visual design.
                  </p>
                  <Badge variant="outline" className="text-xs">
                    Current theme: {activeTheme || 'default'}
                  </Badge>
                </CardContent>
              </Card>
            )}
          </div>
        </ComponentSection>

        {/* Buttons Section */}
        <ComponentSection title="Buttons" description="Various button styles and states including ERP-style variants">
          <div className="space-y-6">
            {/* Standard Variants */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Standard Variants</h4>
              <div className="flex flex-wrap gap-4">
                <Button variant="default">Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="outline">Outline Button</Button>
                <Button variant="destructive">Destructive Button</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="link">Link Button</Button>
              </div>
            </div>

            {/* ERP-Style Polaris Variants */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">ERP-Style Polaris Variants</h4>
              <div className="flex flex-wrap gap-4">
                <Button variant="polaris">Polaris Button</Button>
                <Button variant="critical">Critical Action</Button>
                <Button variant="success">Success Action</Button>
                <Button variant="warning">Warning Action</Button>
                <Button variant="minimal">Minimal Button</Button>
                <Button variant="plain">Plain Button</Button>
                <Button variant="monochrome">Monochrome</Button>
              </div>
            </div>

            {/* Sizes */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Sizes</h4>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm" variant="polaris">Small</Button>
                <Button size="default" variant="polaris">Default</Button>
                <Button size="lg" variant="polaris">Large</Button>
                <Button size="xl" variant="polaris">Extra Large</Button>
                <Button size="icon" variant="polaris"><Settings className="h-4 w-4" /></Button>
                <Button size="icon-sm" variant="polaris"><Settings className="h-4 w-4" /></Button>
                <Button size="icon-lg" variant="polaris"><Settings className="h-4 w-4" /></Button>
              </div>
            </div>

            {/* Full Width */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Full Width</h4>
              <div className="space-y-2">
                <Button variant="polaris" fullWidth>Full Width Primary</Button>
                <Button variant="success" fullWidth>Full Width Success</Button>
              </div>
            </div>

            {/* States */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">States</h4>
              <div className="flex flex-wrap gap-4">
                <Button disabled variant="polaris">Disabled</Button>
                <Button loading variant="polaris">Loading Button</Button>
                <Button loading variant="success">Loading Success</Button>
                <Button loading variant="critical">Loading Critical</Button>
              </div>
            </div>
          </div>
        </ComponentSection>

        {/* Form Elements */}
        <ComponentSection title="Form Elements" description="Input fields and form controls with ERP-style variants">
          <div className="space-y-8">
            {/* Input Variants */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Input Variants</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email-default">Default Input</Label>
                    <Input id="email-default" type="email" placeholder="Enter your email" />
                  </div>
                  <div>
                    <Label htmlFor="email-success">Success State</Label>
                    <Input id="email-success" type="email" placeholder="Valid email" variant="success" />
                  </div>
                  <div>
                    <Label htmlFor="email-error">Error State</Label>
                    <Input id="email-error" type="email" placeholder="Invalid email" variant="error" />
                  </div>
                  <div>
                    <Label htmlFor="email-warning">Warning State</Label>
                    <Input id="email-warning" type="email" placeholder="Check email format" variant="warning" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="email-ghost">Ghost Input</Label>
                    <Input id="email-ghost" type="email" placeholder="Minimal styling" variant="ghost" />
                  </div>
                  <div>
                    <Label htmlFor="search-prefix">With Prefix Icon</Label>
                    <Input 
                      id="search-prefix" 
                      type="search" 
                      placeholder="Search..." 
                      prefix={<Search className="h-4 w-4" />}
                    />
                  </div>
                  <div>
                    <Label htmlFor="copy-suffix">With Suffix Icon</Label>
                    <Input 
                      id="copy-suffix" 
                      placeholder="Copy this text" 
                      suffix={<Copy className="h-4 w-4" />}
                    />
                  </div>
                  <div>
                    <Label htmlFor="both-icons">With Both Icons</Label>
                    <Input 
                      id="both-icons" 
                      placeholder="Username" 
                      prefix={<User className="h-4 w-4" />}
                      suffix={<CheckCircle className="h-4 w-4" />}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Input Sizes */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Input Sizes</h4>
              <div className="space-y-3">
                <Input inputSize="sm" placeholder="Small input" />
                <Input inputSize="default" placeholder="Default input" />
                <Input inputSize="lg" placeholder="Large input" />
                <Input inputSize="xl" placeholder="Extra large input" />
              </div>
            </div>

            {/* Other Form Controls */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Other Form Controls</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="textarea">Description</Label>
                    <Textarea id="textarea" placeholder="Enter description..." />
                  </div>
                  <div>
                    <Label htmlFor="select">Department</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hr">Human Resources</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="it">Information Technology</SelectItem>
                        <SelectItem value="sales">Sales</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="terms" />
                    <Label htmlFor="terms">Accept terms and conditions</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="notifications" />
                    <Label htmlFor="notifications">Enable notifications</Label>
                  </div>
                  <RadioGroup defaultValue="option1">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="option1" id="option1" />
                      <Label htmlFor="option1">Option 1</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="option2" id="option2" />
                      <Label htmlFor="option2">Option 2</Label>
                    </div>
                  </RadioGroup>
                  <div className="space-y-2">
                    <Label>Budget Range: ${sliderValue[0]}K</Label>
                    <Slider
                      value={sliderValue}
                      onValueChange={setSliderValue}
                      max={100}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ComponentSection>

        {/* ERP Components */}
        <ComponentSection title="ERP Components" description="Modern enterprise components for business applications">
          <div className="space-y-8">
            {/* Page Header */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Page Header</h4>
              <PageHeader
                title="Employee Management"
                description="Manage employee information, roles, and permissions across your organization"
                breadcrumbs={[
                  { label: "Dashboard", href: "/" },
                  { label: "HR", href: "/hr" },
                  { label: "Employees" }
                ]}
                badge={{ label: "Beta", variant: "new" }}
                actions={
                  <PageHeaderActions>
                    <Button variant="actionSecondary" size="sm">Export</Button>
                    <Button variant="action" size="sm">Add Employee</Button>
                  </PageHeaderActions>
                }
              />
            </div>

            {/* Data Table Example */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Data Table</h4>
              <DataTable
                data={[
                  { id: 1, name: "John Doe", department: "Engineering", role: "Senior Developer", status: "Active", salary: 85000 },
                  { id: 2, name: "Jane Smith", department: "Marketing", role: "Marketing Manager", status: "Active", salary: 72000 },
                  { id: 3, name: "Mike Brown", department: "Finance", role: "Financial Analyst", status: "On Leave", salary: 68000 },
                  { id: 4, name: "Sarah Wilson", department: "HR", role: "HR Specialist", status: "Active", salary: 65000 },
                  { id: 5, name: "Tom Johnson", department: "Engineering", role: "Frontend Developer", status: "Active", salary: 78000 },
                ]}
                columns={[
                  { key: "name", header: "Name", sortable: true },
                  { key: "department", header: "Department", sortable: true },
                  { key: "role", header: "Role", sortable: true },
                  { 
                    key: "status", 
                    header: "Status", 
                    render: (value) => (
                      <Badge variant={value === "Active" ? "success" : value === "On Leave" ? "warning" : "disabled"}>
                        {value}
                      </Badge>
                    )
                  },
                  { 
                    key: "salary", 
                    header: "Salary", 
                    sortable: true,
                    render: (value) => `$${value.toLocaleString('en-US')}`
                  },
                ]}
                searchable
                selectable
                pagination
                pageSize={3}
                variant="hoverable"
              />
            </div>

            {/* Action List */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Action List</h4>
              <div className="max-w-xs">
                <ActionList>
                  <ActionListSection title="User Actions">
                    <ActionListItem 
                      icon={<User className="h-4 w-4" />}
                      suffix={<span className="text-xs">⌘P</span>}
                    >
                      View Profile
                    </ActionListItem>
                    <ActionListItem 
                      icon={<Settings className="h-4 w-4" />}
                      badge={{ label: "New", variant: "info" }}
                    >
                      Account Settings
                    </ActionListItem>
                    <ActionListItem 
                      icon={<Mail className="h-4 w-4" />}
                    >
                      Send Message
                    </ActionListItem>
                  </ActionListSection>
                  <ActionListSeparator />
                  <ActionListSection title="Admin Actions">
                    <ActionListItem 
                      icon={<Copy className="h-4 w-4" />}
                      variant="default"
                    >
                      Duplicate User
                    </ActionListItem>
                    <ActionListItem 
                      icon={<XCircle className="h-4 w-4" />}
                      variant="destructive"
                    >
                      Delete User
                    </ActionListItem>
                  </ActionListSection>
                </ActionList>
              </div>
            </div>
          </div>
        </ComponentSection>

        {/* Cards */}
        <ComponentSection title="Cards" description="Content containers and layouts with ERP-style variants">
          <div className="space-y-8">
            {/* Standard Cards */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Standard Cards</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Overview</CardTitle>
                    <CardDescription>Monthly revenue statistics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">$45,231.89</div>
                    <p className="text-xs text-muted-foreground">
                      +20.1% from last month
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Active Users</CardTitle>
                    <CardDescription>Current active user count</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">2,350</div>
                    <p className="text-xs text-muted-foreground">
                      +180 from yesterday
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Tasks Completed</CardTitle>
                    <CardDescription>This week's progress</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Progress</span>
                        <span className="text-sm">{progress}%</span>
                      </div>
                      <Progress value={progress} className="w-full" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Card Variants */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Card Variants</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card variant="subdued">
                  <CardHeader>
                    <CardTitle>Subdued Card</CardTitle>
                    <CardDescription>Less prominent styling</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">This card has a more subtle appearance.</p>
                  </CardContent>
                </Card>
                
                <Card variant="elevated">
                  <CardHeader>
                    <CardTitle>Elevated Card</CardTitle>
                    <CardDescription>Enhanced shadow</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">This card appears elevated with more shadow.</p>
                  </CardContent>
                </Card>
                
                <Card variant="outlined">
                  <CardHeader>
                    <CardTitle>Outlined Card</CardTitle>
                    <CardDescription>Prominent border</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">This card has a thicker border.</p>
                  </CardContent>
                </Card>

                <Card variant="sectioned">
                  <CardHeader>
                    <CardTitle>Sectioned Card</CardTitle>
                    <CardDescription>Divided sections</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Each section is visually separated.</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Card Padding Variants */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Padding Variants</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card padding="sm">
                  <CardHeader>
                    <CardTitle>Small Padding</CardTitle>
                    <CardDescription>Compact spacing</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Less padding for compact layouts.</p>
                  </CardContent>
                </Card>
                
                <Card padding="default">
                  <CardHeader>
                    <CardTitle>Default Padding</CardTitle>
                    <CardDescription>Standard spacing</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">Standard padding for most use cases.</p>
                  </CardContent>
                </Card>
                
                <Card padding="lg">
                  <CardHeader>
                    <CardTitle>Large Padding</CardTitle>
                    <CardDescription>Generous spacing</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">More padding for spacious layouts.</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Full Width Card */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Full Width</h4>
              <Card fullWidth variant="elevated">
                <CardHeader>
                  <CardTitle>Full Width Card</CardTitle>
                  <CardDescription>Spans the entire container width</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">This card takes up the full width of its container, perfect for dashboard layouts and detailed content areas.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </ComponentSection>

        {/* Data Display */}
        <ComponentSection title="Data Display" description="Tables, lists, and data presentation">
          <div className="space-y-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Salary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src="/placeholder.jpg" />
                        <AvatarFallback>JD</AvatarFallback>
                      </Avatar>
                      <span>John Doe</span>
                    </div>
                  </TableCell>
                  <TableCell>Engineering</TableCell>
                  <TableCell>Senior Developer</TableCell>
                  <TableCell><Badge variant="default">Active</Badge></TableCell>
                  <TableCell className="text-right">$85,000</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src="/placeholder.jpg" />
                        <AvatarFallback>JS</AvatarFallback>
                      </Avatar>
                      <span>Jane Smith</span>
                    </div>
                  </TableCell>
                  <TableCell>Marketing</TableCell>
                  <TableCell>Marketing Manager</TableCell>
                  <TableCell><Badge variant="secondary">On Leave</Badge></TableCell>
                  <TableCell className="text-right">$72,000</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src="/placeholder.jpg" />
                        <AvatarFallback>MB</AvatarFallback>
                      </Avatar>
                      <span>Mike Brown</span>
                    </div>
                  </TableCell>
                  <TableCell>Finance</TableCell>
                  <TableCell>Financial Analyst</TableCell>
                  <TableCell><Badge variant="outline">Remote</Badge></TableCell>
                  <TableCell className="text-right">$68,000</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </ComponentSection>

        {/* Badges and Status */}
        <ComponentSection title="Badges & Status" description="Status indicators and labels with ERP-style variants">
          <div className="space-y-6">
            {/* Standard Variants */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Standard Variants</h4>
              <div className="flex flex-wrap gap-4">
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="destructive">Destructive</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </div>

            {/* ERP-Style Status Variants */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">ERP-Style Status Variants</h4>
              <div className="flex flex-wrap gap-4">
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="critical">Critical</Badge>
                <Badge variant="info">Information</Badge>
                <Badge variant="attention">Attention</Badge>
                <Badge variant="new">New</Badge>
                <Badge variant="enabled">Enabled</Badge>
                <Badge variant="disabled">Disabled</Badge>
                <Badge variant="read-only">Read Only</Badge>
              </div>
            </div>

            {/* Badge Sizes */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Sizes</h4>
              <div className="flex flex-wrap items-center gap-4">
                <Badge variant="success" size="sm">Small</Badge>
                <Badge variant="success" size="default">Default</Badge>
                <Badge variant="success" size="lg">Large</Badge>
              </div>
            </div>

            {/* Badge Tones */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Tones</h4>
              <div className="flex flex-wrap gap-4">
                <Badge variant="info" tone="default">Default Tone</Badge>
                <Badge variant="info" tone="subdued">Subdued Tone</Badge>
                <Badge variant="info" tone="strong">Strong Tone</Badge>
              </div>
            </div>

            {/* Usage Examples */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">Usage Examples</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">User Status:</span>
                  <Badge variant="success">Active</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Order Status:</span>
                  <Badge variant="warning">Pending</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">System Status:</span>
                  <Badge variant="critical">Down</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Feature:</span>
                  <Badge variant="new">Beta</Badge>
                </div>
              </div>
            </div>
          </div>
        </ComponentSection>

        {/* Alerts */}
        <ComponentSection title="Alerts" description="Information and status messages">
          <div className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>
                This is an informational alert with important details.
              </AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Something went wrong. Please try again or contact support.
              </AlertDescription>
            </Alert>
          </div>
        </ComponentSection>

        {/* Navigation */}
        <ComponentSection title="Navigation" description="Breadcrumbs, pagination, and navigation elements">
          <div className="space-y-6">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/employees">Employees</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Employee Details</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>1</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">2</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">3</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </ComponentSection>

        {/* Interactive Elements */}
        <ComponentSection title="Interactive Elements" description="Dialogs, dropdowns, and interactive components">
          <div className="flex flex-wrap gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Open Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Employee Information</DialogTitle>
                  <DialogDescription>
                    Update employee details and save changes.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value="John Doe" readOnly />
                  </div>
                  <div>
                    <Label htmlFor="position">Position</Label>
                    <Input id="position" value="Senior Developer" readOnly />
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Actions <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>Edit Employee</DropdownMenuItem>
                <DropdownMenuItem>View Details</DropdownMenuItem>
                <DropdownMenuItem>Send Message</DropdownMenuItem>
                <DropdownMenuItem className="text-red-600">Remove</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Open Sheet</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Employee Details</SheetTitle>
                  <SheetDescription>
                    View and edit employee information.
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 mt-6">
                  <div>
                    <Label>Name</Label>
                    <Input value="John Doe" readOnly />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value="john.doe@company.com" readOnly />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </ComponentSection>

        {/* Tabs */}
        <ComponentSection title="Tabs" description="Tabbed content organization">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Overview</CardTitle>
                  <CardDescription>Company performance overview</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>This is the overview tab content showing key metrics and performance indicators.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="analytics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Analytics</CardTitle>
                  <CardDescription>Detailed analytics and insights</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Analytics content goes here with charts and detailed data analysis.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="reports" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Reports</CardTitle>
                  <CardDescription>Generated reports and documents</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Reports section with downloadable documents and generated reports.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Settings</CardTitle>
                  <CardDescription>System and user preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Configuration options and system settings.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ComponentSection>

        {/* Accordion */}
        <ComponentSection title="Accordion" description="Collapsible content sections">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Employee Management</AccordionTrigger>
              <AccordionContent>
                Manage employee information, roles, and permissions. Add new employees, update existing records, and handle employee lifecycle management.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Financial Reports</AccordionTrigger>
              <AccordionContent>
                Access comprehensive financial reports including profit & loss, balance sheets, cash flow statements, and budget analyses.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>System Settings</AccordionTrigger>
              <AccordionContent>
                Configure system-wide settings, user permissions, security policies, and integration configurations.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ComponentSection>

        {/* Loading States */}
        <ComponentSection title="Loading States" description="Skeleton loaders and progress indicators">
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          </div>
        </ComponentSection>

        {/* Toggle Components */}
        <ComponentSection title="Toggle Components" description="Toggle buttons and toggle groups">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4">
              <Toggle>
                <Star className="h-4 w-4" />
              </Toggle>
              <Toggle pressed>
                <Star className="h-4 w-4" />
                Starred
              </Toggle>
              <Toggle disabled>
                <Star className="h-4 w-4" />
                Disabled
              </Toggle>
            </div>
            <ToggleGroup type="multiple" className="justify-start">
              <ToggleGroupItem value="bold" aria-label="Toggle bold">
                <Plus className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="italic" aria-label="Toggle italic">
                <Minus className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="underline" aria-label="Toggle underline">
                <Star className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </ComponentSection>

        {/* Command Palette */}
        <ComponentSection title="Command Palette" description="Search and command interface">
          <div className="space-y-4">
            <Button onClick={() => setCommandOpen(true)}>Open Command Palette</Button>
            <CommandDialog open={commandOpen} onOpenChange={setCommandOpen}>
              <CommandInput placeholder="Type a command or search..." />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Suggestions">
                  <CommandItem>
                    <Mail className="mr-2 h-4 w-4" />
                    <span>Mail</span>
                  </CommandItem>
                  <CommandItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </CommandItem>
                  <CommandItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Settings">
                  <CommandItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                    <CommandShortcut>⌘P</CommandShortcut>
                  </CommandItem>
                  <CommandItem>
                    <Mail className="mr-2 h-4 w-4" />
                    <span>Mail</span>
                    <CommandShortcut>⌘B</CommandShortcut>
                  </CommandItem>
                  <CommandItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                    <CommandShortcut>⌘S</CommandShortcut>
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </CommandDialog>
            <Command className="rounded-lg border shadow-md max-w-md">
              <CommandInput placeholder="Search..." />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Quick Actions">
                  <CommandItem>
                    <Home className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </CommandItem>
                  <CommandItem>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </CommandItem>
                  <CommandItem>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        </ComponentSection>

        {/* Context Menu */}
        <ComponentSection title="Context Menu" description="Right-click context menus">
          <ContextMenu>
            <ContextMenuTrigger className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed text-sm">
              Right click here
            </ContextMenuTrigger>
            <ContextMenuContent className="w-64">
              <ContextMenuItem inset>
                Back
                <ContextMenuShortcut>⌘[</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem inset disabled>
                Forward
                <ContextMenuShortcut>⌘]</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuItem inset>
                Reload
                <ContextMenuShortcut>⌘R</ContextMenuShortcut>
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem inset>
                More Tools
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem>
                Developer Tools
                <ContextMenuShortcut>F12</ContextMenuShortcut>
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </ComponentSection>

        {/* Hover Card */}
        <ComponentSection title="Hover Card" description="Hover-triggered card content">
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="link">@nextjs</Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="flex justify-between space-x-4">
                <Avatar>
                  <AvatarImage src="https://github.com/vercel.png" />
                  <AvatarFallback>VC</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">@nextjs</h4>
                  <p className="text-sm">
                    The React Framework – created and maintained by @vercel.
                  </p>
                  <div className="flex items-center pt-2">
                    <Calendar className="mr-2 h-4 w-4 opacity-70" />{" "}
                    <span className="text-xs text-muted-foreground">
                      Joined December 2021
                    </span>
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </ComponentSection>

        {/* Input OTP */}
        <ComponentSection title="Input OTP" description="One-time password input fields">
          <div className="space-y-4">
            <div>
              <Label htmlFor="otp">Enter OTP</Label>
              <InputOTP maxLength={6} value={otpValue} onChange={setOtpValue}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
            <div className="text-center text-sm">
              {otpValue === "" ? (
                <>Enter your one-time password.</>
              ) : (
                <>You entered: {otpValue}</>
              )}
            </div>
          </div>
        </ComponentSection>

        {/* Popover */}
        <ComponentSection title="Popover" description="Click-triggered popover content">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Open popover</Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Dimensions</h4>
                  <p className="text-sm text-muted-foreground">
                    Set the dimensions for the layer.
                  </p>
                </div>
                <div className="grid gap-2">
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="width">Width</Label>
                    <Input
                      id="width"
                      defaultValue="100%"
                      className="col-span-2 h-8"
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="maxWidth">Max. width</Label>
                    <Input
                      id="maxWidth"
                      defaultValue="300px"
                      className="col-span-2 h-8"
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="height">Height</Label>
                    <Input
                      id="height"
                      defaultValue="25px"
                      className="col-span-2 h-8"
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="maxHeight">Max. height</Label>
                    <Input
                      id="maxHeight"
                      defaultValue="none"
                      className="col-span-2 h-8"
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </ComponentSection>

        {/* Scroll Area */}
        <ComponentSection title="Scroll Area" description="Custom scrollable areas">
          <ScrollArea className="h-[200px] w-[350px] rounded-md border p-4">
            <div className="space-y-4">
              {Array.from({ length: 50 }, (_, i) => (
                <div key={i} className="text-sm">
                  This is item {i + 1} in the scrollable area. Lorem ipsum dolor sit amet.
                </div>
              ))}
            </div>
          </ScrollArea>
        </ComponentSection>

        {/* Tooltips */}
        <ComponentSection title="Tooltips" description="Hover tooltips and information">
          <TooltipProvider>
            <div className="flex gap-4">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">Hover me</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add to library</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add item</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </ComponentSection>

        {/* Drawer */}
        <ComponentSection title="Drawer" description="Slide-out drawers">
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline">Open Drawer</Button>
            </DrawerTrigger>
            <DrawerContent>
              <div className="mx-auto w-full max-w-sm">
                <DrawerHeader>
                  <DrawerTitle>Move Goal</DrawerTitle>
                  <DrawerDescription>Set your daily activity goal.</DrawerDescription>
                </DrawerHeader>
                <div className="p-4 pb-0">
                  <div className="flex items-center justify-center space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 shrink-0 rounded-full"
                      onClick={() => setProgress(Math.max(0, progress - 10))}
                      disabled={progress <= 0}
                    >
                      <Minus className="h-4 w-4" />
                      <span className="sr-only">Decrease</span>
                    </Button>
                    <div className="flex-1 text-center">
                      <div className="text-7xl font-bold tracking-tighter">
                        {progress}
                      </div>
                      <div className="text-[0.70rem] uppercase text-muted-foreground">
                        Goal
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 shrink-0 rounded-full"
                      onClick={() => setProgress(Math.min(100, progress + 10))}
                      disabled={progress >= 100}
                    >
                      <Plus className="h-4 w-4" />
                      <span className="sr-only">Increase</span>
                    </Button>
                  </div>
                </div>
                <DrawerFooter>
                  <Button>Submit</Button>
                  <DrawerClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DrawerClose>
                </DrawerFooter>
              </div>
            </DrawerContent>
          </Drawer>
        </ComponentSection>

        {/* Collapsible */}
        <ComponentSection title="Collapsible" description="Expandable content sections">
          <Collapsible open={isCollapsibleOpen} onOpenChange={setIsCollapsibleOpen} className="w-[350px] space-y-2">
            <div className="flex items-center justify-between space-x-4 px-4">
              <h4 className="text-sm font-semibold">
                @peduarte starred 3 repositories
              </h4>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-9 p-0">
                  <ChevronDown className="h-4 w-4" />
                  <span className="sr-only">Toggle</span>
                </Button>
              </CollapsibleTrigger>
            </div>
            <div className="rounded-md border px-4 py-3 font-mono text-sm">
              @radix-ui/primitives
            </div>
            <CollapsibleContent className="space-y-2">
              <div className="rounded-md border px-4 py-3 font-mono text-sm">
                @radix-ui/colors
              </div>
              <div className="rounded-md border px-4 py-3 font-mono text-sm">
                @stitches/react
              </div>
            </CollapsibleContent>
          </Collapsible>
        </ComponentSection>

        {/* Resizable */}
        <ComponentSection title="Resizable" description="Resizable panel layouts">
          <ResizablePanelGroup
            direction="horizontal"
            className="max-w-md rounded-lg border"
          >
            <ResizablePanel defaultSize={50} minSize={30}>
              <div className="flex h-[200px] items-center justify-center p-6">
                <span className="font-semibold">Panel One</span>
              </div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={50} minSize={30}>
              <ResizablePanelGroup direction="vertical">
                <ResizablePanel defaultSize={25}>
                  <div className="flex h-full items-center justify-center p-6">
                    <span className="font-semibold">Panel Two</span>
                  </div>
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={75}>
                  <div className="flex h-full items-center justify-center p-6">
                    <span className="font-semibold">Panel Three</span>
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ComponentSection>
      </div>
    </div>
  )
}

interface ComponentSectionProps {
  title: string
  description: string
  children: React.ReactNode
}

function ComponentSection({ title, description, children }: ComponentSectionProps) {
  return (
    <Card className="p-8">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            {title}
          </h2>
          <p className="text-muted-foreground">
            {description}
          </p>
          <Separator className="mt-4" />
        </div>
        <div className="space-y-6">
          {children}
        </div>
      </div>
    </Card>
  )
}