import type { ReactNode, ComponentType } from "react";

declare module "@dalaillama/shared-types/react-props" {
  export interface ButtonProps {
    children: ReactNode;
    onClick: () => void;
    disabled?: boolean;
    loading?: boolean;
    className?: string;
  }

  export interface InputFieldProps {
    type?: string;
    placeholder: string;
    value: string;
    onChange: (val: string) => void;
    error?: boolean;
    icon?: ComponentType<any>;
  }

  export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children?: ReactNode;
    title?: string;
  }

  export interface FloatingActionButtonProps {
    icon?: ComponentType<any>;
    label: string;
    onPress: () => void;
    className?: string;
  }

  export interface ErrorMessageProps {
    message: string;
  }
}
