interface SchemaTagProps {
  schema: Record<string, any>;
}

// This is a component that takes a schema and renders it as a script tag
export const SchemaTag: React.FC<SchemaTagProps> = ({schema}) => {
  const schemaString = JSON.stringify(schema);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{__html: schemaString}}
    />
  );
};

// This is a component that renders the root schema and the organization schema for the homepage only
export const GlobalSchemas = () => {
  return (
    <>
      <SchemaTag schema={WEBSITE_SCHEMA} />
      <SchemaTag schema={ORGANIZATION_SCHEMA} />
    </>
  );
};

// This is a component that properties common to all schemas
const COMMON_SCHEMA_PROPERTIES = {
  '@context': 'https://schema.org/',
};

// These are the root and organization schemas
const WEBSITE_SCHEMA = {
  ...COMMON_SCHEMA_PROPERTIES,
  '@type': 'WebSite',
  url: 'https://www.jmclaughlin.com/ ',
  potentialAction: [
    {
      '@type': 'SearchAction',
      target: 'https://www.jmclaughlin.com/search?q={search_term_string}',
      'query-input': 'required name=search_term_string',
    },
  ],
};

// This is the organization schema
const ORGANIZATION_SCHEMA = {
  ...COMMON_SCHEMA_PROPERTIES,
  '@type': 'Organization',
  name: 'J.McLaughlin',
  url: 'https://www.jmclaughlin.com/ ',
  logo: 'https://cdn.shopify.com/s/files/1/0739/8984/9407/files/JMCL_Full-Wordmark_x320.png?v=1704897227',
  image:
    'https://cdn.shopify.com/s/files/1/0739/8984/9407/files/JMCL_Full-Wordmark_x320.png?v=1704897227',
  description:
    "J.McLaughlin is a destination for defining style. Our collection of women's and men's clothing and accessories reflects our casual, classic style peppered with a dose of wit.",
  founder: [
    {'@type': 'Person', name: 'Jay McLaughlin'},
    {'@type': 'Person', name: 'Kevin McLaughlin'},
  ],
  foundingDate: '1977',
  contactPoint: [
    {
      '@type': 'ContactPoint',
      telephone: '+1-844-532-5625',
      contactType: 'customer service',
      contactOption: 'TollFree',
    },
  ],
  sameAs: [
    'https://www.instagram.com/jmclaughlin/ ',
    'https://www.facebook.com/JMcLaughlinNY ',
    'https://www.youtube.com/channel/UCND87QJIABW06Giq2Pp8eAQ ',
    'https://www.pinterest.com/j.mclaughlin/',
    'https://pitchbook.com/profiles/company/53403-85 ',
    'https://www.bloomberg.com/profile/company/0028443D:US ',
    'https://www.crunchbase.com/organization/j-mclaughlin ',
  ],
  member: {
    '@type': 'Person',
    jobTitle: {
      '@type': 'DefinedTerm',
      name: 'Current CEO',
    },
    name: 'Mary Ellen Coyne',
  },
};

// This is the collection breadcrumb schema
export const PLP_BREADCRUMB_SCHEMA = (
  handle: string | undefined,
  title: string | undefined,
) => ({
  ...COMMON_SCHEMA_PROPERTIES,
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      item: {
        '@id': 'https://www.jmclaughlin.com/',
        name: 'Home',
      },
    },
    {
      '@type': 'ListItem',
      position: 2,
      item: {
        '@id': `https://www.jmclaughlin.com/collections/${handle}`,
        name: title,
      },
    },
  ],
});

// This is a pdp breadcrumb schema
export const HOME_BREADCRUMB = {
  ...COMMON_SCHEMA_PROPERTIES,
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      item: {
        '@id': 'https://www.jmclaughlin.com/',
        name: 'Home',
      },
    },
  ],
};

// This returns a pdp schema
export const returnPdpSchema = (
  name: string,
  image: string,
  description: string,
  sku: string,
  url: string,
  price: string,
  priceCurrency: string,
  stock: number,
) => ({
  ...COMMON_SCHEMA_PROPERTIES,
  '@type': 'Product',
  '@id': url,
  name,
  image,
  description,
  brand: {
    '@type': 'Brand',
    name: 'J.McLaughlin',
  },
  sku,
  offers: {
    '@type': 'Offer',
    priceCurrency,
    url,
    availability:
      stock > 0
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    price,
  },
});

type PdpSchemaType = {
  name: string;
  image: string;
  description: string;
  sku: string;
  url: string;
  price: string;
  priceCurrency: string;
  stock: number;
};
// This is a component that returns a pdp schema
export const PdpSchemas = ({
  name,
  image,
  description,
  sku,
  url,
  price,
  priceCurrency,
  stock,
}: PdpSchemaType) => {
  return (
    <>
      <SchemaTag
        schema={returnPdpSchema(
          name,
          image,
          description,
          sku,
          url,
          price,
          priceCurrency,
          stock,
        )}
      />
    </>
  );
};

// This is a page schema
export const returnPageSchema = (
  title: string,
  description: string,
  url: string,
  image: string,
) => ({
  ...COMMON_SCHEMA_PROPERTIES,
  '@type': 'WebPage',
  name: title,
  description,
  url,
  image,
});
