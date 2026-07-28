"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, AlertCircle, Clock, Edit3 } from "lucide-react";
import type { Issue } from "../data/issues";

interface ActivityItem {
  id: string;
  type: "created" | "updated" | "completed" | "assigned";
  issue: Issue;
  user: string;
  timestamp: Date;
}

interface ActivityFeedProps {
  issues: Issue[];
  maxItems?: number;
}

export function ActivityFeed({ issues, maxItems = 6 }: ActivityFeedProps) {
  // Generate activity from recent issues
  const activities: ActivityItem[] = issues
    .slice(0, maxItems)
    .map((issue) => {
      const activity = issue.activity?.[0];
      let type: "created" | "updated" | "completed" | "assigned" = "created";
      
      if (activity?.type === "STATUS_CHANGED" && issue.status === "DONE") {
        type = "completed";
      } else if (issue.assignee !== "Unassigned") {
        type = "assigned";
      } else if (activity?.type === "STATUS_CHANGED") {
        type = "updated";
      }

      return {
        id: issue.id,
        type,
        issue,
        user: issue.assignee || "System",
        timestamp: new Date(activity?.createdAt || issue.createdAt),
      };
    });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "completed":
        return <CheckCircle2 size={16} />;
      case "assigned":
        return <AlertCircle size={16} />;
      case "updated":
        return <Edit3 size={16} />;
      default:
        return <Clock size={16} />;
    }
  };

  const getActivityLabel = (type: string) => {
    switch (type) {
      case "completed":
        return "Completed";
      case "assigned":
        return "Assigned to";
      case "updated":
        return "Updated";
      default:
        return "Created";
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "completed":
        return "var(--green-600)";
      case "assigned":
        return "var(--blue-600)";
      case "updated":
        return "var(--amber-500)";
      default:
        return "var(--gray-600)";
    }
  };

  return (
    <div className="activity-feed">
      <div className="activity-items">
        {activities.map((activity) => (
          <Link
            key={activity.id}
            href={`/issues/${activity.id}`}
            className="activity-item"
            style={
              {
                "--activity-color": getActivityColor(activity.type),
              } as React.CSSProperties
            }
          >
            <div className="activity-icon" style={{ color: getActivityColor(activity.type) }}>
              {getActivityIcon(activity.type)}
            </div>
            <div className="activity-content">
              <div className="activity-main">
                <strong>{activity.issue.title}</strong>
                <span className="activity-id">{activity.issue.id}</span>
              </div>
              <div className="activity-meta">
                <span className="activity-label">{getActivityLabel(activity.type)}</span>
                <span className="activity-user">{activity.user}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
      <Link href="/issues" className="activity-view-all">
        View all activity <ArrowRight size={14} />
      </Link>
    </div>
  );
}
