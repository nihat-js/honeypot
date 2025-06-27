import React from 'react';
import styled from 'styled-components';

interface HoneypotCardProps {
  honeypot: {
    id: string;
    name: string;
    type: string;
    status: 'running' | 'stopped';
    port: number;
    created_at: string;
    last_activity?: string;
    config: any;
  };
  honeypotType?: {
    name: string;
    description: string;
    category: string;
    features: string[];
  };
  onStart: () => void;
  onStop: () => void;
  onDelete: () => void;
  onViewLogs: () => void;
  onConfigure: () => void;
}

export function HoneypotCard({ 
  honeypot, 
  honeypotType, 
  onStart, 
  onStop, 
  onDelete, 
  onViewLogs, 
  onConfigure 
}: HoneypotCardProps) {
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Remote Access':
        return '🔐';
      case 'Database':
        return '🗄️';
      case 'Web Application':
        return '🌐';
      case 'File Transfer':
        return '📁';
      case 'Network Device':
        return '🔌';
      default:
        return '🍯';
    }
  };

  return (
    <CardContainer>
      <CardContent>
        <CardHeader>
          <HoneypotInfo>
            <IconContainer>
              {honeypotType ? getCategoryIcon(honeypotType.category) : '🍯'}
            </IconContainer>
            <div>
              <HoneypotName>{honeypot.name}</HoneypotName>
              <HoneypotType>{honeypotType?.name || honeypot.type}</HoneypotType>
            </div>
          </HoneypotInfo>
          <StatusBadge status={honeypot.status}>
            <StatusDot status={honeypot.status} />
            {honeypot.status === 'running' ? 'Running' : 'Stopped'}
          </StatusBadge>
        </CardHeader>

        <CardDetails>
          <DetailRow>
            <span>Port:</span>
            <span>{honeypot.port}</span>
          </DetailRow>
          <DetailRow>
            <span>Created:</span>
            <span>{new Date(honeypot.created_at).toLocaleDateString()}</span>
          </DetailRow>
          {honeypot.last_activity && (
            <DetailRow>
              <span>Last Activity:</span>
              <span>{new Date(honeypot.last_activity).toLocaleDateString()}</span>
            </DetailRow>
          )}
        </CardDetails>

        {honeypotType?.features && (
          <FeaturesList>
            {honeypotType.features.slice(0, 3).map(feature => (
              <FeatureBadge key={feature}>
                {feature}
              </FeatureBadge>
            ))}
            {honeypotType.features.length > 3 && (
              <FeatureBadge variant="more">
                +{honeypotType.features.length - 3} more
              </FeatureBadge>
            )}
          </FeaturesList>
        )}

        <ActionButtons>
          <ButtonGroup>
            {honeypot.status === 'stopped' ? (
              <ActionButton variant="start" onClick={onStart}>
                ▶️ Start
              </ActionButton>
            ) : (
              <ActionButton variant="stop" onClick={onStop}>
                ⏹️ Stop
              </ActionButton>
            )}
            
            <ActionButton variant="logs" onClick={onViewLogs}>
              👁️ Logs
            </ActionButton>
          </ButtonGroup>

          <IconButtons>
            <IconButton onClick={onConfigure} title="Configure">
              ⚙️
            </IconButton>
            <IconButton onClick={onDelete} title="Delete" variant="danger">
              🗑️
            </IconButton>
          </IconButtons>
        </ActionButtons>
      </CardContent>
    </CardContainer>
  );
}
