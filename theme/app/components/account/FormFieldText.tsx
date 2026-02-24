import clsx from 'clsx';
import type {InputHTMLAttributes} from 'react';

type Props = {
  description?: string;
  error?: string;
  label: string;
} & InputHTMLAttributes<HTMLInputElement>;

const FormFieldText = (props: Props) => {
  const {description, error, label, required, ...rest} = props;
  const placeholder = `${label}${required ? ' *' : ''}`;
  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label
          className="clip-[rect(0,0,0,0)] absolute m-[-1px] h-px w-px overflow-hidden border-0 p-0"
          htmlFor={props.name}
        >
          {label}
        </label>
      )}
      {/* Description */}
      {description && (
        <div className="text-sm text-darkGray/75">{description}</div>
      )}
      <input
        aria-label={label}
        placeholder={placeholder}
        className={clsx([
          'rounded-xs m-0 w-full appearance-none bg-eeeeee px-3 py-2 text-sm leading-field',
          'min-h-[50px] placeholder-primary disabled:bg-gray/50 disabled:opacity-50',
          'focus:outline-1',
          error ? 'border-red' : '',
        ])}
        required={required}
        {...rest}
      />
      {/* Field error */}
      {error && <div className="text-sm text-red">{error}</div>}
    </div>
  );
};

export default FormFieldText;
