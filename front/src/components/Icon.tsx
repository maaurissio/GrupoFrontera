import * as LucideIcons from 'lucide-react';
import type { CSSProperties, ComponentType } from 'react';

function toPascalCase(name: string): string {
  return name.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
}

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: CSSProperties;
  className?: string;
}

type AnyIcon = ComponentType<{ size?: number; color?: string; style?: CSSProperties; className?: string; strokeWidth?: number }>;

export function Icon({ name, size = 16, color, style, className }: IconProps) {
  const pascalName = toPascalCase(name);
  const LucideIcon = (LucideIcons as unknown as Record<string, AnyIcon>)[pascalName];
  if (!LucideIcon) return null;
  return (
    <LucideIcon
      size={size}
      strokeWidth={1.75}
      color={color}
      style={{ flex: 'none', ...style }}
      className={className}
    />
  );
}
