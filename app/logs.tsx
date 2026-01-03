import { LogsScreen } from '@/src/ui/screens';
import { router } from 'expo-router';

export default function LogsRoute() {
    return <LogsScreen onBack={() => router.back()} />;
}
