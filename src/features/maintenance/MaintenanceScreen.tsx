import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Alert, Animated, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Motorcycle } from '@/src/domain/motorcycle';
import { createMaintenanceService, createMotorcycleService, createSettingsService, recommendCategoryForMaintenance, type CreateMaintenanceInput, type MaintenanceListItem } from '@/src/services';
import { layout, palette, radius, spacing, typography } from '@/src/theme';

import { MaintenanceCreateSheet } from './components/MaintenanceCreateSheet';
import { EmptyMaintenanceState } from './components/EmptyMaintenanceState';
import { MaintenanceHeader } from './components/MaintenanceHeader';
import { MaintenanceStatusCard } from './components/MaintenanceStatusCard';
import { MaintenanceTaskCard } from './components/MaintenanceTaskCard';
import { MaintenanceTimeline } from './components/MaintenanceTimeline';
import type { MaintenanceData, MaintenanceStatus } from './types';

export function MaintenanceScreen() {
  const router=useRouter();
  const maintenanceService = useMemo(() => createMaintenanceService(), []);
  const motorcycleService=useMemo(()=>createMotorcycleService(),[]);
  const settingsService=useMemo(()=>createSettingsService(),[]);
  const [primaryMotorcycle,setPrimaryMotorcycle]=useState<Motorcycle|null>(null);
  const [activeTab,setActiveTab]=useState<'Upcoming'|'Completed'|'All Tasks'>('Upcoming');
  const [remindersEnabled,setRemindersEnabled]=useState(false);
  const [refreshing,setRefreshing]=useState(false);
  const [upcomingMaintenance, setUpcomingMaintenance] = useState<readonly MaintenanceListItem[]>([]);
  const [maintenanceHistory, setMaintenanceHistory] = useState<readonly MaintenanceListItem[]>([]);
  const [createSheetVisible, setCreateSheetVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const maintenanceData = useMemo(
    () => createMaintenanceData(upcomingMaintenance, maintenanceHistory),
    [upcomingMaintenance, maintenanceHistory],
  );
  const refreshMaintenance = useCallback(async () => {
    const [upcomingResult, historyResult, motorcycleResult] = await Promise.all([
      maintenanceService.getUpcomingMaintenance(),
      maintenanceService.getMaintenanceHistory(),
      motorcycleService.requirePrimaryMotorcycle(),
    ]);
    if(motorcycleResult.ok)setPrimaryMotorcycle(motorcycleResult.value);else setPrimaryMotorcycle(null);
    const settingsResult=settingsService.getSettingsOverview();if(settingsResult.ok)setRemindersEnabled(settingsResult.value.localNotificationsEnabled);

    if (upcomingResult.ok) {
      setUpcomingMaintenance(upcomingResult.value);
    } else {
      Alert.alert('Maintenance unavailable', upcomingResult.error.message);
    }

    if (historyResult.ok) {
      setMaintenanceHistory(historyResult.value);
    } else {
      Alert.alert('Maintenance history unavailable', historyResult.error.message);
    }
  }, [maintenanceService,motorcycleService,settingsService]);

  useFocusEffect(useCallback(() => { void refreshMaintenance(); }, [refreshMaintenance]));
  async function handleRefresh(){setRefreshing(true);await refreshMaintenance();setRefreshing(false)}

  async function handleCreateMaintenance(input: CreateMaintenanceInput) {
    setSaving(true);
    const result = await maintenanceService.createMaintenance(input);
    setSaving(false);

    if (!result.ok) {
      Alert.alert('Maintenance not saved', result.error.message);
      return;
    }

    setCreateSheetVisible(false);
    await refreshMaintenance();
  }

  async function handleCompleteMaintenance(id: string) {
    const result = await maintenanceService.completeMaintenance({ id });

    if (!result.ok) {
      Alert.alert('Maintenance not completed', result.error.message);
      return;
    }

    await refreshMaintenance();
  }

  function handleLogService() {
    const firstMaintenance = upcomingMaintenance[0];

    if (!firstMaintenance) {
      setCreateSheetVisible(true);
      return;
    }

    Alert.alert('Complete service?', `Mark ${firstMaintenance.maintenance.title} as completed?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Complete',
        onPress: () => {
          void handleCompleteMaintenance(firstMaintenance.maintenance.id);
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.backgroundGlowTop} />
      <View style={styles.backgroundGlowBottom} />
      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} tintColor={palette.accentOrange} colors={[palette.accentOrange]} onRefresh={() => { void handleRefresh(); }}/>} style={styles.screen} contentContainerStyle={styles.content}>
        <MaintenanceHeader onAdd={() => setCreateSheetVisible(true)} />

        <CurrentMotorcycleCard motorcycle={primaryMotorcycle} onChange={()=>router.push('/garage')} />

        <AnimatedEntrance delay={80}>
          <MaintenanceStatusCard status={maintenanceData.overallStatus} />
        </AnimatedEntrance>

        <AnimatedEntrance delay={280}>
          <View style={styles.section}>
            <MaintenanceTabs selected={activeTab} onSelect={setActiveTab}/>
            {activeTab==='Completed'?<MaintenanceTimeline items={maintenanceData.timeline}/>:maintenanceData.upcomingTasks.length > 0 ? (
              <View style={styles.taskStack}>
                {maintenanceData.upcomingTasks.map((task) => (
                  <MaintenanceTaskCard
                    key={task.id}
                    task={task}
                    onComplete={() => {
                      void handleCompleteMaintenance(task.id);
                    }}
                    onFindService={() => {
                      const recommendation = recommendCategoryForMaintenance(task.type);
                      router.push({ pathname: '/nearby-services', params: { category: recommendation.category, recommended: 'maintenance' } });
                    }}
                  />
                ))}
              </View>
            ) : (
              <EmptyMaintenanceState />
            )}
            {activeTab==='All Tasks'&&maintenanceData.timeline.length>0?<MaintenanceTimeline items={maintenanceData.timeline}/>:null}
          </View>
        </AnimatedEntrance>

        <Pressable onPress={()=>setActiveTab('Completed')} style={({pressed})=>[styles.actionCard,pressed&&styles.pressed]}><View style={styles.actionIcon}><SymbolView name={{ios:'calendar',android:'calendar_month',web:'calendar_month'}} tintColor="#FFD18A" size={24}/></View><View style={styles.actionCopy}><Text style={styles.actionTitle}>Maintenance History</Text><Text style={styles.actionSubtitle}>View all completed maintenance records</Text></View><SymbolView name={{ios:'chevron.right',android:'chevron_right',web:'chevron_right'}} tintColor={palette.textMuted} size={22}/></Pressable>
        <View style={styles.reminderCard}><View style={styles.actionCopy}><Text style={styles.actionTitle}>Maintenance Reminders</Text><Text style={styles.actionSubtitle}>Get notified before your maintenance is due</Text></View><Switch value={remindersEnabled} onValueChange={(value)=>{const result=settingsService.setLocalNotificationsEnabled(value);if(result.ok)setRemindersEnabled(result.value)}} trackColor={{false:'rgba(255,255,255,.12)',true:palette.accentOrange}} thumbColor="#fff"/></View>
      </ScrollView>
      <MaintenanceCreateSheet
        visible={createSheetVisible}
        loading={saving}
        onClose={() => setCreateSheetVisible(false)}
        onCreate={(input) => {
          void handleCreateMaintenance(input);
        }}
      />
    </SafeAreaView>
  );
}

function CurrentMotorcycleCard({motorcycle,onChange}:{readonly motorcycle:Motorcycle|null;readonly onChange:()=>void}){return <View style={styles.motorcycleCard}><View style={styles.motorcycleHeader}><View style={styles.motorcycleCopy}><Text style={styles.motorcycleKicker}>CURRENT MOTORCYCLE</Text><Text numberOfLines={1} style={styles.motorcycleName}>{motorcycle?.nickname??'No motorcycle selected'}</Text><Text style={styles.ready}>{motorcycle?'●  Ready to ride':'Add a primary motorcycle'}</Text></View><Pressable accessibilityRole="button" onPress={onChange} style={({pressed})=>[styles.changeButton,pressed&&styles.pressed]}><Text style={styles.changeText}>{motorcycle?'Change':'Add'}</Text><SymbolView name={{ios:'chevron.right',android:'chevron_right',web:'chevron_right'}} tintColor={palette.textMuted} size={18}/></Pressable></View>{motorcycle?<View style={styles.motorcycleImageStage}><Image accessibilityIgnoresInvertColors resizeMode="contain" source={motorcycle.imageUri?{uri:motorcycle.imageUri}:require('../../../assets/images/dashboard-motorcycle-fallback.png')} style={styles.motorcycleImage}/></View>:null}</View>}
function MaintenanceTabs({selected,onSelect}:{readonly selected:'Upcoming'|'Completed'|'All Tasks';readonly onSelect:(tab:'Upcoming'|'Completed'|'All Tasks')=>void}){const tabs=['Upcoming','Completed','All Tasks'] as const;return <View style={styles.tabs}>{tabs.map(tab=><Pressable accessibilityRole="button" accessibilityState={{selected:selected===tab}} key={tab} onPress={()=>onSelect(tab)} style={[styles.tab,selected===tab&&styles.selectedTab]}><Text style={[styles.tabText,selected===tab&&styles.selectedTabText]}>{tab}</Text></Pressable>)}</View>}

function createMaintenanceData(
  upcomingMaintenance: readonly MaintenanceListItem[],
  maintenanceHistory: readonly MaintenanceListItem[],
): MaintenanceData {
  const nextMaintenance = upcomingMaintenance[0];
  const completedCost = maintenanceHistory.reduce(
    (total, item) => total + (item.maintenance.cost ?? 0),
    0,
  );

  return {
    overallStatus: nextMaintenance
      ? {
          status: toDisplayStatus(nextMaintenance.statusLabel),
          nextService: nextMaintenance.maintenance.title,
          remainingDistance: formatRemaining(nextMaintenance),
          progress: nextMaintenance.progress,
        }
      : {
          status: 'Good',
          nextService: 'No service queued',
          remainingDistance: 'Add maintenance to begin tracking',
          progress: 0,
        },
    summary: [
      {
        label: 'Upcoming',
        value: String(upcomingMaintenance.length),
        detail: 'Active service tasks',
        accent: 'orange',
      },
      {
        label: 'Overdue',
        value: String(upcomingMaintenance.filter((item) => item.statusLabel === 'Overdue').length),
        detail: 'Needs attention',
        accent: 'danger',
      },
      {
        label: 'Completed',
        value: String(maintenanceHistory.length),
        detail: 'Logged services',
        accent: 'success',
      },
      {
        label: 'Total Cost',
        value: `PHP ${completedCost.toLocaleString()}`,
        detail: 'Completed spend',
        accent: 'warning',
      },
    ],
    upcomingTasks: upcomingMaintenance.map((item) => ({
      id: item.maintenance.id,
      title: item.maintenance.title,
      remainingDistance: formatRemaining(item),
      status: toDisplayStatus(item.statusLabel),
      type: item.maintenance.type,
    })),
    timeline: maintenanceHistory.map((item) => ({
      id: item.maintenance.id,
      title: item.maintenance.title,
      description: item.maintenance.description ?? item.maintenance.notes ?? 'Service completed.',
      completedAt: formatDate(item.maintenance.updatedAt),
    })),
  };
}

function toDisplayStatus(statusLabel: string): MaintenanceStatus {
  if (statusLabel === 'Due Soon' || statusLabel === 'Overdue' || statusLabel === 'Completed') {
    return statusLabel;
  }

  if (statusLabel === 'Unknown') {
    return 'Unknown';
  }

  return 'Good';
}

function formatRemaining(item: MaintenanceListItem) {
  if (item.remainingKm !== null) {
    return `${Math.round(item.remainingKm).toLocaleString()} km remaining`;
  }

  if (item.remainingDays !== null) {
    return `${Math.round(item.remainingDays).toLocaleString()} days remaining`;
  }

  return 'Waiting for service baseline';
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
}

type AnimatedEntranceProps = {
  children: ReactNode;
  delay: number;
};

function AnimatedEntrance({ children, delay }: AnimatedEntranceProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progress, {
      toValue: 1,
      delay,
      friction: 8,
      tension: 48,
      useNativeDriver: true,
    }).start();
  }, [delay, progress]);

  return (
    <Animated.View
      style={{
        opacity: progress,
        transform: [
          {
            translateY: progress.interpolate({
              inputRange: [0, 1],
              outputRange: [24, 0],
            }),
          },
        ],
      }}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.darkBackground,
  },
  backgroundGlowTop: {
    position: 'absolute',
    top: -130,
    right: -120,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  backgroundGlowBottom: {
    position: 'absolute',
    bottom: 120,
    left: -150,
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: 'rgba(249, 115, 22, 0.08)',
  },
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: layout.floatingTabBarContentInset,
    gap: spacing.xxl,
  },
  section: {
    gap: spacing.lg,
  },
  sectionTitle: {
    color: palette.text,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '700',
  },
  sectionSubtitle: {
    marginTop: spacing.xs,
    color: 'rgba(248, 250, 252, 0.58)',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  taskStack: {
    gap: spacing.md,
  },
  motorcycleCard:{minHeight:150,overflow:'hidden',gap:spacing.lg,padding:spacing.lg,borderWidth:1,borderColor:'rgba(255,255,255,.13)',borderRadius:radius.xl,backgroundColor:'rgba(17,21,28,.88)'},motorcycleHeader:{flexDirection:'row',alignItems:'center',gap:spacing.md},motorcycleCopy:{flex:1,minWidth:0},motorcycleKicker:{...typography.label,color:palette.textMuted},motorcycleName:{...typography.subtitle,color:palette.text,marginTop:spacing.md,fontWeight:'900'},ready:{...typography.caption,color:palette.success,marginTop:8,fontWeight:'700'},motorcycleImageStage:{height:180,overflow:'hidden',alignItems:'center',justifyContent:'center',borderWidth:1,borderColor:'rgba(255,255,255,.08)',borderRadius:radius.lg,backgroundColor:'rgba(255,255,255,.025)'},motorcycleImage:{width:'100%',height:'100%',borderRadius:radius.lg},changeButton:{minHeight:48,flexDirection:'row',alignItems:'center',gap:7,paddingHorizontal:14,borderRadius:15,backgroundColor:'rgba(255,255,255,.07)'},changeText:{...typography.body,color:palette.text,fontWeight:'800'},
  tabs:{minHeight:58,flexDirection:'row',alignItems:'center',padding:6,borderWidth:1,borderColor:'rgba(255,255,255,.1)',borderRadius:radius.xl,backgroundColor:'rgba(17,21,28,.9)'},tab:{flex:1,minHeight:46,alignItems:'center',justifyContent:'center',borderRadius:14},selectedTab:{backgroundColor:'rgba(255,106,0,.09)',borderBottomWidth:2,borderBottomColor:palette.accentOrange},tabText:{...typography.body,color:palette.textMuted,fontWeight:'800'},selectedTabText:{color:palette.accentOrange},
  actionCard:{minHeight:88,flexDirection:'row',alignItems:'center',gap:spacing.md,padding:spacing.lg,borderWidth:1,borderColor:'rgba(255,255,255,.1)',borderRadius:radius.xl,backgroundColor:'rgba(17,21,28,.88)'},actionIcon:{width:46,height:46,alignItems:'center',justifyContent:'center',borderRadius:15,backgroundColor:'rgba(255,177,32,.09)'},actionCopy:{flex:1,minWidth:0},actionTitle:{...typography.subtitle,color:palette.text,fontWeight:'900'},actionSubtitle:{...typography.caption,color:palette.textMuted,marginTop:4},reminderCard:{minHeight:94,flexDirection:'row',alignItems:'center',gap:spacing.md,padding:spacing.lg,borderWidth:1,borderColor:'rgba(255,255,255,.1)',borderRadius:radius.xl,backgroundColor:'rgba(17,21,28,.88)'},pressed:{opacity:.78,transform:[{scale:.99}]},
});
