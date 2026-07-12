import { MaintenanceStatus, type Maintenance } from '@/src/domain/maintenance';
import type { Motorcycle } from '@/src/domain/motorcycle';
import { calculateDateMaintenanceStatus, calculateKmMaintenanceStatus } from '@/src/features/maintenance-engine';

export type MaintenanceReminderSettings = { readonly enabled: boolean; readonly dueSoonKm: number; readonly dueSoonDays: number; readonly dailySummaryEnabled: boolean };
export type MaintenanceReminderKind = 'date-due-soon' | 'date-overdue' | 'distance-due-soon' | 'distance-overdue';
export type MaintenanceReminderPlan = { readonly kind: MaintenanceReminderKind; readonly maintenanceId: string; readonly workspaceId: string; readonly title: string; readonly body: string; readonly triggerDate: Date | null; readonly signature: string };
export type PlannerInput = { readonly workspaceId: string; readonly maintenance: Maintenance; readonly motorcycle: Motorcycle; readonly settings: MaintenanceReminderSettings; readonly now?: Date };

export function planMaintenanceReminder(input:PlannerInput):MaintenanceReminderPlan|null{
  const {maintenance,motorcycle,settings,workspaceId}=input;
  if(!settings.enabled||maintenance.status===MaintenanceStatus.Completed||maintenance.status===MaintenanceStatus.Skipped)return null;
  const now=input.now??new Date();
  const km=calculateKmMaintenanceStatus({lastServiceOdometerKm:maintenance.lastServiceOdometerKm,intervalKm:maintenance.intervalKm,currentOdometerKm:motorcycle.odometerKm,dueSoonThresholdKm:settings.dueSoonKm});
  const date=calculateDateMaintenanceStatus({lastServiceDate:maintenance.lastServiceDate,intervalDays:maintenance.intervalDays,currentDate:now,dueSoonThresholdDays:settings.dueSoonDays});
  if(km.status==='overdue')return plan('distance-overdue',`Maintenance Overdue`,`${maintenance.title} is overdue by ${Math.round(km.overdueByKm??0)} km on ${motorcycle.nickname}.`,null);
  if(date.status==='overdue')return plan('date-overdue','Maintenance Overdue',`${maintenance.title} is ${Math.round(date.overdueByDays??0)} days overdue on ${motorcycle.nickname}.`,null);
  if(km.status==='dueSoon')return plan('distance-due-soon',`${maintenance.title} Due Soon`,`Your ${maintenance.title.toLowerCase()} is due in ${Math.round(km.remainingKm??0)} km.`,null);
  if(date.status==='dueSoon')return plan('date-due-soon',`${maintenance.title} Due Soon`,`${motorcycle.nickname} ${maintenance.title.toLowerCase()} is due in ${Math.round(date.remainingDays??0)} days.`,null);
  if(date.nextDueDate){const trigger=dueSoonDate(date.nextDueDate,settings.dueSoonDays);if(trigger&&trigger>now)return plan('date-due-soon',`${maintenance.title} Due Soon`,`${motorcycle.nickname} ${maintenance.title.toLowerCase()} is due in ${settings.dueSoonDays} days.`,trigger)}
  return null;
  function plan(kind: MaintenanceReminderKind, title: string, body: string, triggerDate: Date | null): MaintenanceReminderPlan {
    return {
      kind,
      maintenanceId: maintenance.id,
      workspaceId,
      title,
      body,
      triggerDate,
      // Odometer changes re-evaluate state but do not repeatedly notify while a
      // task remains in the same due-soon/overdue state.
      signature: `${kind}:${maintenance.updatedAt}:${triggerDate?.toISOString() ?? 'now'}`,
    };
  }
}
function dueSoonDate(value:string,days:number){const timestamp=Date.parse(`${value}T09:00:00`);if(!Number.isFinite(timestamp))return null;return new Date(timestamp-days*86400000)}

export function isMaintenanceNotificationPayload(value:unknown):value is {readonly type:'maintenance-reminder';readonly maintenanceId:string;readonly workspaceId:string}{if(!value||typeof value!=='object')return false;const data=value as Record<string,unknown>;return data.type==='maintenance-reminder'&&typeof data.maintenanceId==='string'&&typeof data.workspaceId==='string'}
