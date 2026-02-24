import '@shopify/ui-extensions/preact';
import { render } from 'preact';
import { useEffect, useState, useMemo } from 'preact/hooks';
import {
  BlockStack,
  Text,
  InlineLayout,
  Image,
  Divider,
  View,
  TextBlock,
  Banner
} from '@shopify/ui-extensions-react/checkout';

export default async () => {
  render(<FullPageExtension />, document.body);
};

function FullPageExtension() {
  const [patronId, setPatronId] = useState('');
  const [rentals, setRentals] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState(null);
  const [productImages, setProductImages] = useState({});

  async function getImage(product_title) {
    try {
      const response = await shopify.query(
        `query ProductsByExactTitle {
          products(first: 1, query: "title:${product_title}") {
            nodes {
              featuredImage {
                url
              }
            }
          }
        }`
      );
      
      const imageUrl = response?.data?.products?.nodes?.[0]?.featuredImage?.url;
      
      if (imageUrl) {
        setProductImages(prev => ({
          ...prev,
          [product_title]: imageUrl
        }));
      }
      
      return imageUrl;
    } catch (err) {
      console.error('Erro ao buscar imagem:', err);
      return null;
    }
  }

  // 1) Query para obter o patron_id salvo no metafield do customer
  const getCustomerNameQuery = {
    query: `query GetCustomerPatronId {
      customer {
        metafields(identifiers: [{ namespace: "rental", key: "patron_id" }]) {
          key
          namespace
          value
        }
      }
    }`,
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();

    const getOrdinalSuffix = (d) => {
      if (d > 3 && d < 21) return 'th';
      switch (d % 10) {
        case 1:
          return 'st';
        case 2:
          return 'nd';
        case 3:
          return 'rd';
        default:
          return 'th';
      }
    };

    return `${day}${getOrdinalSuffix(day)} ${month}, ${year}`;
  };

  // 2) Buscar patronId no Customer Account GraphQL
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          'shopify://customer-account/api/unstable/graphql.json',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(getCustomerNameQuery),
          }
        );
        const { data } = await res.json();
        const patronMetafield = data?.customer?.metafields?.[0]?.value;
        if (patronMetafield) {
          setPatronId(patronMetafield);
        } else {
          setError('Patron ID not found in metafields');
          console.log('Patron ID not found in metafields');
        }
      } catch (err) {
        setError('Erro ao buscar patronId: ' + err.message);
        console.log('Erro ao buscar patronId: ', err);
      }
    })();
  }, []);

  // 3) Buscar rentals por patronId (sua chamada atual)
  useEffect(() => {
    if (!patronId) return;

    const fetchRentals = async () => {
      const shopUrl = 'bkstr-9975.myshopify.com';
      const url = `https://ecom.shopify-integrations.follett.com/api/v1/rentals?patron_id=${encodeURIComponent(
        patronId
      )}&store_no=9975`;

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Shopify-Shop-Domain': shopUrl,
          },
        });

        const rentalsData = await response.json();
        console.log('TESTE rentalsData:', rentalsData);

        const fetchedRentals = rentalsData?.data?.rentals ?? [];
        setRentals(fetchedRentals);
      } catch (err) {
        setError('Erro ao buscar rentals: ' + err.message);
        console.log('Erro ao buscar rentals: ', err);
      }
    };

    fetchRentals();
  }, [patronId]);

  // 4) Buscar imagens quando os rentals forem carregados
  useEffect(() => {
    if (rentals.length > 0) {
      rentals.forEach(rental => {
        if (rental.title && !productImages[rental.title]) {
          getImage(rental.title);
        }
      });
    }
  }, [rentals]);

  const displayedRentals = showAll ? rentals : rentals.slice(0, 50);

  try {
    return (
      <BlockStack>
        <Banner
          status="info"
          title="Any late returns will result in an additional charge to the rental collateral card on file."
        />
        <BlockStack
          background={'subdued'}
          border={'base'}
          cornerRadius={'base'}
          padding={'base'}
          spacing="base"
        >
          {/* Header */}
          <InlineLayout
            columns={['auto', 'fill', 'fill', 'fill', 'auto', 'auto', 'auto']}
            spacing="base"
            blockAlignment="center"
          >
            <View minInlineSize={60} inlineAlignment="center">
              <Text emphasis="bold">Product</Text>
            </View>
            <View inlineAlignment="center">
              <Text emphasis="bold">Product Title</Text>
            </View>
            <View inlineAlignment="center">
              <Text emphasis="bold">Status</Text>
            </View>
            <View inlineAlignment="center">
              <Text emphasis="bold">Due Date</Text>
            </View>
            <View inlineAlignment="center">
              <Text emphasis="bold">Rental Fee</Text>
            </View>
            <View inlineAlignment="center">
              <Text emphasis="bold">ISBN</Text>
            </View>
            <View inlineAlignment="center">
              <Text emphasis="bold">ID</Text>
            </View>
          </InlineLayout>

          <Divider />

          {/* Rows */}
          {rentals.length > 0 ? (
            displayedRentals.map((rental) => {
              const imageUrl = productImages[rental.title] || rental.productImageUrl;
              
              return (
                <View
                  key={rental.id}
                  background="base"
                  padding="base"
                  cornerRadius="base"
                  border={'base'}
                >
                  <InlineLayout
                    columns={['auto', 'fill', 'fill', 'fill', 'auto', 'auto', 'auto']}
                    spacing="base"
                    blockAlignment="center"
                  >
                    <View
                      maxInlineSize={60}
                      minInlineSize={60}
                      inlineAlignment="center"
                    >
                      {typeof imageUrl === 'string' && imageUrl.trim().length > 0 ? (
                        <Image
                          source={imageUrl}
                          alt={rental.title || 'Product image'}
                          fit="cover"
                        />
                      ) : (
                        <Text>No image</Text>
                      )}
                    </View>

                    <View inlineAlignment="center">
                      <TextBlock inlineAlignment="center" emphasis="bold">
                        {rental.title}
                      </TextBlock>
                    </View>
                    <View inlineAlignment="center">
                      <Text>{rental.status}</Text>
                    </View>
                    <View inlineAlignment="center">
                      <Text>{formatDate(rental.dueDate)}</Text>
                    </View>
                    <View inlineAlignment="center">
                      <Text>
                        {typeof rental.rentalFee === 'number'
                          ? `$${rental.rentalFee}`
                          : '-'}
                      </Text>
                    </View>
                    <View inlineAlignment="center">
                      {rental.isbn != null ? <Text>{rental.isbn}</Text> : <Text> - </Text>}
                    </View>
                    <View inlineAlignment="center">
                      <Text>{rental.id}</Text>
                    </View>
                  </InlineLayout>
                </View>
              );
            })
          ) : (
            <Text>No rentals available.</Text>
          )}
        </BlockStack>
      </BlockStack>
    );
  } catch (err) {
    return (
      <s-section>
        <s-text tone="critical">
          Erro inesperado no componente: {err.message}
        </s-text>
      </s-section>
    );
  }
}