"use client";

import * as React from "react";
import { Controller, ControllerProps, ControllerRenderProps, ControllerFieldState, FieldPath, FieldValues, FormProvider, useFormContext } from "react-hook-form";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const Form = FormProvider;

type FormFieldContextValue<TFieldValues extends FieldValues = FieldValues> = {
  name: FieldPath<TFieldValues>;
};

const FormFieldContext = React.createContext<FormFieldContextValue<FieldValues> | undefined>(undefined);

interface FormFieldRenderProps<TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>> {
  field: ControllerRenderProps<TFieldValues, TName>;
  fieldState: ControllerFieldState;
}

const FormField = <TFieldValues extends FieldValues = FieldValues, TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>>({
  children,
  ...props
}: ControllerProps<TFieldValues, TName> & { children: (props: FormFieldRenderProps<TFieldValues, TName>) => React.ReactNode }) => {
  return (
    <Controller
      {...props}
      render={({ field, fieldState }) => (
        <FormFieldContext.Provider value={{ name: props.name }}>
          {children({ field, fieldState } as FormFieldRenderProps<TFieldValues, TName>)}
        </FormFieldContext.Provider>
      )}
    />
  );
};

const useFormField = <TFieldValues extends FieldValues = FieldValues>() => {
  const fieldContext = React.useContext(FormFieldContext) as FormFieldContextValue<TFieldValues> | undefined;
  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }
  const { name } = fieldContext;
  const formContext = useFormContext<TFieldValues>();
  const fieldState = formContext.getFieldState(name, formContext.formState);
  const field = {
    name,
    value: formContext.getValues(name),
    onChange: (value: unknown) => formContext.setValue(name, value as any, { shouldValidate: true }),
    onBlur: () => formContext.trigger(name),
    ref: (el: HTMLElement | null) => { },
  };
  return { field, fieldState, formState: formContext.formState };
};

type FormItemProps = React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode };

const FormItem = React.forwardRef<HTMLDivElement, FormItemProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-2", className)} {...props} />
));
FormItem.displayName = "FormItem";

type FormLabelProps = React.ComponentPropsWithoutRef<typeof Label>;

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(({ className, ...props }, ref) => (
  <Label ref={ref} className={cn("", className)} {...props} />
));
FormLabel.displayName = "FormLabel";

type FormControlProps = React.ComponentPropsWithoutRef<typeof Input>;

const FormControl = React.forwardRef<HTMLInputElement, FormControlProps>(({ className, ...props }, ref) => (
  <Input ref={ref} className={cn("", className)} {...props} />
));
FormControl.displayName = "FormControl";

type FormDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

const FormDescription = React.forwardRef<HTMLParagraphElement, FormDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  )
);
FormDescription.displayName = "FormDescription";

type FormMessageProps = React.HTMLAttributes<HTMLParagraphElement>;

const FormMessage = React.forwardRef<HTMLParagraphElement, FormMessageProps>(
  ({ className, children, ...props }, ref) => {
    const { fieldState } = useFormField();
    if (!fieldState.error) return null;
    const message = fieldState.error.message;
    if (!message) return null;
    return (
      <p ref={ref} className={cn("text-sm text-destructive", className)} {...props}>
        {children ? children : message}
      </p>
    )
  }
);
FormMessage.displayName = "FormMessage";

export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  useFormField,
};