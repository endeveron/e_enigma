import FeatherIcon from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';

import { useThemeColor } from '@/core/hooks/useThemeColor';

const NavBack = ({ onPress }: { onPress?: () => void }) => {
  const router = useRouter();
  const mutedColor = useThemeColor('muted');

  return (
    <TouchableOpacity
      onPress={() => {
        onPress && onPress();
        router.back();
      }}
      className={`flex flex-1 flex-row justify-center items-center`}
    >
      <FeatherIcon size={24} name="arrow-left" color={mutedColor} />
    </TouchableOpacity>
  );
};

export default NavBack;
