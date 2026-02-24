type Props = {
  fallbackContent?: any;
};

export default function EmptyCollectionFallback({fallbackContent}: Props) {
  if (!fallbackContent) return null;

  return (
    <div
      className="text-center"
      dangerouslySetInnerHTML={{__html: fallbackContent.htmlContent}}
    />
  );
}
