import {Link} from '../Link';
type Props = {
  title: string | undefined;
};

export default function DecorativeBreadcrumbs({title}: Props) {
  return (
    <div className="container mx-auto pb-[15px] pt-[30px] md:pb-[25px]">
      <div className="flex flex-row items-center justify-center gap-3 text-[10px] font-medium leading-[200%] text-otherGray">
        <Link to="/" className="hover:text-gray-700" prefetch="intent">
          Home
        </Link>
        |<span className="text-primary">{title}</span>
      </div>
    </div>
  );
}
