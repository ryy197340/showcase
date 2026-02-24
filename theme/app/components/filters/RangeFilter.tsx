import {ChangeEvent, useState} from 'react';

type Props = {
  classNames: string;
  displayName: string;
  name: string;
  min: number;
  max: number;
  onRangeSelect: (event: any) => void;
};

export default function RangeFilter({
  classNames,
  displayName,
  name,
  min,
  max,
  onRangeSelect,
}: Props) {
  const [currentValue, setCurrentValue] = useState(min);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    // onRangeSelect(event);
    setCurrentValue(Number(event.target.value));
    // Perform filtering action here
  };

  return (
    <div className={classNames}>
      <label
        htmlFor={name}
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: '0',
          overflow: 'hidden',
          clip: 'rect(0,0,0,0)',
          whiteSpace: 'nowrap',
          border: '0',
        }}
      >
        {displayName}
      </label>
      <input
        type="range"
        id={name}
        name={name}
        min={min}
        max={max}
        step="1"
        value={currentValue}
        onChange={handleChange}
      />
      <div className="flex flex-row justify-between">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
