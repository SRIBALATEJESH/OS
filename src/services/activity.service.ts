export interface ActivityItem {
  id: string;
  type: 'task' | 'note' | 'document' | 'quiz' | 'coding' | 'roadmap';
  title: string;
  detail: string;
  timestamp: string;
  createdAt: number;
}

const getStorageKey = () => {
  if (typeof window === 'undefined') return 'studyflow_recent_activities_guest';
  try {
    const token = localStorage.getItem('sb-ckqvsrxogsnriihrilml-auth-token');
    if (token) {
      const parsed = JSON.parse(token);
      if (parsed?.user?.id) return `studyflow_recent_activities_${parsed.user.id}`;
    }
  } catch (e) {}
  return 'studyflow_recent_activities_guest';
};

class ActivityService {
  private getActivities(): ActivityItem[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(getStorageKey());
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public getAllActivities(): ActivityItem[] {
    return this.getActivities().sort((a, b) => b.createdAt - a.createdAt);
  }

  public logActivity(item: Omit<ActivityItem, 'id' | 'createdAt'>) {
    if (typeof window === 'undefined') return;
    const current = this.getActivities();
    const newEntry: ActivityItem = {
      ...item,
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      createdAt: Date.now(),
    };
    // Keep last 30 activities
    const updated = [newEntry, ...current].slice(0, 30);
    try {
      localStorage.setItem(getStorageKey(), JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('studyflow-activity-updated'));
    } catch (e) {
      console.warn('Failed to save activity to localStorage', e);
    }
  }
}

export const activityService = new ActivityService();
