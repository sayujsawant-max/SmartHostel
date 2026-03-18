import { FadeIn } from '@components/ui/motion';

export default function SettingsPage() {
  return (
    <FadeIn>
      <div>
        <h2 className="text-2xl font-bold text-[hsl(var(--foreground))]">Settings</h2>
        <p className="mt-2 text-[hsl(var(--muted-foreground))]">Hostel configuration and preferences.</p>
      </div>
    </FadeIn>
  );
}
