export interface BREValidationResult {
  isValid: boolean;
  errors: string[];
}

export const calculateAge = (dob: Date | string): number => {
  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

export const validatePAN = (pan: string): boolean => {
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan.toUpperCase());
};

export const runBRE = (data: {
  dob: Date | string;
  monthlySalary: number;
  pan: string;
  employmentMode: string;
}): BREValidationResult => {
  const errors: string[] = [];

  // Rule 1: Age check (between 23 and 50 inclusive)
  if (!data.dob) {
    errors.push('Date of Birth is required.');
  } else {
    const age = calculateAge(data.dob);
    if (age < 23 || age > 50) {
      errors.push(`Age must be between 23 and 50 years. Current calculated age: ${age}`);
    }
  }

  // Rule 2: Salary check (at least ₹25,000)
  if (data.monthlySalary === undefined || data.monthlySalary === null) {
    errors.push('Monthly Salary is required.');
  } else if (data.monthlySalary < 25000) {
    errors.push('Monthly Salary must be at least ₹25,000.');
  }

  // Rule 3: PAN check
  if (!data.pan) {
    errors.push('PAN is required.');
  } else if (!validatePAN(data.pan)) {
    errors.push('Invalid PAN format. PAN must be in the format ABCDE1234F.');
  }

  // Rule 4: Employment check
  if (!data.employmentMode) {
    errors.push('Employment Mode is required.');
  } else if (data.employmentMode.trim().toLowerCase() === 'unemployed') {
    errors.push('Applicant cannot be Unemployed to apply for a loan.');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};
