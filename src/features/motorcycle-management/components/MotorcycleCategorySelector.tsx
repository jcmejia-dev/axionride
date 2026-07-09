import { MotorcycleCategory } from '@/src/domain/motorcycle';

import { MotorcycleSegmentedSelector } from './MotorcycleSegmentedSelector';

type MotorcycleCategorySelectorProps = {
  value: MotorcycleCategory;
  onChange: (value: MotorcycleCategory) => void;
};

export function MotorcycleCategorySelector({ value, onChange }: MotorcycleCategorySelectorProps) {
  return (
    <MotorcycleSegmentedSelector
      label="Category"
      value={value}
      options={Object.values(MotorcycleCategory)}
      onChange={onChange}
      required
    />
  );
}
