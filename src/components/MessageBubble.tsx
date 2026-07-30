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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '85%',
    padding: 14,
    borderRadius: 18,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(59, 130, 246, 0.3)',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderBottomLeftRadius: 4,
  },
  userText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
  markdownBody: {
    color: '#e0e0e0',
    fontSize: 15,
    lineHeight: 22,
  },
  markdownHeading1: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  markdownHeading2: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  markdownListItem: {
    color: '#e0e0e0',
    fontSize: 15,
  },
  markdownCodeBlock: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 10,
    borderRadius: 8,
    color: '#e0e0e0',
    fontFamily: 'monospace',
  },
});

const markdownStyles = {
  body: styles.markdownBody,
  heading1: styles.markdownHeading1,
  heading2: styles.markdownHeading2,
  list_item: styles.markdownListItem,
  code_block: styles.markdownCodeBlock,
};