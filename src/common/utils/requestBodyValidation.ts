// Define the types for validation rules
interface ValidationRule {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
    minLength?: number;
    maxLength?: number;
    validate?: (value: any) => boolean; // custom validator
}

// Define validation function
export const validateRequestBody = (body: Record<string, any>, rules: Record<string, ValidationRule>) => {
    const errors: Record<string, string> = {};

    for (const field in rules) {
        const value = body[field];
        const rule = rules[field];

        // Check if field is required
        if (rule.required && (value === undefined || value === null)) {
            errors[field] = `${field} is required`;
            continue;
        }

        // If value is provided, validate its type
        if (value !== undefined && rule.type && typeof value !== rule.type) {
            errors[field] = `${field} must be of type ${rule.type}`;
            continue;
        }

        // Validate string length (if applicable)
        if (rule.type === 'string') {
            if (rule.minLength && value.length < rule.minLength) {
                errors[field] = `${field} must be at least ${rule.minLength} characters long`;
                continue;
            }
            if (rule.maxLength && value.length > rule.maxLength) {
                errors[field] = `${field} must be less than ${rule.maxLength} characters long`;
                continue;
            }
        }

        // Custom validation
        if (rule.validate && !rule.validate(value)) {
            errors[field] = `${field} failed custom validation`;
        }
    }

    return Object.keys(errors).length === 0 ? null : errors;
};



    // // request validation start 
    // const validationRules: any = {
    //     username: { required: true, type: 'string', minLength: 3 },
    //     age: { required: true, type: 'number', validate: (value) => value > 0 },
    //     email: { required: true, type: 'string', validate: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) },
    //   };
  
    //   const errors = validateRequestBody(req.body, validationRules);
  
    //   if (errors) {
    //     res.status(400).json({ errors });
    //     return; 
    //   }
    //   // request validation end 