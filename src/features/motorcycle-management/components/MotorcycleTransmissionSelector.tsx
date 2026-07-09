import { TransmissionType } from '@/src/domain/motorcycle';

import { MotorcycleSegmentedSelector } from './MotorcycleSegmentedSelector';

type MotorcycleTransmissionSelectorProps = {
  value: TransmissionType;
  onChange: (value: TransmissionType) => void;
};

export function MotorcycleTransmissionSelector({ value, onChange }: MotorcycleTransmissionSelectorProps) {
  return (
    <MotorcycleSegmentedSelector
      label="Transmission"
      value={value}
      options={Object.values(TransmissionType)}
      onChange={onChange}
      required
    />
  );
}
