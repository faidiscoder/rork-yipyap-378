import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { useThemeColors } from '@/hooks/useThemeColors';
import { UserAvatar } from '@/components/UserAvatar';
import { getUserById } from '@/mocks/users';
import { 
  Shield, 
  AlertTriangle, 
  Ban, 
  CheckCircle, 
  Clock, 
  User,
  MessageSquare,
  Eye,
  Trash2
} from 'lucide-react-native';

export default function AdminScreen() {
  const router = useRouter();
  const { colors, isDark } = useThemeColors();
  const { 
    currentUser, 
    isAdmin, 
    getReports, 
    markReportAsReviewed, 
    banUser, 
    unbanUser,
    bannedUsers,
    isUserBanned
  } = useUserStore();
  
  const [reports, setReports] = useState(getReports());
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'pending' | 'reviewed'>('pending');

  useEffect(() => {
    // ULTRA STRICT ADMIN VERIFICATION - ALL CONDITIONS MUST BE TRUE
    const isVerifiedAdmin = Boolean(
      currentUser &&
      currentUser.id === 'admin_user' &&
      currentUser.username === 'admin15' &&
      currentUser.email === 'admin15' &&
      currentUser.isAdmin === true &&
      isAdmin === true
    );

    console.log('Admin screen access verification:', {
      hasCurrentUser: !!currentUser,
      currentUserId: currentUser?.id,
      currentUserUsername: currentUser?.username,
      currentUserEmail: currentUser?.email,
      currentUserIsAdmin: currentUser?.isAdmin,
      storeIsAdmin: isAdmin,
      finalVerification: isVerifiedAdmin
    });

    // CRITICAL SECURITY: If not verified admin, redirect immediately
    if (!isVerifiedAdmin) {
      console.log('SECURITY ALERT: Unauthorized admin access attempt, redirecting...');
      router.replace('/');
      return;
    }
    
    setReports(getReports());
  }, [isAdmin, currentUser, router]);

  // ULTRA STRICT ADMIN VERIFICATION - ALL CONDITIONS MUST BE TRUE
  const isVerifiedAdmin = Boolean(
    currentUser &&
    currentUser.id === 'admin_user' &&
    currentUser.username === 'admin15' &&
    currentUser.email === 'admin15' &&
    currentUser.isAdmin === true &&
    isAdmin === true
  );

  // SECURITY: If not verified admin, don't render anything and redirect
  if (!isVerifiedAdmin) {
    console.log('SECURITY: Admin screen access denied - not verified admin');
    router.replace('/');
    return null;
  }

  const onRefresh = async () => {
    setRefreshing(true);
    setReports(getReports());
    setRefreshing(false);
  };

  const handleReviewReport = async (reportId: string, action: 'none' | 'warning' | 'ban' | 'suspend') => {
    try {
      await markReportAsReviewed(reportId, action);
      setReports(getReports());
      
      let message = '';
      switch (action) {
        case 'none':
          message = 'Report dismissed - no action taken';
          break;
        case 'warning':
          message = 'Warning issued to user';
          break;
        case 'ban':
          message = 'User has been banned';
          break;
        case 'suspend':
          message = 'User has been suspended';
          break;
      }
      
      Alert.alert('Report Reviewed', message);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to review report');
    }
  };

  const handleBanUser = async (userId: string) => {
    Alert.alert(
      'Ban User',
      'Are you sure you want to ban this user? This action will prevent them from accessing the app.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Ban User',
          style: 'destructive',
          onPress: async () => {
            try {
              await banUser(userId, 'Banned by admin');
              Alert.alert('Success', 'User has been banned');
              setReports(getReports());
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to ban user');
            }
          }
        }
      ]
    );
  };

  const handleUnbanUser = async (userId: string) => {
    Alert.alert(
      'Unban User',
      'Are you sure you want to unban this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unban User',
          onPress: async () => {
            try {
              await unbanUser(userId);
              Alert.alert('Success', 'User has been unbanned');
              setReports(getReports());
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to unban user');
            }
          }
        }
      ]
    );
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getReportsByStatus = (status: 'pending' | 'reviewed') => {
    return reports.filter(report => 
      status === 'pending' ? report.status === 'pending' : report.status === 'reviewed'
    );
  };

  const renderReport = (report: any) => {
    const reportedUser = getUserById(report.reportedUserId);
    const reporterUser = getUserById(report.reporterId);
    const isBanned = isUserBanned(report.reportedUserId);

    return (
      <View key={report.id} style={[styles.reportCard, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
        <View style={styles.reportHeader}>
          <View style={styles.userInfo}>
            <UserAvatar size={40} uri={reportedUser?.avatar} />
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: isDark ? colors.text : '#333333' }]}>
                {reportedUser?.displayName || reportedUser?.name || 'Unknown User'}
              </Text>
              <Text style={[styles.userHandle, { color: isDark ? colors.textSecondary : '#666666' }]}>
                @{reportedUser?.username || 'unknown'}
              </Text>
            </View>
          </View>
          
          <View style={styles.reportStatus}>
            {report.status === 'pending' ? (
              <View style={[styles.statusBadge, { backgroundColor: 'rgba(255, 149, 0, 0.1)' }]}>
                <Clock size={12} color="#FF9500" />
                <Text style={[styles.statusText, { color: '#FF9500' }]}>Pending</Text>
              </View>
            ) : (
              <View style={[styles.statusBadge, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}>
                <CheckCircle size={12} color="#34C759" />
                <Text style={[styles.statusText, { color: '#34C759' }]}>Reviewed</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.reportContent}>
          <Text style={[styles.reportReason, { color: isDark ? colors.text : '#333333' }]}>
            Reason: {report.reason}
          </Text>
          {report.note && (
            <Text style={[styles.reportNote, { color: isDark ? colors.textSecondary : '#666666' }]}>
              Note: {report.note}
            </Text>
          )}
          <Text style={[styles.reportTime, { color: isDark ? colors.textSecondary : '#999999' }]}>
            Reported on {formatTimestamp(report.timestamp)}
          </Text>
          {reporterUser && (
            <Text style={[styles.reportedBy, { color: isDark ? colors.textSecondary : '#666666' }]}>
              Reported by @{reporterUser.username}
            </Text>
          )}
        </View>

        {isBanned && (
          <View style={[styles.bannedIndicator, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
            <Ban size={16} color="#FF3B30" />
            <Text style={[styles.bannedText, { color: '#FF3B30' }]}>User is banned</Text>
          </View>
        )}

        {report.status === 'reviewed' && report.action && (
          <View style={styles.actionTaken}>
            <Text style={[styles.actionText, { color: isDark ? colors.textSecondary : '#666666' }]}>
              Action taken: {report.action}
            </Text>
            {report.reviewedAt && (
              <Text style={[styles.reviewTime, { color: isDark ? colors.textSecondary : '#999999' }]}>
                Reviewed on {formatTimestamp(report.reviewedAt)}
              </Text>
            )}
          </View>
        )}

        <View style={styles.reportActions}>
          {report.status === 'pending' && (
            <>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#34C759' }]}
                onPress={() => handleReviewReport(report.id, 'none')}
              >
                <CheckCircle size={16} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Dismiss</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#FF9500' }]}
                onPress={() => handleReviewReport(report.id, 'warning')}
              >
                <AlertTriangle size={16} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Warn</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: '#FF3B30' }]}
                onPress={() => handleReviewReport(report.id, 'ban')}
              >
                <Ban size={16} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Ban</Text>
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: isDark ? colors.border : '#E0E0E0' }]}
            onPress={() => router.push(`/profile/${report.reportedUserId}`)}
          >
            <Eye size={16} color={isDark ? colors.text : '#333333'} />
            <Text style={[styles.actionButtonText, { color: isDark ? colors.text : '#333333' }]}>
              View Profile
            </Text>
          </TouchableOpacity>

          {isBanned ? (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#0066CC' }]}
              onPress={() => handleUnbanUser(report.reportedUserId)}
            >
              <CheckCircle size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Unban</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#FF3B30' }]}
              onPress={() => handleBanUser(report.reportedUserId)}
            >
              <Ban size={16} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Ban User</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const pendingReports = getReportsByStatus('pending');
  const reviewedReports = getReportsByStatus('reviewed');

  return (
    <View style={[styles.container, { backgroundColor: isDark ? colors.background : '#F8F8F8' }]}>
      <View style={[styles.header, { backgroundColor: isDark ? colors.card : '#FFFFFF' }]}>
        <View style={styles.headerContent}>
          <Shield size={24} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: isDark ? colors.text : '#333333' }]}>
            Admin Panel
          </Text>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: isDark ? colors.text : '#333333' }]}>
              {pendingReports.length}
            </Text>
            <Text style={[styles.statLabel, { color: isDark ? colors.textSecondary : '#666666' }]}>
              Pending
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: isDark ? colors.text : '#333333' }]}>
              {reviewedReports.length}
            </Text>
            <Text style={[styles.statLabel, { color: isDark ? colors.textSecondary : '#666666' }]}>
              Reviewed
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: isDark ? colors.text : '#333333' }]}>
              {bannedUsers.length}
            </Text>
            <Text style={[styles.statLabel, { color: isDark ? colors.textSecondary : '#666666' }]}>
              Banned
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'pending' && styles.activeTab,
            { backgroundColor: selectedTab === 'pending' ? colors.primary : 'transparent' }
          ]}
          onPress={() => setSelectedTab('pending')}
        >
          <Text style={[
            styles.tabText,
            { color: selectedTab === 'pending' ? '#FFFFFF' : (isDark ? colors.text : '#333333') }
          ]}>
            Pending ({pendingReports.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            selectedTab === 'reviewed' && styles.activeTab,
            { backgroundColor: selectedTab === 'reviewed' ? colors.primary : 'transparent' }
          ]}
          onPress={() => setSelectedTab('reviewed')}
        >
          <Text style={[
            styles.tabText,
            { color: selectedTab === 'reviewed' ? '#FFFFFF' : (isDark ? colors.text : '#333333') }
          ]}>
            Reviewed ({reviewedReports.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {selectedTab === 'pending' ? (
          pendingReports.length > 0 ? (
            pendingReports.map(renderReport)
          ) : (
            <View style={styles.emptyState}>
              <CheckCircle size={48} color={isDark ? colors.textSecondary : '#CCCCCC'} />
              <Text style={[styles.emptyText, { color: isDark ? colors.textSecondary : '#666666' }]}>
                No pending reports
              </Text>
            </View>
          )
        ) : (
          reviewedReports.length > 0 ? (
            reviewedReports.map(renderReport)
          ) : (
            <View style={styles.emptyState}>
              <MessageSquare size={48} color={isDark ? colors.textSecondary : '#CCCCCC'} />
              <Text style={[styles.emptyText, { color: isDark ? colors.textSecondary : '#666666' }]}>
                No reviewed reports
              </Text>
            </View>
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginLeft: 12,
    color: '#333333',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: '#0066CC',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  userHandle: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  reportStatus: {
    marginLeft: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reportContent: {
    marginBottom: 12,
  },
  reportReason: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  reportNote: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  reportTime: {
    fontSize: 12,
    color: '#999999',
    marginBottom: 4,
  },
  reportedBy: {
    fontSize: 12,
    color: '#666666',
  },
  bannedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  bannedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF3B30',
  },
  actionTaken: {
    marginBottom: 12,
    padding: 8,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderRadius: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    textTransform: 'capitalize',
  },
  reviewTime: {
    fontSize: 12,
    color: '#999999',
    marginTop: 4,
  },
  reportActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    marginTop: 16,
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
    color: '#FF3B30',
  },
});