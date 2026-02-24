import {
  Text,
  ScrollView,
  RadioButtonList,
  Stack,
  Section,
} from "@shopify/ui-extensions-react/point-of-sale";
import { sortOptions } from "./helper";

export function SortComponent({ api, sort, setSort }: any) {
  const changePage = (val: string) => {
    setSort(val);
    api.navigation.navigate("product-search");
  };

  return (
    <ScrollView>
      <Stack direction="vertical" spacing={3} paddingVertical="Small">
        <Text variant="headingLarge">Sort by</Text>
        <Section>
          <RadioButtonList
            items={sortOptions}
            onItemSelected={changePage}
            initialSelectedItem={sort}
            initialOffsetToShowSelectedItem={true}
          />
        </Section>
      </Stack>
    </ScrollView>
  );
}
