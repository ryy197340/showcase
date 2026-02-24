import LocalizedA from '../global/LocalizedA';

export default function BlogBreadcrumb() {
  return (
    <div className="breadcrumb flex justify-center gap-10 pb-5 pt-[10px] text-2xs uppercase text-primary">
      <LocalizedA href={'/blog'}>All</LocalizedA>
      <LocalizedA href={'/blog/style'}>Style</LocalizedA>
      <LocalizedA href={'/blog/lifestyle'}>Lifestyle</LocalizedA>
      <LocalizedA href={'/blog/culture'}>Culture</LocalizedA>
    </div>
  );
}
