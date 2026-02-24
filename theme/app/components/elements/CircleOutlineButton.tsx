import {HTMLAttributes} from 'react';

type Props = HTMLAttributes<HTMLButtonElement>;

export default function CircleOutlineButton(props: Props) {
  const {className, ...rest} = props;

  return <button className={'relative'} type="button" {...rest} />;
}
