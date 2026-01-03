export interface FeatureProps {
  title: string;
  description: string;
  icon: React.ElementType;
}

export interface RoiMetric {
  label: string;
  value: string;
  trend?: number;
  isCurrency?: boolean;
}