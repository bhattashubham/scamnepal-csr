/**
 * Enhanced Form Validation Hook
 * Provides real-time validation, debounced validation, and form recovery features
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { useForm, UseFormReturn, FieldValues, Path } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ErrorHandler } from '@/lib/error-handler'
import { ErrorContext } from '@/types/errors'

interface UseFormValidationOptions<T extends FieldValues> {
  schema: z.ZodType<T>
  defaultValues?: Partial<T>
  enableRealTimeValidation?: boolean
  enableAutoSave?: boolean
  autoSaveInterval?: number
  enableFormRecovery?: boolean
  debounceMs?: number
}

interface FormValidationState {
  isValidating: boolean
  isDirty: boolean
  isAutoSaving: boolean
  lastSaved?: Date
  hasUnsavedChanges: boolean
  validationProgress: number
  errors: Record<string, string>
  touched: Record<string, boolean>
}

interface UseFormValidationReturn<T extends FieldValues> extends UseFormReturn<T> {
  // Validation state
  validationState: FormValidationState
  
  // Real-time validation
  validateField: (fieldName: Path<T>) => Promise<boolean>
  validateForm: () => Promise<boolean>
  
  // Auto-save functionality
  saveDraft: () => Promise<void>
  loadDraft: () => Promise<void>
  clearDraft: () => void
  
  // Form recovery
  restoreForm: () => Promise<void>
  hasRecoveryData: boolean
  
  // Validation progress
  getValidationProgress: () => number
  
  // Field helpers
  setFieldTouched: (fieldName: Path<T>, touched: boolean) => void
  getFieldError: (fieldName: Path<T>) => string | undefined
  isFieldValid: (fieldName: Path<T>) => boolean
}

export function useFormValidation<T extends FieldValues>({
  schema,
  defaultValues,
  enableRealTimeValidation = true,
  enableAutoSave = true,
  autoSaveInterval = 30000, // 30 seconds
  enableFormRecovery = true,
  debounceMs = 500,
}: UseFormValidationOptions<T>): UseFormValidationReturn<T> {
  
  const [validationState, setValidationState] = useState<FormValidationState>({
    isValidating: false,
    isDirty: false,
    isAutoSaving: false,
    hasUnsavedChanges: false,
    validationProgress: 0,
    errors: {},
    touched: {},
  })

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const formIdRef = useRef<string>(`form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)

  // Initialize form with react-hook-form
  const form = useForm<T>({
    resolver: zodResolver(schema as any) as any,
    defaultValues: defaultValues as any,
    mode: enableRealTimeValidation ? 'onChange' : 'onSubmit',
  })

  const { watch, trigger, formState, setValue, getValues, reset } = form

  // Watch all form values for changes
  const watchedValues = watch()

  // Debounced validation function
  const debouncedValidate = useCallback(async (fieldName?: Path<T>) => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(async () => {
      setValidationState(prev => ({ ...prev, isValidating: true }))
      
      try {
        if (fieldName) {
          await trigger(fieldName)
        } else {
          await trigger()
        }
        
        // Calculate validation progress
        const progress = calculateValidationProgress()
        setValidationState(prev => ({ 
          ...prev, 
          isValidating: false,
          validationProgress: progress
        }))
      } catch (error) {
        const context: ErrorContext = {
          component: 'useFormValidation',
          action: 'debouncedValidate',
          timestamp: new Date(),
          additionalData: { fieldName, formId: formIdRef.current }
        }
        
        ErrorHandler.handle(error, context)
        setValidationState(prev => ({ ...prev, isValidating: false }))
      }
    }, debounceMs)
  }, [trigger, debounceMs])

  // Calculate validation progress
  const calculateValidationProgress = useCallback(() => {
    const fields = Object.keys(watchedValues)
    if (fields.length === 0) return 0

    const validFields = fields.filter(field => {
      const fieldError = formState.errors[field as keyof T]
      return !fieldError
    })

    return Math.round((validFields.length / fields.length) * 100)
  }, [watchedValues, formState.errors])

  // Validate specific field
  const validateField = useCallback(async (fieldName: Path<T>): Promise<boolean> => {
    try {
      const isValid = await trigger(fieldName)
      setFieldTouched(fieldName, true)
      return isValid
    } catch (error) {
      const context: ErrorContext = {
        component: 'useFormValidation',
        action: 'validateField',
        timestamp: new Date(),
        additionalData: { fieldName, formId: formIdRef.current }
      }
      
      ErrorHandler.handle(error, context)
      return false
    }
  }, [trigger])

  // Validate entire form
  const validateForm = useCallback(async (): Promise<boolean> => {
    try {
      setValidationState(prev => ({ ...prev, isValidating: true }))
      const isValid = await trigger()
      
      // Mark all fields as touched
      const fields = Object.keys(watchedValues)
      fields.forEach(field => {
        setFieldTouched(field as Path<T>, true)
      })
      
      setValidationState(prev => ({ 
        ...prev, 
        isValidating: false,
        validationProgress: calculateValidationProgress()
      }))
      
      return isValid
    } catch (error) {
      const context: ErrorContext = {
        component: 'useFormValidation',
        action: 'validateForm',
        timestamp: new Date(),
        additionalData: { formId: formIdRef.current }
      }
      
      ErrorHandler.handle(error, context)
      setValidationState(prev => ({ ...prev, isValidating: false }))
      return false
    }
  }, [trigger, watchedValues, calculateValidationProgress])

  // Set field touched state
  const setFieldTouched = useCallback((fieldName: Path<T>, touched: boolean) => {
    setValidationState(prev => ({
      ...prev,
      touched: { ...prev.touched, [fieldName]: touched }
    }))
  }, [])

  // Get field error
  const getFieldError = useCallback((fieldName: Path<T>): string | undefined => {
    const error = formState.errors[fieldName]
    return error?.message as string | undefined
  }, [formState.errors])

  // Check if field is valid
  const isFieldValid = useCallback((fieldName: Path<T>): boolean => {
    const error = formState.errors[fieldName]
    const touched = validationState.touched[fieldName]
    return !error && touched
  }, [formState.errors, validationState.touched])

  // Auto-save functionality
  const saveDraft = useCallback(async (): Promise<void> => {
    if (!enableAutoSave) return

    try {
      setValidationState(prev => ({ ...prev, isAutoSaving: true }))
      
      const formData = getValues()
      const draftData = {
        ...formData,
        _metadata: {
          savedAt: new Date().toISOString(),
          formId: formIdRef.current,
          version: '1.0'
        }
      }
      
      localStorage.setItem(`form_draft_${formIdRef.current}`, JSON.stringify(draftData))
      
      setValidationState(prev => ({ 
        ...prev, 
        isAutoSaving: false,
        lastSaved: new Date(),
        hasUnsavedChanges: false
      }))
    } catch (error) {
      const context: ErrorContext = {
        component: 'useFormValidation',
        action: 'saveDraft',
        timestamp: new Date(),
        additionalData: { formId: formIdRef.current }
      }
      
      ErrorHandler.handle(error, context)
      setValidationState(prev => ({ ...prev, isAutoSaving: false }))
    }
  }, [enableAutoSave, getValues])

  // Load draft
  const loadDraft = useCallback(async (): Promise<void> => {
    if (!enableFormRecovery) return

    try {
      const draftData = localStorage.getItem(`form_draft_${formIdRef.current}`)
      if (draftData) {
        const parsed = JSON.parse(draftData)
        const { _metadata, ...formData } = parsed
        
        reset(formData)
        
        setValidationState(prev => ({
          ...prev,
          lastSaved: new Date(_metadata.savedAt),
          hasUnsavedChanges: false
        }))
      }
    } catch (error) {
      const context: ErrorContext = {
        component: 'useFormValidation',
        action: 'loadDraft',
        timestamp: new Date(),
        additionalData: { formId: formIdRef.current }
      }
      
      ErrorHandler.handle(error, context)
    }
  }, [enableFormRecovery, reset])

  // Clear draft
  const clearDraft = useCallback(() => {
    localStorage.removeItem(`form_draft_${formIdRef.current}`)
    setValidationState(prev => ({
      ...prev,
      lastSaved: undefined,
      hasUnsavedChanges: false
    }))
  }, [])

  // Restore form after error
  const restoreForm = useCallback(async (): Promise<void> => {
    try {
      await loadDraft()
      
      // Re-validate the restored form
      await validateForm()
    } catch (error) {
      const context: ErrorContext = {
        component: 'useFormValidation',
        action: 'restoreForm',
        timestamp: new Date(),
        additionalData: { formId: formIdRef.current }
      }
      
      ErrorHandler.handle(error, context)
    }
  }, [loadDraft, validateForm])

  // Check if recovery data exists
  const hasRecoveryData = useCallback((): boolean => {
    const draftData = localStorage.getItem(`form_draft_${formIdRef.current}`)
    return !!draftData
  }, [])

  // Get validation progress
  const getValidationProgress = useCallback((): number => {
    return validationState.validationProgress
  }, [validationState.validationProgress])

  // Set up real-time validation
  useEffect(() => {
    if (enableRealTimeValidation) {
      debouncedValidate()
    }
  }, [watchedValues, enableRealTimeValidation, debouncedValidate])

  // Set up auto-save
  useEffect(() => {
    if (enableAutoSave && validationState.isDirty) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }

      autoSaveTimeoutRef.current = setTimeout(() => {
        saveDraft()
      }, autoSaveInterval)
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [enableAutoSave, validationState.isDirty, autoSaveInterval, saveDraft])

  // Update validation state when form state changes
  useEffect(() => {
    setValidationState(prev => ({
      ...prev,
      isDirty: formState.isDirty,
      hasUnsavedChanges: formState.isDirty,
      validationProgress: calculateValidationProgress()
    }))
  }, [formState.isDirty, calculateValidationProgress])

  // Load draft on mount
  useEffect(() => {
    if (enableFormRecovery) {
      loadDraft()
    }
  }, [enableFormRecovery, loadDraft])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [])

  return {
    ...form,
    validationState,
    validateField,
    validateForm,
    saveDraft,
    loadDraft,
    clearDraft,
    restoreForm,
    hasRecoveryData: hasRecoveryData(),
    getValidationProgress,
    setFieldTouched,
    getFieldError,
    isFieldValid,
  }
}
