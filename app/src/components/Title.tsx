import { View } from 'react-native';
import { Text } from '@/src/components/Text';

type Props = {
  title: string;
};

const Title = ({ title }: Props) => {
  return (
    <View>
      <Text colorName="title" className="text-xl font-psemibold">
        {title}
      </Text>
    </View>
  );
};

export default Title;
