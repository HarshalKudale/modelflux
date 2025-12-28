import { ModelsScreen } from '@/src/ui/screens';
import { useRouter } from 'expo-router';

export default function ModelListPage() {
    const router = useRouter();

    return (
        <ModelsScreen
            onBack={() => router.back()}
        />
    );
}
