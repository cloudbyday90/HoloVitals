'use client';

import React from 'react';
import { TimelineEvent as TimelineEventType, TimelineEventType as EventType } from '@/lib/types/clinical-data';
import {
  Stethoscope,
  FlaskConical,
  Pill,
  Scissors,
  Activity,
  Syringe,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface TimelineEventProps {
  event: TimelineEventType;
  isFirst?: boolean;
  isLast?: boolean;
  onClick?: () => void;
}

export function TimelineEvent({ event, isFirst, isLast, onClick }: TimelineEventProps) {
  const getEventIcon = (type: EventType) => {
    switch (type) {
      case EventType.ENCOUNTER:
        return <Stethoscope className="h-4 w-4" />;
      case EventType.LAB_RESULT:
        return <FlaskConical className="h-4 w-4" />;
      case EventType.MEDICATION:
        return <Pill className="h-4 w-4" />;
      case EventType.PROCEDURE:
        return <Scissors className="h-4 w-4" />;
      case EventType.DIAGNOSIS:
        return <Activity className="h-4 w-4" />;
      case EventType.IMMUNIZATION:
        return <Syringe className="h-4 w-4" />;
      case EventType.ALLERGY:
        return <AlertCircle className="h-4 w-4" />;
      case EventType.DOCUMENT:
        return <FileText className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getEventColor = (type: EventType) => {
    switch (type) {
      case EventType.ENCOUNTER:
        return 'bg-blue-100 text-blue-600 border-blue-200';
      case EventType.LAB_RESULT:
        return 'bg-purple-100 text-purple-600 border-purple-200';
      case EventType.MEDICATION:
        return 'bg-green-100 text-green-600 border-green-200';
      case EventType.PROCEDURE:
        return 'bg-orange-100 text-orange-600 border-orange-200';
      case EventType.DIAGNOSIS:
        return 'bg-red-100 text-red-600 border-red-200';
      case EventType.IMMUNIZATION:
        return 'bg-teal-100 text-teal-600 border-teal-200';
      case EventType.ALLERGY:
        return 'bg-yellow-100 text-yellow-600 border-yellow-200';
      case EventType.DOCUMENT:
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="relative flex gap-4 pb-8">
      {/* Timeline line */}
      {!isLast && (
        <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-gray-200" />
      )}

      {/* Icon */}
      <div className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 ${getEventColor(event.type)}`}>
        {getEventIcon(event.type)}
      </div>

      {/* Content */}
      <div
        className="flex-1 cursor-pointer rounded-lg border bg-card p-4 transition-all hover:shadow-md"
        onClick={onClick}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h4 className="font-semibold">{event.title}</h4>
            {event.description && (
              <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
            )}
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{formatDate(event.date)}</p>
            <p className="text-xs text-muted-foreground">{formatTime(event.date)}</p>
          </div>
        </div>

        {/* Additional info */}
        <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
          {event.provider && (
            <div className="flex items-center gap-1">
              <span className="font-medium">Provider:</span>
              <span>{event.provider}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-1">
              <span className="font-medium">Location:</span>
              <span>{event.location}</span>
            </div>
          )}
          {event.status && (
            <div className="flex items-center gap-1">
              <span className="font-medium">Status:</span>
              <span className="capitalize">{event.status.toLowerCase()}</span>
            </div>
          )}
        </div>

        {/* Category badge */}
        <div className="mt-3">
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
            {event.category}
          </span>
        </div>
      </div>
    </div>
  );
}