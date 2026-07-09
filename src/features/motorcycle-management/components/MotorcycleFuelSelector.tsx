import { FuelType } from '@/src/domain/motorcycle';

import { MotorcycleSegmentedSelector } from './MotorcycleSegmentedSelector';

type MotorcycleFuelSelectorProps = {
  value: FuelType;
  onChange: (value: FuelType) => void;
};

export function MotorcycleFuelSelector({ value, onChange }: MotorcycleFuelSelectorProps) {
  return (
    <MotorcycleSegmentedSelector
      label="Fuel Type"
      value={value}
      options={Object.values(FuelType)}
      onChange={onChange}
      required
    />
  );
}
