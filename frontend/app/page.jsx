'use client'

import { useState, useEffect } from 'react'
import styled from 'styled-components'
import { Shield, Plus, Server, Play, Square, Trash2, Eye, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { HoneypotCard } from "./components/HoneypotCard"
import { StatsCard } from './components/StatsCard'
import { CreateHoneypotModal } from './components/CreateHoneypotModal'
import { LogsModal } from './components/LogsModal'

export default function Dashboard() {
  const [honeypots, setHoneypots] = useState([])
  const [runningHoneypots, setRunningHoneypots] = useState({})
  const [stats, setStats] = useState({ total: 0, running: 0, stopped: 0 })
  const [honeypotTypes, setHoneypotTypes] = useState({})
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showLogsModal, setShowLogsModal] = useState(false)
  const [selectedHoneypot, setSelectedHoneypot] = useState(null)

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

  if (loading) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
      </LoadingContainer>
    )
  }

  return (
    <DashboardContainer>
      {/* Header */}
      <Header>
        <HeaderContent>
          <HeaderLeft>
            <Shield size={32} />
            <HeaderTitle>Honeypot Dashboard</HeaderTitle>
          </HeaderLeft>
          <CreateButton onClick={() => setShowCreateModal(true)}>
            <Plus size={16} />
            <span>Create Honeypot</span>
          </CreateButton>
        </HeaderContent>
      </Header>

      <MainContent>
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
      </MainContent>

      {/* Modals */}
      {showCreateModal && (
        <CreateHoneypotModal
          honeypotTypes={honeypotTypes}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateHoneypot}
        />
      )}

      {showLogsModal && selectedHoneypot && (
        <LogsModal
          honeypotId={selectedHoneypot}
          honeypotName={honeypots.find(h => h.id === selectedHoneypot)?.name || ''}
          onClose={() => setShowLogsModal(false)}
        />
      )}
    </DashboardContainer>
  )
}

// Styled Components
const DashboardContainer = styled.div`
  min-height: 100vh;
  background: #f9fafb;
`;

const Header = styled.header`
  background: white;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid #e5e7eb;
`;

const HeaderContent = styled.div`
  max-width: 80rem;
  margin: 0 auto;
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
  gap: 0.75rem;

  svg {
    color: #2563eb;
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

const MainContent = styled.main`
  max-width: 80rem;
  margin: 0 auto;
  padding: 2rem 1rem;

  @media (min-width: 640px) {
    padding: 2rem 1.5rem;
  }

  @media (min-width: 1024px) {
    padding: 2rem 2rem;
  }
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
  min-height: 100vh;
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
