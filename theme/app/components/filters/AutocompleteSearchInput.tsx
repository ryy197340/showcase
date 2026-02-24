import {Ref} from 'react';

import CancelIcon from '../icons/CancelX';
import CloseIcon from '../icons/Close';

type Props = {
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSearch: () => void;
  query: string;
  resultsInputRef: Ref<HTMLInputElement>;
  width?: string;
  isDivOpen: boolean;
  isInputEmptyAndFocused: boolean;
  setIsInputEmptyAndFocused: (isInputEmptyAndFocused: boolean) => void;
  closeDiv: () => void;
};

export default function AutocompleteSearchInput({
  handleInputChange,
  handleSearch,
  query,
  resultsInputRef,
  width,
  isDivOpen,
  isInputEmptyAndFocused,
  setIsInputEmptyAndFocused,
  closeDiv,
  ...rest
}: Props) {
  const handleFocus = () => {
    setIsInputEmptyAndFocused(true);
  };

  const handleBlur = () => {
    setIsInputEmptyAndFocused(false);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  const handleCancel = () => {
    if (
      resultsInputRef &&
      'current' in resultsInputRef &&
      resultsInputRef.current
    ) {
      resultsInputRef.current.blur(); // remove focus from input
    }
    closeDiv(); // close the autocomplete modal
  };

  return (
    <div
      className={`flex ${width} flex-row items-start justify-between pl-[10px] md:items-center md:justify-start`}
      data-cnstrc-search-form
    >
      <div className="search-input-container relative w-full justify-between">
        <input
          type="text"
          value={query}
          ref={resultsInputRef}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="search-input focus:border-gray-500 focus:ring-gray-200 w-full border-b-2 border-lightGray bg-inherit px-2 py-1 text-[16px] italic leading-[90%] text-otherGray focus:outline-none focus:ring-2 focus:ring-offset-2 md:w-full"
          placeholder="Search"
          {...rest}
          onKeyDown={handleKeyDown}
          data-cnstrc-search-input
        />
        {isDivOpen && (
          <div className="hidden md:block">
            <CancelIcon closeDiv={closeDiv} onClick={handleCancel} />
          </div>
        )}
      </div>
      {isInputEmptyAndFocused || isDivOpen || query ? (
        <button
          type="button"
          aria-label="cancel search"
          className={`search-cancel-btn self-center pl-2`}
          onClick={handleCancel}
        >
          <div className={'md:hidden'}>
            <CloseIcon />
          </div>
        </button>
      ) : null}
    </div>
  );
}
