import { useState, useEffect } from "react";
import type {
  ListRow,
  ListRowSubtitle,
} from "@shopify/ui-extensions-react/point-of-sale";
import {
  Text,
  Stack,
  Selectable,
  List,
  Icon,
  useApi,
  useCartSubscription,
  Banner,
  Button,
  ScrollView,
  TextField,
  DatePicker,
} from "@shopify/ui-extensions-react/point-of-sale";
import type { IData } from "./helper";
import { sortOptions, handleCurrency } from "./helper";

const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export function ProductSearch({
  api,
  setVariantsToShow,
  sort,
  setSort,
  setSelectedVariant,
}: any) {
  const cart = useCartSubscription();
  const properties = cart.properties;
  const eventDate = properties["Event Date"] || null;
  const visibleState = useState(false);
  const [state, setState] = useState({
    date: eventDate,
    searchText: "",
    sortType: sort,
  });

  const [generalSearchText, setGeneralSearchText] = useState("");
  const [styleNumberSearchText, setStyleNumberSearchText] = useState("");
  const [listData, setListData] = useState<ListRow[]>([]);
  const [error, setError] = useState<string>("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const { currentSession } = useApi<"pos.home.modal.render">().session;
  const { currency, locationId } = currentSession;
  const isLoyaltyID = "Loyalty ID" in properties;
  const storeId = cart.properties["Store ID"];
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDateSelected, setIsDateSelected] = useState<boolean>(false);

  const filterProducts = (masterProducts: any) => {
    const formattedData = masterProducts.map((item: IData) => {
      const displayPrice =
        item.minPrice === item.maxPrice
          ? `${handleCurrency(currency)}${item.minPrice}`
          : `${handleCurrency(currency)}${item.minPrice} - ${handleCurrency(currency)}${item.maxPrice}`;

      const subtitles: ListRowSubtitle[] = [
        { content: `${item.variants.length} variants` },
        { content: `Price: ${displayPrice}` },
      ];

      if (isLoyaltyID) {
        let displayLoyaltyPrice;
        if (
          item.minMemberPrice === item.maxMemberPrice &&
          item.minMemberPrice
        ) {
          displayLoyaltyPrice = `${handleCurrency(currency)}${item.minMemberPrice}`;
        } else if (
          item.minMemberPrice &&
          item.maxMemberPrice &&
          item.minMemberPrice !== item.maxMemberPrice
        ) {
          displayLoyaltyPrice = `${handleCurrency(currency)}${item.minMemberPrice} - ${handleCurrency(currency)}${item.maxMemberPrice}`;
        }

        if (displayLoyaltyPrice && displayLoyaltyPrice !== displayPrice) {
          subtitles.push({ content: `Member Price: ${displayLoyaltyPrice}` });
        }
      }

      return {
        id: item.id.split("/").pop(),
        leftSide: {
          label: item.combinedTitle,
          image: { source: item.imageSrc },
          subtitle: subtitles as [
            ListRowSubtitle,
            ListRowSubtitle?,
            ListRowSubtitle?,
          ],
        },
        rightSide: { showChevron: true },
        onPress: () => handleClick(item),
      };
    });

    setListData(formattedData);
  };

  const handleSearch = async () => {
    const today = new Date().toDateString();

    if (!state.date) {
      setError("Please select an event date.");
      return;
    }

    if (new Date(state.date).getTime() < new Date(today).getTime()) {
      setError("Please select a future date.");
      return;
    }

    const query = state.searchText.trim();
    if (!query) {
      setError("Please enter a search term.");
      return;
    }

    const endpoint = generalSearchText.trim()
      ? "/product/search"
      : "/product/search-by-metafield";

    try {
      setError("");
      setIsDateSelected(true);
      setIsLoading(true);
      api.toast.show(`Searching for "${query}" on ${state.date}`);

      const response = await fetch(
        `${process.env.REACT_APP_MIDDLEWARE_MAIN_URL}${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            locale: `${process.env.REACT_APP_LOCALE}`,
            storeId,
            locationId,
            isLoyaltyID,
            eventDate: state.date,
            searchQuery: query,
            cursor,
          }),
        },
      );

      const json = await response.json();
      const products = json.data.masterProducts;

      setCursor(json.data.pageInfo?.endCursor);
      setHasNext(json.data.pageInfo?.hasNextPage);

      products.sort((a: any, b: any) =>
        sort === sortOptions[0]
          ? a.combinedTitle.localeCompare(b.combinedTitle)
          : b.combinedTitle.localeCompare(a.combinedTitle),
      );

      filterProducts(products);
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClick = (product: any) => {
    setVariantsToShow(product?.variants.length > 0 ? product.variants : null);
    setSelectedVariant(null);
    api.navigation.navigate("product-variants");
  };

  const setDate = async (date: string) => {
    setIsDateSelected(true);
    setCursor(null);
    setHasNext(false);
    setListData([]);
    setState((prev) => ({
      ...prev,
      date,
    }));

    await api.cart.addCartProperties({
      "Event Date": date,
    });
  };

  const updateSearchText = (general: string, styleNumber: string) => {
    const finalSearchText = general.trim() || styleNumber.trim();
    setCursor(null);
    setHasNext(false);
    setListData([]);
    setState((prev) => ({
      ...prev,
      searchText: finalSearchText,
    }));
  };

  useEffect(() => {
    const sorted = [...listData];
    sorted.sort((a, b) =>
      sort === sortOptions[0]
        ? a.leftSide.label.localeCompare(b.leftSide.label)
        : b.leftSide.label.localeCompare(a.leftSide.label),
    );
    setListData(sorted);
  }, [sort]);

  const handleSortCancel = () => setSort(sortOptions[0]);
  const handleSortClick = () => api.navigation.navigate("sort-options");
  const handleOnEndReached = () => {
    if (hasNext) handleSearch();
  };

  return (
    <ScrollView>
      <Stack direction="vertical">
        <Stack direction="vertical">
          {error && <Banner title={error} hideAction variant="error" visible />}
          {!state.date && (
            <Banner
              title="Please select an event date to search product"
              hideAction
              variant="information"
              visible
            />
          )}
          <Text>Selected date: {state.date}</Text>

          <Button
            title="Show Date Picker"
            onPress={() => visibleState[1](true)}
          />

          <DatePicker
            visibleState={visibleState}
            onChange={(selected) => {
              const parsedDate = new Date(selected);
              parsedDate.setHours(0, 0, 0, 0);
              const today = new Date();
              today.setHours(0, 0, 0, 0);

              if (parsedDate < today) {
                api.toast.show("Please select a future date.");
                return;
              }

              setDate(formatDate(parsedDate));
            }}
            selected={state.date ?? formatDate(new Date())}
            inputMode="inline"
          />
        </Stack>

        <TextField
          label="Search by style number"
          value={styleNumberSearchText}
          onChange={(text) => {
            setStyleNumberSearchText(text);
            setGeneralSearchText("");
            updateSearchText("", text);
          }}
          placeholder="Enter style number"
        />

        <TextField
          label="Search by Barcode/UPC"
          value={generalSearchText}
          onChange={(text) => {
            setGeneralSearchText(text);
            setStyleNumberSearchText("");
            updateSearchText(text, "");
          }}
          placeholder="Enter barcode or UPC"
        />

        <Button
          title="Search"
          onPress={handleSearch}
          isDisabled={!state.searchText.trim() || !state.date}
        />

        <Stack direction="vertical">
          <Stack direction="horizontal" gap="100">
            <Selectable onPress={handleSortCancel}>
              {sort !== sortOptions[0] && (
                <Icon name="circle-cancel" size="major" />
              )}
            </Selectable>
            <Selectable onPress={handleSortClick}>
              <Stack direction="horizontal" gap="100">
                <Icon name="sort" size="badge" />
                <Text variant="captionRegular" color="TextInteractive">
                  {sort}
                </Text>
                <Icon name="caret-down" size="badge" />
              </Stack>
            </Selectable>
          </Stack>
        </Stack>
      </Stack>

      {isLoading && isDateSelected && (
        <Stack direction="vertical">
          <Banner title="Loading..." visible variant="information" hideAction />
        </Stack>
      )}

      {listData.length > 0 && !error ? (
        <List
          title="Products"
          imageDisplayStrategy="always"
          data={listData}
          isLoadingMore={hasNext}
          onEndReached={handleOnEndReached}
        />
      ) : (
        !isLoading &&
        isDateSelected &&
        !error && (
          <Stack direction="vertical">
            <Banner
              title="No products found"
              visible
              variant="information"
              hideAction
            />
          </Stack>
        )
      )}
    </ScrollView>
  );
}
