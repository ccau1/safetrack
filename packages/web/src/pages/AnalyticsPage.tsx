import { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { Activity, Clock, Gauge, ShieldCheck, HelpCircle, Loader2, X, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useAnalytics, type AnalyticsFilters, type TeamPerformance } from '@/hooks/useAnalytics';
import type { EmergencyEventApi, Member, TeamApi } from '@/types';

interface AnalyticsPageProps {
  orgId: string | null;
  teams: TeamApi[];
  members: Member[];
  events: EmergencyEventApi[];
}

const SLA_THRESHOLD_MINUTES = 15;

function formatDuration(minutes: number | null): string {
  if (minutes == null) return '-';
  if (minutes < 1) return '<1m';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatDateShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function AnalyticsPage({ orgId, teams, members, events }: AnalyticsPageProps) {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const parseList = (value: string | null): string[] => {
    if (!value) return [];
    return value.split(',').filter(Boolean);
  };

  const [filters, setFilters] = useState<AnalyticsFilters>({
    teamIds: parseList(searchParams.get('teamIds')),
    memberIds: parseList(searchParams.get('memberIds')),
    eventIds: parseList(searchParams.get('eventIds')),
    from: searchParams.get('from') || null,
    to: searchParams.get('to') || null,
  });

  useEffect(() => {
    const next = new URLSearchParams();
    if (filters.teamIds.length) next.set('teamIds', filters.teamIds.join(','));
    if (filters.memberIds.length) next.set('memberIds', filters.memberIds.join(','));
    if (filters.eventIds.length) next.set('eventIds', filters.eventIds.join(','));
    if (filters.from) next.set('from', filters.from);
    if (filters.to) next.set('to', filters.to);
    setSearchParams(next, { replace: true });
  }, [filters, setSearchParams]);

  const { data, isLoading, refetch } = useAnalytics(orgId, filters);

  const hasFilters =
    filters.teamIds.length > 0 ||
    filters.memberIds.length > 0 ||
    filters.eventIds.length > 0 ||
    filters.from != null ||
    filters.to != null;

  const clearFilters = useCallback(() => {
    setFilters({ teamIds: [], memberIds: [], eventIds: [], from: null, to: null });
  }, []);

  const toggleTeam = useCallback((teamId: string) => {
    setFilters((prev) => ({
      ...prev,
      teamIds: prev.teamIds.includes(teamId)
        ? prev.teamIds.filter((id) => id !== teamId)
        : [...prev.teamIds, teamId],
    }));
  }, []);

  const toggleMember = useCallback((memberId: string) => {
    setFilters((prev) => ({
      ...prev,
      memberIds: prev.memberIds.includes(memberId)
        ? prev.memberIds.filter((id) => id !== memberId)
        : [...prev.memberIds, memberId],
    }));
  }, []);

  const toggleEvent = useCallback((eventId: string) => {
    setFilters((prev) => ({
      ...prev,
      eventIds: prev.eventIds.includes(eventId)
        ? prev.eventIds.filter((id) => id !== eventId)
        : [...prev.eventIds, eventId],
    }));
  }, []);

  const eventTrendData = useMemo(() => {
    if (!data?.events) return [];
    return data.events.map((e) => ({
      date: formatDateShort(e.startedAt),
      fullTitle: e.eventTitle,
      responseRate: e.responseRate,
      avgMinutes: e.avgResponseMinutes ?? 0,
      p50: e.p50ResponseMinutes ?? 0,
      p90: e.p90ResponseMinutes ?? 0,
      p99: e.p99ResponseMinutes ?? 0,
    }));
  }, [data]);



  const slaColor = (rate: number) => {
    if (rate >= 95) return 'text-[#4A5548]';
    if (rate >= 80) return 'text-[#B38600]';
    return 'text-[#C44536]';
  };

  const latencyColor = (minutes: number | null) => {
    if (minutes == null) return 'text-[#8A8A8A]';
    if (minutes <= 5) return 'text-[#4A5548]';
    if (minutes <= SLA_THRESHOLD_MINUTES) return 'text-[#B38600]';
    return 'text-[#C44536]';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]">{t('analytics.title')}</h1>
          <p className="text-sm text-[#8A8A8A] mt-1">{t('analytics.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters} className="text-[#5C5C5C] border-[#E5E4E0]">
              <X size={14} className="mr-1" />
              {t('analytics.clearFilters')}
            </Button>
          )}
          <Button size="sm" onClick={refetch} disabled={isLoading} className="bg-[#4A5548] hover:bg-[#3A4538] text-white">
            {isLoading ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
            {t('analytics.refresh')}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#E5E4E0] rounded-xl shadow-sm">
        <div className="p-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {/* Teams filter */}
            <Select
              value={filters.teamIds.length === 1 ? filters.teamIds[0] : filters.teamIds.length > 1 ? 'multiple' : '__all__'}
              onValueChange={(value) => {
                if (value === 'multiple') return;
                if (value === '__all__') setFilters((prev) => ({ ...prev, teamIds: [] }));
                else setFilters((prev) => ({ ...prev, teamIds: [value] }));
              }}
            >
              <SelectTrigger className="h-8 bg-[#F7F6F2] border-[#E5E4E0] text-xs text-[#1A1A1A] rounded-[10px]">
                <SelectValue placeholder={t('analytics.filters.allTeams')} />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#E5E4E0] rounded-[10px]">
                <SelectItem value="__all__">{t('analytics.filters.allTeams')}</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Members filter */}
            <Select
              value={filters.memberIds.length === 1 ? filters.memberIds[0] : filters.memberIds.length > 1 ? 'multiple' : '__all__'}
              onValueChange={(value) => {
                if (value === 'multiple') return;
                if (value === '__all__') setFilters((prev) => ({ ...prev, memberIds: [] }));
                else setFilters((prev) => ({ ...prev, memberIds: [value] }));
              }}
            >
              <SelectTrigger className="h-8 bg-[#F7F6F2] border-[#E5E4E0] text-xs text-[#1A1A1A] rounded-[10px]">
                <SelectValue placeholder={t('analytics.filters.allMembers')} />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#E5E4E0] rounded-[10px] max-h-[240px]">
                <SelectItem value="__all__">{t('analytics.filters.allMembers')}</SelectItem>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>{member.firstName} {member.lastName}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Events filter */}
            <Select
              value={filters.eventIds.length === 1 ? filters.eventIds[0] : filters.eventIds.length > 1 ? 'multiple' : '__all__'}
              onValueChange={(value) => {
                if (value === 'multiple') return;
                if (value === '__all__') setFilters((prev) => ({ ...prev, eventIds: [] }));
                else setFilters((prev) => ({ ...prev, eventIds: [value] }));
              }}
            >
              <SelectTrigger className="h-8 bg-[#F7F6F2] border-[#E5E4E0] text-xs text-[#1A1A1A] rounded-[10px]">
                <SelectValue placeholder={t('analytics.filters.allEvents')} />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#E5E4E0] rounded-[10px] max-h-[240px]">
                <SelectItem value="__all__">{t('analytics.filters.allEvents')}</SelectItem>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>{event.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date range */}
            <div className="flex items-center gap-1.5">
              <Input type="datetime-local" value={filters.from || ''} onChange={(e) => setFilters((prev) => ({ ...prev, from: e.target.value || null }))} className="h-8 bg-[#F7F6F2] border-[#E5E4E0] text-xs text-[#1A1A1A] rounded-[10px] px-2" />
              <span className="text-[#8A8A8A] text-xs shrink-0">-</span>
              <Input type="datetime-local" value={filters.to || ''} onChange={(e) => setFilters((prev) => ({ ...prev, to: e.target.value || null }))} className="h-8 bg-[#F7F6F2] border-[#E5E4E0] text-xs text-[#1A1A1A] rounded-[10px] px-2" />
            </div>
          </div>

          {/* Active filter badges — single compact row */}
          {(filters.teamIds.length > 0 || filters.memberIds.length > 0 || filters.eventIds.length > 0 || filters.from || filters.to) && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t border-[#F0EFEB]">
              {filters.teamIds.map((id) => {
                const team = teams.find((t) => t.id === id);
                return (
                  <Badge key={id} variant="secondary" className="cursor-pointer bg-[#E8EDE7] text-[#4A5548] hover:bg-[#D8DDD7] text-[10px] h-5" onClick={() => toggleTeam(id)}>
                    {t('analytics.filters.teams')}: {team?.name || id} <X size={9} className="ml-0.5" />
                  </Badge>
                );
              })}
              {filters.memberIds.map((id) => {
                const member = members.find((m) => m.id === id);
                return (
                  <Badge key={id} variant="secondary" className="cursor-pointer bg-[#E8EDE7] text-[#4A5548] hover:bg-[#D8DDD7] text-[10px] h-5" onClick={() => toggleMember(id)}>
                    {t('analytics.filters.members')}: {member ? `${member.firstName} ${member.lastName}` : id} <X size={9} className="ml-0.5" />
                  </Badge>
                );
              })}
              {filters.eventIds.map((id) => {
                const event = events.find((e) => e.id === id);
                return (
                  <Badge key={id} variant="secondary" className="cursor-pointer bg-[#E8EDE7] text-[#4A5548] hover:bg-[#D8DDD7] text-[10px] h-5" onClick={() => toggleEvent(id)}>
                    {t('analytics.filters.events')}: {event?.title || id} <X size={9} className="ml-0.5" />
                  </Badge>
                );
              })}
              {filters.from && (
                <Badge variant="secondary" className="bg-[#F0EFEB] text-[#5C5C5C] text-[10px] h-5">
                  {t('analytics.filters.dateRange')}: {new Date(filters.from).toLocaleDateString()}
                </Badge>
              )}
              {filters.to && (
                <Badge variant="secondary" className="bg-[#F0EFEB] text-[#5C5C5C] text-[10px] h-5">
                  - {new Date(filters.to).toLocaleDateString()}
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Org SLA Summary */}
      {data?.orgSla && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <SlaCard
            icon={<Activity size={18} />}
            label={t('analytics.sla.responseRate')}
            value={`${data.orgSla.overallResponseRate}%`}
            sub={t('analytics.sla.uptimeEquivalent')}
            color={slaColor(data.orgSla.overallResponseRate)}
            bg="bg-[#4A5548]"
          />
          <SlaCard
            icon={<Clock size={18} />}
            label={t('analytics.sla.avgLatency')}
            value={formatDuration(data.orgSla.overallAvgResponseMinutes)}
            sub={`P90: ${formatDuration(data.orgSla.overallP90ResponseMinutes)}`}
            color={latencyColor(data.orgSla.overallAvgResponseMinutes)}
            bg="bg-[#3B82F6]"
          />
          <SlaCard
            icon={<ShieldCheck size={18} />}
            label={t('analytics.sla.slaCompliance')}
            value={`${data.orgSla.overallSlaComplianceRate}%`}
            sub={`< ${SLA_THRESHOLD_MINUTES}min target`}
            color={slaColor(data.orgSla.overallSlaComplianceRate)}
            bg="bg-[#4A5548]"
          />
          <SlaCard
            icon={<AlertTriangle size={18} />}
            label={t('analytics.sla.distressRate')}
            value={`${data.orgSla.overallDistressRate}%`}
            sub={t('analytics.sla.membersNeedingHelp')}
            color={data.orgSla.overallDistressRate > 10 ? 'text-[#C44536]' : 'text-[#4A5548]'}
            bg="bg-[#C44536]"
          />
        </div>
      )}

      {/* Team Performance Cards */}
      {data && data.teamPerformances.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-[#1A1A1A] mb-3">{t('analytics.teamCards.title')}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {data.teamPerformances.map((team) => (
              <TeamSlaCard key={team.teamId} team={team} t={t} />
            ))}
          </div>
        </div>
      )}

      {/* Trend Charts */}
      {data && data.events.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Response Rate Trend - like uptime monitoring */}
          <Card className="border-[#E5E4E0] bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-medium text-[#1A1A1A] flex items-center gap-2">
                <TrendingUp size={16} className="text-[#4A5548]" />
                {t('analytics.charts.responseRateTrend')}
              </CardTitle>
              <CardDescription className="text-xs text-[#8A8A8A]">{t('analytics.charts.responseRateTrendDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={eventTrendData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E4E0" />
                    <XAxis dataKey="date" tick={{ fill: '#5C5C5C', fontSize: 11 }} axisLine={{ stroke: '#E5E4E0' }} tickLine={false} />
                    <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fill: '#5C5C5C', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value: number) => [`${value}%`, t('analytics.sla.responseRate')]} contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E4E0', borderRadius: '10px', fontSize: '12px' }} />
                    <ReferenceLine y={95} stroke="#4A5548" strokeDasharray="4 4" label={{ value: '95% SLA', position: 'right', fill: '#4A5548', fontSize: 11 }} />
                    <Line type="monotone" dataKey="responseRate" stroke="#4A5548" strokeWidth={2} dot={{ r: 3, fill: '#4A5548' }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Latency Percentile Trend */}
          <Card className="border-[#E5E4E0] bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-medium text-[#1A1A1A] flex items-center gap-2">
                <Gauge size={16} className="text-[#3B82F6]" />
                {t('analytics.charts.latencyTrend')}
              </CardTitle>
              <CardDescription className="text-xs text-[#8A8A8A]">{t('analytics.charts.latencyTrendDesc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={eventTrendData} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E4E0" />
                    <XAxis dataKey="date" tick={{ fill: '#5C5C5C', fontSize: 11 }} axisLine={{ stroke: '#E5E4E0' }} tickLine={false} />
                    <YAxis tickFormatter={(v) => `${v}m`} tick={{ fill: '#5C5C5C', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value: number, name: string) => [formatDuration(value), name]} contentStyle={{ backgroundColor: '#fff', border: '1px solid #E5E4E0', borderRadius: '10px', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <ReferenceLine y={SLA_THRESHOLD_MINUTES} stroke="#C44536" strokeDasharray="4 4" label={{ value: `${SLA_THRESHOLD_MINUTES}m SLA`, position: 'right', fill: '#C44536', fontSize: 11 }} />
                    <Line type="monotone" dataKey="p50" name="P50" stroke="#4A5548" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="p90" name="P90" stroke="#E8A838" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="p99" name="P99" stroke="#C44536" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Team SLA Leaderboard */}
      {data && data.teamPerformances.length > 0 && (
        <Card className="border-[#E5E4E0] bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-medium text-[#1A1A1A]">{t('analytics.sla.leaderboard')}</CardTitle>
            <CardDescription className="text-xs text-[#8A8A8A]">{t('analytics.sla.leaderboardDesc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E5E4E0]">
                    <th className="text-left font-medium text-[#8A8A8A] py-2 pr-4">{t('analytics.table.team')}</th>
                    <th className="text-right font-medium text-[#8A8A8A] py-2 pr-4">{t('analytics.sla.events')}</th>
                    <th className="text-right font-medium text-[#8A8A8A] py-2 pr-4">{t('analytics.sla.responseRate')}</th>
                    <th className="text-right font-medium text-[#8A8A8A] py-2 pr-4">{t('analytics.sla.avgLatency')}</th>
                    <th className="text-right font-medium text-[#8A8A8A] py-2 pr-4">P50</th>
                    <th className="text-right font-medium text-[#8A8A8A] py-2 pr-4">P90</th>
                    <th className="text-right font-medium text-[#8A8A8A] py-2 pr-4">{t('analytics.sla.slaCompliance')}</th>
                    <th className="text-right font-medium text-[#8A8A8A] py-2">{t('analytics.sla.distressRate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {[...data.teamPerformances]
                    .sort((a, b) => b.responseRate - a.responseRate || (a.avgResponseMinutes ?? 0) - (b.avgResponseMinutes ?? 0))
                    .map((team) => (
                      <tr key={team.teamId} className="border-b border-[#F0EFEB] last:border-0">
                        <td className="py-3 pr-4 text-[#1A1A1A] font-medium">{team.teamName}</td>
                        <td className="py-3 pr-4 text-right text-[#5C5C5C]">{team.eventsParticipated}</td>
                        <td className={`py-3 pr-4 text-right font-medium ${slaColor(team.responseRate)}`}>{team.responseRate}%</td>
                        <td className={`py-3 pr-4 text-right ${latencyColor(team.avgResponseMinutes)}`}>{formatDuration(team.avgResponseMinutes)}</td>
                        <td className="py-3 pr-4 text-right text-[#5C5C5C]">{formatDuration(team.p50ResponseMinutes)}</td>
                        <td className="py-3 pr-4 text-right text-[#5C5C5C]">{formatDuration(team.p90ResponseMinutes)}</td>
                        <td className={`py-3 pr-4 text-right font-medium ${slaColor(team.slaComplianceRate)}`}>{team.slaComplianceRate}%</td>
                        <td className={`py-3 text-right ${team.distressRate > 10 ? 'text-[#C44536] font-medium' : 'text-[#5C5C5C]'}`}>{team.distressRate}%</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Distress Recovery Table */}
      {data && data.distressRecoveries.length > 0 && (
        <Card className="border-[#E5E4E0] bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-medium text-[#1A1A1A] flex items-center gap-2">
              <Clock size={16} className="text-[#C44536]" />
              {t('analytics.distressToSafe.title')}
            </CardTitle>
            <CardDescription className="text-xs text-[#8A8A8A]">{t('analytics.distressToSafe.desc')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E5E4E0]">
                    <th className="text-left font-medium text-[#8A8A8A] py-2 pr-4">{t('analytics.table.event')}</th>
                    <th className="text-left font-medium text-[#8A8A8A] py-2 pr-4">{t('analytics.table.member')}</th>
                    <th className="text-left font-medium text-[#8A8A8A] py-2 pr-4">{t('analytics.table.team')}</th>
                    <th className="text-right font-medium text-[#8A8A8A] py-2">{t('analytics.distressToSafe.duration')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.distressRecoveries.map((rec) => (
                    <tr key={`${rec.eventId}-${rec.memberId}`} className="border-b border-[#F0EFEB] last:border-0">
                      <td className="py-3 pr-4 text-[#1A1A1A] font-medium">{rec.eventTitle}</td>
                      <td className="py-3 pr-4 text-[#5C5C5C]">{rec.memberName}</td>
                      <td className="py-3 pr-4 text-[#5C5C5C]">{rec.teamName || '-'}</td>
                      <td className="py-3 text-right">
                        <span className="font-medium text-[#4A5548]">{formatDuration(rec.distressToSafeMinutes)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {data && data.events.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <HelpCircle size={40} className="text-[#E5E4E0] mb-3" />
          <p className="text-[#8A8A8A] text-sm">{t('analytics.noData')}</p>
          {hasFilters && (
            <Button variant="link" onClick={clearFilters} className="text-[#4A5548] mt-1">
              {t('analytics.clearFilters')}
            </Button>
          )}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={24} className="animate-spin text-[#4A5548]" />
        </div>
      )}
    </div>
  );
}

function SlaCard({
  icon,
  label,
  value,
  sub,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
  bg: string;
}) {
  return (
    <Card className="border-[#E5E4E0] bg-white shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-[10px] ${bg} text-white flex items-center justify-center shrink-0`}>{icon}</div>
          <div className="min-w-0">
            <p className="text-xs text-[#8A8A8A]">{label}</p>
            <p className={`text-xl font-semibold ${color}`}>{value}</p>
            <p className="text-[10px] text-[#8A8A8A]">{sub}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TeamSlaCard({
  team,
  t,
}: {
  team: TeamPerformance;
  t: (key: string) => string;
}) {
  const slaOk = team.slaComplianceRate >= 95;
  const rateOk = team.responseRate >= 95;
  return (
    <Card className="border-[#E5E4E0] bg-white shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#1A1A1A] truncate">{team.teamName}</h3>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              rateOk ? 'bg-[#E8EDE7] text-[#4A5548]' : 'bg-[#FDE8E7] text-[#C44536]'
            }`}
          >
            {team.responseRate}%
          </span>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mb-3">
          <div>
            <span className="text-[#8A8A8A]">{t('analytics.sla.avgLatency')}</span>
            <p className={`font-semibold ${team.avgResponseMinutes != null && team.avgResponseMinutes <= 15 ? 'text-[#4A5548]' : 'text-[#C44536]'}`}>
              {formatDuration(team.avgResponseMinutes)}
            </p>
          </div>
          <div>
            <span className="text-[#8A8A8A]">P90</span>
            <p className="font-semibold text-[#1A1A1A]">{formatDuration(team.p90ResponseMinutes)}</p>
          </div>
          <div>
            <span className="text-[#8A8A8A]">{t('analytics.sla.slaCompliance')}</span>
            <p className={`font-semibold ${slaOk ? 'text-[#4A5548]' : 'text-[#C44536]'}`}>{team.slaComplianceRate}%</p>
          </div>
          <div>
            <span className="text-[#8A8A8A]">{t('analytics.sla.distressRate')}</span>
            <p className={`font-semibold ${team.distressRate > 10 ? 'text-[#C44536]' : 'text-[#1A1A1A]'}`}>{team.distressRate}%</p>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs border-t border-[#F0EFEB] pt-2">
          <span className="text-[#8A8A8A]">
            {team.respondedCount} / {team.totalMembersAcrossEvents} {t('analytics.teamCards.responded')}
          </span>
          <span className="text-[#8A8A8A]">
            {team.eventsParticipated} {t('analytics.sla.events')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
