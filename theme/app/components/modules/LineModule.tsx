import React from 'react';

type LineModuleProps = {
  borderColor?: string;
  borderWidth?: string;
  borderStyle?: string;
};

const LineModule: React.FC<LineModuleProps> = ({
  borderColor = '#ccc',
  borderWidth = '1px',
  borderStyle = 'solid',
}) => {
  const lineStyle = {
    borderTop: `${borderWidth} ${borderStyle} ${borderColor}`,
  };

  return <div style={lineStyle}></div>;
};

export default LineModule;
