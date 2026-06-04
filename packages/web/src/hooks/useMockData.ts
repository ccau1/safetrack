import { useState, useCallback, useEffect, useRef } from 'react';
import type { Employee, EmployeeStatus, Severity, EmergencyEvent, StatusHistoryEntry } from '@/types';

const INITIAL_EMPLOYEES: Employee[] = [
  { id: 1, memberId: 'mock-1', userId: 'user-1', name: 'Sarah Chen', role: 'Senior Engineer', team: 'Engineering', status: 'safe', location: 'Building A, Floor 3', lastUpdated: '2 min ago' },
  { id: 2, memberId: 'mock-2', userId: 'user-2', name: 'Marcus Johnson', role: 'Product Manager', team: 'Product', status: 'safe', location: 'Building A, Floor 2', lastUpdated: '5 min ago' },
  { id: 3, memberId: 'mock-3', userId: 'user-3', name: 'Emily Davis', role: 'UX Designer', team: 'Design', status: 'distress', location: 'Building B, Floor 1', lastUpdated: '8 min ago', severity: 'high', details: 'Stuck in elevator' },
  { id: 4, memberId: 'mock-4', userId: 'user-4', name: 'James Wilson', role: 'Frontend Dev', team: 'Engineering', status: 'safe', location: 'Remote', lastUpdated: '1 min ago' },
  { id: 5, memberId: 'mock-5', userId: 'user-5', name: 'Aisha Patel', role: 'Marketing Lead', team: 'Marketing', status: 'unknown', location: '-', lastUpdated: '-' },
  { id: 6, memberId: 'mock-6', userId: 'user-6', name: 'Robert Kim', role: 'DevOps Engineer', team: 'Engineering', status: 'safe', location: 'Building A, Floor 3', lastUpdated: '12 min ago' },
  { id: 7, memberId: 'mock-7', userId: 'user-7', name: 'Lisa Wong', role: 'HR Manager', team: 'HR', status: 'safe', location: 'Building A, Floor 1', lastUpdated: '3 min ago' },
  { id: 8, memberId: 'mock-8', userId: 'user-8', name: 'David Brown', role: 'Sales Rep', team: 'Sales', status: 'unknown', location: '-', lastUpdated: '-' },
  { id: 9, memberId: 'mock-9', userId: 'user-9', name: 'Nina Okafor', role: 'Data Analyst', team: 'Engineering', status: 'safe', location: 'Building A, Floor 3', lastUpdated: '7 min ago' },
  { id: 10, memberId: 'mock-10', userId: 'user-10', name: 'Tom Martinez', role: 'Operations Lead', team: 'Operations', status: 'distress', location: 'Building B, Floor 2', lastUpdated: '15 min ago', severity: 'medium', details: 'Sprained ankle, needs medical' },
  { id: 11, memberId: 'mock-11', userId: 'user-11', name: 'Yuki Tanaka', role: 'Backend Engineer', team: 'Engineering', status: 'safe', location: 'Remote', lastUpdated: '4 min ago' },
  { id: 12, memberId: 'mock-12', userId: 'user-12', name: 'Rachel Green', role: 'Content Writer', team: 'Marketing', status: 'unknown', location: '-', lastUpdated: '-' },
  { id: 13, memberId: 'mock-13', userId: 'user-13', name: 'Alex Thompson', role: 'QA Engineer', team: 'Engineering', status: 'safe', location: 'Building A, Floor 3', lastUpdated: '9 min ago' },
  { id: 14, memberId: 'mock-14', userId: 'user-14', name: 'Priya Sharma', role: 'Finance Analyst', team: 'Operations', status: 'safe', location: 'Building A, Floor 1', lastUpdated: '6 min ago' },
  { id: 15, memberId: 'mock-15', userId: 'user-15', name: 'Chris Lee', role: 'Designer', team: 'Design', status: 'unknown', location: '-', lastUpdated: '-' },
  { id: 16, memberId: 'mock-16', userId: 'user-16', name: 'Maria Garcia', role: 'Recruiter', team: 'HR', status: 'safe', location: 'Building A, Floor 1', lastUpdated: '11 min ago' },
  { id: 17, memberId: 'mock-17', userId: 'user-17', name: 'Sam Taylor', role: 'Sales Manager', team: 'Sales', status: 'safe', location: 'Building A, Floor 2', lastUpdated: '14 min ago' },
  { id: 18, memberId: 'mock-18', userId: 'user-18', name: 'John Smith', role: 'CTO', team: 'Engineering', status: 'safe', location: 'Building A, Floor 3', lastUpdated: '1 min ago' },
  { id: 19, memberId: 'mock-19', userId: 'user-19', name: 'Linda Park', role: 'Office Manager', team: 'Operations', status: 'unknown', location: '-', lastUpdated: '-' },
  { id: 20, memberId: 'mock-20', userId: 'user-20', name: "Kevin O'Brien", role: 'Support Engineer', team: 'Engineering', status: 'safe', location: 'Building B, Floor 1', lastUpdated: '10 min ago' },
];

