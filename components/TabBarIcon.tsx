import { type IconProps } from '@expo/vector-icons/build/createIconSet';
import { type ComponentProps } from 'react';
import { 
  Users, 
  MessageCircle, 
  Camera, 
  BookOpen, 
  User, 
  Shield,
  Waves
} from 'lucide-react-native';

export function TabBarIcon({ 
  name, 
  color, 
  focused, 
  ...rest 
}: { 
  name: string; 
  color: string; 
  focused: boolean; 
} & ComponentProps<typeof Users>) {
  const size = focused ? 26 : 24;
  
  switch (name) {
    case 'pool':
      return <Waves size={size} color={color} {...rest} />;
    case 'chat':
      return <MessageCircle size={size} color={color} {...rest} />;
    case 'camera':
      return <Camera size={size} color={color} {...rest} />;
    case 'stories':
      return <BookOpen size={size} color={color} {...rest} />;
    case 'profile':
      return <User size={size} color={color} {...rest} />;
    case 'admin':
      return <Shield size={size} color={color} {...rest} />;
    default:
      return <Users size={size} color={color} {...rest} />;
  }
}