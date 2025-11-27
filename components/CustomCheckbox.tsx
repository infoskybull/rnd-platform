import React from "react";

interface CustomCheckboxProps {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLInputElement>) => void;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({
  checked,
  onChange,
  disabled = false,
  id,
  name,
  className = "",
  onClick,
}) => {
  return (
    <>
      <input
        id={id}
        name={name}
        type="checkbox"
        checked={checked}
        onChange={onChange}
        onClick={onClick}
        disabled={disabled}
        className={`custom-checkbox ${className}`}
      />
      <style>{`
        .custom-checkbox {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          width: 18px;
          height: 18px;
          border: 2px solid #d1d5db;
          border-radius: 4px;
          background-color: white;
          cursor: pointer;
          position: relative;
          transition: all 0.2s ease;
          flex-shrink: 0;
        }

        .custom-checkbox:hover:not(:disabled) {
          border-color: #9ca3af;
          background-color: #f9fafb;
        }

        .custom-checkbox:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .custom-checkbox:checked {
          background-color: white;
          border-color: #d1d5db;
        }

        .custom-checkbox:checked::after {
          content: "";
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%) rotate(45deg) scale(1.5);
          width: 5px;
          height: 10px;
          border: solid #3b82f6;
          border-width: 0 2.5px 2.5px 0;
          border-radius: 1px;
        }

        .custom-checkbox:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background-color: #f3f4f6;
        }
      `}</style>
    </>
  );
};

export default CustomCheckbox;