const TEAMS = [
  { name: 'Engineering', memberCount: 9 },
  { name: 'Product', memberCount: 1 },
  { name: 'Design', memberCount: 2 },
  { name: 'Marketing', memberCount: 2 },
  { name: 'Sales', memberCount: 2 },
  { name: 'HR', memberCount: 2 },
  { name: 'Operations', memberCount: 3 },
];

const EVENT: EmergencyEvent = {
  id: 1,
  uuid: 'mock-event-uuid',
  name: 'Fire Drill',
  type: 'Drill',
  status: 'Active',
  started: '12 min ago',
  startedAt: new Date(Date.now() - 12 * 60000).toISOString(),
  resolvedAt: null,
};

const CURRENT_USER_ID = 4;

export function useMockData() {
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [event] = useState<EmergencyEvent>(EVENT);
  const [teams] = useState(TEAMS);
  const [currentUserId] = useState(CURRENT_USER_ID);
  const [updatedRowId, setUpdatedRowId] = useState<number | null>(null);
  const updatedRowTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentUser = employees.find((e) => e.id === currentUserId)!;

  // Simulated real-time updates
  useEffect(() => {
    const locations = ['Building A, Floor 1', 'Building A, Floor 2', 'Building A, Floor 3', 'Building B, Floor 1', 'Building B, Floor 2', 'Remote'];
    const timeAgo = ['Just now', '1 min ago', '2 min ago', '3 min ago'];

    const interval = setInterval(() => {
      const unknownEmployees = employees.filter((e) => e.status === 'unknown');
      if (unknownEmployees.length === 0) return;

      const randomEmployee = unknownEmployees[Math.floor(Math.random() * unknownEmployees.length)];
      const newStatus: EmployeeStatus = Math.random() > 0.15 ? 'safe' : 'distress';

      setEmployees((prev) =>
        prev.map((e) => {
          if (e.id === randomEmployee.id) {
            return {
              ...e,
              status: newStatus,
              location: newStatus === 'safe' ? locations[Math.floor(Math.random() * locations.length)] : e.location,
              lastUpdated: timeAgo[Math.floor(Math.random() * timeAgo.length)],
              severity: newStatus === 'distress' ? 'medium' : undefined,
              details: newStatus === 'distress' ? 'Need assistance' : undefined,
            };
          }
          return e;
        })
      );

      setUpdatedRowId(randomEmployee.id);
      if (updatedRowTimeout.current) clearTimeout(updatedRowTimeout.current);
      updatedRowTimeout.current = setTimeout(() => setUpdatedRowId(null), 1500);
    }, 5000 + Math.random() * 5000);

    return () => clearInterval(interval);
  }, [employees]);

  const reportSafe = useCallback(() => {
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === currentUserId
          ? { ...e, status: 'safe' as EmployeeStatus, location: 'Building A, Floor 3', lastUpdated: 'Just now' }
          : e
      )
    );
  }, [currentUserId]);

  const reportDistress = useCallback((location: string, severity: Severity, details: string) => {
    setEmployees((prev) =>
      prev.map((e) =>
        e.id === currentUserId
          ? { ...e, status: 'distress' as EmployeeStatus, location, lastUpdated: 'Just now', severity, details }
          : e
      )
    );
  }, [currentUserId]);

  const sendReminder = useCallback((_employeeId: number) => {
    // In real app, this would call an API
    return true;
  }, []);

  const sendAlert = useCallback((_employeeIds: number[], _message: string) => {
    // In real app, this would call an API
    return true;
  }, []);

  const getStatusHistory = useCallback((): StatusHistoryEntry[] => {
    const user = employees.find((e) => e.id === currentUserId);
    const history: StatusHistoryEntry[] = [
      { status: 'safe', timestamp: 'Today, 2:34 PM' },
      { status: 'distress', timestamp: 'Today, 2:15 PM', note: 'Stuck in elevator, Building B' },
      { status: 'safe', timestamp: 'Today, 2:05 PM' },
      { status: 'unknown', timestamp: 'Today, 2:00 PM' },
    ];
    if (user?.status === 'safe') {
      history.unshift({ status: 'safe', timestamp: 'Just now' });
    } else if (user?.status === 'distress') {
      history.unshift({ status: 'distress', timestamp: 'Just now', note: user.details });
    }
    return history;
  }, [employees, currentUserId]);

  const stats = {
    total: employees.length,
    safe: employees.filter((e) => e.status === 'safe').length,
    distress: employees.filter((e) => e.status === 'distress').length,
    unknown: employees.filter((e) => e.status === 'unknown').length,
  };

  return {
    employees,
    event,
    teams,
    currentUser,
    currentUserId,
    stats,
    updatedRowId,
    reportSafe,
    reportDistress,
    sendReminder,
    sendAlert,
    getStatusHistory,
  };
}
