import clsx from 'clsx';

type Props = {
  label: string;
  mode?: 'default' | 'outline';
  small?: boolean;
  tone?: 'default' | 'critical';
  solid?: boolean;
  position?: 'default' | 'right-30px';
};

export default function Badge({
  label,
  mode = 'default',
  small,
  tone = 'default',
  solid,
  position = 'default',
}: Props) {
  return (
    <div
      className={clsx(
        'place-content-center leading-none',
        solid
          ? 'mb-4 inline-block border-none bg-badge p-2 text-black'
          : 'flex rounded-sm bg-white px-1.5 py-1',
        small ? 'text-2xs' : 'text-sm',
        mode === 'outline' && 'border',
        tone === 'critical' && 'border-red text-red',
        tone === 'default' && 'border-darkGray text-darkGray',
        'absolute z-10 px-2', // Apply mobile-only styles
        'md:px1.5 z-10 md:relative md:translate-x-0',
        position === 'right-30px' && 'right-[30px]',
      )}
    >
      {label}
    </div>
  );
}
