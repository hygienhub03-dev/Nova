import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import Markdown from 'react-native-markdown-display';

interface MessageBubbleProps {
  item: { id: string; role: string; content: string };
  index: number;
}

export default function MessageBubble({ item, index }: MessageBubbleProps) {
  const isUser = item.role === 'user';

  return (
    <Animated.View
      entering={isUser ? FadeInUp.duration(300) : FadeInDown.duration(300)}
      style={[
        styles.bubble,
        isUser ? styles.userBubble : styles.aiBubble,
      ]}
    >
      {isUser ? (
        <Text style={styles.userText}>{item.content}</Text>
      ) : (
        <Markdown style={markdownStyles}>
          {item.content}
        </Markdown>
      )}
      <Text style={styles.timestamp}>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '82%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#3b82f6',
    borderBottomRightRadius: 4,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderBottomLeftRadius: 4,
  },
  userText: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
  },
  aiText: {
    color: '#e0e0e0',
    fontSize: 15,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.3)',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  markdownBody: {
    color: '#e0e0e0',
    fontSize: 15,
    lineHeight: 22,
  },
  markdownHeading1: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 4,
  },
  markdownHeading2: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 6,
    marginTop: 4,
  },
  markdownListItem: {
    color: '#e0e0e0',
    fontSize: 15,
    marginBottom: 4,
  },
  markdownCodeBlock: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 12,
    borderRadius: 10,
    color: '#e0e0e0',
    fontFamily: 'monospace',
    fontSize: 13,
    marginVertical: 8,
  },
});

const markdownStyles = {
  body: styles.markdownBody,
  heading1: styles.markdownHeading1,
  heading2: styles.markdownHeading2,
  list_item: styles.markdownListItem,
  code_block: styles.markdownCodeBlock,
};