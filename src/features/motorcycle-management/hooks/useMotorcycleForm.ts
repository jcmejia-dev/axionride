import { useMemo, useState } from 'react';

import {
  validateEngineCc,
  validateMotorcycle,
  validateOdometer,
  validatePlate,
  validateYear,
  type Motorcycle,
  type MotorcycleValidationIssue,
} from '@/src/domain/motorcycle';

import type { MotorcycleFormErrors, MotorcycleFormField, MotorcycleFormValues } from '../types';

type UseMotorcycleFormOptions = {
  initialMotorcycle: Motorcycle;
};

export function useMotorcycleForm({ initialMotorcycle }: UseMotorcycleFormOptions) {
  const initialValues = useMemo(() => toFormValues(initialMotorcycle), [initialMotorcycle]);
  const [values, setValues] = useState<MotorcycleFormValues>(initialValues);
  const [errors, setErrors] = useState<MotorcycleFormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  const previewMotorcycle = useMemo(
    () => toMotorcycle(values, initialMotorcycle, { tolerateInvalidNumbers: true }),
    [initialMotorcycle, values],
  );
  const hasUnsavedChanges = JSON.stringify(values) !== JSON.stringify(initialValues);

  function updateField(field: MotorcycleFormField, value: string) {
    setValues((currentValues) => ({
      ...currentValues,
      [field]: value,
    }));

    if (submitted) {
      setErrors((currentErrors) => ({
        ...currentErrors,
        [field]: undefined,
      }));
    }
  }

  function resetForm() {
    setValues(initialValues);
    setErrors({});
    setSubmitted(false);
  }

  function submit() {
    setSubmitted(true);
    const validation = validateForm(values, initialMotorcycle);

    if (!validation.valid) {
      setErrors(validation.errors);
      return null;
    }

    setErrors({});
    return toMotorcycle(values, initialMotorcycle, { tolerateInvalidNumbers: false });
  }

  return {
    values,
    errors,
    previewMotorcycle,
    hasUnsavedChanges,
    notesCharacterCount: values.notes.length,
    toastVisible,
    setToastVisible,
    updateField,
    resetForm,
    submit,
  };
}

function toFormValues(motorcycle: Motorcycle): MotorcycleFormValues {
  return {
    nickname: motorcycle.nickname,
    brand: motorcycle.brand,
    model: motorcycle.model,
    year: String(motorcycle.year),
    category: motorcycle.category,
    engineCc: String(motorcycle.engineCc),
    fuelType: motorcycle.fuelType,
    transmission: motorcycle.transmission,
    color: motorcycle.color,
    plateNumber: motorcycle.plateNumber ?? '',
    vin: motorcycle.vin ?? '',
    purchaseDate: motorcycle.purchaseDate ?? '',
    purchasePrice: motorcycle.purchasePrice === undefined ? '' : String(motorcycle.purchasePrice),
    odometerKm: String(motorcycle.odometerKm),
    fuelEfficiencyKmPerLiter: String(motorcycle.fuelEfficiencyKmPerLiter ?? 40),
    notes: motorcycle.notes ?? '',
    imageUri: motorcycle.imageUri ?? '',
  };
}

function validateForm(values: MotorcycleFormValues, baseMotorcycle: Motorcycle) {
  const errors: MotorcycleFormErrors = {};
  const yearValidation = validateYear(Number(values.year));
  const engineValidation = validateEngineCc(Number(values.engineCc));
  const odometerValidation = validateOdometer(Number(values.odometerKm));
  const fuelEfficiency = Number(values.fuelEfficiencyKmPerLiter);

  applyFieldError(errors, 'year', yearValidation.valid ? undefined : yearValidation.issues[0]);
  applyFieldError(errors, 'engineCc', engineValidation.valid ? undefined : engineValidation.issues[0]);
  applyFieldError(errors, 'odometerKm', odometerValidation.valid ? undefined : odometerValidation.issues[0]);
  if (!Number.isFinite(fuelEfficiency) || fuelEfficiency <= 0 || fuelEfficiency > 300) {
    errors.fuelEfficiencyKmPerLiter = 'Fuel efficiency must be between 1 and 300 km/L.';
  }

  if (values.plateNumber.trim().length > 0) {
    const plateValidation = validatePlate(values.plateNumber);
    applyFieldError(errors, 'plateNumber', plateValidation.valid ? undefined : plateValidation.issues[0]);
  }

  const motorcycle = toMotorcycle(values, baseMotorcycle, { tolerateInvalidNumbers: false });
  const motorcycleValidation = validateMotorcycle(motorcycle);

  if (!motorcycleValidation.valid) {
    for (const issue of motorcycleValidation.issues) {
      const field = mapDomainFieldToFormField(issue.field);

      if (field && !errors[field]) {
        errors[field] = issue.message;
      }
    }
  }

  return Object.keys(errors).length === 0 ? { valid: true as const } : { valid: false as const, errors };
}

function toMotorcycle(
  values: MotorcycleFormValues,
  baseMotorcycle: Motorcycle,
  options: { tolerateInvalidNumbers: boolean },
): Motorcycle {
  const fallbackYear = options.tolerateInvalidNumbers ? baseMotorcycle.year : Number(values.year);
  const fallbackEngineCc = options.tolerateInvalidNumbers ? baseMotorcycle.engineCc : Number(values.engineCc);
  const fallbackOdometerKm = options.tolerateInvalidNumbers ? baseMotorcycle.odometerKm : Number(values.odometerKm);
  const parsedYear = Number(values.year);
  const parsedEngineCc = Number(values.engineCc);
  const parsedOdometerKm = Number(values.odometerKm);
  const parsedPurchasePrice = Number(values.purchasePrice);
  const parsedFuelEfficiency = Number(values.fuelEfficiencyKmPerLiter);

  return {
    ...baseMotorcycle,
    nickname: values.nickname,
    brand: values.brand,
    model: values.model,
    year: Number.isFinite(parsedYear) ? parsedYear : fallbackYear,
    category: values.category,
    engineCc: Number.isFinite(parsedEngineCc) ? parsedEngineCc : fallbackEngineCc,
    fuelType: values.fuelType,
    transmission: values.transmission,
    color: values.color,
    plateNumber: optionalText(values.plateNumber),
    vin: optionalText(values.vin),
    purchaseDate: optionalText(values.purchaseDate),
    purchasePrice: values.purchasePrice.trim().length === 0 ? undefined : parsedPurchasePrice,
    odometerKm: Number.isFinite(parsedOdometerKm) ? parsedOdometerKm : fallbackOdometerKm,
    fuelEfficiencyKmPerLiter: Number.isFinite(parsedFuelEfficiency)
      ? parsedFuelEfficiency
      : baseMotorcycle.fuelEfficiencyKmPerLiter ?? 40,
    notes: optionalText(values.notes),
    imageUri: optionalText(values.imageUri),
    updatedAt: new Date().toISOString(),
  };
}

function optionalText(value: string) {
  const trimmedValue = value.trim();
  return trimmedValue.length === 0 ? undefined : trimmedValue;
}

function applyFieldError(
  errors: MotorcycleFormErrors,
  field: MotorcycleFormField,
  issue: MotorcycleValidationIssue | undefined,
) {
  if (issue) {
    errors[field] = issue.message;
  }
}

function mapDomainFieldToFormField(field: MotorcycleValidationIssue['field']): MotorcycleFormField | undefined {
  if (field === 'id' || field === 'createdAt' || field === 'updatedAt' || field === 'imageUri' || field === 'general') {
    return undefined;
  }

  return field;
}
