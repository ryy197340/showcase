import {
  createContext,
  Dispatch,
  ReactNode,
  SetStateAction,
  useContext,
  useState,
} from 'react';

const defaultContextValue = {
  familySwatches: {}, // Default empty object for swatches
  setFamilySwatches: (() => {}) as Dispatch<SetStateAction<object>>,
};

const FamilySwatchesContext = createContext(defaultContextValue);

export const FamilySwatchesProvider = ({children}: {children: ReactNode}) => {
  const [familySwatches, setFamilySwatches] = useState({});

  return (
    <FamilySwatchesContext.Provider value={{familySwatches, setFamilySwatches}}>
      {children}
    </FamilySwatchesContext.Provider>
  );
};

export const useFamilySwatches = () => useContext(FamilySwatchesContext);
