import React, { useEffect, useRef, useState } from 'react';
import {
  DefaultSectionT,
  Keyboard,
  KeyboardEventListener,
  SectionList,
  SectionListData,
  SectionListRenderItem,
  View,
} from 'react-native';

import MessageItem from '@/src/components/MessageItem';
import { Text } from '@/src/components/Text';
import { useThemeColor } from '@/src/hooks/useThemeColor';
import { MessageItem as TMessageItem } from '@/src/types/chat';

type Section = {
  title: string;
  data: TMessageItem[];
};

type MessageListProps = {
  messages: TMessageItem[];
  userId: string;
  timestamp: number;
};

const MessageList = ({ messages, userId, timestamp }: MessageListProps) => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);

  const backgroundColor = useThemeColor('background');
  const listRef = useRef<SectionList<TMessageItem>>(null);

  const scrollToEnd = () => {
    // Use getScrollResponder to access the FlatList instance and call scrollToEnd
    const flatList = listRef.current?.getScrollResponder();
    if (flatList) flatList.scrollToEnd({ animated: true });
  };

  const initData = () => {
    const groupArr: Section[] = [];
    for (const msg of messages) {
      const day = msg.date.day;

      const index = groupArr.findIndex((s) => s.title === day);
      if (index !== -1) {
        groupArr[index].data.push(msg);
      } else {
        groupArr.push({
          title: day,
          data: [msg],
        });
      }
    }
    setSections(groupArr);
  };

  const handleKeyboardShow: KeyboardEventListener = (e) => {
    setIsKeyboardVisible(true);
  };

  const handleKeyboardHide: KeyboardEventListener = (e) => {
    setIsKeyboardVisible(false);
  };

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      'keyboardDidShow',
      handleKeyboardShow
    );
    const hideSubscription = Keyboard.addListener(
      'keyboardDidHide',
      handleKeyboardHide
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    initData();

    setTimeout(() => {
      scrollToEnd();
    }, 500);
  }, [messages]);

  useEffect(() => {
    isKeyboardVisible && scrollToEnd();
  }, [isKeyboardVisible]);

  const renderSectionHeader:
    | ((info: {
        section: SectionListData<TMessageItem, DefaultSectionT>;
      }) => React.ReactElement | null)
    | undefined = ({ section: { title } }) => {
    const date = new Date(title);

    // Show the year if it is different from the current
    const year = date.getFullYear();
    const curYear = new Date().getFullYear();
    const options: Intl.DateTimeFormatOptions = {
      month: 'long',
      day: 'numeric',
    };
    if (year !== curYear) options.year = 'numeric';

    const formattedDate = new Intl.DateTimeFormat('en-US', options).format(
      date
    );
    return (
      <View className="flex-row justify-center mb-2 py-0.5">
        <Text
          colorName="muted"
          className="text-center py-2 px-4 rounded-full"
          style={{ backgroundColor }}
        >
          {formattedDate}
        </Text>
      </View>
    );
  };

  const renderItem:
    | SectionListRenderItem<TMessageItem, DefaultSectionT>
    | undefined = ({ item }) => {
    return <MessageItem {...item} userId={userId} timestamp={timestamp} />;
  };

  return (
    <SectionList
      ref={listRef}
      sections={sections}
      stickySectionHeadersEnabled
      renderSectionHeader={renderSectionHeader}
      renderItem={renderItem}
      keyExtractor={(item) => item.createdAt.toString()}
    />
  );
};

export default MessageList;
