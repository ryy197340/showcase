type Props = {
  trendingNow: boolean;
};

export default function CioCardTrendingNow({trendingNow}: Props) {
  return (
    <div className="absolute left-[10px] top-0 mb-[8px] mt-2 flex justify-center gap-[5px] bg-[#13294e] p-2 text-xs font-bold text-white">
      Top Rated
    </div>
  );
}
