import { Reveal } from '@/components/motion/Reveal';
import PageHeader from '@components/ui/PageHeader';

export default function SettingsPage() {
  return (
    <Reveal>
      <PageHeader title="Settings" description="Hostel configuration and preferences." />
    </Reveal>
  );
}
