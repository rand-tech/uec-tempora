import React from "react";
import Select, { ActionMeta } from "react-select";
const customStyles = {
    control: (provided: any) => ({
        ...provided,
        width: 800,
    }),
};

interface Option {
  value: string;
  label: string;
}

interface NativeSelectProps {
  label: string;
  value: string | undefined;
  options: string[];
  onChange: (value: string | undefined) => void;
}
export const NativeSelect: React.FC<NativeSelectProps> = ({
  label,
  value,
  options,
  onChange,
}) => {
  const handleNativeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    onChange(selectedValue || undefined);
  };

  return (
    <div>
      <label>{label}:</label>
      <select value={value || ""} onChange={handleNativeChange}>
        <option value="">All</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

interface MultiFilterSelectProps {
  label: string;
  value: string[];
  options: string[];
  onSelectAll: () => void;
  onClear: () => void;
  onChange: (selected: string[]) => void;
}

export const MultiFilterSelect: React.FC<MultiFilterSelectProps> = ({
  label,
  value,
  options,
  onSelectAll,
  onClear,
  onChange,
}) => {
  const handleChange = (
    selected: ReadonlyArray<Option>,
    _actionMeta: ActionMeta<Option>
  ) => {
    const selectedValues = selected || [];
    onChange(selectedValues.map((item) => item.value));
  };

  return (
    <div>
      <label>{label}:</label>
      <button onClick={onSelectAll}>Select all</button>
      <button onClick={onClear}>Clear</button>

      <Select
        isMulti
        styles={customStyles}
        value={value.map((val) => ({ value: val, label: val }))}
        onChange={handleChange}
        options={options.map((option) => ({ value: option, label: option }))}
      />
      
    </div>
  );
};
