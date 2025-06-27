'use client'

import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Shield, Plus, Server, Play, Square, Trash2, Eye, Download, Menu, X, FileText, BarChart3, Settings, Home, Database, Globe, Lock, Folder, MessageSquare } from 'lucide-react'
import toast from 'react-hot-toast'
import { HoneypotCard } from "./components/HoneypotCard"
import { StatsCard } from './components/StatsCard'
import { CreateHoneypotModal } from './components/CreateHoneypotModal'
import { LogsModal } from './components/LogsModal'
import { HoneypotServicesModal } from './components/HoneypotServicesModal'

export default function Dashboard() {
  const [honeypots, setHoneypots] = useState([])
  const [runningHoneypots, setRunningHoneypots] = useState({})
  const [stats, setStats] = useState({ total: 0, running: 0, stopped: 0 })
  const [honeypotTypes, setHoneypotTypes] = useState({})
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showLogsModal, setShowLogsModal] = useState(false)
  const [showServicesModal, setShowServicesModal] = useState(false)
  const [selectedHoneypot, setSelectedHoneypot] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState('dashboard')

  useEffect(() => {
    loadData()
    loadHoneypotTypes()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadData = async () => {
    try {
      const response = await fetch('/api/honeypots')
      const data = await response.json()
      
      if (data.success) {
        setHoneypots(Object.values(data.data.configs))
        setRunningHoneypots(data.data.running)
        setStats(data.data.statistics)
      }
    } catch (error) {
      toast.error('Failed to load honeypots')
      console.error('Error loading honeypots:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadHoneypotTypes = async () => {
    try {
      const response = await fetch('/api/honeypot-types')
      const data = await response.json()
      
      if (data.success) {
        setHoneypotTypes(data.data)
      }
    } catch (error) {
      console.error('Error loading honeypot types:', error)
    }
  }

  const handleStartHoneypot = async (id) => {
    try {
      const response = await fetch(`/api/honeypots/${id}/start`, {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success('Honeypot started successfully!')
        loadData()
      } else {
        toast.error(data.error || 'Failed to start honeypot')
      }
    } catch (error) {
      toast.error('Failed to start honeypot')
      console.error('Error starting honeypot:', error)
    }
  }

  const handleStopHoneypot = async (id) => {
    try {
      const response = await fetch(`/api/honeypots/${id}/stop`, {
        method: 'POST'
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success('Honeypot stopped successfully!')
        loadData()
      } else {
        toast.error(data.error || 'Failed to stop honeypot')
      }
    } catch (error) {
      toast.error('Failed to stop honeypot')
      console.error('Error stopping honeypot:', error)
    }
  }

  const handleDeleteHoneypot = async (id) => {
    if (!confirm('Are you sure you want to delete this honeypot? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/honeypots/${id}`, {
        method: 'DELETE'
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success('Honeypot deleted successfully!')
        loadData()
      } else {
        toast.error(data.error || 'Failed to delete honeypot')
      }
    } catch (error) {
      toast.error('Failed to delete honeypot')
      console.error('Error deleting honeypot:', error)
    }
  }

  const handleViewLogs = (id) => {
    setSelectedHoneypot(id)
    setShowLogsModal(true)
  }

  const handleCreateHoneypot = () => {
    setShowCreateModal(false)
    loadData()
  }

  const renderDashboard = () => {
    if (loading) {
      return (
        <LoadingContainer>
          <LoadingSpinner />
        </LoadingContainer>
      )
    }

    return (
      <>
        {/* Statistics */}
        <StatsGrid>
          <StatsCard
            title="Total Honeypots"
            value={stats.total}
            icon={Server}
            color="blue"
          />
          <StatsCard
            title="Running"
            value={stats.running}
            icon={Play}
            color="green"
          />
          <StatsCard
            title="Stopped"
            value={stats.stopped}
            icon={Square}
            color="gray"
          />
          <StatsCard
            title="Types Available"
            value={Object.keys(honeypotTypes).length}
            icon={Shield}
            color="purple"
          />
        </StatsGrid>

        {/* Honeypots Grid */}
        <HoneypotsGrid>
          {honeypots.map((honeypot) => (
            <HoneypotCard
              key={honeypot.id}
              honeypot={{
                ...honeypot,
                status: honeypot.id in runningHoneypots ? 'running' : 'stopped',
                created_at: honeypot.created
              }}
              honeypotType={honeypotTypes[honeypot.type]}
              onStart={() => handleStartHoneypot(honeypot.id)}
              onStop={() => handleStopHoneypot(honeypot.id)}
              onDelete={() => handleDeleteHoneypot(honeypot.id)}
              onViewLogs={() => handleViewLogs(honeypot.id)}
              onConfigure={() => {}} // TODO: Add configure functionality
            />
          ))}
        </HoneypotsGrid>

        {honeypots.length === 0 && (
          <EmptyState>
            <Shield size={48} />
            <EmptyTitle>No honeypots</EmptyTitle>
            <EmptyDescription>Get started by creating your first honeypot.</EmptyDescription>
            <EmptyButton onClick={() => setShowCreateModal(true)}>
              <Plus size={16} />
              Create Honeypot
            </EmptyButton>
          </EmptyState>
        )}
      </>
    )
  }

  const renderLogs = () => (
    <PageSection>
      <SectionHeader>
        <SectionTitle>Logs Management</SectionTitle>
        <SectionDescription>View and manage logs from all your honeypots</SectionDescription>
      </SectionHeader>
      <LogsContent>
        <p>Logs management interface coming soon...</p>
      </LogsContent>
    </PageSection>
  )

  const renderAnalysis = () => (
    <PageSection>
      <SectionHeader>
        <SectionTitle>Security Analysis</SectionTitle>
        <SectionDescription>Analyze attack patterns and security insights</SectionDescription>
      </SectionHeader>
      <AnalysisContent>
        <p>Security analysis dashboard coming soon...</p>
      </AnalysisContent>
    </PageSection>
  )

  const renderSettings = () => (
    <PageSection>
      <SectionHeader>
        <SectionTitle>Settings</SectionTitle>
        <SectionDescription>Configure your honeypot platform</SectionDescription>
      </SectionHeader>
      <SettingsContent>
        <p>Settings panel coming soon...</p>
      </SettingsContent>
    </PageSection>
  )

  if (loading) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
      </LoadingContainer>
    )
  }

  return (
    <AppContainer>
      {/* Sidebar */}
      <Sidebar $isOpen={sidebarOpen}>
        <SidebarHeader>
          <SidebarLogo>
            <Shield size={24} />
            <SidebarTitle>HoneyShield</SidebarTitle>
          </SidebarLogo>
          <SidebarCloseButton onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </SidebarCloseButton>
        </SidebarHeader>

        <SidebarNav>
          <SidebarNavItem 
            $active={currentPage === 'dashboard'} 
            onClick={() => setCurrentPage('dashboard')}
          >
            <Home size={20} />
            Dashboard
          </SidebarNavItem>
          <SidebarNavItem 
            $active={currentPage === 'logs'} 
            onClick={() => setCurrentPage('logs')}
          >
            <FileText size={20} />
            Logs
          </SidebarNavItem>
          <SidebarNavItem 
            $active={currentPage === 'analysis'} 
            onClick={() => setCurrentPage('analysis')}
          >
            <BarChart3 size={20} />
            Analysis
          </SidebarNavItem>
          <SidebarNavItem 
            $active={currentPage === 'settings'} 
            onClick={() => setCurrentPage('settings')}
          >
            <Settings size={20} />
            Settings
          </SidebarNavItem>
        </SidebarNav>

        <SidebarSection>
          <SidebarSectionTitle>Quick Actions</SidebarSectionTitle>
          <QuickActionButton onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            New Honeypot
          </QuickActionButton>
          <QuickActionButton onClick={() => setShowServicesModal(true)}>
            <Server size={16} />
            Honeypot Services
          </QuickActionButton>
        </SidebarSection>
      </Sidebar>

      {/* Main Content Area */}
      <MainArea>
        {/* Header */}
        <Header>
          <HeaderContent>
            <HeaderLeft>
              <MenuButton onClick={() => setSidebarOpen(true)}>
                <Menu size={20} />
              </MenuButton>
              <HeaderTitle>
                {currentPage === 'dashboard' && 'Dashboard'}
                {currentPage === 'logs' && 'Logs Management'}
                {currentPage === 'analysis' && 'Security Analysis'}
                {currentPage === 'settings' && 'Settings'}
              </HeaderTitle>
            </HeaderLeft>
            <CreateButton onClick={() => setShowCreateModal(true)}>
              <Plus size={16} />
              <span>Create Honeypot</span>
            </CreateButton>
          </HeaderContent>
        </Header>

        {/* Page Content */}
        <PageContent>
          {currentPage === 'dashboard' && renderDashboard()}
          {currentPage === 'logs' && renderLogs()}
          {currentPage === 'analysis' && renderAnalysis()}
          {currentPage === 'settings' && renderSettings()}
        </PageContent>
      </MainArea>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && <SidebarOverlay onClick={() => setSidebarOpen(false)} />}

      {/* Modals */}
      {showCreateModal && (
        <CreateHoneypotModal
          honeypotTypes={honeypotTypes}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateHoneypot}
        />
      )}

      {showServicesModal && (
        <HoneypotServicesModal
          onClose={() => setShowServicesModal(false)}
          onServiceSelect={(serviceType) => {
            setShowServicesModal(false)
            // TODO: Open service-specific configuration
          }}
        />
      )}

      {showLogsModal && selectedHoneypot && (
        <LogsModal
          honeypotId={selectedHoneypot}
          honeypotName={honeypots.find(h => h.id === selectedHoneypot)?.name || ''}
          onClose={() => setShowLogsModal(false)}
        />
      )}
    </AppContainer>
  )
}

// Styled Components
const AppContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background: #f9fafb;
`;

const Sidebar = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  width: 280px;
  background: white;
  border-right: 1px solid #e5e7eb;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
  z-index: 40;
  transform: ${({ $isOpen }) => $isOpen ? 'translateX(0)' : 'translateX(-100%)'};
  transition: transform 0.3s ease;

  @media (min-width: 1024px) {
    position: relative;
    transform: translateX(0);
    z-index: auto;
  }
`;

const SidebarOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 30;

  @media (min-width: 1024px) {
    display: none;
  }
`;

const SidebarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
`;

const SidebarLogo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;

  svg {
    color: #2563eb;
  }
`;

const SidebarTitle = styled.h1`
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
`;

const SidebarCloseButton = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }

  @media (min-width: 1024px) {
    display: none;
  }
`;

const SidebarNav = styled.nav`
  padding: 1rem 0;
`;

const SidebarNavItem = styled.button`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1.5rem;
  border: none;
  background: ${({ $active }) => $active ? '#eff6ff' : 'transparent'};
  color: ${({ $active }) => $active ? '#2563eb' : '#6b7280'};
  font-weight: ${({ $active }) => $active ? '600' : '500'};
  text-align: left;
  transition: all 0.2s ease;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }

  svg {
    color: ${({ $active }) => $active ? '#2563eb' : '#9ca3af'};
  }
`;

const SidebarSection = styled.div`
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  margin-top: auto;
`;

const SidebarSectionTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const QuickActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  margin-bottom: 0.5rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s ease;

  &:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const MainArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  margin-left: 0;

  @media (min-width: 1024px) {
    margin-left: 280px;
  }
`;

const Header = styled.header`
  background: white;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid #e5e7eb;
`;

const HeaderContent = styled.div`
  padding: 0 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 4rem;

  @media (min-width: 640px) {
    padding: 0 1.5rem;
  }

  @media (min-width: 1024px) {
    padding: 0 2rem;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const MenuButton = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  padding: 0.5rem;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background: #f3f4f6;
    color: #374151;
  }

  @media (min-width: 1024px) {
    display: none;
  }
`;

const HeaderTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0;
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  transition: background 0.2s ease;

  &:hover {
    background: #1d4ed8;
  }
`;

const PageContent = styled.main`
  flex: 1;
  padding: 2rem 1rem;

  @media (min-width: 640px) {
    padding: 2rem 1.5rem;
  }

  @media (min-width: 1024px) {
    padding: 2rem 2rem;
  }
`;

const PageSection = styled.div`
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  padding: 2rem;
`;

const SectionHeader = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #111827;
  margin: 0 0 0.5rem 0;
`;

const SectionDescription = styled.p`
  color: #6b7280;
  margin: 0;
`;

const LogsContent = styled.div`
  color: #6b7280;
`;

const AnalysisContent = styled.div`
  color: #6b7280;
`;

const SettingsContent = styled.div`
  color: #6b7280;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const HoneypotsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;

  @media (min-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1280px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const LoadingContainer = styled.div`
  min-height: 50vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LoadingSpinner = styled.div`
  width: 8rem;
  height: 8rem;
  border: 2px solid #e5e7eb;
  border-radius: 50%;
  border-top-color: #2563eb;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;

  svg {
    color: #9ca3af;
  }
`;

const EmptyTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
  margin: 0;
`;

const EmptyDescription = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
`;

const EmptyButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  transition: background 0.2s ease;
  margin-top: 1rem;

  &:hover {
    background: #1d4ed8;
  }
`;
