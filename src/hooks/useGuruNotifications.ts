import { useMemo, useState, useEffect, useRef } from 'react';
import { useHRIS } from '../context/HRISContext';
import { deviceNotificationService } from '../utils/deviceNotificationService';

export type GuruNotifType = 'BADAL' | 'ATTENDANCE_OPEN' | 'JOURNAL_PENDING' | 'REQUEST_UPDATE';

export interface GuruNotificationItem {
  id: string;
  type: GuruNotifType;
  title: string;
  subtitle: string;
  timeLabel: string;
  urgency: 'high' | 'medium' | 'info';
  actionPath: string;
  actionLabel: string;
  scheduleId?: string;
  createdAt: string;
  isRead: boolean;
  meta?: {
    subject?: string;
    className?: string;
    teacherName?: string;
    time?: string;
  };
}

export const useGuruNotifications = () => {
  const { 
    currentUser, 
    currentRole, 
    schedules, 
    attendances, 
    badalAssignments, 
    teachers, 
    learningNeedRequests 
  } = useHRIS();

  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`read_notifs_${currentUser?.id || 'guru'}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [dismissedToastIds, setDismissedToastIds] = useState<string[]>(() => {
    try {
      const saved = sessionStorage.getItem(`dismissed_toasts_${currentUser?.id || 'guru'}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync read status to local storage
  useEffect(() => {
    if (currentUser?.id) {
      localStorage.setItem(`read_notifs_${currentUser.id}`, JSON.stringify(readNotifIds));
    }
  }, [readNotifIds, currentUser?.id]);

  // Sync dismissed toasts to session storage
  useEffect(() => {
    if (currentUser?.id) {
      sessionStorage.setItem(`dismissed_toasts_${currentUser.id}`, JSON.stringify(dismissedToastIds));
    }
  }, [dismissedToastIds, currentUser?.id]);

  const markAsRead = (id: string) => {
    setReadNotifIds(prev => prev.includes(id) ? prev : [...prev, id]);
  };

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id);
    setReadNotifIds(allIds);
  };

  const dismissToast = (id: string) => {
    setDismissedToastIds(prev => prev.includes(id) ? prev : [...prev, id]);
  };

  const notifications = useMemo<GuruNotificationItem[]>(() => {
    if (currentRole !== 'GURU' || !currentUser?.id) return [];

    const items: GuruNotificationItem[] = [];
    const todayStr = new Date().toISOString().split('T')[0];
    const daysIndo = ['Ahad', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const currentDayName = daysIndo[new Date().getDay()];
    const activeDay = currentDayName === 'Ahad' ? 'Senin' : currentDayName;

    // 1. TUGAS GURU BADAL
    const myBadal = badalAssignments.filter(
      b => b.badalTeacherId === currentUser.id && b.status !== 'REJECTED'
    );

    myBadal.forEach(badal => {
      const schedule = schedules.find(s => s.id === badal.scheduleId);
      const origTeacher = teachers.find(t => t.id === badal.originalTeacherId);
      const isBadalAttended = attendances.some(
        a => a.scheduleId === badal.scheduleId && a.date === (badal.date || todayStr) && (a.status === 'HADIR_LENGKAP' || a.status === 'SELESAI')
      );

      const notifId = `badal_${badal.id}`;
      items.push({
        id: notifId,
        type: 'BADAL',
        title: `Tugas Guru Badal: ${schedule?.subject || 'KBM'}`,
        subtitle: `Gantikan ${origTeacher?.name ? `Ust. ${origTeacher.name.split(' ')[0]}` : 'Guru'} di kelas ${schedule?.className || '-'} (${schedule?.startTime || 'Sesi'}-${schedule?.endTime || ''})`,
        timeLabel: badal.date === todayStr ? 'Hari Ini' : (badal.date || schedule?.dayOfWeek || 'Jadwal Badal'),
        urgency: isBadalAttended ? 'info' : 'high',
        actionPath: '/dashboard/guru',
        actionLabel: isBadalAttended ? 'Lihat Status' : 'Presensi Badal',
        scheduleId: badal.scheduleId,
        createdAt: badal.createdAt || todayStr,
        isRead: readNotifIds.includes(notifId),
        meta: {
          subject: schedule?.subject,
          className: schedule?.className,
          teacherName: origTeacher?.name,
          time: `${schedule?.startTime} - ${schedule?.endTime}`
        }
      });
    });

    // 2. WAKTU PRESENSI KBM SUDAH MULAI
    const myTodaySchedules = schedules.filter(
      s => s.teacherId === currentUser.id && s.dayOfWeek === activeDay
    );

    myTodaySchedules.forEach(sch => {
      const att = attendances.find(a => a.scheduleId === sch.id && a.date === todayStr);
      const isClockedIn = att && (att.status === 'HADIR_LENGKAP' || att.status === 'HADIR_JURNAL_KOSONG' || att.status === 'SELESAI');

      if (!isClockedIn) {
        const notifId = `presensi_${sch.id}_${todayStr}`;
        items.push({
          id: notifId,
          type: 'ATTENDANCE_OPEN',
          title: `Waktu Presensi KBM Dimulai`,
          subtitle: `${sch.subject} • ${sch.className} (${sch.startTime} - ${sch.endTime})`,
          timeLabel: `${sch.startTime} WIB`,
          urgency: 'high',
          actionPath: '/dashboard/guru',
          actionLabel: 'Presensi Masuk',
          scheduleId: sch.id,
          createdAt: todayStr,
          isRead: readNotifIds.includes(notifId),
          meta: {
            subject: sch.subject,
            className: sch.className,
            time: `${sch.startTime} - ${sch.endTime}`
          }
        });
      }
    });

    // 3. WAKTU MENGISI JURNAL KBM
    const pendingJournalAttendances = attendances.filter(
      a => a.teacherId === currentUser.id && 
           a.date === todayStr && 
           (a.status === 'HADIR_JURNAL_KOSONG' || (!a.journalTopic && a.status !== 'SELESAI'))
    );

    pendingJournalAttendances.forEach(att => {
      const sch = schedules.find(s => s.id === att.scheduleId);
      const notifId = `journal_${att.id}`;
      items.push({
        id: notifId,
        type: 'JOURNAL_PENDING',
        title: `Jurnal Mengajar Belum Diisi`,
        subtitle: `Presensi masuk tercatat. Harap isi catatan materi & presensi santri untuk ${sch?.subject || 'KBM'} (${sch?.className || '-'}).`,
        timeLabel: att.time || 'Hari Ini',
        urgency: 'high',
        actionPath: '/dashboard/guru',
        actionLabel: 'Isi Jurnal',
        scheduleId: att.scheduleId,
        createdAt: att.date || todayStr,
        isRead: readNotifIds.includes(notifId),
        meta: {
          subject: sch?.subject,
          className: sch?.className,
          time: att.time
        }
      });
    });

    // 4. PEMBARUAN STATUS PENGAJUAN KEBUTUHAN
    const requests = Array.isArray(learningNeedRequests) ? learningNeedRequests : [];
    const myProcessedRequests = requests.filter(
      r => r.teacherId === currentUser.id && r.status !== 'PENDING'
    );

    myProcessedRequests.forEach(req => {
      const notifId = `req_${req.id}_${req.status}`;
      const statusLabel = req.status === 'APPROVED' ? 'Disetujui' : req.status === 'COMPLETED' ? 'Selesai' : 'Ditolak';
      items.push({
        id: notifId,
        type: 'REQUEST_UPDATE',
        title: `Ajuan ${statusLabel}: ${req.title}`,
        subtitle: req.decisionNote ? `"${req.decisionNote}"` : `Kategori ${req.category} telah diverifikasi.`,
        timeLabel: 'Pengajuan',
        urgency: req.status === 'APPROVED' ? 'info' : req.status === 'REJECTED' ? 'high' : 'info',
        actionPath: '/dashboard/guru/kebutuhan',
        actionLabel: 'Rincian Ajuan',
        createdAt: req.updatedAt || req.createdAt || todayStr,
        isRead: readNotifIds.includes(notifId)
      });
    });

    // Sort: high urgency first, unread first
    return items.sort((a, b) => {
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      if (a.urgency === 'high' && b.urgency !== 'high') return -1;
      if (b.urgency === 'high' && a.urgency !== 'high') return 1;
      return 0;
    });
  }, [
    currentRole, 
    currentUser, 
    schedules, 
    attendances, 
    badalAssignments, 
    teachers, 
    learningNeedRequests, 
    readNotifIds
  ]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Active high-priority banner toasts that haven't been dismissed in this session
  const activeDeviceAlerts = notifications.filter(
    n => !n.isRead && n.urgency === 'high' && !dismissedToastIds.includes(n.id)
  );

  // Track dispatched push notifications to avoid duplicates in device OS shade
  const dispatchedPushIdsRef = useRef<Set<string>>(new Set());
  const [devicePermission, setDevicePermission] = useState<NotificationPermission>(() => 
    deviceNotificationService.getPermission()
  );

  // Automatically trigger native OS notification on Phone / Tablet / Desktop
  useEffect(() => {
    if (activeDeviceAlerts.length > 0) {
      const topAlert = activeDeviceAlerts[0];
      if (!dispatchedPushIdsRef.current.has(topAlert.id)) {
        dispatchedPushIdsRef.current.add(topAlert.id);
        deviceNotificationService.sendDeviceAlert({
          title: `BQA: ${topAlert.title}`,
          body: topAlert.subtitle,
          tag: topAlert.id,
          url: topAlert.actionPath,
          urgency: topAlert.urgency
        });
      }
    }
  }, [activeDeviceAlerts]);

  // Request device notification permission
  const requestDevicePermission = async () => {
    const res = await deviceNotificationService.requestPermission();
    setDevicePermission(res);
    return res;
  };

  // Test device notification
  const sendTestDeviceNotification = async () => {
    const res = await deviceNotificationService.sendTestNotification();
    setDevicePermission(deviceNotificationService.getPermission());
    return res;
  };

  return {
    notifications,
    unreadCount,
    activeDeviceAlerts,
    devicePermission,
    requestDevicePermission,
    sendTestDeviceNotification,
    markAsRead,
    markAllAsRead,
    dismissToast
  };
};

