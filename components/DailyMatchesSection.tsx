import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Match } from '@/types/user';
import { MatchCard } from '@/components/MatchCard';
import { mockUsers } from '@/mocks/users';

interface Props {
  matches: Match[];
}

export function DailyMatchesSection({ matches }: Props) {
  if (!matches?.length) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Daily Matches</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {matches.map((match) => {
          const matchedUser = mockUsers.find(user => user.id === match.matchedUserId);
          if (!matchedUser) return null;
          
          return (
            <MatchCard 
              key={match.id} 
              match={match} 
              matchedUser={matchedUser}
              onAccept={() => {}}
              onReject={() => {}}
              onMessage={() => {}}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  scrollContent: {
    gap: 12,
    paddingRight: 16,
  },
});