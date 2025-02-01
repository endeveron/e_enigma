import { View } from 'react-native';

import { Text } from '@/components/Text';

type Props = {
  title: string;
};

const Title = ({ title }: Props) => {
  return (
    <View>
      <Text className="font-psemibold text-xl">{title}</Text>
    </View>
  );
};

export default Title;
