import React, {memo, ReactNode} from 'react';

import DefaultErrorBoundaryMessage from './DefaultErrorBoundaryMessage';

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: ReactNode;
};

const TryCatchComponent: React.FC<ErrorBoundaryProps> = ({
  children,
  fallback,
}) => {
  try {
    return <>{children}</>;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(error);
    return <>{fallback ? fallback : <DefaultErrorBoundaryMessage />}</>;
  }
};

export default memo(TryCatchComponent);
