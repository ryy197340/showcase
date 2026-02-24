import JMcLMonogram from '~/components/media/JMcLMonogram';

type Props = {
  text: string;
};

export default function FooterMonogram({text}: Props) {
  return (
    <div className="flex flex-col gap-5 p-5 text-center md:px-10">
      <div className="flex flex-row items-center gap-[25px]">
        <div className="h-[1px] w-full border-b border-lightGray"></div>
        <div className="w-fit-content flex justify-center">
          <JMcLMonogram />
        </div>
        <div className="h-[1px] w-full border-b border-lightGray"></div>
      </div>
      <span className="text-xs">{text}</span>
    </div>
  );
}
