/**
 * useForm Hook
 * Manages form state, validation, and submission
 * Handles complex forms with multiple fields
 */

import { useState, useCallback } from 'react';

export const useForm = (initialValues, onSubmit, onValidate) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Handle field value changes
  const handleChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setValues((prev) => ({
      ...prev,
      [name]: newValue
    }));

    // Clear error for this field when user starts editing
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  }, [errors]);

  // Handle field blur (mark as touched)
  const handleBlur = useCallback((e) => {
    const { name } = e.target;
    setTouched((prev) => ({
      ...prev,
      [name]: true
    }));
  }, []);

  // Validate form
  const validate = useCallback(() => {
    if (onValidate) {
      const newErrors = onValidate(values);
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    }
    return true;
  }, [values, onValidate]);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault?.();

    // Validate all fields
    const isValid = validate();
    if (!isValid) {
      setTouched(
        Object.keys(values).reduce((acc, key) => {
          acc[key] = true;
          return acc;
        }, {})
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      await onSubmit?.(values);
      setSubmitSuccess(true);
      setSubmitError(null);
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitError(error.message || 'An error occurred during submission');
      setSubmitSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, onSubmit]);

  // Reset form to initial values
  const handleReset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setSubmitError(null);
    setSubmitSuccess(false);
  }, [initialValues]);

  // Set field value programmatically
  const setFieldValue = useCallback((name, value) => {
    setValues((prev) => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Set field error
  const setFieldError = useCallback((name, error) => {
    setErrors((prev) => ({
      ...prev,
      [name]: error
    }));
  }, []);

  // Mark field as touched
  const setFieldTouched = useCallback((name, touched = true) => {
    setTouched((prev) => ({
      ...prev,
      [name]: touched
    }));
  }, []);

  // Get form field props
  const getFieldProps = useCallback((name) => {
    return {
      name,
      value: values[name] || '',
      onChange: handleChange,
      onBlur: handleBlur
    };
  }, [values, handleChange, handleBlur]);

  // Check if field has error and is touched
  const getFieldError = useCallback((name) => {
    return touched[name] ? errors[name] : null;
  }, [touched, errors]);

  // Check if field has been modified
  const isFieldDirty = useCallback((name) => {
    return values[name] !== initialValues[name];
  }, [values, initialValues]);

  // Check if form is dirty
  const isDirty = Object.keys(values).some((name) => isFieldDirty(name));

  return {
    // Values
    values,
    errors,
    touched,
    isSubmitting,
    submitError,
    submitSuccess,
    isDirty,

    // Handlers
    handleChange,
    handleBlur,
    handleSubmit,
    handleReset,

    // Setters
    setFieldValue,
    setFieldError,
    setFieldTouched,
    setValues,
    setErrors,

    // Getters
    getFieldProps,
    getFieldError,
    isFieldDirty,

    // Methods
    validate
  };
};

export default useForm;
